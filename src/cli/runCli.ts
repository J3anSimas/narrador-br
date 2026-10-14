import { describeErrorChain } from "../errors/describeErrorChain.js";
import { readInputText, type TextInputSource } from "../input/textInputSource.js";
import { formatParagraphs } from "../output/formatParagraphs.js";
import { fitParagraphsToLimit } from "../paragraphs/fitParagraphsToLimit.js";
import { splitParagraphs } from "../paragraphs/splitParagraphs.js";
import type { AiProvider } from "../ports/aiProvider.js";
import { fitParagraphsWithRewriter, type RewriteEvent } from "../rewrite/fitParagraphsWithRewriter.js";
import { helpText, parseCliArgs, type CliOptions } from "./parseCliArgs.js";
import {
  writeParagraphsAsAudioFiles,
  writeParagraphsAsSingleAudio,
  type AudioCliDependencies,
  type AudioOutputDependencies,
} from "./writeAudioOutput.js";

export type { AudioCliDependencies } from "./writeAudioOutput.js";

export interface TextSink {
  write(chunk: string): unknown;
}

export interface CliDependencies {
  source: TextInputSource;
  stdout: TextSink;
  stderr: TextSink;
  /** Fala e LLM; a CLI não conhece o provedor por trás da porta. */
  ai: AiProvider;
  audio?: AudioCliDependencies;
}

/**
 * Executa a CLI e devolve o código de saída do processo (0 = sucesso).
 *
 * @example await runCli(["-f", "aula.txt", "--audio-file", "aula.wav"], { source, stdout, stderr, ai, audio })
 */
export async function runCli(argv: readonly string[], deps: CliDependencies): Promise<number> {
  try {
    const options = parseCliArgs(argv);
    if (options.showHelp) {
      deps.stdout.write(helpText(deps.ai));
      return 0;
    }
    // O texto impresso é o mesmo que seria narrado: nenhum parágrafo passa do limite da API de fala.
    const text = await readInputText(options.input, deps.source);
    const paragraphs = await fitToSpeechLimit(splitParagraphs(text), options, deps);
    await writeParagraphs(paragraphs, options, deps);
    return 0;
  } catch (error) {
    // A cadeia inteira: erros de rede do fetch dizem só "terminated" e guardam o motivo na causa.
    const message = describeErrorChain(error);
    deps.stderr.write(`Erro: ${message}\n\n${helpText(deps.ai)}`);
    return 1;
  }
}

async function fitToSpeechLimit(
  paragraphs: readonly string[],
  options: CliOptions,
  deps: CliDependencies,
): Promise<string[]> {
  const { speech, rewrite } = deps.ai;
  if (rewrite === undefined) return fitParagraphsToLimit(paragraphs, speech.maxInputLength);
  return fitParagraphsWithRewriter(paragraphs, speech.maxInputLength, {
    createRewriter: () => rewrite.create(options.rewriteModel),
    // stderr: o stdout pode ser o JSON dos parágrafos.
    onEvent: (event) => deps.stderr.write(describeRewriteEvent(event)),
  });
}

function describeRewriteEvent(event: RewriteEvent): string {
  const { position, originalLength, partLengths, usedFallback } = event;
  const prefix = `Aviso: parágrafo ${position} tinha ${originalLength} caracteres`;
  const lengths = partLengths.join(" + ");
  const fallbackNote = usedFallback ? " (a LLM não chegou ao limite em algum trecho, dividido nos fins de frase)" : "";
  if (partLengths.length === 1) return `${prefix}; condensado pela LLM para ${lengths}${fallbackNote}.\n`;
  return `${prefix}; reescrito pela LLM em ${partLengths.length} parágrafos (${lengths})${fallbackNote}.\n`;
}

async function writeParagraphs(
  paragraphs: readonly string[],
  options: CliOptions,
  deps: CliDependencies,
): Promise<void> {
  if (options.audio !== undefined) {
    const audio = requireAudioDependencies(deps, `--audio "${options.audio.outputDir}"`);
    return writeParagraphsAsAudioFiles(paragraphs, options.audio, audio, deps.stdout);
  }
  if (options.audioFile !== undefined) {
    const audio = requireAudioDependencies(deps, `--audio-file "${options.audioFile.outputPath}"`);
    return writeParagraphsAsSingleAudio(paragraphs, options.audioFile, audio, deps.stdout);
  }
  deps.stdout.write(formatParagraphs(paragraphs, options.outputFormat));
}

// A API de fala só é criada aqui: ela pode exigir credencial, e o modo texto funciona sem.
function requireAudioDependencies(deps: CliDependencies, requestedFlag: string): AudioOutputDependencies {
  if (deps.audio === undefined) {
    throw new Error(`${requestedFlag} pedido, mas a CLI foi montada sem suporte a áudio (esperado: deps.audio).`);
  }
  return { ...deps.audio, api: deps.ai.speech.create() };
}

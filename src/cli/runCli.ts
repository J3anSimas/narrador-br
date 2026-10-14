import { readInputText, type TextInputSource } from "../input/textInputSource.js";
import { formatParagraphs } from "../output/formatParagraphs.js";
import { fitParagraphsToLimit } from "../paragraphs/fitParagraphsToLimit.js";
import { splitParagraphs } from "../paragraphs/splitParagraphs.js";
import { fitParagraphsWithRewriter, type RewriteEvent } from "../rewrite/fitParagraphsWithRewriter.js";
import type { TextRewriter } from "../rewrite/textRewriter.js";
import { MAX_PARAGRAPH_LENGTH } from "../speech/synthesizeParagraph.js";
import { HELP_TEXT, parseCliArgs, type CliOptions } from "./parseCliArgs.js";
import {
  writeParagraphsAsAudioFiles,
  writeParagraphsAsSingleAudio,
  type AudioCliDependencies,
} from "./writeAudioOutput.js";

export type { AudioCliDependencies } from "./writeAudioOutput.js";

export interface TextSink {
  write(chunk: string): unknown;
}

export interface CliDependencies {
  source: TextInputSource;
  stdout: TextSink;
  stderr: TextSink;
  audio?: AudioCliDependencies;
  /**
   * Cria a LLM que condensa e/ou quebra parágrafos acima do limite da API de fala. Fábrica porque
   * exige a chave, e textos sem parágrafos longos funcionam sem ela. Sem a fábrica,
   * os parágrafos longos são divididos nos fins de frase.
   */
  createTextRewriter?: (model: string | undefined) => TextRewriter;
}

/**
 * Executa a CLI e devolve o código de saída do processo (0 = sucesso).
 *
 * @example await runCli(["-f", "aula.txt", "--audio-file", "aula.wav"], { source, stdout, stderr, audio })
 */
export async function runCli(argv: readonly string[], deps: CliDependencies): Promise<number> {
  try {
    const options = parseCliArgs(argv);
    if (options.showHelp) {
      deps.stdout.write(HELP_TEXT);
      return 0;
    }
    // O texto impresso é o mesmo que seria narrado: nenhum parágrafo passa do limite da API de fala.
    const text = await readInputText(options.input, deps.source);
    const paragraphs = await fitToSpeechLimit(splitParagraphs(text), options, deps);
    await writeParagraphs(paragraphs, options, deps);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    deps.stderr.write(`Erro: ${message}\n\n${HELP_TEXT}`);
    return 1;
  }
}

async function fitToSpeechLimit(
  paragraphs: readonly string[],
  options: CliOptions,
  deps: CliDependencies,
): Promise<string[]> {
  const { createTextRewriter } = deps;
  if (createTextRewriter === undefined) return fitParagraphsToLimit(paragraphs, MAX_PARAGRAPH_LENGTH);
  return fitParagraphsWithRewriter(paragraphs, MAX_PARAGRAPH_LENGTH, {
    createRewriter: () => createTextRewriter(options.rewriteModel),
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

function requireAudioDependencies(deps: CliDependencies, requestedFlag: string): AudioCliDependencies {
  if (deps.audio === undefined) {
    throw new Error(`${requestedFlag} pedido, mas a CLI foi montada sem suporte a áudio (esperado: deps.audio).`);
  }
  return deps.audio;
}

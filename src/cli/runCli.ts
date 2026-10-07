import { readInputText, type TextInputSource } from "../input/textInputSource.js";
import { formatParagraphs } from "../output/formatParagraphs.js";
import { splitParagraphs } from "../paragraphs/splitParagraphs.js";
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
    const paragraphs = splitParagraphs(await readInputText(options.input, deps.source));
    await writeParagraphs(paragraphs, options, deps);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    deps.stderr.write(`Erro: ${message}\n\n${HELP_TEXT}`);
    return 1;
  }
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

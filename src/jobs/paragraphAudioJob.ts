import { synthesizeParagraphs } from "../speech/synthesizeParagraphs.js";
import type { AudioJobDependencies, AudioOutputRequest } from "./audioJobDependencies.js";
import type { AudioJobListener } from "./audioJobEvent.js";

/**
 * Grava um arquivo de áudio por parágrafo e devolve os caminhos, na ordem do texto.
 *
 * @example await runParagraphAudioJob(["Um."], { outputDir: "saida" }, deps, (event) => console.log(event))
 */
export async function runParagraphAudioJob(
  paragraphs: readonly string[],
  request: AudioOutputRequest,
  deps: AudioJobDependencies,
  onEvent: AudioJobListener,
): Promise<string[]> {
  const onAudioWritten = (path: string, position: number, total: number): void => {
    onEvent({ kind: "audioFileWritten", path, position, total });
  };
  const batchDeps = { api: deps.createSpeechApi(), writer: deps.writer, onAudioWritten };
  return synthesizeParagraphs(paragraphs, request.outputDir, batchDeps, { voice: request.voice });
}

import { join } from "node:path";
import type { AudioFileWriter } from "../output/audioFileWriter.js";
import type { SpeechApi } from "../ports/speechApi.js";
import { synthesizeInOrder } from "./synthesizeInOrder.js";
import { DEFAULT_AUDIO_FORMAT, type SpeechOptions } from "./synthesizeParagraph.js";

export interface AudioBatchDependencies {
  api: SpeechApi;
  writer: AudioFileWriter;
  /** Chamado após cada arquivo gravado; a síntese é lenta, então vale avisar o progresso. */
  onAudioWritten?: (path: string, position: number, total: number) => void;
}

/**
 * Gera um arquivo de áudio por parágrafo em `outputDir` e devolve os caminhos, na ordem.
 * Valida todos os parágrafos antes da primeira chamada à API (ver `synthesizeInOrder`).
 *
 * @example
 * await synthesizeParagraphs(["Um.", "Dois."], "audio", { api, writer })
 * // ["audio/paragrafo-001.mp3", "audio/paragrafo-002.mp3"]
 */
export async function synthesizeParagraphs(
  paragraphs: readonly string[],
  outputDir: string,
  deps: AudioBatchDependencies,
  options: SpeechOptions = {},
): Promise<string[]> {
  const extension = options.format ?? DEFAULT_AUDIO_FORMAT;
  const paths: string[] = [];
  for await (const audio of synthesizeInOrder(paragraphs, deps.api, options)) {
    const path = join(outputDir, audioFileName(paths.length + 1, extension));
    await deps.writer.writeAudioFile(path, audio);
    paths.push(path);
    deps.onAudioWritten?.(path, paths.length, paragraphs.length);
  }
  return paths;
}

/** Numeração com zeros à esquerda para que a ordem alfabética siga a ordem do texto. */
function audioFileName(position: number, extension: string): string {
  return `paragrafo-${String(position).padStart(3, "0")}.${extension}`;
}

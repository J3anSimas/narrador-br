import type { AudioFileWriter } from "../../src/output/audioFileWriter.js";

/** Guarda em memória os arquivos de áudio que seriam gravados no disco. */
export class FakeAudioFileWriter implements AudioFileWriter {
  readonly filesByPath = new Map<string, Uint8Array>();

  async writeAudioFile(path: string, audio: Uint8Array): Promise<void> {
    this.filesByPath.set(path, audio);
  }
}

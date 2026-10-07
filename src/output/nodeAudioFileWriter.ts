import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AudioFileWriter } from "./audioFileWriter.js";

/** Implementação real de `AudioFileWriter`: cria a pasta de destino se preciso e grava o arquivo. */
export class NodeAudioFileWriter implements AudioFileWriter {
  async writeAudioFile(path: string, audio: Uint8Array): Promise<void> {
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, audio);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Não foi possível gravar o áudio em "${path}" (esperado: caminho gravável): ${reason}`);
    }
  }
}

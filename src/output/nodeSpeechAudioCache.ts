import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SpeechAudioCache } from "../speech/speechAudioCache.js";

/**
 * Cache de áudio em disco: um arquivo por chave dentro de `directory`.
 *
 * @example new NodeSpeechAudioCache("aula.mp3.partes")
 */
export class NodeSpeechAudioCache implements SpeechAudioCache {
  constructor(private readonly directory: string) {}

  async read(key: string): Promise<Uint8Array | undefined> {
    try {
      return new Uint8Array(await readFile(this.pathFor(key)));
    } catch (error) {
      if (isMissingFileError(error)) return undefined;
      throw error;
    }
  }

  // Grava num arquivo temporário e renomeia: se o processo cair no meio da escrita,
  // sobra só o .tmp, e um áudio truncado nunca é lido como pronto.
  async write(key: string, audio: Uint8Array): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const temporaryPath = `${this.pathFor(key)}.tmp`;
    await writeFile(temporaryPath, audio);
    await rename(temporaryPath, this.pathFor(key));
  }

  async clear(): Promise<void> {
    await rm(this.directory, { recursive: true, force: true });
  }

  private pathFor(key: string): string {
    if (!/^[0-9a-f]+$/.test(key)) {
      throw new Error(`Chave de cache inválida: "${key}" (esperado: hash hexadecimal).`);
    }
    return join(this.directory, `${key}.audio`);
  }
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

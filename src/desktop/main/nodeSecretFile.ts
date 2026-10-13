import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { SecretFile } from "./apiKeyStore.js";

/**
 * `SecretFile` em disco, normalmente dentro da pasta de dados do app.
 *
 * @example new NodeSecretFile(join(app.getPath("userData"), "openai-key.bin"))
 */
export class NodeSecretFile implements SecretFile {
  constructor(private readonly path: string) {}

  async read(): Promise<Uint8Array | undefined> {
    try {
      return new Uint8Array(await readFile(this.path));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    }
  }

  async write(sealed: Uint8Array): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, sealed);
  }

  async remove(): Promise<void> {
    await rm(this.path, { force: true });
  }
}

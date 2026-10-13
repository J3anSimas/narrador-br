import type { SecretFile } from "../../src/desktop/main/apiKeyStore.js";

/** Arquivo de segredo em memória. */
export class FakeSecretFile implements SecretFile {
  stored: Uint8Array | undefined;

  async read(): Promise<Uint8Array | undefined> {
    return this.stored;
  }

  async write(sealed: Uint8Array): Promise<void> {
    this.stored = sealed;
  }

  async remove(): Promise<void> {
    this.stored = undefined;
  }
}

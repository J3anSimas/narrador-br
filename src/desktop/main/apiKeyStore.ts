/** Criptografia da chave em repouso; no app real, o `safeStorage` do Electron (DPAPI no Windows). */
export interface SecretCipher {
  encrypt(plainText: string): Uint8Array;
  decrypt(sealed: Uint8Array): string;
}

/** Onde a chave criptografada fica guardada; isola o disco para testes. */
export interface SecretFile {
  read(): Promise<Uint8Array | undefined>;
  write(sealed: Uint8Array): Promise<void>;
  remove(): Promise<void>;
}

/**
 * Guarda a chave da OpenAI criptografada, no lugar do `.env` (que um executável
 * instalado não tem na pasta atual).
 *
 * @example await new ApiKeyStore(new ElectronSecretCipher(), new NodeSecretFile(caminho)).save("sk-...")
 */
export class ApiKeyStore {
  constructor(
    private readonly cipher: SecretCipher,
    private readonly file: SecretFile,
  ) {}

  async load(): Promise<string | undefined> {
    const sealed = await this.file.read();
    return sealed === undefined ? undefined : this.cipher.decrypt(sealed);
  }

  async save(apiKey: string): Promise<void> {
    const trimmed = apiKey.trim();
    assertApiKeyShape(trimmed);
    await this.file.write(this.cipher.encrypt(trimmed));
  }

  async clear(): Promise<void> {
    await this.file.remove();
  }
}

const MIN_API_KEY_LENGTH = 20;

function assertApiKeyShape(apiKey: string): void {
  if (apiKey.startsWith("sk-") && apiKey.length >= MIN_API_KEY_LENGTH) return;
  // Só o começo da chave na mensagem: o resto é segredo, mesmo se estiver errado.
  throw new Error(
    `Chave da OpenAI inválida: "${apiKey.slice(0, 5)}…" com ${apiKey.length} caracteres (esperado: começa com "sk-" e tem ao menos ${MIN_API_KEY_LENGTH}).`,
  );
}

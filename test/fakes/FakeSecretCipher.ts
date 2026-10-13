import type { SecretCipher } from "../../src/desktop/main/apiKeyStore.js";

/** "Criptografia" reversível e visível, no lugar do safeStorage, para conferir o que foi gravado. */
export class FakeSecretCipher implements SecretCipher {
  encrypt(plainText: string): Uint8Array {
    return new TextEncoder().encode(`selado:${plainText}`);
  }

  decrypt(sealed: Uint8Array): string {
    return new TextDecoder().decode(sealed).replace(/^selado:/, "");
  }
}

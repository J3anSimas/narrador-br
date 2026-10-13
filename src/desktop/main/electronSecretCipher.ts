import { safeStorage } from "electron";
import type { SecretCipher } from "./apiKeyStore.js";

/**
 * `SecretCipher` sobre o `safeStorage` do Electron; no Windows usa a DPAPI, que
 * amarra o arquivo ao usuário logado. Só funciona depois de `app.whenReady()`.
 *
 * @example new ApiKeyStore(new ElectronSecretCipher(), file)
 */
export class ElectronSecretCipher implements SecretCipher {
  encrypt(plainText: string): Uint8Array {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Criptografia do sistema indisponível (esperado: safeStorage ativo); a chave não foi salva.");
    }
    return new Uint8Array(safeStorage.encryptString(plainText));
  }

  decrypt(sealed: Uint8Array): string {
    return safeStorage.decryptString(Buffer.from(sealed));
  }
}

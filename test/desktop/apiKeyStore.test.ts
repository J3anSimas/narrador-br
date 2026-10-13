import { describe, expect, it } from "vitest";
import { ApiKeyStore } from "../../src/desktop/main/apiKeyStore.js";
import { FakeSecretCipher } from "../fakes/FakeSecretCipher.js";
import { FakeSecretFile } from "../fakes/FakeSecretFile.js";

const VALID_KEY = "sk-proj-abcdefghijklmnop";

describe("ApiKeyStore", () => {
  it("devolve undefined quando nenhuma chave foi salva", async () => {
    expect(await new ApiKeyStore(new FakeSecretCipher(), new FakeSecretFile()).load()).toBeUndefined();
  });

  it("grava a chave criptografada e sem espaços, e lê de volta", async () => {
    const file = new FakeSecretFile();
    const store = new ApiKeyStore(new FakeSecretCipher(), file);
    await store.save(`  ${VALID_KEY}\n`);
    expect(new TextDecoder().decode(file.stored)).toBe(`selado:${VALID_KEY}`);
    expect(await store.load()).toBe(VALID_KEY);
  });

  it("recusa texto que não parece chave, sem repetir a chave inteira no erro", async () => {
    const store = new ApiKeyStore(new FakeSecretCipher(), new FakeSecretFile());
    const attempt = store.save("minha-senha-secreta-123");
    await expect(attempt).rejects.toThrow(/"minha…" com 23 caracteres.*"sk-"/);
    await expect(attempt).rejects.not.toThrow(/secreta/);
  });

  it("remove a chave salva", async () => {
    const store = new ApiKeyStore(new FakeSecretCipher(), new FakeSecretFile());
    await store.save(VALID_KEY);
    await store.clear();
    expect(await store.load()).toBeUndefined();
  });
});

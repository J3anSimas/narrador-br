import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NodeSecretFile } from "../../src/desktop/main/nodeSecretFile.js";

describe("NodeSecretFile", () => {
  let workDir = "";

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "secret-file-"));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it("devolve undefined sem o arquivo e não falha ao remover o que não existe", async () => {
    const file = new NodeSecretFile(join(workDir, "chave.bin"));
    expect(await file.read()).toBeUndefined();
    await expect(file.remove()).resolves.toBeUndefined();
  });

  it("cria a pasta, grava e lê os mesmos bytes", async () => {
    const file = new NodeSecretFile(join(workDir, "dados", "chave.bin"));
    await file.write(new Uint8Array([9, 8, 7]));
    expect([...((await file.read()) ?? [])]).toEqual([9, 8, 7]);
  });
});

import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NodeSpeechAudioCache } from "../../src/output/nodeSpeechAudioCache.js";

describe("NodeSpeechAudioCache", () => {
  let workDir = "";

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "speech-cache-"));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it("devolve undefined para chave ausente, mesmo sem a pasta existir", async () => {
    expect(await new NodeSpeechAudioCache(join(workDir, "partes")).read("abc123")).toBeUndefined();
  });

  it("grava e lê de volta os mesmos bytes, sem deixar .tmp para trás", async () => {
    const directory = join(workDir, "partes");
    const cache = new NodeSpeechAudioCache(directory);
    await cache.write("abc123", new Uint8Array([1, 2, 3]));
    expect([...((await cache.read("abc123")) ?? [])]).toEqual([1, 2, 3]);
    expect(await readdir(directory)).toEqual(["abc123.audio"]);
  });

  it("ignora um .tmp deixado por uma escrita interrompida", async () => {
    const directory = join(workDir, "partes");
    const cache = new NodeSpeechAudioCache(directory);
    await cache.write("abc123", new Uint8Array([1]));
    await writeFile(join(directory, "def456.audio.tmp"), new Uint8Array([9]));
    expect(await cache.read("def456")).toBeUndefined();
  });

  it("apaga a pasta inteira no clear", async () => {
    const directory = join(workDir, "partes");
    const cache = new NodeSpeechAudioCache(directory);
    await cache.write("abc123", new Uint8Array([1]));
    await cache.clear();
    expect(await readdir(workDir)).toEqual([]);
  });

  it("rejeita chave que não seja hash, citando o valor", async () => {
    await expect(new NodeSpeechAudioCache(workDir).read("../fora")).rejects.toThrow(/"\.\.\/fora".*hexadecimal/);
  });
});

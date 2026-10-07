import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NodeAudioFileWriter } from "../../src/output/nodeAudioFileWriter.js";

describe("NodeAudioFileWriter", () => {
  let workDir = "";

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "audio-writer-"));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it("cria as pastas que faltam e grava os bytes", async () => {
    const path = join(workDir, "nova", "pasta", "a.mp3");
    await new NodeAudioFileWriter().writeAudioFile(path, new Uint8Array([1, 2, 3]));
    expect([...(await readFile(path))]).toEqual([1, 2, 3]);
  });

  it("inclui o caminho na mensagem quando não consegue gravar", async () => {
    const blockingFile = join(workDir, "arquivo");
    await writeFile(blockingFile, "não é pasta");
    const path = join(blockingFile, "a.mp3");
    await expect(new NodeAudioFileWriter().writeAudioFile(path, new Uint8Array())).rejects.toThrow(
      /"[^"]*a\.mp3".*gravável/,
    );
  });
});

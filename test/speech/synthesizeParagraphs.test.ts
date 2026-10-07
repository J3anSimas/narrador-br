import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { synthesizeParagraphs } from "../../src/speech/synthesizeParagraphs.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

describe("synthesizeParagraphs", () => {
  it("grava um arquivo numerado por parágrafo e devolve os caminhos em ordem", async () => {
    const writer = new FakeAudioFileWriter();
    const paths = await synthesizeParagraphs(["Um.", "Dois."], "saida", { api: new FakeSpeechApi(), writer });
    expect(paths).toEqual([join("saida", "paragrafo-001.mp3"), join("saida", "paragrafo-002.mp3")]);
    expect([...writer.filesByPath.keys()]).toEqual(paths);
  });

  it("envia cada parágrafo com as opções informadas e usa o formato como extensão", async () => {
    const api = new FakeSpeechApi();
    const paths = await synthesizeParagraphs(
      ["Um."],
      "saida",
      { api, writer: new FakeAudioFileWriter() },
      { voice: "cedar", format: "wav" },
    );
    expect(api.requests).toEqual([{ text: "Um.", model: "gpt-4o-mini-tts", voice: "cedar", format: "wav" }]);
    expect(paths).toEqual([join("saida", "paragrafo-001.wav")]);
  });

  it("avisa o progresso após cada arquivo gravado", async () => {
    const progress: string[] = [];
    const onAudioWritten = (path: string, position: number, total: number): void => {
      progress.push(`${position}/${total} ${path}`);
    };
    await synthesizeParagraphs(["Um.", "Dois."], "s", {
      api: new FakeSpeechApi(),
      writer: new FakeAudioFileWriter(),
      onAudioWritten,
    });
    expect(progress).toEqual([`1/2 ${join("s", "paragrafo-001.mp3")}`, `2/2 ${join("s", "paragrafo-002.mp3")}`]);
  });

  it("não chama a API se algum parágrafo for inválido", async () => {
    const api = new FakeSpeechApi();
    const writer = new FakeAudioFileWriter();
    await expect(synthesizeParagraphs(["Válido.", "  "], "s", { api, writer })).rejects.toThrow(/Parágrafo vazio/);
    expect(api.requests).toHaveLength(0);
    expect(writer.filesByPath.size).toBe(0);
  });
});

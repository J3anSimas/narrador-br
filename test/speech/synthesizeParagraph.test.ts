import { describe, expect, it } from "vitest";
import { MAX_PARAGRAPH_LENGTH, synthesizeParagraph } from "../../src/speech/synthesizeParagraph.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

describe("synthesizeParagraph", () => {
  it("devolve o áudio produzido pela API", async () => {
    const audio = new Uint8Array([9, 8, 7]);
    expect(await synthesizeParagraph("Olá.", new FakeSpeechApi(audio))).toBe(audio);
  });

  it("envia o parágrafo sem espaços nas pontas e com os padrões", async () => {
    const api = new FakeSpeechApi();
    await synthesizeParagraph("  Olá, mundo.\n", api);
    expect(api.requests).toEqual([{ text: "Olá, mundo.", model: "gpt-4o-mini-tts", voice: "marin", format: "mp3" }]);
  });

  it("aplica as opções informadas e ignora as indefinidas", async () => {
    const api = new FakeSpeechApi();
    await synthesizeParagraph("Olá.", api, {
      voice: "cedar",
      format: "wav",
      instructions: "Fale devagar.",
      model: undefined,
    });
    expect(api.requests[0]).toEqual({
      text: "Olá.",
      model: "gpt-4o-mini-tts",
      voice: "cedar",
      format: "wav",
      instructions: "Fale devagar.",
    });
  });

  it("rejeita parágrafo vazio sem chamar a API", async () => {
    const api = new FakeSpeechApi();
    await expect(synthesizeParagraph(" \n ", api)).rejects.toThrow(/Parágrafo vazio/);
    expect(api.requests).toHaveLength(0);
  });

  it("rejeita parágrafo acima do limite da API", async () => {
    const api = new FakeSpeechApi();
    const tooLong = "a".repeat(MAX_PARAGRAPH_LENGTH + 1);
    await expect(synthesizeParagraph(tooLong, api)).rejects.toThrow(`${MAX_PARAGRAPH_LENGTH + 1} caracteres`);
    expect(api.requests).toHaveLength(0);
  });
});

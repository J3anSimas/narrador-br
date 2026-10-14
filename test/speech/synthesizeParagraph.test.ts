import { describe, expect, it } from "vitest";
import { BRAZILIAN_NARRATION_INSTRUCTIONS } from "../../src/speech/brazilianNarration.js";
import { synthesizeParagraph } from "../../src/speech/synthesizeParagraph.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

describe("synthesizeParagraph", () => {
  it("devolve o áudio produzido pela API", async () => {
    const audio = new Uint8Array([9, 8, 7]);
    expect(await synthesizeParagraph("Olá.", new FakeSpeechApi(audio))).toBe(audio);
  });

  it("envia o parágrafo sem espaços nas pontas, em MP3, deixando voz e modelo para o provedor", async () => {
    const api = new FakeSpeechApi();
    await synthesizeParagraph("  Olá, mundo.\n", api);
    expect(api.requests).toEqual([{ text: "Olá, mundo.", format: "mp3", instructions: BRAZILIAN_NARRATION_INSTRUCTIONS }]);
  });

  it("aplica as opções informadas e ignora as indefinidas", async () => {
    const api = new FakeSpeechApi();
    await synthesizeParagraph("Olá.", api, {
      voice: "cedar",
      instructions: "Fale devagar.",
      format: undefined,
    });
    expect(api.requests[0]).toEqual({
      text: "Olá.",
      voice: "cedar",
      format: "mp3",
      instructions: "Fale devagar.",
    });
  });

  it("rejeita parágrafo vazio sem chamar a API", async () => {
    const api = new FakeSpeechApi();
    await expect(synthesizeParagraph(" \n ", api)).rejects.toThrow(/Parágrafo vazio/);
    expect(api.requests).toHaveLength(0);
  });

  it("rejeita parágrafo acima do limite informado pela API", async () => {
    const api = new FakeSpeechApi();
    const tooLong = "a".repeat(api.maxInputLength + 1);
    await expect(synthesizeParagraph(tooLong, api)).rejects.toThrow(`${api.maxInputLength + 1} caracteres`);
    expect(api.requests).toHaveLength(0);
  });
});

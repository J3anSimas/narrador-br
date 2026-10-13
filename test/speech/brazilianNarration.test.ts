import { describe, expect, it } from "vitest";
import { BRAZILIAN_NARRATION_INSTRUCTIONS } from "../../src/speech/brazilianNarration.js";
import { synthesizeParagraph } from "../../src/speech/synthesizeParagraph.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

describe("narração em português do Brasil", () => {
  it("envia as instruções de sotaque brasileiro por padrão", async () => {
    const api = new FakeSpeechApi();
    await synthesizeParagraph("Fiz o deploy da API.", api);
    expect(api.requests[0]?.instructions).toBe(BRAZILIAN_NARRATION_INSTRUCTIONS);
  });

  it("deixa instruções informadas substituírem o padrão", async () => {
    const api = new FakeSpeechApi();
    await synthesizeParagraph("Olá.", api, { instructions: "Fale devagar." });
    expect(api.requests[0]?.instructions).toBe("Fale devagar.");
  });
});

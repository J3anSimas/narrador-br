import { describe, expect, it } from "vitest";
import { createOpenAiSpeechApi } from "../../src/speech/createOpenAiSpeechApi.js";
import { OpenAiSpeechApi } from "../../src/speech/openAiSpeechApi.js";

describe("createOpenAiSpeechApi", () => {
  it("monta a API quando a chave existe, sem chamar a rede", () => {
    expect(createOpenAiSpeechApi({ OPENAI_API_KEY: "sk-teste" })).toBeInstanceOf(OpenAiSpeechApi);
  });

  it("aponta para o .env quando a chave falta", () => {
    expect(() => createOpenAiSpeechApi({})).toThrow(/OPENAI_API_KEY.*\.env/);
  });

  it("trata chave só com espaços como ausente", () => {
    expect(() => createOpenAiSpeechApi({ OPENAI_API_KEY: "   " })).toThrow(/ausente ou vazia/);
  });
});

import { describe, expect, it } from "vitest";
import { createOpenAiProvider } from "../../../src/adapters/openai/createOpenAiProvider.js";
import { OpenAiSpeechApi } from "../../../src/adapters/openai/openAiSpeechApi.js";
import { DEFAULT_REWRITE_MODEL } from "../../../src/adapters/openai/openAiTextRewriter.js";

describe("createOpenAiProvider", () => {
  it("expõe limite, voz e modelo padrão sem exigir a chave", () => {
    const provider = createOpenAiProvider({});
    expect(provider.speech.maxInputLength).toBe(4096);
    expect(provider.speech.defaultVoice).toBe("marin");
    expect(provider.rewrite?.defaultModel).toBe(DEFAULT_REWRITE_MODEL);
  });

  it("monta a API de fala quando a chave existe, sem chamar a rede", () => {
    expect(createOpenAiProvider({ OPENAI_API_KEY: "sk-teste" }).speech.create()).toBeInstanceOf(OpenAiSpeechApi);
  });

  it("monta a LLM com o modelo pedido ou o padrão", () => {
    const { rewrite } = createOpenAiProvider({ OPENAI_API_KEY: "sk-teste" });
    expect(rewrite?.create("m").model).toBe("m");
    expect(rewrite?.create(undefined).model).toBe(DEFAULT_REWRITE_MODEL);
  });

  it("aponta para o .env quando a chave falta", () => {
    const provider = createOpenAiProvider({});
    expect(() => provider.speech.create()).toThrow(/OPENAI_API_KEY.*\.env/);
    expect(() => provider.rewrite?.create(undefined)).toThrow(/OPENAI_API_KEY.*\.env/);
  });

  it("trata chave só com espaços como ausente", () => {
    expect(() => createOpenAiProvider({ OPENAI_API_KEY: "   " }).speech.create()).toThrow(/ausente ou vazia/);
  });
});

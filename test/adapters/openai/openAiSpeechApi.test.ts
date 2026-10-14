import { describe, expect, it } from "vitest";
import { OpenAiSpeechApi } from "../../../src/adapters/openai/openAiSpeechApi.js";
import { FakeOpenAiSpeechEndpoint } from "./FakeOpenAiSpeechEndpoint.js";

describe("OpenAiSpeechApi", () => {
  it("traduz o pedido para os parâmetros do SDK", async () => {
    const endpoint = new FakeOpenAiSpeechEndpoint(new Uint8Array());
    await new OpenAiSpeechApi(endpoint, "tts-1").createSpeech({
      text: "Olá.",
      voice: "cedar",
      format: "wav",
      instructions: "Fale devagar.",
    });
    expect(endpoint.bodies).toEqual([
      {
        input: "Olá.",
        model: "tts-1",
        voice: "cedar",
        response_format: "wav",
        instructions: "Fale devagar.",
      },
    ]);
  });

  it("usa o modelo e a voz padrão quando não informados, e omite instructions", async () => {
    const endpoint = new FakeOpenAiSpeechEndpoint(new Uint8Array());
    await new OpenAiSpeechApi(endpoint).createSpeech({ text: "Olá.", format: "mp3" });
    expect(endpoint.bodies).toEqual([
      { input: "Olá.", model: "gpt-4o-mini-tts", voice: "marin", response_format: "mp3" },
    ]);
  });

  it("expõe o limite de entrada e o formato PCM da OpenAI", () => {
    const api = new OpenAiSpeechApi(new FakeOpenAiSpeechEndpoint(new Uint8Array()));
    expect(api.maxInputLength).toBe(4096);
    expect(api.pcmFormat).toEqual({ sampleRate: 24_000, channels: 1, bitsPerSample: 16 });
  });

  it("devolve os bytes do corpo da resposta", async () => {
    const endpoint = new FakeOpenAiSpeechEndpoint(new Uint8Array([4, 5, 6]));
    const audio = await new OpenAiSpeechApi(endpoint).createSpeech({ text: "Olá.", format: "mp3" });
    expect([...audio]).toEqual([4, 5, 6]);
  });

  it("permite dois pedidos de fala em paralelo", () => {
    const api = new OpenAiSpeechApi(new FakeOpenAiSpeechEndpoint(new Uint8Array()));
    expect(api.maxConcurrentRequests).toBe(2);
  });
});

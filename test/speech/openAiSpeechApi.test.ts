import { describe, expect, it } from "vitest";
import { OpenAiSpeechApi } from "../../src/speech/openAiSpeechApi.js";
import { FakeOpenAiSpeechEndpoint } from "../fakes/FakeOpenAiSpeechEndpoint.js";

describe("OpenAiSpeechApi", () => {
  it("traduz o pedido para os parâmetros do SDK", async () => {
    const endpoint = new FakeOpenAiSpeechEndpoint(new Uint8Array());
    await new OpenAiSpeechApi(endpoint).createSpeech({
      text: "Olá.",
      model: "gpt-4o-mini-tts",
      voice: "marin",
      format: "wav",
      instructions: "Fale devagar.",
    });
    expect(endpoint.bodies).toEqual([
      {
        input: "Olá.",
        model: "gpt-4o-mini-tts",
        voice: "marin",
        response_format: "wav",
        instructions: "Fale devagar.",
      },
    ]);
  });

  it("omite instructions quando não informado", async () => {
    const endpoint = new FakeOpenAiSpeechEndpoint(new Uint8Array());
    await new OpenAiSpeechApi(endpoint).createSpeech({ text: "Olá.", model: "tts-1", voice: "coral", format: "mp3" });
    expect(endpoint.bodies[0]).not.toHaveProperty("instructions");
  });

  it("devolve os bytes do corpo da resposta", async () => {
    const endpoint = new FakeOpenAiSpeechEndpoint(new Uint8Array([4, 5, 6]));
    const audio = await new OpenAiSpeechApi(endpoint).createSpeech({
      text: "Olá.",
      model: "tts-1",
      voice: "coral",
      format: "mp3",
    });
    expect([...audio]).toEqual([4, 5, 6]);
  });
});

import { describe, expect, it } from "vitest";
import { AbortableSpeechApi, JobCancelledError } from "../../src/desktop/main/abortableSpeechApi.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

const REQUEST = { text: "Um.", model: "gpt-4o-mini-tts", voice: "marin", format: "pcm" as const };

describe("AbortableSpeechApi", () => {
  it("repassa pedidos enquanto o sinal não foi abortado", async () => {
    const inner = new FakeSpeechApi();
    await new AbortableSpeechApi(inner, new AbortController().signal).createSpeech(REQUEST);
    expect(inner.requests).toHaveLength(1);
  });

  it("recusa novos pedidos depois do cancelamento, sem chamar a API", async () => {
    const inner = new FakeSpeechApi();
    const abort = new AbortController();
    abort.abort();
    const attempt = new AbortableSpeechApi(inner, abort.signal).createSpeech(REQUEST);
    await expect(attempt).rejects.toBeInstanceOf(JobCancelledError);
    expect(inner.requests).toHaveLength(0);
  });
});

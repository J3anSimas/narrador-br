import { describe, expect, it } from "vitest";
import { CachingSpeechApi, speechCacheKey } from "../../src/speech/cachingSpeechApi.js";
import type { SpeechRequest } from "../../src/ports/speechApi.js";
import { FakeSpeechAudioCache } from "../fakes/FakeSpeechAudioCache.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

const MODEL = "gpt-4o-mini-tts";
const request: SpeechRequest = { text: "Olá.", voice: "marin", format: "pcm" };

describe("speechCacheKey", () => {
  it("é estável para o mesmo pedido", () => {
    expect(speechCacheKey(MODEL, { ...request })).toBe(speechCacheKey(MODEL, request));
  });

  it("muda quando texto, voz, modelo, formato ou instruções mudam", () => {
    const variants: [string, SpeechRequest][] = [
      [MODEL, { ...request, text: "Olá!" }],
      [MODEL, { ...request, voice: "cedar" }],
      ["tts-1", request],
      [MODEL, { ...request, format: "mp3" }],
      [MODEL, { ...request, instructions: "Fale devagar." }],
    ];
    const keys = new Set([[MODEL, request] as const, ...variants].map(([model, req]) => speechCacheKey(model, req)));
    expect(keys.size).toBe(variants.length + 1);
  });
});

describe("CachingSpeechApi", () => {
  it("chama a API e grava a resposta no cache quando não há nada salvo", async () => {
    const inner = new FakeSpeechApi(new Uint8Array([4, 2]));
    const cache = new FakeSpeechAudioCache();
    const api = new CachingSpeechApi(inner, cache);
    expect([...(await api.createSpeech(request))]).toEqual([4, 2]);
    expect(inner.requests).toHaveLength(1);
    expect(cache.audioByKey.get(speechCacheKey(inner.model, request))).toEqual(new Uint8Array([4, 2]));
    expect(api.cacheHits).toBe(0);
  });

  it("devolve o áudio salvo sem chamar a API e conta o reaproveitamento", async () => {
    const inner = new FakeSpeechApi();
    const cache = new FakeSpeechAudioCache();
    cache.audioByKey.set(speechCacheKey(inner.model, request), new Uint8Array([7]));
    const api = new CachingSpeechApi(inner, cache);
    expect([...(await api.createSpeech(request))]).toEqual([7]);
    expect(inner.requests).toHaveLength(0);
    expect(api.cacheHits).toBe(1);
  });

  it("repassa modelo, limite e formato PCM da API envolvida", () => {
    const inner = new FakeSpeechApi();
    const api = new CachingSpeechApi(inner, new FakeSpeechAudioCache());
    expect([api.model, api.maxInputLength, api.pcmFormat]).toEqual([inner.model, inner.maxInputLength, inner.pcmFormat]);
  });
});

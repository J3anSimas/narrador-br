import { describe, expect, it } from "vitest";
import { CachingSpeechApi, speechCacheKey } from "../../src/speech/cachingSpeechApi.js";
import type { SpeechRequest } from "../../src/speech/speechApi.js";
import { FakeSpeechAudioCache } from "../fakes/FakeSpeechAudioCache.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

const request: SpeechRequest = { text: "Olá.", model: "gpt-4o-mini-tts", voice: "marin", format: "pcm" };

describe("speechCacheKey", () => {
  it("é estável para o mesmo pedido", () => {
    expect(speechCacheKey({ ...request })).toBe(speechCacheKey(request));
  });

  it("muda quando texto, voz, modelo, formato ou instruções mudam", () => {
    const variants: SpeechRequest[] = [
      { ...request, text: "Olá!" },
      { ...request, voice: "cedar" },
      { ...request, model: "tts-1" },
      { ...request, format: "mp3" },
      { ...request, instructions: "Fale devagar." },
    ];
    const keys = new Set([request, ...variants].map(speechCacheKey));
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
    expect(cache.audioByKey.get(speechCacheKey(request))).toEqual(new Uint8Array([4, 2]));
    expect(api.cacheHits).toBe(0);
  });

  it("devolve o áudio salvo sem chamar a API e conta o reaproveitamento", async () => {
    const inner = new FakeSpeechApi();
    const cache = new FakeSpeechAudioCache();
    cache.audioByKey.set(speechCacheKey(request), new Uint8Array([7]));
    const api = new CachingSpeechApi(inner, cache);
    expect([...(await api.createSpeech(request))]).toEqual([7]);
    expect(inner.requests).toHaveLength(0);
    expect(api.cacheHits).toBe(1);
  });
});

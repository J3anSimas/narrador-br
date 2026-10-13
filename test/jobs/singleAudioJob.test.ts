import { describe, expect, it } from "vitest";
import type { AudioJobEvent } from "../../src/jobs/audioJobEvent.js";
import { runSingleAudioJob } from "../../src/jobs/singleAudioJob.js";
import { speechCacheKey } from "../../src/speech/cachingSpeechApi.js";
import { DEFAULT_SPEECH_OPTIONS } from "../../src/speech/synthesizeParagraph.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeMp3Encoder } from "../fakes/FakeMp3Encoder.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";
import { FakeSpeechAudioCache } from "../fakes/FakeSpeechAudioCache.js";

describe("runSingleAudioJob", () => {
  it("emite progresso por parágrafo e termina com o caminho salvo", async () => {
    const events: AudioJobEvent[] = [];
    const deps = { createSpeechApi: () => new FakeSpeechApi(new Uint8Array([1, 0])), writer: new FakeAudioFileWriter() };
    await runSingleAudioJob(["Um.", "Dois."], { outputPath: "aula.wav" }, deps, (event) => events.push(event));
    expect(events).toEqual([
      { kind: "paragraphSynthesized", position: 1, total: 2 },
      { kind: "paragraphSynthesized", position: 2, total: 2 },
      { kind: "audioSaved", path: "aula.wav" },
    ]);
  });

  it("avisa a pasta de progresso e quantos parágrafos vieram do cache", async () => {
    const events: AudioJobEvent[] = [];
    const cache = new FakeSpeechAudioCache();
    const cachedRequest = { ...DEFAULT_SPEECH_OPTIONS, format: "pcm" as const, text: "Um." };
    cache.audioByKey.set(speechCacheKey(cachedRequest), new Uint8Array([1, 0]));
    const deps = {
      createSpeechApi: () => new FakeSpeechApi(new Uint8Array([1, 0])),
      writer: new FakeAudioFileWriter(),
      createSpeechCache: () => cache,
    };
    await runSingleAudioJob(["Um.", "Dois."], { outputPath: "a.wav" }, deps, (event) => events.push(event));
    expect(events[0]).toEqual({ kind: "progressSaved", directory: "a.wav.partes" });
    expect(events).toContainEqual({ kind: "paragraphsReused", count: 1 });
    expect(cache.cleared).toBe(true);
  });

  it("converte para MP3 quando o destino termina em .mp3", async () => {
    const writer = new FakeAudioFileWriter();
    const mp3Encoder = new FakeMp3Encoder(new Uint8Array([0xff]));
    const deps = { createSpeechApi: () => new FakeSpeechApi(new Uint8Array([1, 0])), writer, mp3Encoder };
    await runSingleAudioJob(["Um."], { outputPath: "aula.mp3" }, deps, () => undefined);
    expect([...(writer.filesByPath.get("aula.mp3") ?? [])]).toEqual([0xff]);
  });
});

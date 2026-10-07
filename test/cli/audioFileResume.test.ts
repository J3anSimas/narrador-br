import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli/runCli.js";
import type { SpeechApi, SpeechRequest } from "../../src/speech/speechApi.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";
import { FakeSpeechAudioCache } from "../fakes/FakeSpeechAudioCache.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";
import { FakeTextSink } from "../fakes/FakeTextSink.js";

/** API que funciona até o N-ésimo pedido e então cai, como uma queda de rede no meio do texto. */
class CrashingSpeechApi implements SpeechApi {
  readonly requests: SpeechRequest[] = [];

  constructor(private readonly crashOnRequestNumber: number) {}

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    this.requests.push(request);
    if (this.requests.length === this.crashOnRequestNumber) throw new Error("conexão perdida");
    return new Uint8Array([1, 0]);
  }
}

interface ResumeTestRun {
  exitCode: number;
  writer: FakeAudioFileWriter;
  stdout: FakeTextSink;
}

const ARGV = ["-f", "aula.txt", "--audio-file", "aula.wav"];

async function runWith(api: SpeechApi, cache: FakeSpeechAudioCache, cacheDirs: string[]): Promise<ResumeTestRun> {
  const writer = new FakeAudioFileWriter();
  const stdout = new FakeTextSink();
  const createSpeechCache = (directory: string): FakeSpeechAudioCache => {
    cacheDirs.push(directory);
    return cache;
  };
  const exitCode = await runCli(ARGV, {
    source: new FakeTextInputSource(new Map([["aula.txt", "Um.\n\nDois.\n\nTrês."]])),
    stdout,
    stderr: new FakeTextSink(),
    audio: { createSpeechApi: () => api, writer, createSpeechCache },
  });
  return { exitCode, writer, stdout };
}

describe("--audio-file retomável", () => {
  it("após uma queda, a nova execução só sintetiza o que faltou", async () => {
    const cache = new FakeSpeechAudioCache();
    const cacheDirs: string[] = [];
    const firstRun = await runWith(new CrashingSpeechApi(3), cache, cacheDirs);
    expect(firstRun.exitCode).toBe(1);
    expect(cache.audioByKey.size).toBe(2);

    const secondApi = new FakeSpeechApi(new Uint8Array([1, 0]));
    const secondRun = await runWith(secondApi, cache, cacheDirs);
    expect(secondRun.exitCode).toBe(0);
    expect(secondApi.requests.map((request) => request.text)).toEqual(["Três."]);
    expect(secondRun.stdout.written).toMatch(/2 parágrafo\(s\) reaproveitado\(s\)/);
    expect(cacheDirs).toEqual(["aula.wav.partes", "aula.wav.partes"]);
  });

  it("avisa onde o progresso fica e apaga a pasta depois de salvar o áudio final", async () => {
    const cache = new FakeSpeechAudioCache();
    const run = await runWith(new FakeSpeechApi(new Uint8Array([1, 0])), cache, []);
    expect(run.exitCode).toBe(0);
    expect(run.stdout.written).toMatch(/^Progresso salvo em aula\.wav\.partes/);
    expect([...run.writer.filesByPath.keys()]).toEqual(["aula.wav"]);
    expect(cache.cleared).toBe(true);
  });

  it("mantém o progresso se o áudio final não puder ser gravado", async () => {
    const cache = new FakeSpeechAudioCache();
    const api = new CrashingSpeechApi(2);
    expect((await runWith(api, cache, [])).exitCode).toBe(1);
    expect(cache.cleared).toBe(false);
    expect(cache.audioByKey.size).toBe(1);
  });
});

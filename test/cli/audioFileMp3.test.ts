import { describe, expect, it } from "vitest";
import type { Mp3Encoder } from "../../src/audio/mp3Encoder.js";
import { parseCliArgs } from "../../src/cli/parseCliArgs.js";
import { runCli } from "../../src/cli/runCli.js";
import { FailingMp3Encoder } from "../fakes/FailingMp3Encoder.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeMp3Encoder } from "../fakes/FakeMp3Encoder.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";
import { FakeTextSink } from "../fakes/FakeTextSink.js";

interface Mp3TestRun {
  exitCode: number;
  writer: FakeAudioFileWriter;
  stdout: FakeTextSink;
  stderr: FakeTextSink;
}

async function runWithMp3Encoder(argv: readonly string[], mp3Encoder: Mp3Encoder | undefined): Promise<Mp3TestRun> {
  const writer = new FakeAudioFileWriter();
  const stdout = new FakeTextSink();
  const stderr = new FakeTextSink();
  const api = new FakeSpeechApi(new Uint8Array([1, 0]));
  const exitCode = await runCli(argv, {
    source: new FakeTextInputSource(new Map([["aula.txt", "Um.\n\nDois."]])),
    stdout,
    stderr,
    audio: { createSpeechApi: () => api, writer, ...(mp3Encoder && { mp3Encoder }) },
  });
  return { exitCode, writer, stdout, stderr };
}

describe("--audio-file com .mp3", () => {
  it("o parser aceita .mp3", () => {
    expect(parseCliArgs(["--audio-file", "aula.mp3"]).audioFile).toEqual({ outputPath: "aula.mp3" });
  });

  it("o parser rejeita outras extensões, listando as aceitas", () => {
    expect(() => parseCliArgs(["--audio-file", "aula.ogg"])).toThrow(/"aula\.ogg".*\.wav ou \.mp3/);
  });

  it("converte o WAV montado e grava o MP3 no caminho pedido", async () => {
    const encoder = new FakeMp3Encoder(new Uint8Array([0xff, 0xfb, 9]));
    const run = await runWithMp3Encoder(["-f", "aula.txt", "--audio-file", "aula.mp3"], encoder);
    expect(run.exitCode).toBe(0);
    expect(String.fromCharCode(...(encoder.receivedWavs[0] ?? new Uint8Array()).subarray(0, 4))).toBe("RIFF");
    expect([...run.writer.filesByPath.entries()]).toEqual([["aula.mp3", new Uint8Array([0xff, 0xfb, 9])]]);
    expect(run.stdout.written).toMatch(/Áudio salvo em aula\.mp3\n$/);
  });

  it("com .wav, não chama o encoder", async () => {
    const encoder = new FakeMp3Encoder();
    const run = await runWithMp3Encoder(["-f", "aula.txt", "--audio-file", "aula.wav"], encoder);
    expect(run.exitCode).toBe(0);
    expect(encoder.receivedWavs).toHaveLength(0);
  });

  it("se a conversão falhar, salva o WAV ao lado e explica no erro", async () => {
    const run = await runWithMp3Encoder(
      ["-f", "aula.txt", "--audio-file", "aula.MP3"],
      new FailingMp3Encoder("ffmpeg não encontrado"),
    );
    expect(run.exitCode).toBe(1);
    expect([...run.writer.filesByPath.keys()]).toEqual(["aula.wav"]);
    expect(run.stderr.written).toMatch(
      /ffmpeg não encontrado\nO áudio já sintetizado foi salvo como WAV em "aula\.wav"/,
    );
  });

  it("sem encoder configurado, também salva o WAV e aponta a dependência faltante", async () => {
    const run = await runWithMp3Encoder(["-f", "aula.txt", "--audio-file", "aula.mp3"], undefined);
    expect(run.exitCode).toBe(1);
    expect([...run.writer.filesByPath.keys()]).toEqual(["aula.wav"]);
    expect(run.stderr.written).toMatch(/"aula\.mp3".*mp3Encoder/);
  });
});

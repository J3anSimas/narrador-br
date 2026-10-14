import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/cli/parseCliArgs.js";
import { runCli } from "../../src/cli/runCli.js";
import { fakeAiProvider } from "../fakes/FakeAiProvider.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";
import { FakeTextSink } from "../fakes/FakeTextSink.js";

describe("parseCliArgs com --audio-file", () => {
  it("aceita --audio-file com --voice", () => {
    expect(parseCliArgs(["--audio-file", "aula.wav", "--voice", "cedar"]).audioFile).toEqual({
      outputPath: "aula.wav",
      voice: "cedar",
    });
  });

  it("rejeita --audio junto com --audio-file, citando os dois", () => {
    expect(() => parseCliArgs(["--audio", "saida", "--audio-file", "aula.wav"])).toThrow(/"saida".*"aula\.wav"/);
  });

  it("rejeita extensão não suportada, citando o caminho", () => {
    expect(() => parseCliArgs(["--audio-file", "aula.ogg"])).toThrow(/"aula\.ogg".*\.wav/);
  });

  it("aceita .WAV em maiúsculas", () => {
    expect(parseCliArgs(["--audio-file", "AULA.WAV"]).audioFile).toEqual({ outputPath: "AULA.WAV" });
  });
});

describe("runCli com --audio-file", () => {
  it("separa o texto, sintetiza cada parágrafo em PCM e grava um único WAV", async () => {
    const api = new FakeSpeechApi(new Uint8Array([1, 0]));
    const writer = new FakeAudioFileWriter();
    const stdout = new FakeTextSink();
    const deps = {
      source: new FakeTextInputSource(new Map([["aula.txt", "Um\nlinha.\n\nDois."]])),
      stdout,
      stderr: new FakeTextSink(),
      ai: fakeAiProvider({ createSpeechApi: () => api }),
      audio: { writer },
    };
    expect(await runCli(["-f", "aula.txt", "--audio-file", "aula.wav"], deps)).toBe(0);
    expect(api.requests.map((request) => [request.text, request.format])).toEqual([
      ["Um linha.", "pcm"],
      ["Dois.", "pcm"],
    ]);
    expect([...writer.filesByPath.keys()]).toEqual(["aula.wav"]);
    expect(String.fromCharCode(...(writer.filesByPath.get("aula.wav") ?? new Uint8Array()).subarray(0, 4))).toBe("RIFF");
    expect(stdout.written).toBe("[1/2] parágrafo sintetizado\n[2/2] parágrafo sintetizado\nÁudio salvo em aula.wav\n");
  });
});

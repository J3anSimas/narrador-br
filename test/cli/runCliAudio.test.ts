import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli, type CliDependencies } from "../../src/cli/runCli.js";
import type { SpeechApi } from "../../src/ports/speechApi.js";
import { fakeAiProvider } from "../fakes/FakeAiProvider.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";
import { FakeTextSink } from "../fakes/FakeTextSink.js";

interface AudioTestSetup {
  api: FakeSpeechApi;
  writer: FakeAudioFileWriter;
  deps: CliDependencies & { stdout: FakeTextSink; stderr: FakeTextSink; audio: { writer: FakeAudioFileWriter } };
}

/** Fábrica que falha como a real falharia sem credencial. */
function failingSpeechApiFactory(message: string): () => SpeechApi {
  return () => {
    throw new Error(message);
  };
}

function createAudioDependencies(text: string): AudioTestSetup {
  const api = new FakeSpeechApi();
  const writer = new FakeAudioFileWriter();
  return {
    api,
    writer,
    deps: {
      source: new FakeTextInputSource(new Map([["aula.txt", text]])),
      stdout: new FakeTextSink(),
      stderr: new FakeTextSink(),
      ai: fakeAiProvider({ createSpeechApi: () => api }),
      audio: { writer },
    },
  };
}

describe("runCli com --audio", () => {
  it("separa o texto e gera um áudio por parágrafo, com progresso no stdout", async () => {
    const { api, writer, deps } = createAudioDependencies("Um\nlinha.\n\nDois.");
    expect(await runCli(["-f", "aula.txt", "--audio", "saida", "--voice", "cedar"], deps)).toBe(0);
    expect(api.requests.map((request) => [request.text, request.voice])).toEqual([
      ["Um linha.", "cedar"],
      ["Dois.", "cedar"],
    ]);
    expect(writer.filesByPath.size).toBe(2);
    expect(deps.stdout.written).toBe(
      `[1/2] ${join("saida", "paragrafo-001.mp3")}\n[2/2] ${join("saida", "paragrafo-002.mp3")}\n`,
    );
  });

  it("não cria a API no modo texto", async () => {
    const { deps } = createAudioDependencies("Um.");
    const failingDeps = { ...deps, ai: fakeAiProvider({ createSpeechApi: failingSpeechApiFactory("sem chave") }) };
    expect(await runCli(["-f", "aula.txt"], failingDeps)).toBe(0);
  });

  it("retorna 1 com a mensagem da fábrica quando a API não pode ser criada", async () => {
    const { deps } = createAudioDependencies("Um.");
    const failingDeps = { ...deps, ai: fakeAiProvider({ createSpeechApi: failingSpeechApiFactory("chave ausente") }) };
    expect(await runCli(["-f", "aula.txt", "--audio", "saida"], failingDeps)).toBe(1);
    expect(deps.stderr.written).toMatch(/^Erro: chave ausente/);
  });

  it("retorna 1 quando a CLI foi montada sem suporte a áudio", async () => {
    const { deps } = createAudioDependencies("Um.");
    const { audio: _unused, ...depsWithoutAudio } = deps;
    expect(await runCli(["-f", "aula.txt", "--audio", "saida"], depsWithoutAudio)).toBe(1);
    expect(deps.stderr.written).toMatch(/"saida".*deps\.audio/);
  });

  it("mostra no stderr a causa real de um erro de rede", async () => {
    const { deps } = createAudioDependencies("Um.");
    const terminated = new TypeError("terminated", { cause: new Error("other side closed") });
    const createSpeechApi = (): SpeechApi => {
      throw terminated;
    };
    const failingDeps = { ...deps, ai: fakeAiProvider({ createSpeechApi }) };
    expect(await runCli(["-f", "aula.txt", "--audio", "saida"], failingDeps)).toBe(1);
    expect(deps.stderr.written).toMatch(/^Erro: terminated → other side closed/);
  });
});

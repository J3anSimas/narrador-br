import { describe, expect, it } from "vitest";
import {
  DesktopJobController,
  type DesktopJobControllerDependencies,
} from "../../src/desktop/main/desktopJobController.js";
import type { DesktopJobEvent, DesktopJobRequest } from "../../src/desktop/shared/desktopBridge.js";
import type { SpeechApi, SpeechRequest } from "../../src/ports/speechApi.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";
import { FakeStructuredLogger } from "../fakes/FakeStructuredLogger.js";

/** API que cancela a geração durante o primeiro pedido, como um clique em "Cancelar" no meio. */
class CancelDuringFirstRequestSpeechApi extends FakeSpeechApi {
  controller: DesktopJobController | undefined;

  constructor() {
    super(new Uint8Array([1, 0]));
  }

  override async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    const audio = await super.createSpeech(request);
    this.controller?.cancel();
    return audio;
  }
}

/** API cuja conexão cai como no `fetch` do Node: "terminated" por fora, o motivo real na causa. */
class TerminatedSpeechApi extends FakeSpeechApi {
  override async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    await super.createSpeech(request);
    const socketError = Object.assign(new Error("other side closed"), { code: "UND_ERR_SOCKET" });
    throw new TypeError("terminated", { cause: socketError });
  }
}

// O áudio único emenda PCM de 16 bits: o fake precisa devolver um número par de bytes.
const PCM_SAMPLE = new Uint8Array([1, 0]);
const SINGLE: DesktopJobRequest = { mode: "singleFile", text: "Um.\n\nDois.", voice: "marin", outputPath: "a.wav" };
const PER_PARAGRAPH: DesktopJobRequest = { mode: "perParagraph", text: "Um.\n\nDois.", voice: "cedar", outputDir: "saida" };

function controllerWith(api: SpeechApi, overrides: Partial<DesktopJobControllerDependencies> = {}) {
  const logger = new FakeStructuredLogger();
  const registered: string[] = [];
  const controller = new DesktopJobController({
    loadApiKey: async () => "sk-teste",
    createJobDependencies: () => ({ createSpeechApi: () => api, writer: new FakeAudioFileWriter() }),
    registerTrack: (path) => {
      registered.push(path);
      return `tts-audio://track/${registered.length}`;
    },
    logger,
    ...overrides,
  });
  return { controller, logger, registered };
}

describe("DesktopJobController", () => {
  it("gera o áudio único e publica a faixa pronta para tocar", async () => {
    const { controller } = controllerWith(new FakeSpeechApi(PCM_SAMPLE));
    const events: DesktopJobEvent[] = [];
    expect(await controller.start(SINGLE, (event) => events.push(event))).toEqual({ status: "done" });
    expect(events.at(-1)).toEqual({ kind: "trackReady", track: { url: "tts-audio://track/1", path: "a.wav" } });
  });

  it("publica uma faixa por parágrafo, com a posição no texto", async () => {
    const { controller } = controllerWith(new FakeSpeechApi());
    const events: DesktopJobEvent[] = [];
    await controller.start(PER_PARAGRAPH, (event) => events.push(event));
    const tracks = events.flatMap((event) => (event.kind === "trackReady" ? [event.track.paragraphPosition] : []));
    expect(tracks).toEqual([1, 2]);
  });

  it("falha com orientação quando não há chave salva, sem chamar a API", async () => {
    const api = new FakeSpeechApi();
    const { controller } = controllerWith(api, { loadApiKey: async () => undefined });
    const result = await controller.start(SINGLE, () => undefined);
    expect(result).toMatchObject({ status: "failed", message: expect.stringMatching(/Chave da OpenAI/) });
    expect(api.requests).toHaveLength(0);
  });

  it("devolve cancelado e para depois do parágrafo em andamento", async () => {
    const api = new CancelDuringFirstRequestSpeechApi();
    const { controller, logger } = controllerWith(api);
    api.controller = controller;
    expect(await controller.start(SINGLE, () => undefined)).toEqual({ status: "cancelled" });
    expect(api.requests).toHaveLength(1);
    expect(logger.entries).toHaveLength(0);
  });

  it("registra o erro em log estruturado e libera uma nova geração", async () => {
    const { controller, logger } = controllerWith(new FakeSpeechApi(PCM_SAMPLE));
    const result = await controller.start({ ...SINGLE, text: "x".repeat(5000) }, () => undefined);
    expect(result).toMatchObject({ status: "failed", message: expect.stringMatching(/5000 caracteres/) });
    expect(logger.entries[0]).toMatchObject({ level: "error", fields: { mode: "singleFile" } });
    expect(await controller.start(SINGLE, () => undefined)).toEqual({ status: "done" });
  });

  it("mostra a causa real quando a API falha só com 'terminated'", async () => {
    const { controller, logger } = controllerWith(new TerminatedSpeechApi());
    const result = await controller.start(SINGLE, () => undefined);
    expect(result).toEqual({ status: "failed", message: "terminated → other side closed [UND_ERR_SOCKET]" });
    expect(logger.entries[0]).toMatchObject({ fields: { error: "terminated → other side closed [UND_ERR_SOCKET]" } });
  });

  it("recusa uma segunda geração enquanto a primeira roda", async () => {
    const { controller } = controllerWith(new FakeSpeechApi(PCM_SAMPLE));
    const first = controller.start(SINGLE, () => undefined);
    const second = await controller.start(SINGLE, () => undefined);
    expect(second).toMatchObject({ status: "failed", message: expect.stringMatching(/em andamento/) });
    expect(await first).toEqual({ status: "done" });
  });
});

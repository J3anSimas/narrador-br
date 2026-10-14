import type { AudioJobDependencies } from "../../jobs/audioJobDependencies.js";
import type { AudioJobListener } from "../../jobs/audioJobEvent.js";
import { runParagraphAudioJob } from "../../jobs/paragraphAudioJob.js";
import { runSingleAudioJob } from "../../jobs/singleAudioJob.js";
import { describeErrorChain } from "../../errors/describeErrorChain.js";
import { splitParagraphs } from "../../paragraphs/splitParagraphs.js";
import type { DesktopJobEvent, DesktopJobRequest, DesktopJobResult } from "../shared/desktopBridge.js";
import { AbortableSpeechApi, JobCancelledError } from "./abortableSpeechApi.js";
import type { StructuredLogger } from "./structuredLogger.js";

export interface DesktopJobControllerDependencies {
  loadApiKey(): Promise<string | undefined>;
  createJobDependencies(apiKey: string): AudioJobDependencies;
  registerTrack(path: string): string;
  logger: StructuredLogger;
}

/**
 * Roda uma geração por vez a pedido da janela, traduzindo arquivos gravados em
 * faixas tocáveis e erros em resultados (a janela não recebe exceções pelo IPC).
 *
 * @example await controller.start({ mode: "singleFile", text, voice: "marin", outputPath: "C:/aula.mp3" }, send)
 */
export class DesktopJobController {
  private running: AbortController | undefined;

  constructor(private readonly deps: DesktopJobControllerDependencies) {}

  async start(request: DesktopJobRequest, emit: (event: DesktopJobEvent) => void): Promise<DesktopJobResult> {
    if (this.running !== undefined) {
      return { status: "failed", message: "Já existe uma geração em andamento; aguarde ou cancele antes de começar outra." };
    }
    const abort = new AbortController();
    this.running = abort;
    try {
      await this.run(request, abort.signal, emit);
      return { status: "done" };
    } catch (error) {
      return this.toFailedResult(error, request);
    } finally {
      this.running = undefined;
    }
  }

  /** Cancela depois do parágrafo em andamento; o que já foi sintetizado fica salvo. */
  cancel(): void {
    this.running?.abort();
  }

  private async run(request: DesktopJobRequest, signal: AbortSignal, emit: (event: DesktopJobEvent) => void): Promise<void> {
    const jobDeps = this.withCancellation(this.deps.createJobDependencies(await this.requireApiKey()), signal);
    const paragraphs = requireParagraphs(request.text);
    const onEvent = this.withTracks(emit);
    if (request.mode === "singleFile") {
      await runSingleAudioJob(paragraphs, { outputPath: request.outputPath, voice: request.voice }, jobDeps, onEvent);
      return;
    }
    await runParagraphAudioJob(paragraphs, { outputDir: request.outputDir, voice: request.voice }, jobDeps, onEvent);
  }

  private async requireApiKey(): Promise<string> {
    const apiKey = await this.deps.loadApiKey();
    if (apiKey !== undefined) return apiKey;
    throw new Error("Nenhuma chave da OpenAI configurada. Abra \"Chave da OpenAI\" e cole a sua chave sk-...");
  }

  private withCancellation(jobDeps: AudioJobDependencies, signal: AbortSignal): AudioJobDependencies {
    return { ...jobDeps, createSpeechApi: () => new AbortableSpeechApi(jobDeps.createSpeechApi(), signal) };
  }

  private withTracks(emit: (event: DesktopJobEvent) => void): AudioJobListener {
    return (event) => {
      emit(event);
      if (event.kind === "audioFileWritten") {
        const url = this.deps.registerTrack(event.path);
        emit({ kind: "trackReady", track: { url, path: event.path, paragraphPosition: event.position } });
      }
      if (event.kind === "audioSaved") {
        emit({ kind: "trackReady", track: { url: this.deps.registerTrack(event.path), path: event.path } });
      }
    };
  }

  private toFailedResult(error: unknown, request: DesktopJobRequest): DesktopJobResult {
    if (error instanceof JobCancelledError) return { status: "cancelled" };
    // A cadeia inteira: só `error.message` mostrava "terminated" sem dizer o motivo.
    const message = describeErrorChain(error);
    this.deps.logger.log("error", "desktop job failed", { mode: request.mode, error: message });
    return { status: "failed", message };
  }
}

function requireParagraphs(text: string): string[] {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length > 0) return paragraphs;
  throw new Error(`Nenhum parágrafo encontrado (recebido: ${text.length} caracteres sem texto visível).`);
}

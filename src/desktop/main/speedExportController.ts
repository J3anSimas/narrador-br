import type { AudioSpeedRenderer } from "../../audio/audioSpeedRenderer.js";
import type { SpeedExportRequest, SpeedExportResult } from "../shared/desktopBridge.js";
import { spedUpAudioPath } from "./spedUpAudioPath.js";
import type { StructuredLogger } from "./structuredLogger.js";

export interface SpeedExportDependencies {
  /** Caminho de uma faixa registrada; a janela só conhece a URL. */
  trackPathFor(url: string): string | undefined;
  /** Diálogo de salvar, já sugerindo `suggestedPath`; `undefined` se o usuário cancelar. */
  chooseOutputPath(suggestedPath: string): Promise<string | undefined>;
  renderer: AudioSpeedRenderer;
  registerTrack(path: string): string;
  logger: StructuredLogger;
}

/**
 * Salva uma faixa tocável em outra velocidade e devolve o resultado como nova faixa,
 * traduzindo erros em resultados (a janela não recebe exceções pelo IPC).
 *
 * @example await controller.exportAtSpeed({ trackUrl: "tts-audio://track/1", speed: 1.5 })
 */
export class SpeedExportController {
  constructor(private readonly deps: SpeedExportDependencies) {}

  async exportAtSpeed(request: SpeedExportRequest): Promise<SpeedExportResult> {
    const inputPath = this.deps.trackPathFor(request.trackUrl);
    if (inputPath === undefined) {
      return { status: "failed", message: `Faixa desconhecida: "${request.trackUrl}" (esperado: um áudio aberto ou gerado no app).` };
    }
    const outputPath = await this.deps.chooseOutputPath(spedUpAudioPath(inputPath, request.speed));
    if (outputPath === undefined) return { status: "cancelled" };
    try {
      await this.deps.renderer.renderAtSpeed({ inputPath, outputPath, speed: request.speed });
    } catch (error) {
      return this.toFailedResult(error, request.speed);
    }
    return { status: "saved", track: { url: this.deps.registerTrack(outputPath), path: outputPath } };
  }

  private toFailedResult(error: unknown, speed: number): SpeedExportResult {
    const message = error instanceof Error ? error.message : String(error);
    this.deps.logger.log("error", "speed export failed", { speed, error: message });
    return { status: "failed", message };
  }
}

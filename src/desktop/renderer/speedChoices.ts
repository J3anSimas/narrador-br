import { formatSpeedNumber } from "../../audio/audioSpeed.js";
import type { SpeedExportResult } from "../shared/desktopBridge.js";

/** Atalhos ao lado do slider: as velocidades mais usadas para ouvir aula e podcast. */
export const SPEED_PRESETS: readonly number[] = [1, 1.25, 1.5, 1.75, 2];

/**
 * Rótulo da velocidade atual.
 *
 * @example speedLabel(1.25) // "1,25×"
 */
export function speedLabel(speed: number): string {
  return `${formatSpeedNumber(speed)}×`;
}

/**
 * Frase da linha de status depois de salvar; `undefined` quando o usuário cancelou o diálogo.
 *
 * @example describeSpeedExportResult({ status: "saved", track }) // "Salvo em C:/aula (1,5x).mp3"
 */
export function describeSpeedExportResult(result: SpeedExportResult): string | undefined {
  if (result.status === "saved") return `Salvo em ${result.track.path}`;
  if (result.status === "failed") return result.message;
  return undefined;
}

import { assertAudioSpeed } from "../../audio/audioSpeed.js";
import type { SpeedExportRequest } from "../shared/desktopBridge.js";

/**
 * Valida o pedido de exportação que chega da janela pelo IPC.
 *
 * @example parseSpeedExportRequest({ trackUrl: "tts-audio://track/1", speed: 1.5 })
 */
export function parseSpeedExportRequest(raw: unknown): SpeedExportRequest {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Pedido de exportação inválido: ${JSON.stringify(raw)} (esperado: objeto com trackUrl e speed).`);
  }
  const { trackUrl, speed } = raw as Readonly<Record<string, unknown>>;
  if (typeof trackUrl !== "string") {
    throw new Error(`Campo "trackUrl" inválido: ${JSON.stringify(trackUrl)} (esperado: URL tts-audio://track/N).`);
  }
  if (typeof speed !== "number") throw new Error(`Campo "speed" inválido: ${JSON.stringify(speed)} (esperado: número).`);
  assertAudioSpeed(speed);
  return { trackUrl, speed };
}

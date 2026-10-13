import { isMissingExecutable } from "./runProcess.js";

/**
 * Erro legível para quando o ffmpeg nem chega a rodar; `missingHint` completa a
 * mensagem de executável ausente com uma saída específica de quem chamou.
 *
 * @example describeFfmpegSpawnError(error, "ffmpeg", " Use --audio-file com .wav para não depender dele.")
 */
export function describeFfmpegSpawnError(error: unknown, command: string, missingHint = ""): Error {
  if (isMissingExecutable(error)) {
    return new Error(
      `ffmpeg não encontrado (procurado: "${command}"; esperado: ffmpeg no PATH, ex.: winget install Gyan.FFmpeg).${missingHint}`,
    );
  }
  const reason = error instanceof Error ? error.message : String(error);
  return new Error(`Não foi possível executar "${command}": ${reason}`);
}

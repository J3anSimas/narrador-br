import { createPcmSilence, type PcmFormat } from "./wav.js";

/**
 * Concatena trechos PCM intercalando um silêncio entre eles (não antes do
 * primeiro nem depois do último).
 *
 * @example joinPcmSegments([pcmParagrafo1, pcmParagrafo2], 500, OPENAI_PCM_FORMAT)
 */
export function joinPcmSegments(segments: readonly Uint8Array[], pauseMs: number, format: PcmFormat): Uint8Array {
  segments.forEach((segment, index) => assertWholeFrames(segment, index, format));
  const pause = createPcmSilence(pauseMs, format);
  const pieces = segments.flatMap((segment, index) => (index === 0 ? [segment] : [pause, segment]));
  const joined = new Uint8Array(pieces.reduce((total, piece) => total + piece.length, 0));
  let offset = 0;
  for (const piece of pieces) {
    joined.set(piece, offset);
    offset += piece.length;
  }
  return joined;
}

// Um trecho com frame incompleto desalinharia todos os seguintes, virando ruído.
function assertWholeFrames(segment: Uint8Array, index: number, format: PcmFormat): void {
  const blockAlign = format.channels * (format.bitsPerSample / 8);
  if (segment.length % blockAlign !== 0) {
    throw new Error(
      `Trecho PCM ${index + 1} com ${segment.length} bytes (esperado: múltiplo de ${blockAlign}, um frame inteiro).`,
    );
  }
}

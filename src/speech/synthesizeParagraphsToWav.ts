import { joinPcmSegments } from "../audio/joinPcmSegments.js";
import { encodeWav } from "../audio/wav.js";
import type { SpeechApi } from "../ports/speechApi.js";
import { synthesizeInOrder } from "./synthesizeInOrder.js";
import type { SpeechOptions } from "./synthesizeParagraph.js";

/** Pausa entre parágrafos: o suficiente para marcar a troca sem soar como corte. */
export const DEFAULT_PARAGRAPH_PAUSE_MS = 600;

// O formato é fixo em PCM: só amostras cruas podem ser emendadas sem decodificar.
export type SingleAudioOptions = Omit<SpeechOptions, "format"> & { pauseMs?: number };

export interface SingleAudioDependencies {
  api: SpeechApi;
  /** Chamado após cada parágrafo sintetizado; a síntese é lenta, então vale avisar o progresso. */
  onParagraphSynthesized?: (position: number, total: number) => void;
}

/**
 * Sintetiza todos os parágrafos e devolve um único WAV, com uma pausa entre eles.
 *
 * @example
 * const wav = await synthesizeParagraphsToWav(splitParagraphs(texto), { api });
 * await writeFile("aula.wav", wav);
 */
export async function synthesizeParagraphsToWav(
  paragraphs: readonly string[],
  deps: SingleAudioDependencies,
  options: SingleAudioOptions = {},
): Promise<Uint8Array> {
  const { pauseMs = DEFAULT_PARAGRAPH_PAUSE_MS, ...speechOptions } = options;
  const segments: Uint8Array[] = [];
  for await (const pcm of synthesizeInOrder(paragraphs, deps.api, { ...speechOptions, format: "pcm" })) {
    segments.push(pcm);
    deps.onParagraphSynthesized?.(segments.length, paragraphs.length);
  }
  const { pcmFormat } = deps.api;
  return encodeWav(joinPcmSegments(segments, pauseMs, pcmFormat), pcmFormat);
}

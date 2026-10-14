import type { PcmFormat } from "../audio/wav.js";

/** Formatos de áudio que um provedor de fala precisa saber gerar. */
export const AUDIO_FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"] as const;
export type AudioFormat = (typeof AUDIO_FORMATS)[number];

/** Pedido de síntese já validado; o que não vier preenchido fica com o padrão do provedor. */
export interface SpeechRequest {
  text: string;
  format: AudioFormat;
  voice?: string;
  instructions?: string;
}

/**
 * Porta de text-to-speech: o domínio só conhece esta interface, e cada provedor
 * (ex.: `adapters/openai`) a implementa. Também permite testar a síntese sem rede.
 */
export interface SpeechApi {
  /** Modelo usado; entra na chave do cache, porque trocar o modelo muda o áudio. */
  readonly model: string;
  /** Maior texto aceito por chamada. */
  readonly maxInputLength: number;
  /** Formato das amostras devolvidas com `format: "pcm"`, para emendá-las num WAV. */
  readonly pcmFormat: PcmFormat;
  /** Quantos pedidos podem estar em andamento ao mesmo tempo (inteiro ≥ 1); sem ele, um por vez. */
  readonly maxConcurrentRequests?: number;
  createSpeech(request: SpeechRequest): Promise<Uint8Array>;
}

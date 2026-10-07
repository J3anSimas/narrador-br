/** Formatos de áudio aceitos pelo endpoint `POST /v1/audio/speech`. */
export const AUDIO_FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"] as const;
export type AudioFormat = (typeof AUDIO_FORMATS)[number];

/** Pedido de síntese já validado, no formato que a API de fala espera. */
export interface SpeechRequest {
  text: string;
  model: string;
  voice: string;
  format: AudioFormat;
  instructions?: string;
}

/**
 * Fronteira com o provedor de text-to-speech; isola o SDK da OpenAI para que
 * a lógica de síntese seja testada sem rede.
 */
export interface SpeechApi {
  createSpeech(request: SpeechRequest): Promise<Uint8Array>;
}

import type { PcmFormat } from "../../src/audio/wav.js";
import type { SpeechApi, SpeechRequest } from "../../src/ports/speechApi.js";

/** 24 kHz, 16 bits, mono: 1 ms de silêncio = 24 frames de 2 bytes. */
export const FAKE_PCM_FORMAT: PcmFormat = { sampleRate: 24_000, channels: 1, bitsPerSample: 16 };

export const FAKE_MAX_INPUT_LENGTH = 4096;

/** API de fala em memória: registra os pedidos e devolve um áudio fixo, sem rede. */
export class FakeSpeechApi implements SpeechApi {
  readonly requests: SpeechRequest[] = [];
  readonly model = "modelo-de-fala-falso";
  readonly maxInputLength = FAKE_MAX_INPUT_LENGTH;
  readonly pcmFormat = FAKE_PCM_FORMAT;

  constructor(private readonly audio: Uint8Array = new Uint8Array([1, 2, 3])) {}

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    this.requests.push(request);
    return this.audio;
  }
}

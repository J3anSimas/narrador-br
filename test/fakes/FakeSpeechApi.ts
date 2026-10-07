import type { SpeechApi, SpeechRequest } from "../../src/speech/speechApi.js";

/** API de fala em memória: registra os pedidos e devolve um áudio fixo, sem rede. */
export class FakeSpeechApi implements SpeechApi {
  readonly requests: SpeechRequest[] = [];

  constructor(private readonly audio: Uint8Array = new Uint8Array([1, 2, 3])) {}

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    this.requests.push(request);
    return this.audio;
  }
}

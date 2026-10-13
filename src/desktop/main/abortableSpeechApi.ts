import type { SpeechApi, SpeechRequest } from "../../speech/speechApi.js";

export class JobCancelledError extends Error {
  constructor() {
    super("Geração cancelada.");
    this.name = "JobCancelledError";
  }
}

/**
 * `SpeechApi` que para de aceitar pedidos depois que o sinal é abortado. O pedido em
 * andamento termina normalmente: o áudio dele já vai para o cache e não é pago de novo.
 *
 * @example new AbortableSpeechApi(api, abortController.signal)
 */
export class AbortableSpeechApi implements SpeechApi {
  constructor(
    private readonly inner: SpeechApi,
    private readonly signal: AbortSignal,
  ) {}

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    if (this.signal.aborted) throw new JobCancelledError();
    return this.inner.createSpeech(request);
  }
}

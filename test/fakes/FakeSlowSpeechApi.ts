import type { SpeechApi, SpeechRequest } from "../../src/ports/speechApi.js";
import { FAKE_MAX_INPUT_LENGTH, FAKE_PCM_FORMAT } from "./FakeSpeechApi.js";

/**
 * API de fala em memória que demora `delayMsByText[texto]` para responder e devolve o
 * próprio texto em bytes; mede quantos pedidos ficaram em andamento ao mesmo tempo.
 */
export class FakeSlowSpeechApi implements SpeechApi {
  readonly requests: SpeechRequest[] = [];
  readonly model = "modelo-de-fala-lento";
  readonly maxInputLength = FAKE_MAX_INPUT_LENGTH;
  readonly pcmFormat = FAKE_PCM_FORMAT;
  maxInFlight = 0;
  private inFlight = 0;

  constructor(
    readonly maxConcurrentRequests: number,
    private readonly delayMsByText: Readonly<Record<string, number>> = {},
    private readonly failingText?: string,
  ) {}

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    this.requests.push(request);
    this.inFlight += 1;
    this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
    await new Promise((resolve) => setTimeout(resolve, this.delayMsByText[request.text] ?? 1));
    this.inFlight -= 1;
    if (request.text === this.failingText) throw new Error(`falha simulada em "${request.text}"`);
    return new TextEncoder().encode(request.text);
  }
}

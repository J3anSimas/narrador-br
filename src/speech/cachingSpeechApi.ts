import { createHash } from "node:crypto";
import type { SpeechAudioCache } from "./speechAudioCache.js";
import type { PcmFormat } from "../audio/wav.js";
import type { SpeechApi, SpeechRequest } from "../ports/speechApi.js";

/**
 * Chave do cache: muda se qualquer coisa que altere o áudio mudar (texto, voz, modelo,
 * formato ou instruções), então editar o texto só refaz os parágrafos alterados.
 *
 * @example speechCacheKey("gpt-4o-mini-tts", { text: "Olá.", voice: "marin", format: "pcm" })
 */
export function speechCacheKey(model: string, request: SpeechRequest): string {
  const identity = [request.text, model, request.voice ?? null, request.format, request.instructions ?? null];
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
}

/**
 * `SpeechApi` que consulta o cache antes de chamar a API e grava cada resposta assim
 * que ela chega; uma queda no meio perde no máximo o parágrafo em andamento.
 *
 * @example new CachingSpeechApi(ai.speech.create(), new NodeSpeechAudioCache("aula.mp3.partes"))
 */
export class CachingSpeechApi implements SpeechApi {
  private hits = 0;

  constructor(
    private readonly inner: SpeechApi,
    private readonly cache: SpeechAudioCache,
  ) {}

  get model(): string {
    return this.inner.model;
  }

  get maxInputLength(): number {
    return this.inner.maxInputLength;
  }

  get pcmFormat(): PcmFormat {
    return this.inner.pcmFormat;
  }

  get maxConcurrentRequests(): number | undefined {
    return this.inner.maxConcurrentRequests;
  }

  /** Quantos pedidos foram atendidos pelo cache (trabalho reaproveitado de execuções anteriores). */
  get cacheHits(): number {
    return this.hits;
  }

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    const key = speechCacheKey(this.inner.model, request);
    const cached = await this.cache.read(key);
    if (cached !== undefined) {
      this.hits += 1;
      return cached;
    }
    const audio = await this.inner.createSpeech(request);
    await this.cache.write(key, audio);
    return audio;
  }
}

import { createHash } from "node:crypto";
import type { SpeechAudioCache } from "./speechAudioCache.js";
import type { SpeechApi, SpeechRequest } from "./speechApi.js";

/**
 * Chave do cache: muda se qualquer coisa que altere o áudio mudar (texto, voz, modelo,
 * formato ou instruções), então editar o texto só refaz os parágrafos alterados.
 *
 * @example speechCacheKey({ text: "Olá.", model: "gpt-4o-mini-tts", voice: "marin", format: "pcm" })
 */
export function speechCacheKey(request: SpeechRequest): string {
  const identity = [request.text, request.model, request.voice, request.format, request.instructions ?? null];
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
}

/**
 * `SpeechApi` que consulta o cache antes de chamar a API e grava cada resposta assim
 * que ela chega; uma queda no meio perde no máximo o parágrafo em andamento.
 *
 * @example new CachingSpeechApi(createOpenAiSpeechApi(process.env), new NodeSpeechAudioCache("aula.mp3.partes"))
 */
export class CachingSpeechApi implements SpeechApi {
  private hits = 0;

  constructor(
    private readonly inner: SpeechApi,
    private readonly cache: SpeechAudioCache,
  ) {}

  /** Quantos pedidos foram atendidos pelo cache (trabalho reaproveitado de execuções anteriores). */
  get cacheHits(): number {
    return this.hits;
  }

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    const key = speechCacheKey(request);
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

import type { SpeechApi } from "../ports/speechApi.js";
import { assertSpeakableText, synthesizeParagraph, type SpeechOptions } from "./synthesizeParagraph.js";

/**
 * Sintetiza os parágrafos com até `api.maxConcurrentRequests` pedidos em andamento,
 * entregando os áudios sempre na ordem do texto. Valida todos antes da primeira
 * chamada à API, para não pagar por metade do texto e falhar no meio.
 *
 * @example for await (const audio of synthesizeInOrder(["Um.", "Dois."], api)) { ... }
 */
export async function* synthesizeInOrder(
  paragraphs: readonly string[],
  api: SpeechApi,
  options: SpeechOptions = {},
): AsyncGenerator<Uint8Array> {
  paragraphs.forEach((paragraph) => assertSpeakableText(paragraph.trim(), api.maxInputLength));
  const windowSize = requireConcurrencyLimit(api.maxConcurrentRequests ?? 1);
  // Janela deslizante: o limite vem do provedor para não estourar o rate limit dele,
  // e a fila FIFO mantém a ordem do texto (e do progresso) mesmo se um pedido terminar antes.
  const inFlight: Promise<Uint8Array>[] = [];
  for (const paragraph of paragraphs) {
    inFlight.push(startSynthesis(paragraph, api, options));
    if (inFlight.length >= windowSize) yield await takeOldest(inFlight);
  }
  while (inFlight.length > 0) yield await takeOldest(inFlight);
}

function startSynthesis(paragraph: string, api: SpeechApi, options: SpeechOptions): Promise<Uint8Array> {
  const synthesis = synthesizeParagraph(paragraph, api, options);
  // Se um pedido anterior falhar, este ainda pode rejeitar sem ninguém esperando por ele;
  // marcá-lo como tratado evita o "unhandled rejection", e quem o aguardar recebe o erro igual.
  synthesis.catch(() => undefined);
  return synthesis;
}

async function takeOldest(inFlight: Promise<Uint8Array>[]): Promise<Uint8Array> {
  const oldest = inFlight.shift();
  if (oldest === undefined) throw new Error("Fila de síntese vazia (esperado: ao menos um pedido em andamento).");
  return oldest;
}

function requireConcurrencyLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`maxConcurrentRequests = ${limit} (esperado: inteiro maior ou igual a 1).`);
  }
  return limit;
}

import type { SpeechApi } from "./speechApi.js";
import { assertSpeakableText, synthesizeParagraph, type SpeechOptions } from "./synthesizeParagraph.js";

/**
 * Sintetiza os parágrafos um por vez, na ordem do texto. Valida todos antes da
 * primeira chamada à API, para não pagar por metade do texto e falhar no meio.
 *
 * @example for await (const audio of synthesizeInOrder(["Um.", "Dois."], api)) { ... }
 */
export async function* synthesizeInOrder(
  paragraphs: readonly string[],
  api: SpeechApi,
  options: SpeechOptions = {},
): AsyncGenerator<Uint8Array> {
  paragraphs.forEach((paragraph) => assertSpeakableText(paragraph.trim()));
  // Sequencial de propósito: evita estourar o rate limit da API e mantém a ordem do progresso.
  for (const paragraph of paragraphs) {
    yield await synthesizeParagraph(paragraph, api, options);
  }
}

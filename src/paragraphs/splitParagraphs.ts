import { mergeBrokenSentences } from "./mergeBrokenSentences.js";
import { splitIntoBlocks } from "./textBlocks.js";

/**
 * Separa um texto em parágrafos: cada parágrafo vem numa única linha, sem
 * espaços sobrando, e frases quebradas por linha em branco são reunidas.
 *
 * @example splitParagraphs("Título\n\nPrimeira frase\ncontinua.\n\nOutra.")
 * // ["Título", "Primeira frase continua.", "Outra."]
 */
export function splitParagraphs(text: string): string[] {
  return mergeBrokenSentences(splitIntoBlocks(text));
}

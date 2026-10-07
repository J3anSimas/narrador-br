// Pontuação que indica que o bloco terminou de forma intencional
// (frase, item de lista, citação ou título com dois-pontos).
const TERMINAL_PUNCTUATION = /[.!?…:;"'”’)\]»]$/u;
const STARTS_LOWERCASE = /^\p{Ll}/u;

/**
 * Indica se `nextBlock` é a continuação de uma frase quebrada em `previousBlock`.
 * Ex.: no arquivo de referência, "…capacidades da empresa para a" seguido de
 * "inovação." foi separado por uma linha em branco indevida.
 *
 * @example isSentenceContinuation("para a", "inovação.") // true
 */
export function isSentenceContinuation(previousBlock: string, nextBlock: string): boolean {
  if (TERMINAL_PUNCTUATION.test(previousBlock)) return false;
  return STARTS_LOWERCASE.test(nextBlock);
}

/**
 * Une blocos consecutivos quando o segundo continua uma frase do primeiro.
 *
 * @example mergeBrokenSentences(["Vai até a", "casa.", "Fim."]) // ["Vai até a casa.", "Fim."]
 */
export function mergeBrokenSentences(blocks: readonly string[]): string[] {
  const merged: string[] = [];
  for (const block of blocks) {
    const lastIndex = merged.length - 1;
    const previous = merged[lastIndex];
    if (previous !== undefined && isSentenceContinuation(previous, block)) {
      merged[lastIndex] = `${previous} ${block}`;
      continue;
    }
    merged.push(block);
  }
  return merged;
}

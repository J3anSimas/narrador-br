const BYTE_ORDER_MARK = /^﻿/;
const BLANK_LINE = /\n[ \t]*\n/;

/**
 * Remove o BOM e converte quebras de linha Windows/Mac antigas para `\n`.
 *
 * @example normalizeLineEndings("﻿a\r\nb") // "a\nb"
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(BYTE_ORDER_MARK, "").replace(/\r\n?/g, "\n");
}

/**
 * Junta as linhas de um bloco num único parágrafo de uma linha só.
 * Quebras de linha dentro do bloco são tratadas como quebra visual (hard wrap),
 * não como fim de parágrafo.
 *
 * @example collapseWhitespace("  um\n  dois\t três ") // "um dois três"
 */
export function collapseWhitespace(block: string): string {
  return block.replace(/\s+/g, " ").trim();
}

/**
 * Divide o texto em blocos brutos. Se houver linhas em branco, elas delimitam
 * os blocos; caso contrário, cada linha é um bloco — textos sem linha em branco
 * costumam usar uma quebra simples por parágrafo.
 *
 * @example splitIntoBlocks("a\nb\n\nc") // ["a b", "c"]
 */
export function splitIntoBlocks(text: string): string[] {
  const normalized = normalizeLineEndings(text);
  const separator = BLANK_LINE.test(normalized) ? BLANK_LINE : /\n/;
  return normalized
    .split(separator)
    .map(collapseWhitespace)
    .filter((block) => block.length > 0);
}

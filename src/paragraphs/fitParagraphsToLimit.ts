// Pontos de corte em ordem de preferência: fim de frase, pausa dentro da frase, qualquer espaço.
const BREAK_POINTS = [/(?<=[.!?…]["'”’)\]»]*)\s+/u, /(?<=[;:,—–])\s+/u, /\s+/u] as const;

/**
 * Divide os parágrafos maiores que `maxLength` em trechos que cabem no limite,
 * cortando de preferência no fim de uma frase, depois em `;`, `:` ou `,`, depois
 * entre palavras — só corta uma palavra ao meio se ela sozinha passar do limite.
 * Parágrafos que já cabem ficam como estão.
 *
 * @example fitParagraphsToLimit(["Uma frase. Outra frase."], 12) // ["Uma frase.", "Outra frase."]
 */
export function fitParagraphsToLimit(paragraphs: readonly string[], maxLength: number): string[] {
  if (!Number.isInteger(maxLength) || maxLength < 1) {
    throw new Error(`Limite de caracteres inválido: ${maxLength} (esperado: inteiro maior que zero).`);
  }
  return paragraphs.flatMap((paragraph) => fitText(paragraph, maxLength, 0));
}

function fitText(text: string, maxLength: number, level: number): string[] {
  if (text.length <= maxLength) return [text];
  const breakPoint = BREAK_POINTS[level];
  if (breakPoint === undefined) return cutEvery(text, maxLength);
  const pieces = text.split(breakPoint).flatMap((piece) => fitText(piece, maxLength, level + 1));
  return packPieces(pieces, maxLength);
}

/** Reagrupa os pedaços em ordem, colocando em cada trecho tantos quantos couberem. */
function packPieces(pieces: readonly string[], maxLength: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (current.length === 0) current = piece;
    else if (current.length + 1 + piece.length <= maxLength) current = `${current} ${piece}`;
    else {
      chunks.push(current);
      current = piece;
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function cutEvery(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += maxLength) chunks.push(text.slice(start, start + maxLength));
  return chunks;
}

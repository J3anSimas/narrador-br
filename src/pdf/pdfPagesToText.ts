import type { PdfPage, PdfTextLine } from "./pdfTextLine.js";

const PAGE_NUMBER = /^(?:(?:p[áa]g(?:ina)?\.?\s*)?\d{1,4}(?:\s*(?:de|\/)\s*\d{1,4})?|-\s*\d{1,4}\s*-)$/iu;
const ENDS_SENTENCE = /[.!?…:]["'”’)\]»]*$/u;
const HYPHENATED_END = /\p{L}-$/u;
const STARTS_LOWERCASE = /^\p{Ll}/u;

// Espaço entre linhas acima do normal (em múltiplos do espaçamento típico) indica novo parágrafo.
const PARAGRAPH_GAP_FACTOR = 1.5;
// Linha que termina a frase e ocupa menos que isso de uma linha cheia fecha o parágrafo.
const SHORT_LINE_RATIO = 0.85;
// Cabeçalho/rodapé: o mesmo texto nas bordas de pelo menos esta fração das páginas.
const RUNNING_LINE_MIN_PAGE_RATIO = 0.5;
const RUNNING_LINE_MIN_PAGES = 3;
const EDGE_LINES_PER_PAGE = 2;

/**
 * Reconstrói o texto corrido de um PDF: um parágrafo por linha, separados por
 * linha em branco. Remove números de página e cabeçalhos/rodapés repetidos,
 * junta as linhas de cada parágrafo e desfaz a hifenização de fim de linha.
 *
 * @example pdfPagesToText(await extractPdfLines(pdfBytes)) // "Título\n\nPrimeiro parágrafo…"
 */
export function pdfPagesToText(pages: readonly PdfPage[]): string {
  const cleanPages = removeRunningLines(pages);
  const layout: DocumentLayout = {
    typicalGap: percentile(cleanPages.flatMap(lineGaps), 0.5),
    // Percentil alto em vez do máximo: uma tabela ou URL larga não deve tornar curtas as linhas cheias.
    fullLineWidth: percentile(cleanPages.flat().map((line) => line.width), 0.9),
  };
  const paragraphs: PdfTextLine[][] = [];
  let previous: { line: PdfTextLine; samePage: boolean } | undefined;
  for (const page of cleanPages) {
    page.forEach((line, index) => {
      const current = paragraphs.at(-1);
      if (current === undefined || (previous !== undefined && startsNewParagraph(previous, line, layout))) {
        paragraphs.push([line]);
      } else {
        current.push(line);
      }
      previous = { line, samePage: index < page.length - 1 };
    });
  }
  return paragraphs.map(joinLines).join("\n\n");
}

interface DocumentLayout {
  /** Distância vertical normal entre linhas consecutivas do mesmo parágrafo. */
  typicalGap: number;
  /** Largura de uma linha que ocupa toda a área de texto. */
  fullLineWidth: number;
}

function startsNewParagraph(
  previous: { line: PdfTextLine; samePage: boolean },
  line: PdfTextLine,
  layout: DocumentLayout,
): boolean {
  const prev = previous.line;
  const gap = prev.y - line.y;
  if (previous.samePage && gap > layout.typicalGap * PARAGRAPH_GAP_FACTOR) return true;
  if (Math.abs(prev.height - line.height) > Math.max(prev.height, line.height) * 0.2) return true;
  if (!ENDS_SENTENCE.test(prev.text)) return false;
  const isShortLine = prev.width < layout.fullLineWidth * SHORT_LINE_RATIO;
  const isIndented = previous.samePage && line.x - prev.x > line.height;
  return isShortLine || isIndented;
}

function lineGaps(page: PdfPage): number[] {
  const gaps: number[] = [];
  for (let index = 1; index < page.length; index++) {
    const gap = (page[index - 1] as PdfTextLine).y - (page[index] as PdfTextLine).y;
    if (gap > 0) gaps.push(gap);
  }
  return gaps;
}

function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) return Number.POSITIVE_INFINITY;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] as number;
}

function joinLines(lines: readonly PdfTextLine[]): string {
  let text = "";
  for (const { text: line } of lines) {
    if (text.length === 0) text = line;
    else if (HYPHENATED_END.test(text) && STARTS_LOWERCASE.test(line)) text = `${text.slice(0, -1)}${line}`;
    else text = `${text} ${line}`;
  }
  return text.replace(/\s+/g, " ").trim();
}

/** Remove números de página e linhas que se repetem nas bordas de muitas páginas (cabeçalhos/rodapés). */
function removeRunningLines(pages: readonly PdfPage[]): PdfPage[] {
  const running = findRunningLineKeys(pages);
  return pages
    .map((page) => page.filter((line) => !PAGE_NUMBER.test(line.text) && !running.has(runningLineKey(line.text))))
    .filter((page) => page.length > 0);
}

function findRunningLineKeys(pages: readonly PdfPage[]): Set<string> {
  const minPages = Math.max(RUNNING_LINE_MIN_PAGES, Math.ceil(pages.length * RUNNING_LINE_MIN_PAGE_RATIO));
  const pageCountByKey = new Map<string, number>();
  for (const page of pages) {
    const edgeLines = [...page.slice(0, EDGE_LINES_PER_PAGE), ...page.slice(-EDGE_LINES_PER_PAGE)];
    for (const key of new Set(edgeLines.map((line) => runningLineKey(line.text)))) {
      pageCountByKey.set(key, (pageCountByKey.get(key) ?? 0) + 1);
    }
  }
  return new Set([...pageCountByKey].filter(([, count]) => count >= minPages).map(([key]) => key));
}

// Ignora números para reconhecer "Capítulo 1 — pág. 3" e "Capítulo 1 — pág. 4" como o mesmo rodapé.
function runningLineKey(text: string): string {
  return text.replace(/\d+/g, "#").replace(/\s+/g, " ").trim().toLowerCase();
}

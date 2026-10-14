import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api.js";
import type { PdfPage, PdfTextLine } from "./pdfTextLine.js";

/**
 * Lê o PDF e devolve, por página, as linhas de texto com suas posições.
 * PDFs escaneados (só imagem) não têm texto e resultam em páginas vazias.
 *
 * @example const pages = await extractPdfLines(await readFile("aula.pdf"));
 */
export async function extractPdfLines(data: Uint8Array): Promise<PdfPage[]> {
  // O pdf.js transfere (e esvazia) o buffer recebido; a cópia preserva o do chamador.
  const loadingTask = getDocument({ data: new Uint8Array(data), verbosity: 0 });
  try {
    const document = await loadingTask.promise;
    const pages: PdfPage[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(groupItemsIntoLines(content.items));
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}

function groupItemsIntoLines(items: readonly (TextItem | TextMarkedContent)[]): PdfTextLine[] {
  const lines: PdfTextLine[] = [];
  let current: PdfTextLine | undefined;
  const closeLine = (): void => {
    if (current !== undefined && current.text.trim().length > 0) lines.push({ ...current, text: current.text.trim() });
    current = undefined;
  };
  for (const item of items) {
    if (!isTextItem(item)) continue;
    const [x, y] = [Number(item.transform[4]), Number(item.transform[5])];
    if (current !== undefined && !isSameLine(current, y, item.height)) closeLine();
    current = current === undefined ? startLine(item, x, y) : appendToLine(current, item, x);
    if (item.hasEOL) closeLine();
  }
  closeLine();
  return lines;
}

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return "str" in item;
}

function isSameLine(line: PdfTextLine, y: number, height: number): boolean {
  return Math.abs(line.y - y) <= Math.max(line.height, height) / 2;
}

function startLine(item: TextItem, x: number, y: number): PdfTextLine {
  return { text: item.str, x, y, width: item.width, height: item.height };
}

function appendToLine(line: PdfTextLine, item: TextItem, x: number): PdfTextLine {
  // Alguns PDFs posicionam cada palavra separadamente, sem um item de espaço entre elas.
  const lineEnd = line.x + line.width;
  const needsSpace = x - lineEnd > item.height * 0.15 && !/\s$/.test(line.text) && !/^\s/.test(item.str);
  return {
    ...line,
    text: `${line.text}${needsSpace ? " " : ""}${item.str}`,
    width: Math.max(lineEnd, x + item.width) - line.x,
    height: Math.max(line.height, item.height),
  };
}

/** Uma linha a desenhar na página, em pontos (origem no canto inferior esquerdo). */
export interface PdfLineSpec {
  text: string;
  y: number;
  x?: number;
  size?: number;
}

/**
 * Monta um PDF mínimo e válido com texto em Helvetica (WinAnsi, aceita acentos),
 * para testar a extração sem depender de arquivos binários no repositório.
 *
 * @example buildPdf([[{ text: "Olá.", y: 770 }]])
 */
export function buildPdf(pages: readonly (readonly PdfLineSpec[])[]): Uint8Array {
  const fontId = 3;
  const firstPageId = 4;
  const pageIds = pages.map((_, index) => firstPageId + index * 2);
  const objects = new Map<number, string>([
    [1, "<< /Type /Catalog /Pages 2 0 R >>"],
    [2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`],
    [fontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"],
  ]);
  pages.forEach((lines, index) => {
    const pageId = pageIds[index] as number;
    const stream = lines.map(drawLine).join("\n");
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${pageId + 1} 0 R >>`,
    );
    objects.set(pageId + 1, `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
  });
  return serialize(objects);
}

function drawLine({ text, x = 72, y, size = 12 }: PdfLineSpec): string {
  const escaped = text.replace(/[\\()]/g, (char) => `\\${char}`);
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escaped}) Tj ET`;
}

function serialize(objects: ReadonlyMap<number, string>): Uint8Array {
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  const ids = [...objects.keys()].sort((a, b) => a - b);
  for (const id of ids) {
    offsets[id] = Buffer.byteLength(body, "latin1");
    body += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(body, "latin1");
  const size = ids.length + 1;
  body += `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (const id of ids) body += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(body, "latin1"));
}

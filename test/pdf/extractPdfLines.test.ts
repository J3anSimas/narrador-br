import { describe, expect, it } from "vitest";
import { extractPdfLines } from "../../src/pdf/extractPdfLines.js";
import { buildPdf } from "../fakes/buildPdf.js";

describe("extractPdfLines", () => {
  it("devolve as linhas de cada página com texto acentuado e posição", async () => {
    const pdf = buildPdf([
      [
        { text: "Informação útil", y: 770 },
        { text: "segunda linha", y: 755 },
      ],
      [{ text: "Página dois.", y: 770, x: 90 }],
    ]);
    const pages = await extractPdfLines(pdf);
    expect(pages.map((page) => page.map((line) => line.text))).toEqual([
      ["Informação útil", "segunda linha"],
      ["Página dois."],
    ]);
    expect(pages[0]?.[1]).toMatchObject({ x: 72, y: 755, height: 12 });
    expect(pages[1]?.[0]?.x).toBe(90);
  });

  it("não altera o buffer recebido", async () => {
    const pdf = buildPdf([[{ text: "Oi.", y: 770 }]]);
    const copy = new Uint8Array(pdf);
    await extractPdfLines(pdf);
    expect(pdf).toEqual(copy);
  });

  it("rejeita bytes que não são PDF", async () => {
    await expect(extractPdfLines(new TextEncoder().encode("não sou um pdf"))).rejects.toThrow();
  });
});

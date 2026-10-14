import { describe, expect, it } from "vitest";
import { pdfPagesToText } from "../../src/pdf/pdfPagesToText.js";
import type { PdfTextLine } from "../../src/pdf/pdfTextLine.js";

const FULL_WIDTH = 450;

/** Linha de corpo de texto com 12pt; `width` cheia por padrão (linha que continua na seguinte). */
function line(text: string, y: number, overrides: Partial<PdfTextLine> = {}): PdfTextLine {
  return { text, x: 72, y, width: FULL_WIDTH, height: 12, ...overrides };
}

describe("pdfPagesToText", () => {
  it("junta as linhas de um parágrafo e separa parágrafos por espaço vertical maior", () => {
    const page = [
      line("Primeira linha do primeiro", 770),
      line("parágrafo termina aqui.", 756, { width: 200 }),
      line("Segundo parágrafo depois", 728),
      line("de um espaço maior.", 714, { width: 150 }),
    ];
    expect(pdfPagesToText([page])).toBe(
      "Primeira linha do primeiro parágrafo termina aqui.\n\nSegundo parágrafo depois de um espaço maior.",
    );
  });

  it("fecha o parágrafo em linha curta terminada em ponto, mesmo sem espaço extra", () => {
    const page = [
      line("Uma frase que vai até o", 770),
      line("fim aqui.", 756, { width: 80 }),
      line("Outro parágrafo.", 742, { width: 140 }),
    ];
    expect(pdfPagesToText([page])).toBe("Uma frase que vai até o fim aqui.\n\nOutro parágrafo.");
  });

  it("não quebra em linha cheia terminada em ponto (frase que acaba no fim da linha)", () => {
    const page = [line("Frase acaba bem no fim da linha.", 770), line("E o parágrafo segue.", 756, { width: 160 })];
    expect(pdfPagesToText([page])).toBe("Frase acaba bem no fim da linha. E o parágrafo segue.");
  });

  it("reconhece recuo de primeira linha como novo parágrafo", () => {
    const page = [line("Termina numa linha cheia.", 770), line("Novo parágrafo recuado.", 756, { x: 100 })];
    expect(pdfPagesToText([page])).toBe("Termina numa linha cheia.\n\nNovo parágrafo recuado.");
  });

  it("separa títulos pelo tamanho da fonte", () => {
    const page = [line("Capítulo 1", 780, { height: 18, width: 120 }), line("Texto do capítulo.", 756, { width: 160 })];
    expect(pdfPagesToText([page])).toBe("Capítulo 1\n\nTexto do capítulo.");
  });

  it("desfaz a hifenização de fim de linha", () => {
    const page = [line("A infor-", 770), line("mação chegou.", 756, { width: 120 })];
    expect(pdfPagesToText([page])).toBe("A informação chegou.");
  });

  it("continua o parágrafo na página seguinte e remove números de página", () => {
    const pages = [
      [line("Parágrafo que atravessa a", 770), line("1", 40, { width: 10 })],
      [line("página e termina.", 770, { width: 140 }), line("Página 2 de 2", 40, { width: 80 })],
    ];
    expect(pdfPagesToText(pages)).toBe("Parágrafo que atravessa a página e termina.");
  });

  it("remove cabeçalhos repetidos no topo das páginas", () => {
    const bodies = [
      ["Começo do texto, numa linha", "cheia e outra curta."],
      ["Meio do texto, que também", "ocupa duas linhas."],
      ["Fim do texto, encerrando", "o documento."],
    ];
    const pages = bodies.map(([first = "", last = ""], index) => [
      line(`Curso de TI — capítulo ${index + 1}`, 800, { width: 200 }),
      line(first, 770),
      line(last, 756, { width: 160 }),
    ]);
    expect(pdfPagesToText(pages)).toBe(bodies.map((body) => body.join(" ")).join("\n\n"));
  });

  it("devolve texto vazio para PDF sem texto", () => {
    expect(pdfPagesToText([[], []])).toBe("");
  });
});

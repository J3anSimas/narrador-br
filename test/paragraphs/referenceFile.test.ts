import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { splitParagraphs } from "../../src/paragraphs/splitParagraphs.js";

// Cópia de teoria_indicadores_desempenho_TI.txt: arquivo de referência para validação.
const referencePath = fileURLToPath(new URL("../fixtures/teoria_indicadores_desempenho_TI.txt", import.meta.url));
const referenceText = readFileSync(referencePath, "utf8");
const paragraphs = splitParagraphs(referenceText);

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

describe("arquivo de referência: teoria_indicadores_desempenho_TI.txt", () => {
  it("gera 568 parágrafos (569 blocos, com uma frase quebrada reunida)", () => {
    expect(paragraphs).toHaveLength(568);
  });

  it("começa pelo título e termina na última referência bibliográfica", () => {
    expect(paragraphs[0]).toBe("Teoria sobre indicadores de desempenho de TI");
    expect(paragraphs.at(-1)).toBe("SOMMERVILLE, I. Engenharia de software. 10. ed. São Paulo: Pearson Prentice Hall, 2011.");
  });

  it("reúne a frase quebrada por linha em branco (linhas 795-797 do original)", () => {
    expect(paragraphs).toContain(
      "( ) KPIs que monitoram o desempenho organizacional, considerando as capacidades da empresa para a inovação.",
    );
    expect(paragraphs).not.toContain("inovação.");
  });

  it("mantém itens de lista, títulos e alternativas como parágrafos próprios", () => {
    expect(paragraphs).toContain("- número de erros em um módulo;");
    expect(paragraphs).toContain("1. Itens iniciais");
    expect(paragraphs).toContain("Probabilidade/");
    expect(paragraphs).toContain("Impacto");
  });

  it("produz parágrafos de uma linha, sem espaços nas bordas e não vazios", () => {
    for (const paragraph of paragraphs) {
      expect(paragraph).toMatch(/^\S(.*\S)?$/);
    }
  });

  it("não perde nem reordena nenhuma palavra do texto original", () => {
    expect(wordsOf(paragraphs.join(" "))).toEqual(wordsOf(referenceText));
  });

  it("gera o mesmo resultado com quebras de linha Windows (CRLF)", () => {
    expect(splitParagraphs(referenceText.replace(/\n/g, "\r\n"))).toEqual(paragraphs);
  });
});

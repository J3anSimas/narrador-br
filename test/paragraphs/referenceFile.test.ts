import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { splitParagraphs } from "../../src/paragraphs/splitParagraphs.js";

// Texto próprio no formato de um material de aula; substituiu um material de curso de terceiros
// para que o repositório pudesse ser público.
const referencePath = fileURLToPath(new URL("../fixtures/texto_referencia.txt", import.meta.url));
const referenceText = readFileSync(referencePath, "utf8");
const paragraphs = splitParagraphs(referenceText);

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

describe("arquivo de referência: texto_referencia.txt", () => {
  it("gera 40 parágrafos (42 blocos, com duas frases quebradas reunidas)", () => {
    expect(paragraphs).toHaveLength(40);
  });

  it("começa pelo título e termina na última referência bibliográfica", () => {
    expect(paragraphs[0]).toBe("Guia de observabilidade para pequenas equipes de TI");
    expect(paragraphs.at(-1)).toBe(
      "MAJORS, C.; FONG-JONES, L.; MIRANDA, G. Observability engineering. Sebastopol: O'Reilly Media, 2022.",
    );
  });

  it("reúne a frase quebrada por linha em branco", () => {
    expect(paragraphs).toContain(
      "( ) Seguir uma requisição de ponta a ponta entre os serviços do sistema, mostrando onde o tempo foi gasto.",
    );
    expect(paragraphs).not.toContain("gasto.");
    expect(paragraphs).not.toContain("sala de reuniões.");
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

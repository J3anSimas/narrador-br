import { describe, expect, it } from "vitest";
import { fitParagraphsToLimit } from "../../src/paragraphs/fitParagraphsToLimit.js";

function wordsOf(texts: readonly string[]): string[] {
  return texts.join(" ").split(/\s+/).filter((word) => word.length > 0);
}

describe("fitParagraphsToLimit", () => {
  it("mantém intactos os parágrafos que já cabem", () => {
    expect(fitParagraphsToLimit(["Curto.", "Também curto."], 20)).toEqual(["Curto.", "Também curto."]);
  });

  it("corta no fim das frases, agrupando quantas couberem em cada trecho", () => {
    const paragraph = "Primeira frase. Segunda frase! Terceira frase? Quarta.";
    expect(fitParagraphsToLimit([paragraph], 32)).toEqual(["Primeira frase. Segunda frase!", "Terceira frase? Quarta."]);
  });

  it("reconhece fim de frase seguido de aspas ou parênteses", () => {
    expect(fitParagraphsToLimit(["Ele disse “sim.” Depois saiu (rápido.) E fim."], 21)).toEqual([
      "Ele disse “sim.”",
      "Depois saiu (rápido.)",
      "E fim.",
    ]);
  });

  it("corta em vírgula ou ponto e vírgula quando uma frase sozinha passa do limite", () => {
    expect(fitParagraphsToLimit(["um item longo, outro item longo; e o último item."], 20)).toEqual([
      "um item longo,",
      "outro item longo;",
      "e o último item.",
    ]);
  });

  it("corta entre palavras quando não há pontuação", () => {
    expect(fitParagraphsToLimit(["palavra palavra palavra palavra"], 16)).toEqual(["palavra palavra", "palavra palavra"]);
  });

  it("só corta uma palavra ao meio se ela sozinha passar do limite", () => {
    expect(fitParagraphsToLimit(["abcdefghij"], 4)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("nunca passa do limite nem perde ou reordena palavras", () => {
    const sentence = "Indicadores de desempenho, quando bem definidos, orientam decisões; sem eles, a gestão é intuição. ";
    const paragraph = sentence.repeat(120).trim();
    const chunks = fitParagraphsToLimit([paragraph], 4096);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(4096);
    expect(chunks.every((chunk) => chunk.endsWith("intuição."))).toBe(true);
    expect(wordsOf(chunks)).toEqual(wordsOf([paragraph]));
  });

  it("rejeita limite inválido", () => {
    expect(() => fitParagraphsToLimit(["a"], 0)).toThrow(/0.*inteiro maior que zero/);
  });
});

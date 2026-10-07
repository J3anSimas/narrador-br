import { describe, expect, it } from "vitest";
import { isSentenceContinuation, mergeBrokenSentences } from "../../src/paragraphs/mergeBrokenSentences.js";

describe("isSentenceContinuation", () => {
  it("é continuação quando o anterior não termina com pontuação e o próximo começa minúsculo", () => {
    expect(isSentenceContinuation("capacidades da empresa para a", "inovação.")).toBe(true);
  });

  it.each([".", "!", "?", "…", ":", ";", "”", ")"])("não é continuação após %s", (mark) => {
    expect(isSentenceContinuation(`fim${mark}`, "começo")).toBe(false);
  });

  it("não é continuação quando o próximo começa com maiúscula, número ou símbolo", () => {
    expect(isSentenceContinuation("Probabilidade/", "Impacto")).toBe(false);
    expect(isSentenceContinuation("Prof.ª Ana Souza", "1. Itens iniciais")).toBe(false);
    expect(isSentenceContinuation("Objetivos", "- Reconhecer os serviços")).toBe(false);
  });
});

describe("mergeBrokenSentences", () => {
  it("une apenas os blocos que continuam a frase anterior", () => {
    expect(mergeBrokenSentences(["Vai até a", "casa.", "Fim."])).toEqual(["Vai até a casa.", "Fim."]);
  });

  it("une quebras em cadeia", () => {
    expect(mergeBrokenSentences(["uma frase", "quebrada em", "três."])).toEqual(["uma frase quebrada em três."]);
  });

  it("devolve lista vazia para entrada vazia", () => {
    expect(mergeBrokenSentences([])).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { splitParagraphs } from "../../src/paragraphs/splitParagraphs.js";

describe("splitParagraphs", () => {
  it("separa por linha em branco, junta hard wraps e reúne frases quebradas", () => {
    const text = "Título\n\nPrimeira frase\ncontinua.\n\nSegunda frase para a\n\ninovação.";
    expect(splitParagraphs(text)).toEqual(["Título", "Primeira frase continua.", "Segunda frase para a inovação."]);
  });

  it("devolve lista vazia para texto vazio", () => {
    expect(splitParagraphs("")).toEqual([]);
  });
});

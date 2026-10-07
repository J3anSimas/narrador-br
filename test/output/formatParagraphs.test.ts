import { describe, expect, it } from "vitest";
import { formatParagraphs } from "../../src/output/formatParagraphs.js";

describe("formatParagraphs", () => {
  it("no formato text, separa os parágrafos por linha em branco", () => {
    expect(formatParagraphs(["A.", "B."], "text")).toBe("A.\n\nB.\n");
  });

  it("no formato text, não escreve nada quando não há parágrafos", () => {
    expect(formatParagraphs([], "text")).toBe("");
  });

  it("no formato json, numera os parágrafos a partir de 1", () => {
    const parsed: unknown = JSON.parse(formatParagraphs(["A.", "B."], "json"));
    expect(parsed).toEqual([
      { index: 1, text: "A." },
      { index: 2, text: "B." },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { collapseWhitespace, normalizeLineEndings, splitIntoBlocks } from "../../src/paragraphs/textBlocks.js";

describe("normalizeLineEndings", () => {
  it("remove o BOM e converte CRLF e CR para LF", () => {
    expect(normalizeLineEndings("﻿a\r\nb\rc")).toBe("a\nb\nc");
  });
});

describe("collapseWhitespace", () => {
  it("junta linhas e espaços repetidos num único espaço, sem bordas", () => {
    expect(collapseWhitespace("  um\n  dois\t três ")).toBe("um dois três");
  });
});

describe("splitIntoBlocks", () => {
  it("usa linhas em branco como separador e junta quebras simples", () => {
    expect(splitIntoBlocks("linha um\nlinha dois\n\noutro bloco")).toEqual(["linha um linha dois", "outro bloco"]);
  });

  it("considera linhas só com espaços como linha em branco", () => {
    expect(splitIntoBlocks("a\n   \t\nb")).toEqual(["a", "b"]);
  });

  it("ignora várias linhas em branco seguidas", () => {
    expect(splitIntoBlocks("\n\na\n\n\n\nb\n\n")).toEqual(["a", "b"]);
  });

  it("sem linha em branco, cada linha vira um bloco", () => {
    expect(splitIntoBlocks("um\ndois\r\ntrês")).toEqual(["um", "dois", "três"]);
  });

  it("devolve lista vazia para texto vazio ou só espaços", () => {
    expect(splitIntoBlocks(" \n\n \t ")).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { fitParagraphsWithRewriter, type RewriteEvent } from "../../src/rewrite/fitParagraphsWithRewriter.js";
import { UnexpectedRewriteResponseError } from "../../src/rewrite/openAiTextRewriter.js";
import { FakeTextRewriter, type FakeRewriteResponse } from "../fakes/FakeTextRewriter.js";

const LIMIT = 40;
const LONG = "Uma frase longa demais. Outra frase longa demais. Mais uma."; // 59 caracteres
const TOO_LONG = "x".repeat(LIMIT + 1);

function setup(responses: readonly FakeRewriteResponse[]) {
  const rewriter = new FakeTextRewriter(responses);
  const events: RewriteEvent[] = [];
  let created = 0;
  const deps = {
    createRewriter: () => {
      created += 1;
      return rewriter;
    },
    onEvent: (event: RewriteEvent) => events.push(event),
  };
  return { rewriter, events, deps, createdCount: () => created };
}

describe("fitParagraphsWithRewriter", () => {
  it("não chama nem cria a LLM quando todos os parágrafos cabem", async () => {
    const { deps, createdCount } = setup([]);
    expect(await fitParagraphsWithRewriter(["Curto.", "Também curto."], LIMIT, deps)).toEqual(["Curto.", "Também curto."]);
    expect(createdCount()).toBe(0);
  });

  it("aceita o parágrafo condensado pela LLM, mirando abaixo do limite", async () => {
    const { rewriter, events, deps } = setup([["Frases longas demais, e mais uma."]]);
    const result = await fitParagraphsWithRewriter(["Curto.", LONG, "Fim."], LIMIT, deps);
    expect(result).toEqual(["Curto.", "Frases longas demais, e mais uma.", "Fim."]);
    expect(rewriter.requests).toEqual([{ text: LONG, maxLength: 36 }]);
    expect(events).toEqual([{ position: 2, originalLength: LONG.length, partLengths: [33], usedFallback: false }]);
  });

  it("aceita o parágrafo quebrado em dois pela LLM, na ordem", async () => {
    const { events, deps } = setup([["Uma frase longa demais.", "Outra frase longa. Mais uma."]]);
    expect(await fitParagraphsWithRewriter([LONG, "Fim."], LIMIT, deps)).toEqual([
      "Uma frase longa demais.",
      "Outra frase longa. Mais uma.",
      "Fim.",
    ]);
    expect(events).toEqual([{ position: 1, originalLength: LONG.length, partLengths: [23, 28], usedFallback: false }]);
  });

  it("deixa cada parte numa linha só e descarta partes vazias", async () => {
    const { deps } = setup([["  Linha um\n\nlinha dois.  ", "   ", "Outra."]]);
    expect(await fitParagraphsWithRewriter([LONG], LIMIT, deps)).toEqual(["Linha um linha dois.", "Outra."]);
  });

  it("devolve à LLM, com alvo menor, só a parte que ainda passou do limite", async () => {
    const { rewriter, deps } = setup([["Primeira parte ok.", TOO_LONG], ["Segunda", "parte."]]);
    expect(await fitParagraphsWithRewriter([LONG], LIMIT, deps)).toEqual(["Primeira parte ok.", "Segunda", "parte."]);
    expect(rewriter.requests).toEqual([
      { text: LONG, maxLength: 36 },
      { text: TOO_LONG, maxLength: 30 },
    ]);
  });

  it("tenta de novo quando a LLM devolve nada ou responde fora do formato", async () => {
    const { rewriter, deps } = setup([[], new UnexpectedRewriteResponseError("não é JSON"), ["Enfim cabe."]]);
    expect(await fitParagraphsWithRewriter([LONG], LIMIT, deps)).toEqual(["Enfim cabe."]);
    expect(rewriter.requests.map((request) => request.maxLength)).toEqual([36, 30, 24]);
  });

  it("divide nos fins de frase, sem a LLM, o trecho que não coube após 3 tentativas", async () => {
    const { rewriter, events, deps } = setup([[], [], []]);
    expect(await fitParagraphsWithRewriter([LONG], LIMIT, deps)).toEqual([
      "Uma frase longa demais.",
      "Outra frase longa demais. Mais uma.",
    ]);
    expect(rewriter.requests).toHaveLength(3);
    expect(events).toEqual([{ position: 1, originalLength: LONG.length, partLengths: [23, 35], usedFallback: true }]);
  });

  it("cria a LLM uma vez só para vários parágrafos longos", async () => {
    const { deps, createdCount } = setup([["Primeiro condensado."], ["Segundo condensado."]]);
    expect(await fitParagraphsWithRewriter([LONG, LONG], LIMIT, deps)).toEqual([
      "Primeiro condensado.",
      "Segundo condensado.",
    ]);
    expect(createdCount()).toBe(1);
  });

  it("propaga erros de rede ou de chave em vez de seguir com texto errado", async () => {
    const { deps } = setup([new Error("401 Incorrect API key")]);
    await expect(fitParagraphsWithRewriter([LONG], LIMIT, deps)).rejects.toThrow(/401/);
  });
});

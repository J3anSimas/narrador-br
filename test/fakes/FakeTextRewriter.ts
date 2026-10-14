import type { TextRewriter } from "../../src/ports/textRewriter.js";

/** Resposta programada: os parágrafos devolvidos, ou um erro a lançar. */
export type FakeRewriteResponse = readonly string[] | Error;

/** LLM falsa: registra os pedidos e devolve as respostas programadas, em ordem. */
export class FakeTextRewriter implements TextRewriter {
  readonly requests: { text: string; maxLength: number }[] = [];

  constructor(
    private readonly responses: readonly FakeRewriteResponse[],
    readonly model: string = "modelo-falso",
  ) {}

  async fitToLength(text: string, maxLength: number): Promise<string[]> {
    this.requests.push({ text, maxLength });
    const response = this.responses[this.requests.length - 1];
    if (response === undefined) throw new Error(`FakeTextRewriter sem resposta para o pedido ${this.requests.length}`);
    if (response instanceof Error) throw response;
    return [...response];
  }
}

import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { describe, expect, it } from "vitest";
import { createOpenAiTextRewriter } from "../../src/rewrite/createOpenAiTextRewriter.js";
import {
  DEFAULT_REWRITE_MODEL,
  OpenAiTextRewriter,
  UnexpectedRewriteResponseError,
  type OpenAiResponsesEndpoint,
} from "../../src/rewrite/openAiTextRewriter.js";

/** Substitui `OpenAI#responses`: guarda os corpos enviados e responde com um texto fixo. */
class FakeResponsesEndpoint implements OpenAiResponsesEndpoint {
  readonly bodies: ResponseCreateParamsNonStreaming[] = [];

  constructor(private readonly outputText: string) {}

  async create(body: ResponseCreateParamsNonStreaming): Promise<{ output_text: string }> {
    this.bodies.push(body);
    return { output_text: this.outputText };
  }
}

describe("OpenAiTextRewriter", () => {
  it("envia o texto como input, o limite nas instruções e pede a lista de parágrafos em JSON", async () => {
    const endpoint = new FakeResponsesEndpoint(JSON.stringify({ paragraphs: ["Parte um.", "Parte dois."] }));
    const rewriter = new OpenAiTextRewriter(endpoint);
    expect(await rewriter.fitToLength("Texto original muito longo.", 3686)).toEqual(["Parte um.", "Parte dois."]);
    const body = endpoint.bodies[0];
    expect(body).toMatchObject({ model: DEFAULT_REWRITE_MODEL, input: "Texto original muito longo." });
    expect(body?.instructions).toMatch(/no máximo 3686 caracteres/);
    expect(body?.instructions).toMatch(/quebrá-lo em dois ou mais parágrafos/);
    expect(body?.text?.format).toMatchObject({ type: "json_schema", strict: true });
  });

  it("usa o modelo informado", async () => {
    const endpoint = new FakeResponsesEndpoint(JSON.stringify({ paragraphs: ["ok"] }));
    const rewriter = new OpenAiTextRewriter(endpoint, "outro-modelo");
    await rewriter.fitToLength("texto", 100);
    expect(rewriter.model).toBe("outro-modelo");
    expect(endpoint.bodies[0]?.model).toBe("outro-modelo");
  });

  it.each([["não é JSON"], [JSON.stringify({ paragraphs: "texto" })], [JSON.stringify({ outra: [] })]])(
    "lança UnexpectedRewriteResponseError para resposta fora do formato: %s",
    async (outputText) => {
      const rewriter = new OpenAiTextRewriter(new FakeResponsesEndpoint(outputText));
      await expect(rewriter.fitToLength("texto", 100)).rejects.toThrow(UnexpectedRewriteResponseError);
    },
  );
});

describe("createOpenAiTextRewriter", () => {
  it("monta a LLM quando a chave existe, sem chamar a rede", () => {
    expect(createOpenAiTextRewriter({ OPENAI_API_KEY: "sk-teste" }, "m").model).toBe("m");
  });

  it("aponta para o .env quando a chave falta", () => {
    expect(() => createOpenAiTextRewriter({})).toThrow(/OPENAI_API_KEY.*\.env/);
  });
});

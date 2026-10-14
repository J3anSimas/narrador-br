import { describe, expect, it } from "vitest";
import { runCli, type CliDependencies } from "../../src/cli/runCli.js";
import { MAX_PARAGRAPH_LENGTH } from "../../src/speech/synthesizeParagraph.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";
import { FakeTextRewriter } from "../fakes/FakeTextRewriter.js";
import { FakeTextSink } from "../fakes/FakeTextSink.js";

function createDependencies(source: FakeTextInputSource): CliDependencies & { stdout: FakeTextSink; stderr: FakeTextSink } {
  return { source, stdout: new FakeTextSink(), stderr: new FakeTextSink() };
}

describe("runCli", () => {
  it("separa o arquivo informado e escreve no stdout", async () => {
    const deps = createDependencies(new FakeTextInputSource(new Map([["aula.txt", "Um\nlinha.\n\nDois."]])));
    expect(await runCli(["--file", "aula.txt"], deps)).toBe(0);
    expect(deps.stdout.written).toBe("Um linha.\n\nDois.\n");
    expect(deps.stderr.written).toBe("");
  });

  it("lê do stdin quando não há --file nem texto", async () => {
    const deps = createDependencies(new FakeTextInputSource(new Map(), "A.\n\nB."));
    expect(await runCli(["--format", "json"], deps)).toBe(0);
    expect(JSON.parse(deps.stdout.written)).toHaveLength(2);
  });

  it("aceita PDF em --file", async () => {
    const source = new FakeTextInputSource(new Map([["apostila.pdf", "Título\n\nTexto extraído."]]));
    const deps = createDependencies(source);
    expect(await runCli(["--file", "apostila.pdf"], deps)).toBe(0);
    expect(source.pdfPathsRead).toEqual(["apostila.pdf"]);
    expect(deps.stdout.written).toBe("Título\n\nTexto extraído.\n");
  });

  it("condensa com a LLM só os parágrafos acima do limite, avisando no stderr", async () => {
    const longParagraph = "Uma frase de exemplo para encher o parágrafo. ".repeat(100).trim();
    const rewriter = new FakeTextRewriter([["Versão condensada."]]);
    const models: (string | undefined)[] = [];
    const deps = {
      ...createDependencies(new FakeTextInputSource(new Map([["aula.txt", `Curto.\n\n${longParagraph}`]]))),
      createTextRewriter: (model: string | undefined) => {
        models.push(model);
        return rewriter;
      },
    };
    expect(await runCli(["-f", "aula.txt", "--rewrite-model", "gpt-teste"], deps)).toBe(0);
    expect(deps.stdout.written).toBe("Curto.\n\nVersão condensada.\n");
    expect(models).toEqual(["gpt-teste"]);
    expect(rewriter.requests.map((request) => request.text)).toEqual([longParagraph]);
    expect(deps.stderr.written).toBe(
      `Aviso: parágrafo 2 tinha ${longParagraph.length} caracteres; condensado pela LLM para 18.\n`,
    );
  });

  it("usa os parágrafos em que a LLM quebrou o texto longo", async () => {
    const longParagraph = "Uma frase de exemplo para encher o parágrafo. ".repeat(100).trim();
    const deps = {
      ...createDependencies(new FakeTextInputSource(new Map(), longParagraph)),
      createTextRewriter: () => new FakeTextRewriter([["Primeira metade.", "Segunda metade."]]),
    };
    expect(await runCli([], deps)).toBe(0);
    expect(deps.stdout.written).toBe("Primeira metade.\n\nSegunda metade.\n");
    expect(deps.stderr.written).toBe(
      `Aviso: parágrafo 1 tinha ${longParagraph.length} caracteres; reescrito pela LLM em 2 parágrafos (16 + 15).\n`,
    );
  });

  it("não cria a LLM quando nenhum parágrafo passa do limite", async () => {
    const deps = {
      ...createDependencies(new FakeTextInputSource(new Map(), "Curto.")),
      createTextRewriter: (): never => {
        throw new Error("sem chave");
      },
    };
    expect(await runCli([], deps)).toBe(0);
    expect(deps.stdout.written).toBe("Curto.\n");
  });

  it("sem LLM configurada, divide parágrafos maiores que o limite da API de fala", async () => {
    const longParagraph = "Uma frase de exemplo para encher o parágrafo. ".repeat(200).trim();
    const deps = createDependencies(new FakeTextInputSource(new Map(), longParagraph));
    expect(await runCli(["--format", "json"], deps)).toBe(0);
    const paragraphs: { text: string }[] = JSON.parse(deps.stdout.written);
    expect(paragraphs.length).toBeGreaterThan(1);
    for (const { text } of paragraphs) expect(text.length).toBeLessThanOrEqual(MAX_PARAGRAPH_LENGTH);
  });

  it("mostra a ajuda com -h", async () => {
    const deps = createDependencies(new FakeTextInputSource());
    expect(await runCli(["-h"], deps)).toBe(0);
    expect(deps.stdout.written).toMatch(/^Uso: paragrafos/);
  });

  it("retorna 1 e escreve o erro no stderr quando a leitura falha", async () => {
    const deps = createDependencies(new FakeTextInputSource());
    expect(await runCli(["-f", "sumiu.txt"], deps)).toBe(1);
    expect(deps.stderr.written).toMatch(/^Erro: .*"sumiu\.txt"/);
    expect(deps.stdout.written).toBe("");
  });
});

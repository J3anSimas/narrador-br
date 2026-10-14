import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NodeTextInputSource, type StdinStream } from "../../src/input/nodeTextInputSource.js";
import { buildPdf } from "../fakes/buildPdf.js";

/** stdin falso de terminal interativo (sem pipe). */
class FakeTerminalStdin implements StdinStream {
  readonly isTTY = true;
  async *[Symbol.asyncIterator](): AsyncIterator<string> {}
}

const fixturePath = fileURLToPath(new URL("../fixtures/teoria_indicadores_desempenho_TI.txt", import.meta.url));

describe("NodeTextInputSource", () => {
  it("lê um arquivo UTF-8 do disco", async () => {
    const text = await new NodeTextInputSource(Readable.from([])).readFile(fixturePath);
    expect(text.startsWith("Teoria sobre indicadores de desempenho de TI")).toBe(true);
  });

  it("inclui o caminho na mensagem quando o arquivo não existe", async () => {
    const source = new NodeTextInputSource(Readable.from([]));
    await expect(source.readFile("nao-existe.txt")).rejects.toThrow(/"nao-existe\.txt".*UTF-8/);
  });

  it("extrai de um PDF o texto em parágrafos separados por linha em branco", async () => {
    const path = await writeTempFile(
      "aula.pdf",
      buildPdf([
        [
          { text: "Introdução", y: 780, size: 18 },
          { text: "O texto da apostila começa", y: 750 },
          { text: "aqui e continua.", y: 736 },
        ],
      ]),
    );
    expect(await new NodeTextInputSource(Readable.from([])).readPdf(path)).toBe(
      "Introdução\n\nO texto da apostila começa aqui e continua.",
    );
  });

  it("explica quando o PDF não tem texto (ex.: escaneado)", async () => {
    const path = await writeTempFile("escaneado.pdf", buildPdf([[]]));
    await expect(new NodeTextInputSource(Readable.from([])).readPdf(path)).rejects.toThrow(/não tem texto selecionável/);
  });

  it("inclui o caminho na mensagem quando o arquivo não é um PDF válido", async () => {
    const path = await writeTempFile("falso.pdf", new TextEncoder().encode("texto comum"));
    await expect(new NodeTextInputSource(Readable.from([])).readPdf(path)).rejects.toThrow(/falso\.pdf.*PDF válido/);
  });

  it("concatena os pedaços do stdin, inclusive Buffers com acentos", async () => {
    const stdin = Readable.from([Buffer.from("informação "), "em pedaços"]);
    expect(await new NodeTextInputSource(stdin).readStdin()).toBe("informação em pedaços");
  });

  it("recusa ler o stdin quando ele é um terminal interativo", async () => {
    await expect(new NodeTextInputSource(new FakeTerminalStdin()).readStdin()).rejects.toThrow(/Nenhum texto recebido/);
  });
});

async function writeTempFile(name: string, content: Uint8Array): Promise<string> {
  const path = join(await mkdtemp(join(tmpdir(), "narrador-")), name);
  await writeFile(path, content);
  return path;
}

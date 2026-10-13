import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NodeTextInputSource, type StdinStream } from "../../src/input/nodeTextInputSource.js";

/** stdin falso de terminal interativo (sem pipe). */
class FakeTerminalStdin implements StdinStream {
  readonly isTTY = true;
  async *[Symbol.asyncIterator](): AsyncIterator<string> {}
}

const fixturePath = fileURLToPath(new URL("../fixtures/texto_referencia.txt", import.meta.url));

describe("NodeTextInputSource", () => {
  it("lê um arquivo UTF-8 do disco", async () => {
    const text = await new NodeTextInputSource(Readable.from([])).readFile(fixturePath);
    expect(text.startsWith("Guia de observabilidade para pequenas equipes de TI")).toBe(true);
  });

  it("inclui o caminho na mensagem quando o arquivo não existe", async () => {
    const source = new NodeTextInputSource(Readable.from([]));
    await expect(source.readFile("nao-existe.txt")).rejects.toThrow(/"nao-existe\.txt".*UTF-8/);
  });

  it("concatena os pedaços do stdin, inclusive Buffers com acentos", async () => {
    const stdin = Readable.from([Buffer.from("informação "), "em pedaços"]);
    expect(await new NodeTextInputSource(stdin).readStdin()).toBe("informação em pedaços");
  });

  it("recusa ler o stdin quando ele é um terminal interativo", async () => {
    await expect(new NodeTextInputSource(new FakeTerminalStdin()).readStdin()).rejects.toThrow(/Nenhum texto recebido/);
  });
});

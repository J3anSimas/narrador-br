import { describe, expect, it } from "vitest";
import { readInputText } from "../../src/input/textInputSource.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";

const source = new FakeTextInputSource(
  new Map([
    ["aula.txt", "conteúdo do arquivo"],
    ["apostila.PDF", "texto extraído do PDF"],
  ]),
  "conteúdo do stdin",
);

describe("readInputText", () => {
  it("devolve o texto inline sem consultar a fonte", async () => {
    expect(await readInputText({ kind: "inline", text: "direto" }, source)).toBe("direto");
  });

  it("lê o arquivo pedido", async () => {
    expect(await readInputText({ kind: "file", path: "aula.txt" }, source)).toBe("conteúdo do arquivo");
  });

  it("extrai o texto quando o arquivo é PDF, ignorando maiúsculas na extensão", async () => {
    expect(await readInputText({ kind: "file", path: "apostila.PDF" }, source)).toBe("texto extraído do PDF");
    expect(source.pdfPathsRead).toEqual(["apostila.PDF"]);
  });

  it("lê o stdin", async () => {
    expect(await readInputText({ kind: "stdin" }, source)).toBe("conteúdo do stdin");
  });
});

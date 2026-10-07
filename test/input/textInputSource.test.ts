import { describe, expect, it } from "vitest";
import { readInputText } from "../../src/input/textInputSource.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";

const source = new FakeTextInputSource(new Map([["aula.txt", "conteúdo do arquivo"]]), "conteúdo do stdin");

describe("readInputText", () => {
  it("devolve o texto inline sem consultar a fonte", async () => {
    expect(await readInputText({ kind: "inline", text: "direto" }, source)).toBe("direto");
  });

  it("lê o arquivo pedido", async () => {
    expect(await readInputText({ kind: "file", path: "aula.txt" }, source)).toBe("conteúdo do arquivo");
  });

  it("lê o stdin", async () => {
    expect(await readInputText({ kind: "stdin" }, source)).toBe("conteúdo do stdin");
  });
});

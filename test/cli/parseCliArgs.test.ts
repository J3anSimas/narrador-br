import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/cli/parseCliArgs.js";

describe("parseCliArgs", () => {
  it("sem argumentos, lê do stdin em formato text", () => {
    expect(parseCliArgs([])).toEqual({ showHelp: false, input: { kind: "stdin" }, outputFormat: "text" });
  });

  it("aceita --file / -f e --format json", () => {
    expect(parseCliArgs(["-f", "aula.txt", "--format", "json"])).toEqual({
      showHelp: false,
      input: { kind: "file", path: "aula.txt" },
      outputFormat: "json",
    });
  });

  it("junta os argumentos posicionais como texto inline", () => {
    expect(parseCliArgs(["Olá", "mundo."]).input).toEqual({ kind: "inline", text: "Olá mundo." });
  });

  it("reconhece -h", () => {
    expect(parseCliArgs(["-h"]).showHelp).toBe(true);
  });

  it("rejeita --file junto com texto inline, citando os dois valores", () => {
    expect(() => parseCliArgs(["-f", "aula.txt", "texto"])).toThrow(/"aula\.txt".*"texto"/);
  });

  it("rejeita formato desconhecido, citando o valor e os aceitos", () => {
    expect(() => parseCliArgs(["--format", "xml"])).toThrow(/"xml".*text \| json/);
  });
});

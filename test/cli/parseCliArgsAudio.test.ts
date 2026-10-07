import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/cli/parseCliArgs.js";

describe("parseCliArgs com áudio", () => {
  it("sem --audio, não pede áudio", () => {
    expect(parseCliArgs(["texto"]).audio).toBeUndefined();
  });

  it("aceita --audio sozinho", () => {
    expect(parseCliArgs(["--audio", "saida"]).audio).toEqual({ outputDir: "saida" });
  });

  it("aceita --audio com --voice", () => {
    expect(parseCliArgs(["--audio", "saida", "--voice", "cedar"]).audio).toEqual({
      outputDir: "saida",
      voice: "cedar",
    });
  });

  it("rejeita --voice sem --audio, citando a voz", () => {
    expect(() => parseCliArgs(["--voice", "cedar"])).toThrow(/"cedar".*--audio/);
  });
});

import { describe, expect, it } from "vitest";
import { createOverridingEnvFileLoader } from "../../src/cli/overridingEnvFileLoader.js";

/** Arquivos de texto em memória, no lugar do disco. */
class FakeTextFiles {
  constructor(private readonly contentByPath: ReadonlyMap<string, string>) {}

  readonly read = (path: string): string => {
    const content = this.contentByPath.get(path);
    if (content === undefined) throw Object.assign(new Error(`não existe: ${path}`), { code: "ENOENT" });
    return content;
  };
}

describe("createOverridingEnvFileLoader", () => {
  it("sobrescreve variáveis que já existiam no ambiente", () => {
    const env: Record<string, string | undefined> = { OPENAI_API_KEY: "sk-antiga", OUTRA: "mantida" };
    const files = new FakeTextFiles(new Map([[".env", "# comentário\nOPENAI_API_KEY=sk-nova\n"]]));
    createOverridingEnvFileLoader(env, files.read)(".env");
    expect(env).toEqual({ OPENAI_API_KEY: "sk-nova", OUTRA: "mantida" });
  });

  it("propaga o erro de leitura para quem decide se o arquivo é opcional", () => {
    const loader = createOverridingEnvFileLoader({}, new FakeTextFiles(new Map()).read);
    expect(() => loader(".env")).toThrow(expect.objectContaining({ code: "ENOENT" }));
  });
});

import { describe, expect, it } from "vitest";
import { loadEnvFileIfPresent } from "../../src/cli/loadEnvFileIfPresent.js";

/** Imita `process.loadEnvFile`: registra o caminho pedido ou lança o erro configurado. */
class FakeEnvFileLoader {
  readonly loadedPaths: string[] = [];

  constructor(private readonly failure?: Error) {}

  readonly load = (path: string): void => {
    if (this.failure !== undefined) throw this.failure;
    this.loadedPaths.push(path);
  };
}

function errorWithCode(code: string): Error {
  return Object.assign(new Error(`falha ${code}`), { code });
}

describe("loadEnvFileIfPresent", () => {
  it("carrega o arquivo quando ele existe", () => {
    const loader = new FakeEnvFileLoader();
    expect(loadEnvFileIfPresent(".env", loader.load)).toBe(true);
    expect(loader.loadedPaths).toEqual([".env"]);
  });

  it("segue sem erro quando o arquivo não existe", () => {
    expect(loadEnvFileIfPresent(".env", new FakeEnvFileLoader(errorWithCode("ENOENT")).load)).toBe(false);
  });

  it("propaga outros erros citando o caminho", () => {
    const loader = new FakeEnvFileLoader(errorWithCode("EACCES"));
    expect(() => loadEnvFileIfPresent(".env", loader.load)).toThrow(/"\.env".*EACCES/);
  });
});

import { describe, expect, it } from "vitest";
import { runCli, type CliDependencies } from "../../src/cli/runCli.js";
import { FakeTextInputSource } from "../fakes/FakeTextInputSource.js";
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

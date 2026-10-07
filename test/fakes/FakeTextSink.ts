import type { TextSink } from "../../src/cli/runCli.js";

/** Captura tudo o que a CLI escreve, no lugar de stdout/stderr. */
export class FakeTextSink implements TextSink {
  private readonly chunks: string[] = [];

  write(chunk: string): boolean {
    this.chunks.push(chunk);
    return true;
  }

  get written(): string {
    return this.chunks.join("");
  }
}

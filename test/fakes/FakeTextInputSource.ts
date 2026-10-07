import type { TextInputSource } from "../../src/input/textInputSource.js";

/** Fonte de texto em memória: simula arquivos e stdin sem tocar no disco. */
export class FakeTextInputSource implements TextInputSource {
  constructor(
    private readonly filesByPath: ReadonlyMap<string, string> = new Map(),
    private readonly stdinText: string = "",
  ) {}

  async readFile(path: string): Promise<string> {
    const content = this.filesByPath.get(path);
    if (content === undefined) throw new Error(`Arquivo falso não encontrado: "${path}"`);
    return content;
  }

  async readStdin(): Promise<string> {
    return this.stdinText;
  }
}

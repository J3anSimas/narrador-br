import { readFile } from "node:fs/promises";
import type { TextInputSource } from "./textInputSource.js";

export type StdinStream = AsyncIterable<string | Buffer> & { isTTY?: boolean };

/** Implementação real de `TextInputSource` sobre o sistema de arquivos e o stdin do Node. */
export class NodeTextInputSource implements TextInputSource {
  constructor(private readonly stdin: StdinStream) {}

  async readFile(path: string): Promise<string> {
    try {
      return await readFile(path, "utf8");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Não foi possível ler o arquivo "${path}" (esperado: arquivo de texto UTF-8): ${reason}`);
    }
  }

  async readStdin(): Promise<string> {
    // Sem pipe, o stdin é o terminal: ler dele travaria esperando digitação.
    if (this.stdin.isTTY) {
      throw new Error("Nenhum texto recebido (esperado: --file <caminho>, texto como argumento ou conteúdo via stdin).");
    }
    const chunks: string[] = [];
    for await (const chunk of this.stdin) {
      chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
    }
    return chunks.join("");
  }
}

import { readFile } from "node:fs/promises";
import { extractPdfLines } from "../pdf/extractPdfLines.js";
import { pdfPagesToText } from "../pdf/pdfPagesToText.js";
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

  async readPdf(path: string): Promise<string> {
    let text: string;
    try {
      text = pdfPagesToText(await extractPdfLines(await readFile(path)));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Não foi possível ler o PDF "${path}" (esperado: arquivo PDF válido): ${reason}`);
    }
    // PDF escaneado (só imagens) não tem camada de texto; narrá-lo exigiria OCR.
    if (text.trim().length === 0) {
      throw new Error(`O PDF "${path}" não tem texto selecionável (esperado: PDF com texto, não imagem escaneada).`);
    }
    return text;
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

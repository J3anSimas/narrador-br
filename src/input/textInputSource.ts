/** Origem do texto a ser separado; isola o acesso a disco e stdin para testes. */
export interface TextInputSource {
  readFile(path: string): Promise<string>;
  /** Extrai o texto de um PDF, já com um parágrafo por bloco separado por linha em branco. */
  readPdf(path: string): Promise<string>;
  readStdin(): Promise<string>;
}

export type InputRequest =
  | { kind: "file"; path: string }
  | { kind: "inline"; text: string }
  | { kind: "stdin" };

/**
 * Obtém o texto bruto conforme o pedido da linha de comando. Arquivos `.pdf`
 * têm o texto extraído; os demais são lidos como texto UTF-8.
 *
 * @example await readInputText({ kind: "file", path: "aula.pdf" }, new NodeTextInputSource(process.stdin))
 */
export async function readInputText(request: InputRequest, source: TextInputSource): Promise<string> {
  if (request.kind === "inline") return request.text;
  if (request.kind === "file") return isPdfPath(request.path) ? source.readPdf(request.path) : source.readFile(request.path);
  return source.readStdin();
}

export function isPdfPath(path: string): boolean {
  return /\.pdf$/i.test(path);
}

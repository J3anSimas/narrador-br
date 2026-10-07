/** Origem do texto a ser separado; isola o acesso a disco e stdin para testes. */
export interface TextInputSource {
  readFile(path: string): Promise<string>;
  readStdin(): Promise<string>;
}

export type InputRequest =
  | { kind: "file"; path: string }
  | { kind: "inline"; text: string }
  | { kind: "stdin" };

/**
 * Obtém o texto bruto conforme o pedido da linha de comando.
 *
 * @example await readInputText({ kind: "file", path: "aula.txt" }, new NodeTextInputSource(process.stdin))
 */
export async function readInputText(request: InputRequest, source: TextInputSource): Promise<string> {
  if (request.kind === "inline") return request.text;
  if (request.kind === "file") return source.readFile(request.path);
  return source.readStdin();
}

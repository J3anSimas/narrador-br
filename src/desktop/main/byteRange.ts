export type ByteRange =
  | { kind: "full" }
  | { kind: "partial"; start: number; end: number }
  | { kind: "unsatisfiable" };

const SINGLE_RANGE = /^bytes=(\d*)-(\d*)$/;

/**
 * Interpreta o cabeçalho `Range` que o `<audio>` manda ao pular para outro ponto.
 * Só aceita um intervalo; qualquer outra forma vira o arquivo inteiro (o que a RFC 9110 permite).
 *
 * @example parseByteRange("bytes=100-", 1000) // { kind: "partial", start: 100, end: 999 }
 */
export function parseByteRange(header: string | null, size: number): ByteRange {
  const match = header === null ? null : SINGLE_RANGE.exec(header.trim());
  if (match === null) return { kind: "full" };
  const [, rawStart = "", rawEnd = ""] = match;
  if (rawStart === "") return suffixRange(rawEnd, size);
  const start = Number(rawStart);
  const end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  return start >= size || start > end ? { kind: "unsatisfiable" } : { kind: "partial", start, end };
}

// "bytes=-500" pede os últimos 500 bytes.
function suffixRange(rawLength: string, size: number): ByteRange {
  const length = Number(rawLength);
  if (rawLength === "" || length === 0 || size === 0) return { kind: "unsatisfiable" };
  return { kind: "partial", start: Math.max(0, size - length), end: size - 1 };
}

/**
 * Tipo MIME pelo nome do arquivo; o app só gera MP3 e WAV.
 *
 * @example audioContentType("aula.MP3") // "audio/mpeg"
 */
export function audioContentType(path: string): string {
  if (/\.mp3$/i.test(path)) return "audio/mpeg";
  if (/\.wav$/i.test(path)) return "audio/wav";
  return "application/octet-stream";
}

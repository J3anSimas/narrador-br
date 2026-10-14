// Mais que isso é quase sempre um ciclo de `cause`; o limite evita laço infinito.
const MAX_CAUSE_DEPTH = 5;

/**
 * Junta a mensagem do erro com as de suas causas (`error.cause`), incluindo o `code`
 * quando houver. Erros de rede do `fetch` do Node dizem só "terminated" ou "fetch failed"
 * e guardam o motivo real na causa.
 *
 * @example describeErrorChain(new TypeError("terminated", { cause: socketError }))
 * // "terminated → other side closed [UND_ERR_SOCKET]"
 */
export function describeErrorChain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current !== undefined && depth < MAX_CAUSE_DEPTH; depth += 1) {
    const part = describeSingleError(current);
    if (parts.at(-1) !== part) parts.push(part);
    current = current instanceof Error ? current.cause : undefined;
  }
  return parts.join(" → ");
}

function describeSingleError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const code = "code" in error ? error.code : undefined;
  return typeof code === "string" && !error.message.includes(code) ? `${error.message} [${code}]` : error.message;
}

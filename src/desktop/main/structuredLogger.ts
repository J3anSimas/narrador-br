export type LogLevel = "info" | "warn" | "error";

export type LogFields = Readonly<Record<string, string | number | boolean | undefined>>;

/** Log de diagnóstico do processo principal; a janela mostra mensagens próprias ao usuário. */
export interface StructuredLogger {
  log(level: LogLevel, message: string, fields?: LogFields): void;
}

/**
 * Escreve uma linha JSON por evento, no formato que ferramentas de log leem direto.
 *
 * @example createJsonLineLogger((line) => process.stderr.write(line)).log("error", "job failed", { mode: "singleFile" })
 */
export function createJsonLineLogger(writeLine: (line: string) => void): StructuredLogger {
  return {
    log(level, message, fields = {}) {
      writeLine(`${JSON.stringify({ time: new Date().toISOString(), level, message, ...fields })}\n`);
    },
  };
}

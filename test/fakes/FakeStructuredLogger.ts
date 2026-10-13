import type { LogFields, LogLevel, StructuredLogger } from "../../src/desktop/main/structuredLogger.js";

export interface LoggedEntry {
  level: LogLevel;
  message: string;
  fields: LogFields;
}

/** Guarda as entradas de log em memória. */
export class FakeStructuredLogger implements StructuredLogger {
  readonly entries: LoggedEntry[] = [];

  log(level: LogLevel, message: string, fields: LogFields = {}): void {
    this.entries.push({ level, message, fields });
  }
}

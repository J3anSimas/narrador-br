import { parseEnv } from "node:util";
import type { EnvFileLoader } from "./loadEnvFileIfPresent.js";

export type TextFileReader = (path: string) => string;

/**
 * Cria um `EnvFileLoader` em que o `.env` vence as variáveis já definidas no sistema.
 * `process.loadEnvFile` faz o contrário, e nesta máquina havia uma OPENAI_API_KEY
 * antiga e inválida no ambiente do Windows que escondia a chave do `.env` (401).
 *
 * @example loadEnvFileIfPresent(".env", createOverridingEnvFileLoader(process.env, (p) => readFileSync(p, "utf8")))
 */
export function createOverridingEnvFileLoader(
  env: Record<string, string | undefined>,
  readText: TextFileReader,
): EnvFileLoader {
  return (path) => {
    Object.assign(env, parseEnv(readText(path)));
  };
}

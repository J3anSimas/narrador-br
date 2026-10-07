export type EnvFileLoader = (path: string) => void;

/**
 * Carrega variáveis de um arquivo `.env`, se ele existir; sem o arquivo, segue
 * sem erro (as variáveis podem vir do próprio ambiente).
 *
 * @example loadEnvFileIfPresent(".env", process.loadEnvFile) // true se carregou
 */
export function loadEnvFileIfPresent(path: string, loadEnvFile: EnvFileLoader): boolean {
  try {
    loadEnvFile(path);
    return true;
  } catch (error) {
    if (isMissingFileError(error)) return false;
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Não foi possível ler "${path}" (esperado: linhas CHAVE=valor): ${reason}`);
  }
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

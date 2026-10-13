import { spawn } from "node:child_process";

export interface ProcessResult {
  exitCode: number | null;
  stdout: Buffer;
  stderr: string;
}

/**
 * Roda um executável até o fim, mandando `input` pelo stdin e juntando stdout e stderr.
 * Rejeita só se o processo nem começar (ex.: executável inexistente, `code === "ENOENT"`).
 *
 * @example const { exitCode, stderr } = await runProcess("ffmpeg", ["-version"])
 */
export function runProcess(command: string, args: readonly string[], input?: Uint8Array): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout: Buffer.concat(stdoutChunks), stderr: Buffer.concat(stderrChunks).toString("utf8") });
    });
    // Se o ffmpeg morrer antes de ler tudo, a escrita dá EPIPE; o código de saída já relata a falha.
    child.stdin.on("error", () => undefined);
    child.stdin.end(input);
  });
}

/**
 * Diz se o erro de `runProcess` é de executável não encontrado.
 *
 * @example isMissingExecutable(error) // true para ENOENT
 */
export function isMissingExecutable(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

import { describe, expect, it } from "vitest";
import { describeFfmpegSpawnError } from "../../src/audio/ffmpegSpawnError.js";
import { isMissingExecutable, runProcess } from "../../src/audio/runProcess.js";

describe("runProcess", () => {
  it("devolve código de saída, stdout e stderr, passando o stdin", async () => {
    const script = 'process.stdin.pipe(process.stdout); process.stderr.write("aviso"); process.exitCode = 3';
    const result = await runProcess(process.execPath, ["-e", script], new TextEncoder().encode("olá"));
    expect(result).toMatchObject({ exitCode: 3, stderr: "aviso" });
    expect(result.stdout.toString("utf8")).toBe("olá");
  });

  it("rejeita com ENOENT quando o executável não existe", async () => {
    const failure = await runProcess("executavel-inexistente-para-teste", []).catch((error: unknown) => error);
    expect(isMissingExecutable(failure)).toBe(true);
  });
});

describe("describeFfmpegSpawnError", () => {
  it("explica como instalar quando falta o executável, com a dica de quem chamou", () => {
    const missing = Object.assign(new Error("spawn"), { code: "ENOENT" });
    expect(describeFfmpegSpawnError(missing, "ff", " Use WAV.").message).toMatch(/"ff".*PATH.*Use WAV\.$/);
  });

  it("repassa a mensagem de outros erros", () => {
    expect(describeFfmpegSpawnError(new Error("EACCES"), "ff").message).toBe('Não foi possível executar "ff": EACCES');
  });
});

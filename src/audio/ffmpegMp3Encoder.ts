import { spawn } from "node:child_process";
import type { Mp3Encoder } from "./mp3Encoder.js";

// WAV pelo stdin, MP3 pelo stdout: nada de arquivo temporário. Bitrate constante (CBR) de
// propósito: escrevendo em pipe, o ffmpeg não volta ao início para gravar o cabeçalho Xing,
// e um MP3 VBR sem ele mostra duração errada nos players (7,4 s viravam 6,5 s no teste).
// Com CBR a duração sai exata do tamanho do arquivo; 64 kbps sobra para voz mono a 24 kHz.
const WAV_TO_MP3_ARGS = [
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "wav",
  "-i",
  "pipe:0",
  "-codec:a",
  "libmp3lame",
  "-b:a",
  "64k",
  "-f",
  "mp3",
  "pipe:1",
];

interface ProcessResult {
  exitCode: number | null;
  stdout: Buffer;
  stderr: string;
}

/**
 * Implementação de `Mp3Encoder` que chama o executável do ffmpeg.
 *
 * @example await new FfmpegMp3Encoder().encodeWavToMp3(wav) // usa o ffmpeg do PATH
 */
export class FfmpegMp3Encoder implements Mp3Encoder {
  constructor(private readonly ffmpegPath: string = "ffmpeg") {}

  async encodeWavToMp3(wav: Uint8Array): Promise<Uint8Array> {
    const result = await runProcess(this.ffmpegPath, WAV_TO_MP3_ARGS, wav);
    if (result.exitCode !== 0) {
      throw new Error(
        `ffmpeg falhou com código ${result.exitCode} (esperado: 0) ao converter WAV de ${wav.length} bytes: ${result.stderr.trim()}`,
      );
    }
    return new Uint8Array(result.stdout);
  }
}

function runProcess(command: string, args: readonly string[], input: Uint8Array): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    child.on("error", (error) => reject(describeSpawnError(error, command)));
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout: Buffer.concat(stdoutChunks), stderr: Buffer.concat(stderrChunks).toString("utf8") });
    });
    // Se o ffmpeg morrer antes de ler tudo, a escrita dá EPIPE; o código de saída já relata a falha.
    child.stdin.on("error", () => undefined);
    child.stdin.end(input);
  });
}

function describeSpawnError(error: Error, command: string): Error {
  if ("code" in error && error.code === "ENOENT") {
    return new Error(
      `ffmpeg não encontrado (procurado: "${command}"; esperado: ffmpeg no PATH, ex.: winget install Gyan.FFmpeg). Use --audio-file com .wav para não depender dele.`,
    );
  }
  return new Error(`Não foi possível executar "${command}": ${error.message}`);
}

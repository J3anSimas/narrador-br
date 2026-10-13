import type { Mp3Encoder } from "./mp3Encoder.js";
import { describeFfmpegSpawnError } from "./ffmpegSpawnError.js";
import { runProcess, type ProcessResult } from "./runProcess.js";

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

/**
 * Implementação de `Mp3Encoder` que chama o executável do ffmpeg.
 *
 * @example await new FfmpegMp3Encoder().encodeWavToMp3(wav) // usa o ffmpeg do PATH
 */
export class FfmpegMp3Encoder implements Mp3Encoder {
  constructor(private readonly ffmpegPath: string = "ffmpeg") {}

  async encodeWavToMp3(wav: Uint8Array): Promise<Uint8Array> {
    const result = await runFfmpeg(this.ffmpegPath, wav);
    if (result.exitCode !== 0) {
      throw new Error(
        `ffmpeg falhou com código ${result.exitCode} (esperado: 0) ao converter WAV de ${wav.length} bytes: ${result.stderr.trim()}`,
      );
    }
    return new Uint8Array(result.stdout);
  }
}

async function runFfmpeg(command: string, wav: Uint8Array): Promise<ProcessResult> {
  try {
    return await runProcess(command, WAV_TO_MP3_ARGS, wav);
  } catch (error) {
    throw describeFfmpegSpawnError(error, command, " Use --audio-file com .wav para não depender dele.");
  }
}

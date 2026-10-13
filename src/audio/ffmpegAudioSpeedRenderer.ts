import { rename, rm } from "node:fs/promises";
import { buildAtempoFilter } from "./audioSpeed.js";
import type { AudioSpeedRenderer, AudioSpeedRenderRequest } from "./audioSpeedRenderer.js";
import { describeFfmpegSpawnError } from "./ffmpegSpawnError.js";
import { runProcess } from "./runProcess.js";
import { singleAudioFormatFromPath, type SingleAudioFormat } from "./singleAudioFormat.js";

// Gravando em arquivo (não em pipe) o ffmpeg volta ao início e escreve o cabeçalho Xing,
// então VBR aqui não erra a duração como no FfmpegMp3Encoder. -q:a 2 ≈ 190 kbps: serve para música.
const CODEC_ARGS: Readonly<Record<SingleAudioFormat, readonly string[]>> = {
  mp3: ["-codec:a", "libmp3lame", "-q:a", "2", "-f", "mp3"],
  wav: ["-codec:a", "pcm_s16le", "-f", "wav"],
};

/**
 * Argumentos do ffmpeg para regravar `inputPath` em `outputPath` na velocidade pedida.
 * `-vn` descarta a capa embutida, que o muxer de MP3 tentaria recodificar.
 *
 * @example buildSpeedRenderArgs("in.m4a", "out.mp3.parcial", 1.5, "mp3")
 */
export function buildSpeedRenderArgs(inputPath: string, outputPath: string, speed: number, format: SingleAudioFormat): string[] {
  const filter = buildAtempoFilter(speed);
  return ["-hide_banner", "-loglevel", "error", "-y", "-i", inputPath, "-vn", "-filter:a", filter, ...CODEC_ARGS[format], outputPath];
}

/**
 * `AudioSpeedRenderer` que chama o ffmpeg. Grava num arquivo `.parcial` e só renomeia no
 * fim: uma falha não deixa áudio pela metade, e dá para salvar por cima do próprio original.
 *
 * @example await new FfmpegAudioSpeedRenderer("ffmpeg").renderAtSpeed({ inputPath, outputPath: "aula (1,5x).mp3", speed: 1.5 })
 */
export class FfmpegAudioSpeedRenderer implements AudioSpeedRenderer {
  constructor(private readonly ffmpegPath: string = "ffmpeg") {}

  async renderAtSpeed(request: AudioSpeedRenderRequest): Promise<void> {
    const format = requireOutputFormat(request.outputPath);
    const partialPath = `${request.outputPath}.parcial`;
    try {
      await this.runFfmpeg(buildSpeedRenderArgs(request.inputPath, partialPath, request.speed, format), request);
      await rename(partialPath, request.outputPath);
    } finally {
      await rm(partialPath, { force: true });
    }
  }

  private async runFfmpeg(args: readonly string[], request: AudioSpeedRenderRequest): Promise<void> {
    const result = await runProcess(this.ffmpegPath, args).catch((error: unknown) => {
      throw describeFfmpegSpawnError(error, this.ffmpegPath);
    });
    if (result.exitCode === 0) return;
    throw new Error(
      `ffmpeg falhou com código ${result.exitCode} (esperado: 0) ao acelerar "${request.inputPath}" para ${request.speed}×: ${result.stderr.trim()}`,
    );
  }
}

function requireOutputFormat(outputPath: string): SingleAudioFormat {
  const format = singleAudioFormatFromPath(outputPath);
  if (format !== undefined) return format;
  throw new Error(`Arquivo de saída inválido: "${outputPath}" (esperado: caminho terminando em .mp3 ou .wav).`);
}

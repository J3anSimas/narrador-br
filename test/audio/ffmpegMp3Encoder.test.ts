import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { FfmpegMp3Encoder } from "../../src/audio/ffmpegMp3Encoder.js";
import { createPcmSilence, encodeWav, OPENAI_PCM_FORMAT } from "../../src/audio/wav.js";

// Teste de integração com o executável real; pulado em máquinas sem ffmpeg.
const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).error === undefined;

function isMp3Start(bytes: Uint8Array): boolean {
  const hasId3Tag = String.fromCharCode(...bytes.subarray(0, 3)) === "ID3";
  const hasFrameSync = bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0;
  return hasId3Tag || hasFrameSync;
}

describe("FfmpegMp3Encoder", () => {
  it.skipIf(!hasFfmpeg)("converte um WAV em MP3", async () => {
    const wav = encodeWav(createPcmSilence(300, OPENAI_PCM_FORMAT), OPENAI_PCM_FORMAT);
    const mp3 = await new FfmpegMp3Encoder().encodeWavToMp3(wav);
    expect(mp3.length).toBeGreaterThan(0);
    expect(isMp3Start(mp3)).toBe(true);
  });

  // Regressão: em VBR via pipe o MP3 saía sem cabeçalho Xing e os players erravam a duração.
  it.skipIf(!hasFfmpeg)("usa bitrate constante, para a duração sair certa sem cabeçalho Xing", async () => {
    const twoSeconds = encodeWav(createPcmSilence(2_000, OPENAI_PCM_FORMAT), OPENAI_PCM_FORMAT);
    const mp3 = await new FfmpegMp3Encoder().encodeWavToMp3(twoSeconds);
    const bytesPerSecondAt64kbps = 8_000;
    expect(mp3.length / bytesPerSecondAt64kbps).toBeCloseTo(2, 0);
  });

  it.skipIf(!hasFfmpeg)("relata o código de saída e o stderr quando a entrada não é WAV", async () => {
    await expect(new FfmpegMp3Encoder().encodeWavToMp3(new Uint8Array([1, 2, 3]))).rejects.toThrow(
      /ffmpeg falhou com código \d+.*3 bytes/,
    );
  });

  it("explica como instalar quando o executável não existe", async () => {
    const encoder = new FfmpegMp3Encoder("ffmpeg-inexistente-para-teste");
    await expect(encoder.encodeWavToMp3(new Uint8Array())).rejects.toThrow(
      /"ffmpeg-inexistente-para-teste".*PATH.*\.wav/,
    );
  });
});

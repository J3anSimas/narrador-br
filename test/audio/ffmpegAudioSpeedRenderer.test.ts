import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSpeedRenderArgs, FfmpegAudioSpeedRenderer } from "../../src/audio/ffmpegAudioSpeedRenderer.js";
import { createPcmSilence, encodeWav, OPENAI_PCM_FORMAT } from "../../src/audio/wav.js";

// Teste de integração com o executável real; pulado em máquinas sem ffmpeg.
const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).error === undefined;
const WAV_HEADER_SIZE = 44;

function writeSilentWav(durationMs: number): { dir: string; inputPath: string } {
  const dir = mkdtempSync(join(tmpdir(), "tts-speed-"));
  const inputPath = join(dir, "entrada.wav");
  writeFileSync(inputPath, encodeWav(createPcmSilence(durationMs, OPENAI_PCM_FORMAT), OPENAI_PCM_FORMAT));
  return { dir, inputPath };
}

// Aproximado: o ffmpeg pode gravar blocos extras (LIST) no cabeçalho, alguns bytes a mais.
function wavDurationMs(path: string): number {
  const bytesPerMs = (OPENAI_PCM_FORMAT.sampleRate * 2) / 1000;
  return (readFileSync(path).length - WAV_HEADER_SIZE) / bytesPerMs;
}

describe("buildSpeedRenderArgs", () => {
  it("monta filtro, codec e formato explícito (o destino é um .parcial)", () => {
    const args = buildSpeedRenderArgs("in.m4a", "out.mp3.parcial", 3, "mp3");
    expect(args).toEqual(expect.arrayContaining(["-i", "in.m4a", "-vn", "-filter:a", "atempo=2,atempo=1.5"]));
    expect(args.slice(-3)).toEqual(["-f", "mp3", "out.mp3.parcial"]);
  });
});

describe("FfmpegAudioSpeedRenderer", () => {
  it.skipIf(!hasFfmpeg)("grava o áudio na velocidade pedida e não deixa o .parcial", async () => {
    const { dir, inputPath } = writeSilentWav(2_000);
    const outputPath = join(dir, "saida.wav");
    await new FfmpegAudioSpeedRenderer().renderAtSpeed({ inputPath, outputPath, speed: 2 });
    expect(wavDurationMs(outputPath)).toBeCloseTo(1_000, -2);
    expect(existsSync(`${outputPath}.parcial`)).toBe(false);
  });

  it.skipIf(!hasFfmpeg)("pode salvar por cima do próprio original", async () => {
    const { inputPath } = writeSilentWav(2_000);
    await new FfmpegAudioSpeedRenderer().renderAtSpeed({ inputPath, outputPath: inputPath, speed: 1.25 });
    expect(wavDurationMs(inputPath)).toBeCloseTo(1_600, -2);
  });

  it.skipIf(!hasFfmpeg)("relata a falha do ffmpeg e não deixa arquivo pela metade", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tts-speed-"));
    const inputPath = join(dir, "quebrado.mp3");
    writeFileSync(inputPath, new Uint8Array([1, 2, 3]));
    const outputPath = join(dir, "saida.mp3");
    const render = new FfmpegAudioSpeedRenderer().renderAtSpeed({ inputPath, outputPath, speed: 1.5 });
    await expect(render).rejects.toThrow(/ffmpeg falhou com código \d+.*quebrado\.mp3.*1\.5×/s);
    expect(existsSync(outputPath) || existsSync(`${outputPath}.parcial`)).toBe(false);
  });

  it("recusa extensão de saída que não seja .mp3 ou .wav", async () => {
    const render = new FfmpegAudioSpeedRenderer().renderAtSpeed({ inputPath: "a.mp3", outputPath: "b.ogg", speed: 1.5 });
    await expect(render).rejects.toThrow(/"b\.ogg".*\.mp3 ou \.wav/);
  });

  it("explica quando o ffmpeg não existe", async () => {
    const { dir, inputPath } = writeSilentWav(100);
    const renderer = new FfmpegAudioSpeedRenderer("ffmpeg-inexistente-para-teste");
    await expect(renderer.renderAtSpeed({ inputPath, outputPath: join(dir, "s.mp3"), speed: 1.5 })).rejects.toThrow(
      /"ffmpeg-inexistente-para-teste".*PATH/,
    );
  });
});

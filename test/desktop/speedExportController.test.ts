import { describe, expect, it } from "vitest";
import { SpeedExportController, type SpeedExportDependencies } from "../../src/desktop/main/speedExportController.js";
import { FakeAudioSpeedRenderer } from "../fakes/FakeAudioSpeedRenderer.js";
import { FakeStructuredLogger } from "../fakes/FakeStructuredLogger.js";

const TRACK_URL = "tts-audio://track/1";

function exporterWith(overrides: Partial<SpeedExportDependencies> = {}) {
  const renderer = new FakeAudioSpeedRenderer();
  const logger = new FakeStructuredLogger();
  const suggestions: string[] = [];
  const exporter = new SpeedExportController({
    trackPathFor: (url) => (url === TRACK_URL ? "C:/aulas/aula.m4a" : undefined),
    chooseOutputPath: async (suggestedPath) => {
      suggestions.push(suggestedPath);
      return "C:/aulas/rapida.mp3";
    },
    renderer,
    registerTrack: () => "tts-audio://track/2",
    logger,
    ...overrides,
  });
  return { exporter, renderer, logger, suggestions };
}

describe("SpeedExportController", () => {
  it("sugere um nome, grava na velocidade e devolve a nova faixa", async () => {
    const { exporter, renderer, suggestions } = exporterWith();
    const result = await exporter.exportAtSpeed({ trackUrl: TRACK_URL, speed: 1.5 });
    expect(suggestions).toEqual(["C:/aulas/aula (1,5x).mp3"]);
    expect(renderer.requests).toEqual([{ inputPath: "C:/aulas/aula.m4a", outputPath: "C:/aulas/rapida.mp3", speed: 1.5 }]);
    expect(result).toEqual({ status: "saved", track: { url: "tts-audio://track/2", path: "C:/aulas/rapida.mp3" } });
  });

  it("não grava nada quando o usuário cancela o diálogo", async () => {
    const { exporter, renderer } = exporterWith({ chooseOutputPath: async () => undefined });
    expect(await exporter.exportAtSpeed({ trackUrl: TRACK_URL, speed: 2 })).toEqual({ status: "cancelled" });
    expect(renderer.requests).toEqual([]);
  });

  it("recusa faixa que a janela não recebeu do app", async () => {
    const { exporter } = exporterWith();
    const result = await exporter.exportAtSpeed({ trackUrl: "tts-audio://track/99", speed: 2 });
    expect(result).toMatchObject({ status: "failed", message: expect.stringMatching(/track\/99/) });
  });

  it("transforma a falha do ffmpeg em resultado e registra no log", async () => {
    const { exporter, logger } = exporterWith({ renderer: new FakeAudioSpeedRenderer(new Error("ffmpeg quebrou")) });
    const result = await exporter.exportAtSpeed({ trackUrl: TRACK_URL, speed: 2 });
    expect(result).toEqual({ status: "failed", message: "ffmpeg quebrou" });
    expect(logger.entries).toEqual([
      { level: "error", message: "speed export failed", fields: { speed: 2, error: "ffmpeg quebrou" } },
    ]);
  });
});

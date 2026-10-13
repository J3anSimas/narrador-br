import { describe, expect, it } from "vitest";
import { assertAudioSpeed } from "../../src/audio/audioSpeed.js";
import { describeSpeedExportResult, SPEED_PRESETS, speedLabel } from "../../src/desktop/renderer/speedChoices.js";

describe("speedLabel", () => {
  it("mostra a velocidade com vírgula e o sinal de vezes", () => {
    expect(speedLabel(1.25)).toBe("1,25×");
    expect(speedLabel(1)).toBe("1×");
  });
});

describe("SPEED_PRESETS", () => {
  it("só oferece velocidades que a exportação aceita", () => {
    SPEED_PRESETS.forEach((speed) => expect(() => assertAudioSpeed(speed)).not.toThrow());
  });
});

describe("describeSpeedExportResult", () => {
  it("diz onde salvou, repassa o erro e fica quieto no cancelamento", () => {
    const track = { url: "tts-audio://track/2", path: "C:/aula (1,5x).mp3" };
    expect(describeSpeedExportResult({ status: "saved", track })).toBe("Salvo em C:/aula (1,5x).mp3");
    expect(describeSpeedExportResult({ status: "failed", message: "ffmpeg quebrou" })).toBe("ffmpeg quebrou");
    expect(describeSpeedExportResult({ status: "cancelled" })).toBeUndefined();
  });
});

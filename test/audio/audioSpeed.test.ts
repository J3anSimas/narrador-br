import { describe, expect, it } from "vitest";
import { assertAudioSpeed, AUDIO_SPEED_LIMITS, buildAtempoFilter, formatSpeedNumber } from "../../src/audio/audioSpeed.js";

describe("assertAudioSpeed", () => {
  it("aceita os limites e recusa o que está fora, citando o valor", () => {
    expect(() => assertAudioSpeed(AUDIO_SPEED_LIMITS.min)).not.toThrow();
    expect(() => assertAudioSpeed(AUDIO_SPEED_LIMITS.max)).not.toThrow();
    expect(() => assertAudioSpeed(0.4)).toThrow(/0\.4.*entre 0\.5 e 3/);
    expect(() => assertAudioSpeed(Number.NaN)).toThrow(/NaN/);
  });
});

describe("buildAtempoFilter", () => {
  it("usa um fator só até 2×", () => {
    expect(buildAtempoFilter(1.5)).toBe("atempo=1.5");
    expect(buildAtempoFilter(0.5)).toBe("atempo=0.5");
  });

  it("encadeia fatores de até 2 acima de 2×, para não descartar amostras", () => {
    expect(buildAtempoFilter(3)).toBe("atempo=2,atempo=1.5");
    expect(buildAtempoFilter(2.5)).toBe("atempo=2,atempo=1.25");
  });

  it("recusa velocidade fora dos limites", () => {
    expect(() => buildAtempoFilter(10)).toThrow(/Velocidade inválida: 10/);
  });
});

describe("formatSpeedNumber", () => {
  it("usa vírgula e tira zeros e resíduo de ponto flutuante", () => {
    expect(formatSpeedNumber(1.5)).toBe("1,5");
    expect(formatSpeedNumber(2)).toBe("2");
    expect(formatSpeedNumber(1.2500000001)).toBe("1,25");
  });
});

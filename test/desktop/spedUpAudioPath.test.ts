import { describe, expect, it } from "vitest";
import { spedUpAudioPath } from "../../src/desktop/main/spedUpAudioPath.js";

describe("spedUpAudioPath", () => {
  it("sugere o arquivo ao lado do original, com a velocidade no nome", () => {
    expect(spedUpAudioPath("C:\\aulas\\aula.m4a", 1.5)).toBe("C:\\aulas\\aula (1,5x).mp3");
  });

  it("mantém WAV quando o original é WAV", () => {
    expect(spedUpAudioPath("C:/aulas/aula.WAV", 2)).toBe("C:/aulas/aula (2x).wav");
  });

  it("não confunde ponto de pasta com extensão", () => {
    expect(spedUpAudioPath("C:/v1.2/gravacao", 1.25)).toBe("C:/v1.2/gravacao (1,25x).mp3");
  });
});

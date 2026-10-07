import { describe, expect, it } from "vitest";
import { singleAudioFormatFromPath } from "../../src/audio/singleAudioFormat.js";

describe("singleAudioFormatFromPath", () => {
  it("reconhece .wav e .mp3, sem diferenciar maiúsculas", () => {
    expect(["a.wav", "a.mp3", "A.WAV", "pasta/A.Mp3"].map(singleAudioFormatFromPath)).toEqual([
      "wav",
      "mp3",
      "wav",
      "mp3",
    ]);
  });

  it("devolve undefined para outras extensões", () => {
    expect(["a.ogg", "a", "mp3"].map(singleAudioFormatFromPath)).toEqual([undefined, undefined, undefined]);
  });
});

import { describe, expect, it } from "vitest";
import { resolveFfmpegPath } from "../../src/desktop/main/ffmpegLocation.js";

describe("resolveFfmpegPath", () => {
  it("aponta para app.asar.unpacked quando o ffmpeg está dentro do asar", () => {
    const packaged = "C:\\App\\resources\\app.asar\\node_modules\\ffmpeg-static\\ffmpeg.exe";
    const unpacked = "C:\\App\\resources\\app.asar.unpacked\\node_modules\\ffmpeg-static\\ffmpeg.exe";
    expect(resolveFfmpegPath(packaged)).toBe(unpacked);
  });

  it("mantém caminhos fora do asar e cai para o PATH sem binário embutido", () => {
    const development = "C:/proj/node_modules/ffmpeg-static/ffmpeg.exe";
    expect(resolveFfmpegPath(development)).toBe(development);
    expect(resolveFfmpegPath(null)).toBe("ffmpeg");
  });
});

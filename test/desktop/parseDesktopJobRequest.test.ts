import { describe, expect, it } from "vitest";
import { parseDesktopJobRequest } from "../../src/desktop/main/parseDesktopJobRequest.js";

describe("parseDesktopJobRequest", () => {
  it("aceita os dois modos", () => {
    const single = { mode: "singleFile", text: "Olá.", voice: "marin", outputPath: "C:/a.mp3" };
    const perParagraph = { mode: "perParagraph", text: "Olá.", voice: "cedar", outputDir: "C:/saida" };
    expect(parseDesktopJobRequest(single)).toEqual(single);
    expect(parseDesktopJobRequest(perParagraph)).toEqual(perParagraph);
  });

  it("recusa valores fora do contrato, citando o valor recebido", () => {
    expect(() => parseDesktopJobRequest(null)).toThrow(/null.*objeto/);
    expect(() => parseDesktopJobRequest({ mode: "zip", text: "a", voice: "marin" })).toThrow(/"zip"/);
    expect(() => parseDesktopJobRequest({ mode: "singleFile", text: "a", voice: "robo" })).toThrow(/"robo".*marin/);
    expect(() => parseDesktopJobRequest({ mode: "singleFile", text: "  ", voice: "marin" })).toThrow(/"text".*"  "/);
  });

  it("exige .mp3 ou .wav no áudio único", () => {
    const request = { mode: "singleFile", text: "a", voice: "marin", outputPath: "C:/a.ogg" };
    expect(() => parseDesktopJobRequest(request)).toThrow(/"C:\/a\.ogg".*\.mp3 ou \.wav/);
  });
});

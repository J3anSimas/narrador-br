import { describe, expect, it } from "vitest";
import { parseSpeedExportRequest } from "../../src/desktop/main/parseSpeedExportRequest.js";

describe("parseSpeedExportRequest", () => {
  it("aceita URL e velocidade válidas", () => {
    expect(parseSpeedExportRequest({ trackUrl: "tts-audio://track/1", speed: 1.5 })).toEqual({
      trackUrl: "tts-audio://track/1",
      speed: 1.5,
    });
  });

  it("recusa pedidos malformados citando o valor recebido", () => {
    expect(() => parseSpeedExportRequest(null)).toThrow(/null.*trackUrl e speed/);
    expect(() => parseSpeedExportRequest({ trackUrl: 1, speed: 1.5 })).toThrow(/"trackUrl" inválido: 1/);
    expect(() => parseSpeedExportRequest({ trackUrl: "u", speed: "2" })).toThrow(/"speed" inválido: "2"/);
    expect(() => parseSpeedExportRequest({ trackUrl: "u", speed: 9 })).toThrow(/Velocidade inválida: 9/);
  });
});

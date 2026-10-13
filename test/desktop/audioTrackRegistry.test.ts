import { describe, expect, it } from "vitest";
import { AudioTrackRegistry } from "../../src/desktop/main/audioTrackRegistry.js";

describe("AudioTrackRegistry", () => {
  it("devolve o caminho de uma URL registrada", () => {
    const registry = new AudioTrackRegistry();
    const url = registry.register("C:/aula.mp3");
    expect(url).toBe("tts-audio://track/1");
    expect(registry.pathFor(url)).toBe("C:/aula.mp3");
  });

  it("gera URL nova ao registrar o mesmo arquivo de novo", () => {
    const registry = new AudioTrackRegistry();
    expect(registry.register("C:/a.mp3")).not.toBe(registry.register("C:/a.mp3"));
  });

  it("não resolve URLs desconhecidas nem caminhos embutidos na URL", () => {
    const registry = new AudioTrackRegistry();
    registry.register("C:/a.mp3");
    expect(registry.pathFor("tts-audio://track/2")).toBeUndefined();
    expect(registry.pathFor("tts-audio://track/1/../../Windows/win.ini")).toBeUndefined();
  });
});

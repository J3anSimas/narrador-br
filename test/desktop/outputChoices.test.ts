import { describe, expect, it } from "vitest";
import {
  buildJobRequest,
  currentDestination,
  remoteErrorMessage,
  withAudioExtension,
  type OutputChoices,
} from "../../src/desktop/renderer/outputChoices.js";

const SINGLE: OutputChoices = { mode: "singleFile", voice: "marin", format: "mp3", filePath: "C:/a.mp3" };

describe("withAudioExtension", () => {
  it("troca a extensão de áudio ou acrescenta quando falta", () => {
    expect(withAudioExtension("C:/aula.MP3", "wav")).toBe("C:/aula.wav");
    expect(withAudioExtension("C:/aula", "mp3")).toBe("C:/aula.mp3");
  });
});

describe("currentDestination", () => {
  it("usa o destino do modo escolhido", () => {
    expect(currentDestination(SINGLE)).toBe("C:/a.mp3");
    expect(currentDestination({ ...SINGLE, mode: "perParagraph" })).toBeUndefined();
  });
});

describe("buildJobRequest", () => {
  it("monta o pedido de cada modo", () => {
    expect(buildJobRequest("Olá.", SINGLE)).toEqual({ mode: "singleFile", text: "Olá.", voice: "marin", outputPath: "C:/a.mp3" });
    const perParagraph = { ...SINGLE, mode: "perParagraph" as const, folderPath: "C:/saida" };
    expect(buildJobRequest("Olá.", perParagraph)).toMatchObject({ mode: "perParagraph", outputDir: "C:/saida" });
  });

  it("explica o que falta em vez de montar um pedido incompleto", () => {
    expect(buildJobRequest("   ", SINGLE)).toMatch(/Cole ou abra um texto/);
    expect(buildJobRequest("Olá.", { ...SINGLE, filePath: undefined })).toMatch(/Escolha onde salvar/);
  });
});

describe("remoteErrorMessage", () => {
  it("remove o prefixo técnico do IPC do Electron", () => {
    const error = new Error("Error invoking remote method 'api-key:save': Error: Chave da OpenAI inválida");
    expect(remoteErrorMessage(error)).toBe("Chave da OpenAI inválida");
    expect(remoteErrorMessage("texto")).toBe("texto");
  });
});

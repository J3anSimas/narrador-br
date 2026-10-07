import { describe, expect, it } from "vitest";
import { synthesizeParagraphsToWav } from "../../src/speech/synthesizeParagraphsToWav.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

const WAV_HEADER_SIZE = 44;

describe("synthesizeParagraphsToWav", () => {
  it("pede PCM à API para cada parágrafo, mantendo as demais opções", async () => {
    const api = new FakeSpeechApi(new Uint8Array([1, 0]));
    await synthesizeParagraphsToWav(["Um.", "Dois."], { api }, { voice: "cedar" });
    expect(api.requests.map((request) => [request.text, request.format, request.voice])).toEqual([
      ["Um.", "pcm", "cedar"],
      ["Dois.", "pcm", "cedar"],
    ]);
  });

  it("devolve um WAV com os trechos e a pausa entre eles", async () => {
    const api = new FakeSpeechApi(new Uint8Array([1, 0]));
    const wav = await synthesizeParagraphsToWav(["Um.", "Dois."], { api }, { pauseMs: 1 });
    // 1 ms a 24 kHz = 24 frames de 2 bytes = 48 bytes de silêncio.
    expect(wav.length).toBe(WAV_HEADER_SIZE + 2 + 48 + 2);
    expect(String.fromCharCode(...wav.subarray(0, 4))).toBe("RIFF");
    expect([...wav.subarray(WAV_HEADER_SIZE, WAV_HEADER_SIZE + 2)]).toEqual([1, 0]);
    expect([...wav.subarray(-2)]).toEqual([1, 0]);
  });

  it("avisa o progresso após cada parágrafo", async () => {
    const progress: string[] = [];
    const onParagraphSynthesized = (position: number, total: number): void => {
      progress.push(`${position}/${total}`);
    };
    await synthesizeParagraphsToWav(["Um.", "Dois."], {
      api: new FakeSpeechApi(new Uint8Array([1, 0])),
      onParagraphSynthesized,
    });
    expect(progress).toEqual(["1/2", "2/2"]);
  });

  it("não chama a API se algum parágrafo for inválido", async () => {
    const api = new FakeSpeechApi();
    await expect(synthesizeParagraphsToWav(["Válido.", ""], { api })).rejects.toThrow(/Parágrafo vazio/);
    expect(api.requests).toHaveLength(0);
  });
});

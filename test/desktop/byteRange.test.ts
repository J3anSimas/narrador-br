import { describe, expect, it } from "vitest";
import { audioContentType, parseByteRange } from "../../src/desktop/main/byteRange.js";

describe("parseByteRange", () => {
  it("sem cabeçalho ou com formato não suportado, serve o arquivo inteiro", () => {
    expect(parseByteRange(null, 100)).toEqual({ kind: "full" });
    expect(parseByteRange("bytes=0-1,5-9", 100)).toEqual({ kind: "full" });
  });

  it("interpreta início aberto, intervalo fechado e sufixo", () => {
    expect(parseByteRange("bytes=10-", 100)).toEqual({ kind: "partial", start: 10, end: 99 });
    expect(parseByteRange("bytes=10-19", 100)).toEqual({ kind: "partial", start: 10, end: 19 });
    expect(parseByteRange("bytes=-30", 100)).toEqual({ kind: "partial", start: 70, end: 99 });
  });

  it("corta o fim no tamanho do arquivo", () => {
    expect(parseByteRange("bytes=90-500", 100)).toEqual({ kind: "partial", start: 90, end: 99 });
  });

  it("recusa início além do fim do arquivo e sufixo vazio", () => {
    expect(parseByteRange("bytes=100-", 100)).toEqual({ kind: "unsatisfiable" });
    expect(parseByteRange("bytes=-0", 100)).toEqual({ kind: "unsatisfiable" });
  });
});

describe("audioContentType", () => {
  it("reconhece MP3 e WAV sem diferenciar maiúsculas", () => {
    expect(audioContentType("C:/AULA.MP3")).toBe("audio/mpeg");
    expect(audioContentType("aula.wav")).toBe("audio/wav");
    expect(audioContentType("aula.ogg")).toBe("application/octet-stream");
  });
});

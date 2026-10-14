import { describe, expect, it } from "vitest";
import { createPcmSilence, encodeWav, type PcmFormat } from "../../src/audio/wav.js";

const PCM_FORMAT: PcmFormat = { sampleRate: 24_000, channels: 1, bitsPerSample: 16 };

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

describe("encodeWav", () => {
  it("escreve um cabeçalho RIFF/WAVE coerente com o formato e o tamanho", () => {
    const wav = encodeWav(new Uint8Array([1, 0, 2, 0]), PCM_FORMAT);
    const view = new DataView(wav.buffer);
    expect([readAscii(wav, 0, 4), readAscii(wav, 8, 4), readAscii(wav, 12, 4), readAscii(wav, 36, 4)]).toEqual([
      "RIFF",
      "WAVE",
      "fmt ",
      "data",
    ]);
    expect(view.getUint32(4, true)).toBe(36 + 4);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(24_000);
    expect(view.getUint32(28, true)).toBe(48_000);
    expect(view.getUint16(32, true)).toBe(2);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(4);
  });

  it("copia as amostras logo após o cabeçalho", () => {
    expect([...encodeWav(new Uint8Array([7, 8]), PCM_FORMAT).subarray(44)]).toEqual([7, 8]);
  });
});

describe("createPcmSilence", () => {
  it("gera bytes zerados na quantidade da duração pedida", () => {
    const silence = createPcmSilence(500, PCM_FORMAT);
    expect(silence.length).toBe(24_000);
    expect(silence.every((byte) => byte === 0)).toBe(true);
  });
});

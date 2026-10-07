import { describe, expect, it } from "vitest";
import { joinPcmSegments } from "../../src/audio/joinPcmSegments.js";
import type { PcmFormat } from "../../src/audio/wav.js";

// 1 kHz deixa a conta do silêncio pequena: 2 ms = 2 frames = 4 bytes.
const TINY_FORMAT: PcmFormat = { sampleRate: 1_000, channels: 1, bitsPerSample: 16 };

describe("joinPcmSegments", () => {
  it("intercala o silêncio só entre os trechos", () => {
    const joined = joinPcmSegments([new Uint8Array([1, 1]), new Uint8Array([2, 2])], 2, TINY_FORMAT);
    expect([...joined]).toEqual([1, 1, 0, 0, 0, 0, 2, 2]);
  });

  it("devolve o trecho intacto quando há um só", () => {
    expect([...joinPcmSegments([new Uint8Array([5, 6])], 2, TINY_FORMAT)]).toEqual([5, 6]);
  });

  it("rejeita trecho com frame incompleto, citando posição e tamanho", () => {
    expect(() => joinPcmSegments([new Uint8Array([1, 1]), new Uint8Array([3])], 2, TINY_FORMAT)).toThrow(
      /Trecho PCM 2 com 1 bytes.*múltiplo de 2/,
    );
  });
});

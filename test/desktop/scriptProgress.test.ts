import { describe, expect, it } from "vitest";
import {
  describeJobEvent,
  describeJobResult,
  findOverlongParagraphs,
  IDLE_PROGRESS,
  paragraphStatus,
  progressAfterEvent,
} from "../../src/desktop/renderer/scriptProgress.js";

describe("paragraphStatus", () => {
  it("marca feitos, o atual (só durante a geração) e pendentes", () => {
    const running = { doneCount: 2, running: true };
    expect([0, 1, 2, 3].map((index) => paragraphStatus(index, running))).toEqual(["done", "done", "current", "pending"]);
    expect(paragraphStatus(2, { doneCount: 2, running: false })).toBe("pending");
  });
});

describe("progressAfterEvent", () => {
  it("avança com parágrafos sintetizados ou arquivos gravados e ignora o resto", () => {
    const afterSynth = progressAfterEvent(IDLE_PROGRESS, { kind: "paragraphSynthesized", position: 3, total: 9 });
    expect(afterSynth.doneCount).toBe(3);
    const afterFile = progressAfterEvent(afterSynth, { kind: "audioFileWritten", path: "p", position: 4, total: 9 });
    expect(afterFile.doneCount).toBe(4);
    expect(progressAfterEvent(afterFile, { kind: "audioSaved", path: "a.mp3" })).toBe(afterFile);
  });
});

describe("describeJobEvent / describeJobResult", () => {
  it("descreve o progresso e silencia faixas prontas", () => {
    expect(describeJobEvent({ kind: "paragraphSynthesized", position: 2, total: 5 })).toBe("Parágrafo 2 de 5 pronto");
    expect(describeJobEvent({ kind: "trackReady", track: { url: "u", path: "p" } })).toBeUndefined();
  });

  it("mostra a mensagem de falha e mantém o status ao concluir", () => {
    expect(describeJobResult({ status: "failed", message: "sem rede" })).toBe("sem rede");
    expect(describeJobResult({ status: "done" })).toBeUndefined();
  });
});

describe("findOverlongParagraphs", () => {
  it("devolve as posições dos parágrafos acima do limite da API", () => {
    expect(findOverlongParagraphs(["curto", "x".repeat(4097), "y".repeat(4096)])).toEqual([2]);
  });
});

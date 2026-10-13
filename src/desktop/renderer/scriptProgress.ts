import { MAX_PARAGRAPH_LENGTH } from "../../speech/synthesizeParagraph.js";
import type { DesktopJobEvent, DesktopJobResult } from "../shared/desktopBridge.js";

export type ParagraphStatus = "pending" | "current" | "done";

/** Quantos parágrafos já viraram áudio na geração atual (ou na última). */
export interface ScriptProgress {
  doneCount: number;
  running: boolean;
}

export const IDLE_PROGRESS: ScriptProgress = { doneCount: 0, running: false };

/**
 * Estado de um parágrafo no roteiro; `index` começa em 0.
 *
 * @example paragraphStatus(2, { doneCount: 2, running: true }) // "current"
 */
export function paragraphStatus(index: number, progress: ScriptProgress): ParagraphStatus {
  if (index < progress.doneCount) return "done";
  return progress.running && index === progress.doneCount ? "current" : "pending";
}

/**
 * Avança o progresso conforme os eventos da geração.
 *
 * @example progressAfterEvent(progress, { kind: "paragraphSynthesized", position: 3, total: 9 }).doneCount // 3
 */
export function progressAfterEvent(progress: ScriptProgress, event: DesktopJobEvent): ScriptProgress {
  if (event.kind === "paragraphSynthesized" || event.kind === "audioFileWritten") {
    return { ...progress, doneCount: event.position };
  }
  return progress;
}

/**
 * Frase da linha de status para cada evento; `undefined` quando não há nada a dizer.
 *
 * @example describeJobEvent({ kind: "audioSaved", path: "C:/aula.mp3" }) // "Áudio salvo em C:/aula.mp3"
 */
export function describeJobEvent(event: DesktopJobEvent): string | undefined {
  switch (event.kind) {
    case "progressSaved":
      return "Se a geração parar, gere de novo com o mesmo texto e destino: o que já foi feito é reaproveitado.";
    case "paragraphSynthesized":
    case "audioFileWritten":
      return `Parágrafo ${event.position} de ${event.total} pronto`;
    case "paragraphsReused":
      return `${event.count} parágrafo(s) reaproveitado(s) de uma geração anterior`;
    case "audioSaved":
      return `Áudio salvo em ${event.path}`;
    case "trackReady":
      return undefined;
  }
}

/**
 * Frase final da linha de status; `undefined` mantém a última frase de progresso.
 *
 * @example describeJobResult({ status: "cancelled" }) // "Geração cancelada."
 */
export function describeJobResult(result: DesktopJobResult): string | undefined {
  if (result.status === "cancelled") return "Geração cancelada.";
  if (result.status === "failed") return result.message;
  return undefined;
}

/**
 * Posições (1, 2...) dos parágrafos longos demais para a API, que barrariam a geração.
 *
 * @example findOverlongParagraphs(["curto", "x".repeat(5000)]) // [2]
 */
export function findOverlongParagraphs(paragraphs: readonly string[]): number[] {
  return paragraphs.flatMap((paragraph, index) => (paragraph.trim().length > MAX_PARAGRAPH_LENGTH ? [index + 1] : []));
}

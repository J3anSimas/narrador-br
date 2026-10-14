import { fitParagraphsToLimit } from "../paragraphs/fitParagraphsToLimit.js";
import { UnexpectedRewriteResponseError } from "./openAiTextRewriter.js";
import type { TextRewriter } from "./textRewriter.js";

// A LLM conta caracteres mal: mira abaixo do limite, e cada nova tentativa sobre
// uma parte que ainda não coube aperta o alvo.
const TARGET_RATIOS = [0.9, 0.75, 0.6] as const;

/** Como ficou um parágrafo que passava do limite. */
export interface RewriteEvent {
  position: number;
  originalLength: number;
  partLengths: number[];
  /** Algum trecho não coube depois de todas as tentativas e foi dividido nos fins de frase, sem a LLM. */
  usedFallback: boolean;
}

export interface RewriteDependencies {
  /** Criado só quando aparece o primeiro parágrafo longo: textos curtos não exigem chave de API. */
  createRewriter: () => TextRewriter;
  onEvent?: (event: RewriteEvent) => void;
}

interface FitResult {
  parts: string[];
  usedFallback: boolean;
}

/**
 * Garante que todo parágrafo caiba em `maxLength`. Os que já cabem ficam intactos;
 * os maiores vão para a LLM, que pode condensá-los e/ou quebrá-los em vários.
 * Uma parte que ainda passe do limite volta para a LLM com alvo menor; se nem
 * assim couber, é dividida nos fins de frase, sem perder texto.
 *
 * @example await fitParagraphsWithRewriter(paragraphs, 4096, { createRewriter: () => rewriter })
 */
export async function fitParagraphsWithRewriter(
  paragraphs: readonly string[],
  maxLength: number,
  deps: RewriteDependencies,
): Promise<string[]> {
  let rewriter: TextRewriter | undefined;
  const fitted: string[] = [];
  for (const [index, paragraph] of paragraphs.entries()) {
    if (paragraph.length <= maxLength) {
      fitted.push(paragraph);
      continue;
    }
    rewriter ??= deps.createRewriter();
    const { parts, usedFallback } = await fitLongText(paragraph, maxLength, rewriter, 0);
    deps.onEvent?.({
      position: index + 1,
      originalLength: paragraph.length,
      partLengths: parts.map((part) => part.length),
      usedFallback,
    });
    fitted.push(...parts);
  }
  return fitted;
}

async function fitLongText(text: string, maxLength: number, rewriter: TextRewriter, attempt: number): Promise<FitResult> {
  const ratio = TARGET_RATIOS[attempt];
  if (ratio === undefined) return { parts: fitParagraphsToLimit([text], maxLength), usedFallback: true };
  const parts = await requestParts(text, Math.floor(maxLength * ratio), rewriter);
  if (parts.length === 0) return fitLongText(text, maxLength, rewriter, attempt + 1);
  const result: FitResult = { parts: [], usedFallback: false };
  for (const part of parts) {
    const fitted =
      part.length <= maxLength
        ? { parts: [part], usedFallback: false }
        : await fitLongText(part, maxLength, rewriter, attempt + 1);
    result.parts.push(...fitted.parts);
    result.usedFallback ||= fitted.usedFallback;
  }
  return result;
}

async function requestParts(text: string, target: number, rewriter: TextRewriter): Promise<string[]> {
  try {
    // Cada parte vira um parágrafo de uma linha, como os demais.
    const parts = await rewriter.fitToLength(text, target);
    return parts.map((part) => part.replace(/\s+/g, " ").trim()).filter((part) => part.length > 0);
  } catch (error) {
    // Formato errado conta como tentativa falha; erro de rede ou de chave interrompe a execução.
    if (error instanceof UnexpectedRewriteResponseError) return [];
    throw error;
  }
}

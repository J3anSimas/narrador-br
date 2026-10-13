import { BRAZILIAN_NARRATION_INSTRUCTIONS } from "./brazilianNarration.js";
import type { AudioFormat, SpeechApi, SpeechRequest } from "./speechApi.js";

/** Limite de caracteres do campo `input` em `POST /v1/audio/speech`. */
export const MAX_PARAGRAPH_LENGTH = 4096;

export interface SpeechOptions {
  model?: string;
  voice?: string;
  format?: AudioFormat;
  instructions?: string;
}

// "marin" e "cedar" são as vozes de melhor qualidade segundo o guia de TTS da OpenAI.
export const DEFAULT_SPEECH_OPTIONS = {
  model: "gpt-4o-mini-tts",
  voice: "marin",
  format: "mp3",
  instructions: BRAZILIAN_NARRATION_INSTRUCTIONS,
} as const satisfies SpeechOptions;

/**
 * Envia um parágrafo para a API de text-to-speech e devolve o áudio gerado.
 *
 * @example
 * const audio = await synthesizeParagraph("Olá, mundo.", new OpenAiSpeechApi(new OpenAI()));
 * await writeFile("ola.mp3", audio);
 */
export async function synthesizeParagraph(
  paragraph: string,
  api: SpeechApi,
  options: SpeechOptions = {},
): Promise<Uint8Array> {
  return api.createSpeech(buildSpeechRequest(paragraph, options));
}

function buildSpeechRequest(paragraph: string, options: SpeechOptions): SpeechRequest {
  const text = paragraph.trim();
  assertSpeakableText(text);
  return { ...DEFAULT_SPEECH_OPTIONS, ...withoutUndefined(options), text };
}

export function assertSpeakableText(text: string): void {
  if (text.length === 0) {
    throw new Error('Parágrafo vazio: "" (esperado: texto com pelo menos um caractere visível).');
  }
  if (text.length > MAX_PARAGRAPH_LENGTH) {
    throw new Error(
      `Parágrafo com ${text.length} caracteres (esperado: no máximo ${MAX_PARAGRAPH_LENGTH}). Início: "${text.slice(0, 60)}…"`,
    );
  }
}

// Sem isso, `{ voice: undefined }` sobrescreveria o padrão no spread.
function withoutUndefined(options: SpeechOptions): Partial<SpeechRequest> {
  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
}

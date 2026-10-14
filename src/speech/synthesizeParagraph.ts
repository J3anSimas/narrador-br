import type { AudioFormat, SpeechApi, SpeechRequest } from "../ports/speechApi.js";

/** Voz e instruções em branco ficam com o padrão do provedor. */
export interface SpeechOptions {
  voice?: string;
  format?: AudioFormat;
  instructions?: string;
}

export const DEFAULT_AUDIO_FORMAT: AudioFormat = "mp3";

/**
 * Envia um parágrafo para a API de text-to-speech e devolve o áudio gerado.
 *
 * @example
 * const audio = await synthesizeParagraph("Olá, mundo.", createOpenAiProvider(process.env).speech.create());
 * await writeFile("ola.mp3", audio);
 */
export async function synthesizeParagraph(
  paragraph: string,
  api: SpeechApi,
  options: SpeechOptions = {},
): Promise<Uint8Array> {
  return api.createSpeech(buildSpeechRequest(paragraph, api.maxInputLength, options));
}

function buildSpeechRequest(paragraph: string, maxLength: number, options: SpeechOptions): SpeechRequest {
  const text = paragraph.trim();
  assertSpeakableText(text, maxLength);
  return { format: DEFAULT_AUDIO_FORMAT, ...withoutUndefined(options), text };
}

export function assertSpeakableText(text: string, maxLength: number): void {
  if (text.length === 0) {
    throw new Error('Parágrafo vazio: "" (esperado: texto com pelo menos um caractere visível).');
  }
  if (text.length > maxLength) {
    throw new Error(
      `Parágrafo com ${text.length} caracteres (esperado: no máximo ${maxLength}). Início: "${text.slice(0, 60)}…"`,
    );
  }
}

// Sem isso, `{ format: undefined }` sobrescreveria o padrão no spread.
function withoutUndefined(options: SpeechOptions): Partial<SpeechRequest> {
  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
}

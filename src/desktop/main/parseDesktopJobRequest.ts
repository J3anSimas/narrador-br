import { singleAudioFormatFromPath } from "../../audio/singleAudioFormat.js";
import { SPEECH_VOICES, type DesktopJobRequest, type SpeechVoice } from "../shared/desktopBridge.js";

type UntrustedFields = Readonly<Record<string, unknown>>;

/**
 * Valida o pedido que chega da janela pelo IPC: a fronteira entre processos não
 * garante os tipos do TypeScript.
 *
 * @example parseDesktopJobRequest({ mode: "singleFile", text: "Olá.", voice: "marin", outputPath: "C:/aula.mp3" })
 */
export function parseDesktopJobRequest(raw: unknown): DesktopJobRequest {
  const fields = requireObject(raw);
  const text = requireNonEmptyString(fields, "text");
  const voice = requireVoice(fields["voice"]);
  if (fields["mode"] === "perParagraph") {
    return { mode: "perParagraph", text, voice, outputDir: requireNonEmptyString(fields, "outputDir") };
  }
  if (fields["mode"] === "singleFile") {
    return { mode: "singleFile", text, voice, outputPath: requireSingleAudioPath(fields) };
  }
  throw new Error(`Modo de geração inválido: ${JSON.stringify(fields["mode"])} (esperado: "singleFile" | "perParagraph").`);
}

function requireObject(raw: unknown): UntrustedFields {
  if (typeof raw === "object" && raw !== null) return raw as UntrustedFields;
  throw new Error(`Pedido de geração inválido: ${JSON.stringify(raw)} (esperado: objeto com mode, text e voice).`);
}

function requireNonEmptyString(fields: UntrustedFields, name: string): string {
  const value = fields[name];
  if (typeof value === "string" && value.trim().length > 0) return value;
  throw new Error(`Campo "${name}" inválido: ${JSON.stringify(value)} (esperado: texto não vazio).`);
}

function requireVoice(value: unknown): SpeechVoice {
  const match = SPEECH_VOICES.find((voice) => voice === value);
  if (match !== undefined) return match;
  throw new Error(`Voz inválida: ${JSON.stringify(value)} (esperado: ${SPEECH_VOICES.join(" | ")}).`);
}

function requireSingleAudioPath(fields: UntrustedFields): string {
  const outputPath = requireNonEmptyString(fields, "outputPath");
  if (singleAudioFormatFromPath(outputPath) !== undefined) return outputPath;
  throw new Error(`Arquivo de saída inválido: "${outputPath}" (esperado: caminho terminando em .mp3 ou .wav).`);
}

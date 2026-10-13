import type { DesktopJobRequest, SpeechVoice } from "../shared/desktopBridge.js";

export type OutputMode = DesktopJobRequest["mode"];
export type SingleAudioFormat = "mp3" | "wav";

/** Escolhas do painel de saída; cada modo guarda o próprio destino. */
export interface OutputChoices {
  mode: OutputMode;
  voice: SpeechVoice;
  format: SingleAudioFormat;
  filePath?: string;
  folderPath?: string;
}

/**
 * Troca a extensão do arquivo escolhido quando o formato muda, para não gravar WAV em "aula.mp3".
 *
 * @example withAudioExtension("C:/aula.mp3", "wav") // "C:/aula.wav"
 */
export function withAudioExtension(path: string, format: SingleAudioFormat): string {
  return /\.(mp3|wav)$/i.test(path) ? path.replace(/\.(mp3|wav)$/i, `.${format}`) : `${path}.${format}`;
}

/** Destino do modo atual, ou `undefined` se ainda não foi escolhido. */
export function currentDestination(choices: OutputChoices): string | undefined {
  return choices.mode === "singleFile" ? choices.filePath : choices.folderPath;
}

/**
 * Monta o pedido de geração, ou explica o que falta para gerar.
 *
 * @example buildJobRequest("Olá.", { mode: "singleFile", voice: "marin", format: "mp3", filePath: "C:/a.mp3" })
 */
export function buildJobRequest(text: string, choices: OutputChoices): DesktopJobRequest | string {
  if (text.trim().length === 0) return "Cole ou abra um texto para gerar o áudio.";
  const destination = currentDestination(choices);
  if (destination === undefined) return "Escolha onde salvar o áudio.";
  const { voice } = choices;
  if (choices.mode === "singleFile") return { mode: "singleFile", text, voice, outputPath: destination };
  return { mode: "perParagraph", text, voice, outputDir: destination };
}

const REMOTE_ERROR_PREFIX = /^Error invoking remote method '[^']+': (?:Error: )?/;

/**
 * Mensagem de um erro vindo do processo principal, sem o prefixo técnico do Electron.
 *
 * @example remoteErrorMessage(new Error("Error invoking remote method 'x': Error: Chave inválida")) // "Chave inválida"
 */
export function remoteErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(REMOTE_ERROR_PREFIX, "");
}

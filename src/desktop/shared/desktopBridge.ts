import type { AudioJobEvent } from "../../jobs/audioJobEvent.js";

// "marin" e "cedar" primeiro: são as de melhor qualidade segundo o guia de TTS da OpenAI.
export const SPEECH_VOICES = [
  "marin",
  "cedar",
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;
export type SpeechVoice = (typeof SPEECH_VOICES)[number];

export type DesktopJobRequest =
  | { mode: "singleFile"; text: string; voice: SpeechVoice; outputPath: string }
  | { mode: "perParagraph"; text: string; voice: SpeechVoice; outputDir: string };

/** Áudio pronto para tocar; `url` usa o protocolo próprio do app, nunca file://. */
export interface AudioTrack {
  url: string;
  path: string;
  /** Número do parágrafo (1, 2...) no modo um arquivo por parágrafo; ausente no áudio único. */
  paragraphPosition?: number;
}

export type DesktopJobEvent = AudioJobEvent | { kind: "trackReady"; track: AudioTrack };

export type DesktopJobResult = { status: "done" } | { status: "cancelled" } | { status: "failed"; message: string };

/** Pedido de salvar a faixa `trackUrl` (já tocável na janela) em outra velocidade. */
export interface SpeedExportRequest {
  trackUrl: string;
  speed: number;
}

export type SpeedExportResult =
  | { status: "saved"; track: AudioTrack }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

export interface OpenedTextFile {
  path: string;
  text: string;
}

/** O que a janela pode pedir ao processo principal; exposto em `window.desktopBridge` pelo preload. */
export interface DesktopBridge {
  openTextFile(): Promise<OpenedTextFile | undefined>;
  chooseAudioFile(format: "mp3" | "wav"): Promise<string | undefined>;
  chooseAudioFolder(): Promise<string | undefined>;
  /** Abre um áudio do computador e o devolve pronto para tocar; `undefined` se o usuário cancelar. */
  openAudioFile(): Promise<AudioTrack | undefined>;
  /** Pergunta onde salvar e grava a faixa na velocidade pedida, sem mudar o tom. */
  exportAtSpeed(request: SpeedExportRequest): Promise<SpeedExportResult>;
  hasApiKey(): Promise<boolean>;
  saveApiKey(apiKey: string): Promise<void>;
  clearApiKey(): Promise<void>;
  startJob(request: DesktopJobRequest): Promise<DesktopJobResult>;
  cancelJob(): Promise<void>;
  /** Abre o Explorer com o arquivo da faixa selecionado. */
  showInFolder(trackUrl: string): Promise<void>;
  /** Devolve a função que cancela a inscrição. */
  onJobEvent(listener: (event: DesktopJobEvent) => void): () => void;
}

export const DESKTOP_CHANNELS = {
  openTextFile: "text:open",
  chooseAudioFile: "output:choose-file",
  chooseAudioFolder: "output:choose-folder",
  openAudioFile: "audio:open",
  exportAtSpeed: "audio:export-at-speed",
  hasApiKey: "api-key:has",
  saveApiKey: "api-key:save",
  clearApiKey: "api-key:clear",
  startJob: "job:start",
  cancelJob: "job:cancel",
  showInFolder: "file:show-in-folder",
  jobEvent: "job:event",
} as const;

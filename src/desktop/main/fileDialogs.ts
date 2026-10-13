import { dialog, type BrowserWindow } from "electron";
import { readFile } from "node:fs/promises";
import type { OpenedTextFile } from "../shared/desktopBridge.js";

/**
 * Pede um .txt ao usuário e devolve o conteúdo; `undefined` se ele cancelar.
 *
 * @example const opened = await openTextFile(window)
 */
export async function openTextFile(window: BrowserWindow): Promise<OpenedTextFile | undefined> {
  const result = await dialog.showOpenDialog(window, {
    title: "Abrir texto",
    filters: [{ name: "Texto", extensions: ["txt", "md"] }],
    properties: ["openFile"],
  });
  const path = result.filePaths[0];
  if (result.canceled || path === undefined) return undefined;
  try {
    return { path, text: await readFile(path, "utf8") };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Não foi possível ler "${path}" (esperado: arquivo de texto UTF-8): ${reason}`);
  }
}

/**
 * Pergunta onde salvar o áudio único; `undefined` se o usuário cancelar.
 *
 * @example await chooseAudioFile(window, "mp3") // "C:\\Users\\...\\aula.mp3"
 */
export async function chooseAudioFile(window: BrowserWindow, format: "mp3" | "wav"): Promise<string | undefined> {
  const result = await dialog.showSaveDialog(window, {
    title: "Salvar áudio",
    defaultPath: `audio.${format}`,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
  });
  return result.canceled ? undefined : result.filePath;
}

/**
 * Pergunta em que pasta gravar um arquivo por parágrafo; `undefined` se o usuário cancelar.
 *
 * @example await chooseAudioFolder(window) // "C:\\Users\\...\\aula"
 */
export async function chooseAudioFolder(window: BrowserWindow): Promise<string | undefined> {
  const result = await dialog.showOpenDialog(window, {
    title: "Pasta dos áudios",
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? undefined : result.filePaths[0];
}

// Formatos que o <audio> do Chromium toca e o ffmpeg lê; a prévia precisa dos dois.
const OPENABLE_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "aac", "ogg", "opus", "flac", "webm"];

/**
 * Pede um áudio do computador para ouvir e acelerar; `undefined` se o usuário cancelar.
 *
 * @example await chooseAudioToOpen(window) // "C:\Users\...\aula.m4a"
 */
export async function chooseAudioToOpen(window: BrowserWindow): Promise<string | undefined> {
  const result = await dialog.showOpenDialog(window, {
    title: "Abrir áudio",
    filters: [{ name: "Áudio", extensions: OPENABLE_AUDIO_EXTENSIONS }],
    properties: ["openFile"],
  });
  return result.canceled ? undefined : result.filePaths[0];
}

/**
 * Pergunta onde salvar o áudio na nova velocidade, sugerindo `suggestedPath`.
 *
 * @example await chooseSpedUpAudioPath(window, "C:\aulas\aula (1,5x).mp3")
 */
export async function chooseSpedUpAudioPath(window: BrowserWindow, suggestedPath: string): Promise<string | undefined> {
  const result = await dialog.showSaveDialog(window, {
    title: "Salvar áudio nesta velocidade",
    defaultPath: suggestedPath,
    filters: [
      { name: "MP3", extensions: ["mp3"] },
      { name: "WAV", extensions: ["wav"] },
    ],
  });
  return result.canceled ? undefined : result.filePath;
}

import { ipcMain, shell, type BrowserWindow } from "electron";
import { DESKTOP_CHANNELS, type AudioTrack } from "../shared/desktopBridge.js";
import type { ApiKeyStore } from "./apiKeyStore.js";
import type { AudioTrackRegistry } from "./audioTrackRegistry.js";
import type { DesktopJobController } from "./desktopJobController.js";
import { chooseAudioFile, chooseAudioFolder, chooseAudioToOpen, openTextFile } from "./fileDialogs.js";
import { parseDesktopJobRequest } from "./parseDesktopJobRequest.js";
import { parseSpeedExportRequest } from "./parseSpeedExportRequest.js";
import type { SpeedExportController } from "./speedExportController.js";

export interface DesktopIpcDependencies {
  window: BrowserWindow;
  controller: DesktopJobController;
  apiKeyStore: ApiKeyStore;
  registry: AudioTrackRegistry;
  speedExporter: SpeedExportController;
}

/**
 * Liga cada canal de `DESKTOP_CHANNELS` à sua implementação no processo principal.
 *
 * @example registerIpcHandlers({ window, controller, apiKeyStore, registry, speedExporter })
 */
export function registerIpcHandlers(deps: DesktopIpcDependencies): void {
  ipcMain.handle(DESKTOP_CHANNELS.openTextFile, () => openTextFile(deps.window));
  ipcMain.handle(DESKTOP_CHANNELS.chooseAudioFile, (_event, format: unknown) =>
    chooseAudioFile(deps.window, requireAudioFormat(format)),
  );
  ipcMain.handle(DESKTOP_CHANNELS.chooseAudioFolder, () => chooseAudioFolder(deps.window));
  ipcMain.handle(DESKTOP_CHANNELS.openAudioFile, () => openAudioTrack(deps));
  ipcMain.handle(DESKTOP_CHANNELS.exportAtSpeed, (_event, rawRequest: unknown) =>
    deps.speedExporter.exportAtSpeed(parseSpeedExportRequest(rawRequest)),
  );
  ipcMain.handle(DESKTOP_CHANNELS.hasApiKey, async () => (await deps.apiKeyStore.load()) !== undefined);
  ipcMain.handle(DESKTOP_CHANNELS.saveApiKey, (_event, apiKey: unknown) => deps.apiKeyStore.save(String(apiKey)));
  ipcMain.handle(DESKTOP_CHANNELS.clearApiKey, () => deps.apiKeyStore.clear());
  ipcMain.handle(DESKTOP_CHANNELS.startJob, (event, rawRequest: unknown) =>
    deps.controller.start(parseDesktopJobRequest(rawRequest), (jobEvent) => {
      event.sender.send(DESKTOP_CHANNELS.jobEvent, jobEvent);
    }),
  );
  ipcMain.handle(DESKTOP_CHANNELS.cancelJob, () => deps.controller.cancel());
  ipcMain.handle(DESKTOP_CHANNELS.showInFolder, (_event, trackUrl: unknown) => showTrackInFolder(deps, trackUrl));
}

function requireAudioFormat(format: unknown): "mp3" | "wav" {
  if (format === "mp3" || format === "wav") return format;
  throw new Error(`Formato de áudio inválido: ${JSON.stringify(format)} (esperado: "mp3" | "wav").`);
}

async function openAudioTrack(deps: DesktopIpcDependencies): Promise<AudioTrack | undefined> {
  const path = await chooseAudioToOpen(deps.window);
  return path === undefined ? undefined : { url: deps.registry.register(path), path };
}

function showTrackInFolder(deps: DesktopIpcDependencies, trackUrl: unknown): void {
  const path = deps.registry.pathFor(String(trackUrl));
  if (path === undefined) throw new Error(`Faixa desconhecida: ${JSON.stringify(trackUrl)} (esperado: URL tts-audio://track/N).`);
  shell.showItemInFolder(path);
}

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { DESKTOP_CHANNELS, type DesktopBridge, type DesktopJobEvent } from "../shared/desktopBridge.js";

// Empacotado pelo esbuild em CommonJS: preloads com sandbox não carregam ESM nem arquivos locais.
const desktopBridge: DesktopBridge = {
  openTextFile: () => ipcRenderer.invoke(DESKTOP_CHANNELS.openTextFile),
  chooseAudioFile: (format) => ipcRenderer.invoke(DESKTOP_CHANNELS.chooseAudioFile, format),
  chooseAudioFolder: () => ipcRenderer.invoke(DESKTOP_CHANNELS.chooseAudioFolder),
  openAudioFile: () => ipcRenderer.invoke(DESKTOP_CHANNELS.openAudioFile),
  exportAtSpeed: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.exportAtSpeed, request),
  hasApiKey: () => ipcRenderer.invoke(DESKTOP_CHANNELS.hasApiKey),
  saveApiKey: (apiKey) => ipcRenderer.invoke(DESKTOP_CHANNELS.saveApiKey, apiKey),
  clearApiKey: () => ipcRenderer.invoke(DESKTOP_CHANNELS.clearApiKey),
  startJob: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.startJob, request),
  cancelJob: () => ipcRenderer.invoke(DESKTOP_CHANNELS.cancelJob),
  showInFolder: (trackUrl) => ipcRenderer.invoke(DESKTOP_CHANNELS.showInFolder, trackUrl),
  onJobEvent: (listener) => {
    const forward = (_event: IpcRendererEvent, jobEvent: DesktopJobEvent): void => listener(jobEvent);
    ipcRenderer.on(DESKTOP_CHANNELS.jobEvent, forward);
    return () => ipcRenderer.off(DESKTOP_CHANNELS.jobEvent, forward);
  },
};

contextBridge.exposeInMainWorld("desktopBridge", desktopBridge);

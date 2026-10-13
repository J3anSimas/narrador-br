import { BrowserWindow, nativeTheme } from "electron";

export interface MainWindowFiles {
  preloadPath: string;
  indexHtmlPath: string;
}

/**
 * Cria a janela com isolamento total: a página só fala com o Node pelo `desktopBridge` do preload.
 *
 * @example createMainWindow({ preloadPath: join(here, "../preload.cjs"), indexHtmlPath: join(here, "../renderer/index.html") })
 */
export function createMainWindow(files: MainWindowFiles): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 860,
    minHeight: 560,
    title: "Texto em fala",
    show: false,
    // Mesma cor do fundo da página, para não piscar branco antes do primeiro desenho.
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#121821" : "#F2F4F7",
    webPreferences: { preload: files.preloadPath, contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  lockNavigation(window);
  window.once("ready-to-show", () => window.show());
  void window.loadFile(files.indexHtmlPath);
  return window;
}

// A janela só mostra o próprio app: links e redirecionamentos não abrem nada.
function lockNavigation(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
}

import { app, Menu, type BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createOpenAiProvider } from "../../adapters/openai/createOpenAiProvider.js";
import { FfmpegAudioSpeedRenderer } from "../../audio/ffmpegAudioSpeedRenderer.js";
import { FfmpegMp3Encoder } from "../../audio/ffmpegMp3Encoder.js";
import type { AudioJobDependencies } from "../../jobs/audioJobDependencies.js";
import { NodeAudioFileWriter } from "../../output/nodeAudioFileWriter.js";
import { NodeSpeechAudioCache } from "../../output/nodeSpeechAudioCache.js";
import { ApiKeyStore } from "./apiKeyStore.js";
import { handleAudioTrackProtocol, registerAudioTrackScheme } from "./audioTrackProtocol.js";
import { AudioTrackRegistry } from "./audioTrackRegistry.js";
import { DesktopJobController } from "./desktopJobController.js";
import { ElectronSecretCipher } from "./electronSecretCipher.js";
import { resolveFfmpegPath } from "./ffmpegLocation.js";
import { chooseSpedUpAudioPath } from "./fileDialogs.js";
import { createMainWindow } from "./mainWindow.js";
import { NodeSecretFile } from "./nodeSecretFile.js";
import { registerIpcHandlers } from "./registerIpcHandlers.js";
import { SpeedExportController } from "./speedExportController.js";
import { createJsonLineLogger } from "./structuredLogger.js";

const here = dirname(fileURLToPath(import.meta.url));
const logger = createJsonLineLogger((line) => process.stderr.write(line));
// require em vez de import: os tipos do pacote dizem que o default é o módulo, mas em runtime é o caminho.
const bundledFfmpegPath: unknown = createRequire(import.meta.url)("ffmpeg-static");
const ffmpegPath = resolveFfmpegPath(typeof bundledFfmpegPath === "string" ? bundledFfmpegPath : null);

registerAudioTrackScheme();
app.on("window-all-closed", () => app.quit());
app.whenReady().then(startDesktopApp, (error: unknown) => {
  logger.log("error", "desktop app failed to start", { error: String(error) });
  app.exit(1);
});

function startDesktopApp(): void {
  Menu.setApplicationMenu(null);
  const registry = new AudioTrackRegistry();
  handleAudioTrackProtocol(registry);
  const apiKeyFile = new NodeSecretFile(join(app.getPath("userData"), "openai-key.bin"));
  const apiKeyStore = new ApiKeyStore(new ElectronSecretCipher(), apiKeyFile);
  const controller = new DesktopJobController({
    loadApiKey: () => apiKeyStore.load(),
    createJobDependencies,
    registerTrack: (path) => registry.register(path),
    logger,
  });
  const window = createMainWindow({
    preloadPath: join(here, "../preload.cjs"),
    indexHtmlPath: join(here, "../renderer/index.html"),
  });
  const speedExporter = createSpeedExporter(window, registry);
  registerIpcHandlers({ window, controller, apiKeyStore, registry, speedExporter });
}

function createSpeedExporter(window: BrowserWindow, registry: AudioTrackRegistry): SpeedExportController {
  return new SpeedExportController({
    trackPathFor: (url) => registry.pathFor(url),
    chooseOutputPath: (suggestedPath) => chooseSpedUpAudioPath(window, suggestedPath),
    renderer: new FfmpegAudioSpeedRenderer(ffmpegPath),
    registerTrack: (path) => registry.register(path),
    logger,
  });
}

function createJobDependencies(apiKey: string): AudioJobDependencies {
  return {
    createSpeechApi: () => createOpenAiProvider({ OPENAI_API_KEY: apiKey }).speech.create(),
    writer: new NodeAudioFileWriter(),
    mp3Encoder: new FfmpegMp3Encoder(ffmpegPath),
    createSpeechCache: (directory) => new NodeSpeechAudioCache(directory),
  };
}

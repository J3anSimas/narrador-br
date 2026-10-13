import type { DesktopJobEvent, DesktopJobRequest, DesktopJobResult } from "../shared/desktopBridge.js";
import { ApiKeyDialog } from "./apiKeyDialog.js";
import { requireElement } from "./dom.js";
import { buildJobRequest, remoteErrorMessage } from "./outputChoices.js";
import { OutputPanel } from "./outputPanel.js";
import { PlayerView } from "./playerView.js";
import { SpeedPanel } from "./speedPanel.js";
import { describeJobEvent, describeJobResult, IDLE_PROGRESS, progressAfterEvent, type ScriptProgress } from "./scriptProgress.js";
import { TextPane } from "./textPane.js";

const bridge = window.desktopBridge;
let progress: ScriptProgress = IDLE_PROGRESS;

const textPane = new TextPane(
  {
    textarea: requireElement("source-text", HTMLTextAreaElement),
    scriptList: requireElement("script-list", HTMLOListElement),
    editTab: requireElement("tab-edit", HTMLButtonElement),
    scriptTab: requireElement("tab-script", HTMLButtonElement),
    openFileButton: requireElement("open-file-button", HTMLButtonElement),
    notice: requireElement("text-notice", HTMLParagraphElement),
  },
  bridge,
  (position) => player.playParagraph(position),
);

const player = new PlayerView(
  {
    audio: requireElement("audio-player", HTMLAudioElement),
    emptyNote: requireElement("player-empty", HTMLParagraphElement),
    trackList: requireElement("track-list", HTMLUListElement),
    playAllButton: requireElement("play-all-button", HTMLButtonElement),
    showInFolderButton: requireElement("show-in-folder-button", HTMLButtonElement),
    speedControls: requireElement("speed-controls", HTMLDivElement),
  },
  bridge,
  (position) => textPane.script.showPlaying(position),
);

new SpeedPanel(
  {
    openAudioButton: requireElement("open-audio-button", HTMLButtonElement),
    slider: requireElement("speed-slider", HTMLInputElement),
    valueLabel: requireElement("speed-value", HTMLOutputElement),
    presets: requireElement("speed-presets", HTMLDivElement),
    saveButton: requireElement("save-speed-button", HTMLButtonElement),
    status: requireElement("speed-status", HTMLParagraphElement),
  },
  bridge,
  player,
);

const panel = new OutputPanel(
  {
    form: requireElement("output-form", HTMLFormElement),
    voiceSelect: requireElement("voice-select", HTMLSelectElement),
    formatField: requireElement("format-field", HTMLFieldSetElement),
    destinationLabel: requireElement("destination-path", HTMLElement),
    chooseDestinationButton: requireElement("choose-destination", HTMLButtonElement),
    generateButton: requireElement("generate-button", HTMLButtonElement),
    cancelButton: requireElement("cancel-button", HTMLButtonElement),
    status: requireElement("job-status", HTMLParagraphElement),
  },
  bridge,
);

const apiKeyDialog = new ApiKeyDialog(
  {
    openButton: requireElement("api-key-button", HTMLButtonElement),
    statusLabel: requireElement("api-key-label", HTMLSpanElement),
    dialog: requireElement("api-key-dialog", HTMLDialogElement),
    form: requireElement("api-key-form", HTMLFormElement),
    input: requireElement("api-key-input", HTMLInputElement),
    error: requireElement("api-key-error", HTMLParagraphElement),
    clearButton: requireElement("api-key-clear", HTMLButtonElement),
    closeButton: requireElement("api-key-close", HTMLButtonElement),
  },
  bridge,
);

bridge.onJobEvent(handleJobEvent);
requireElement("output-form", HTMLFormElement).addEventListener("submit", (event) => void generate(event));
requireElement("cancel-button", HTMLButtonElement).addEventListener("click", () => void cancel());
void apiKeyDialog.refreshStatus();

async function generate(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const request = buildJobRequest(textPane.text, panel.choices);
  if (typeof request === "string") {
    panel.setStatus(request, "error");
    return;
  }
  if (!(await apiKeyDialog.refreshStatus())) {
    panel.setStatus("Configure a chave da OpenAI para gerar o áudio.", "error");
    apiKeyDialog.open();
    return;
  }
  beginJob();
  finishJob(await startJob(request));
}

async function startJob(request: DesktopJobRequest): Promise<DesktopJobResult> {
  try {
    return await bridge.startJob(request);
  } catch (error) {
    return { status: "failed", message: remoteErrorMessage(error) };
  }
}

function beginJob(): void {
  player.clear();
  textPane.setLocked(true);
  textPane.showView("script");
  showProgress({ doneCount: 0, running: true });
  panel.setRunning(true);
  panel.setStatus("Preparando a geração…");
}

function finishJob(result: DesktopJobResult): void {
  showProgress({ ...progress, running: false });
  textPane.setLocked(false);
  panel.setRunning(false);
  const message = describeJobResult(result);
  if (message !== undefined) panel.setStatus(message, result.status === "failed" ? "error" : "neutral");
}

async function cancel(): Promise<void> {
  requireElement("cancel-button", HTMLButtonElement).disabled = true;
  panel.setStatus("Cancelando depois do parágrafo atual…");
  await bridge.cancelJob();
}

function handleJobEvent(event: DesktopJobEvent): void {
  showProgress(progressAfterEvent(progress, event));
  const message = describeJobEvent(event);
  if (message !== undefined) panel.setStatus(message);
  if (event.kind !== "trackReady") return;
  player.addTrack(event.track);
  if (event.track.paragraphPosition !== undefined) textPane.script.markPlayable(event.track.paragraphPosition);
}

function showProgress(next: ScriptProgress): void {
  progress = next;
  textPane.script.showProgress(progress);
}

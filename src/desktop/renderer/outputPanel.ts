import { SPEECH_VOICES, type DesktopBridge, type SpeechVoice } from "../shared/desktopBridge.js";
import {
  currentDestination,
  withAudioExtension,
  type OutputChoices,
  type OutputMode,
} from "./outputChoices.js";

export interface OutputPanelElements {
  form: HTMLFormElement;
  voiceSelect: HTMLSelectElement;
  formatField: HTMLFieldSetElement;
  destinationLabel: HTMLElement;
  chooseDestinationButton: HTMLButtonElement;
  generateButton: HTMLButtonElement;
  cancelButton: HTMLButtonElement;
  status: HTMLElement;
}

export type StatusTone = "neutral" | "error";

/**
 * Painel de saída: modo, voz, formato e destino, mais os botões de gerar e cancelar.
 *
 * @example const panel = new OutputPanel(elements, bridge); panel.choices.voice // "marin"
 */
export class OutputPanel {
  readonly choices: OutputChoices = { mode: "singleFile", voice: "marin", format: "mp3" };

  constructor(
    private readonly elements: OutputPanelElements,
    private readonly bridge: DesktopBridge,
  ) {
    fillVoiceOptions(elements.voiceSelect);
    elements.form.addEventListener("change", () => this.readFormChoices());
    elements.chooseDestinationButton.addEventListener("click", () => void this.chooseDestination());
    this.syncDestination();
  }

  setRunning(running: boolean): void {
    this.elements.generateButton.hidden = running;
    this.elements.cancelButton.hidden = !running;
    this.elements.cancelButton.disabled = false;
    this.elements.form.querySelectorAll("fieldset, select, #choose-destination").forEach((control) => {
      control.toggleAttribute("disabled", running);
    });
  }

  setStatus(text: string, tone: StatusTone = "neutral"): void {
    this.elements.status.textContent = text;
    this.elements.status.dataset["tone"] = tone;
  }

  private readFormChoices(): void {
    const formValues = new FormData(this.elements.form);
    this.choices.mode = formValues.get("mode") === "perParagraph" ? "perParagraph" : "singleFile";
    this.choices.voice = toVoice(this.elements.voiceSelect.value);
    this.choices.format = formValues.get("format") === "wav" ? "wav" : "mp3";
    if (this.choices.filePath !== undefined) {
      this.choices.filePath = withAudioExtension(this.choices.filePath, this.choices.format);
    }
    this.syncDestination();
  }

  private async chooseDestination(): Promise<void> {
    if (this.choices.mode === "singleFile") {
      this.choices.filePath = (await this.bridge.chooseAudioFile(this.choices.format)) ?? this.choices.filePath;
    } else {
      this.choices.folderPath = (await this.bridge.chooseAudioFolder()) ?? this.choices.folderPath;
    }
    this.syncDestination();
  }

  private syncDestination(): void {
    const destination = currentDestination(this.choices);
    this.elements.destinationLabel.textContent = destination ?? emptyDestinationText(this.choices.mode);
    this.elements.destinationLabel.dataset["empty"] = String(destination === undefined);
    this.elements.formatField.hidden = this.choices.mode !== "singleFile";
  }
}

function fillVoiceOptions(select: HTMLSelectElement): void {
  select.replaceChildren(...SPEECH_VOICES.map((voice) => new Option(voice, voice)));
}

function toVoice(value: string): SpeechVoice {
  return SPEECH_VOICES.find((voice) => voice === value) ?? "marin";
}

function emptyDestinationText(mode: OutputMode): string {
  return mode === "singleFile" ? "Escolha o arquivo de áudio" : "Escolha a pasta dos áudios";
}

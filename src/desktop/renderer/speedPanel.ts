import { AUDIO_SPEED_LIMITS } from "../../audio/audioSpeed.js";
import type { DesktopBridge, SpeedExportResult } from "../shared/desktopBridge.js";
import { remoteErrorMessage } from "./outputChoices.js";
import type { StatusTone } from "./outputPanel.js";
import type { PlayerView } from "./playerView.js";
import { describeSpeedExportResult, SPEED_PRESETS, speedLabel } from "./speedChoices.js";

export interface SpeedPanelElements {
  openAudioButton: HTMLButtonElement;
  slider: HTMLInputElement;
  valueLabel: HTMLOutputElement;
  presets: HTMLElement;
  saveButton: HTMLButtonElement;
  status: HTMLElement;
}

/**
 * Abre um áudio do computador, muda a velocidade do player na hora (prévia) e, quando
 * o usuário gosta do resultado, grava a faixa atual nessa velocidade.
 *
 * @example new SpeedPanel(elements, window.desktopBridge, player)
 */
export class SpeedPanel {
  constructor(
    private readonly elements: SpeedPanelElements,
    private readonly bridge: DesktopBridge,
    private readonly player: PlayerView,
  ) {
    configureSlider(elements.slider);
    elements.presets.replaceChildren(...SPEED_PRESETS.map(createPresetButton));
    elements.slider.addEventListener("input", () => this.applySpeed(elements.slider.valueAsNumber));
    elements.presets.addEventListener("click", (event) => this.handlePresetClick(event));
    elements.openAudioButton.addEventListener("click", () => void this.openAudio());
    elements.saveButton.addEventListener("click", () => void this.saveAtSpeed());
    this.applySpeed(1);
  }

  private applySpeed(speed: number): void {
    this.elements.slider.value = String(speed);
    this.elements.valueLabel.value = speedLabel(speed);
    this.player.setSpeed(speed);
    for (const button of this.elements.presets.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset["speed"]) === speed));
    }
  }

  private handlePresetClick(event: MouseEvent): void {
    const button = event.target instanceof Element ? event.target.closest("button[data-speed]") : null;
    const speed = Number(button?.getAttribute("data-speed"));
    if (Number.isFinite(speed) && speed > 0) this.applySpeed(speed);
  }

  private async openAudio(): Promise<void> {
    try {
      const track = await this.bridge.openAudioFile();
      if (track === undefined) return;
      this.player.addTrack(track);
      this.player.select(track);
      this.setStatus("");
    } catch (error) {
      this.setStatus(remoteErrorMessage(error), "error");
    }
  }

  private async saveAtSpeed(): Promise<void> {
    const track = this.player.currentTrack;
    if (track === undefined) return;
    this.elements.saveButton.disabled = true;
    this.setStatus("Escolha onde salvar…");
    const result = await this.requestExport(track.url, this.elements.slider.valueAsNumber);
    this.elements.saveButton.disabled = false;
    this.setStatus(describeSpeedExportResult(result) ?? "", result.status === "failed" ? "error" : "neutral");
    if (result.status === "saved") this.player.addTrack(result.track);
  }

  private async requestExport(trackUrl: string, speed: number): Promise<SpeedExportResult> {
    try {
      return await this.bridge.exportAtSpeed({ trackUrl, speed });
    } catch (error) {
      return { status: "failed", message: remoteErrorMessage(error) };
    }
  }

  private setStatus(text: string, tone: StatusTone = "neutral"): void {
    this.elements.status.textContent = text;
    this.elements.status.dataset["tone"] = tone;
  }
}

// Os limites vêm do mesmo módulo que valida a exportação: o slider nunca oferece o que o ffmpeg recusaria.
function configureSlider(slider: HTMLInputElement): void {
  slider.min = String(AUDIO_SPEED_LIMITS.min);
  slider.max = String(AUDIO_SPEED_LIMITS.max);
  slider.step = String(AUDIO_SPEED_LIMITS.step);
}

function createPresetButton(speed: number): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset["speed"] = String(speed);
  button.textContent = speedLabel(speed);
  return button;
}

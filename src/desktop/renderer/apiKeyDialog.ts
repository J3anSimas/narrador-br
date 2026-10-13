import type { DesktopBridge } from "../shared/desktopBridge.js";
import { remoteErrorMessage } from "./outputChoices.js";

export interface ApiKeyDialogElements {
  openButton: HTMLButtonElement;
  statusLabel: HTMLElement;
  dialog: HTMLDialogElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  error: HTMLElement;
  clearButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
}

/**
 * Diálogo para colar, trocar ou remover a chave da OpenAI; a chave nunca volta
 * para a janela depois de salva, só o fato de existir.
 *
 * @example await new ApiKeyDialog(elements, window.desktopBridge).refreshStatus()
 */
export class ApiKeyDialog {
  constructor(
    private readonly elements: ApiKeyDialogElements,
    private readonly bridge: DesktopBridge,
  ) {
    elements.openButton.addEventListener("click", () => this.open());
    elements.closeButton.addEventListener("click", () => elements.dialog.close());
    elements.form.addEventListener("submit", (event) => void this.save(event));
    elements.clearButton.addEventListener("click", () => void this.clear());
  }

  async refreshStatus(): Promise<boolean> {
    const configured = await this.bridge.hasApiKey();
    this.elements.openButton.dataset["configured"] = String(configured);
    this.elements.statusLabel.textContent = configured ? "Chave da OpenAI configurada" : "Configurar chave da OpenAI";
    this.elements.clearButton.hidden = !configured;
    return configured;
  }

  open(): void {
    this.elements.input.value = "";
    this.elements.error.textContent = "";
    this.elements.dialog.showModal();
  }

  private async save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    try {
      await this.bridge.saveApiKey(this.elements.input.value);
      this.elements.dialog.close();
      await this.refreshStatus();
    } catch (error) {
      this.elements.error.textContent = remoteErrorMessage(error);
    }
  }

  private async clear(): Promise<void> {
    await this.bridge.clearApiKey();
    await this.refreshStatus();
    this.elements.dialog.close();
  }
}

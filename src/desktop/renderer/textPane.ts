import { splitParagraphs } from "../../paragraphs/splitParagraphs.js";
import type { DesktopBridge } from "../shared/desktopBridge.js";
import { remoteErrorMessage } from "./outputChoices.js";
import { findOverlongParagraphs } from "./scriptProgress.js";
import { ScriptView } from "./scriptView.js";

export interface TextPaneElements {
  textarea: HTMLTextAreaElement;
  scriptList: HTMLOListElement;
  editTab: HTMLButtonElement;
  scriptTab: HTMLButtonElement;
  openFileButton: HTMLButtonElement;
  notice: HTMLElement;
}

export type TextPaneView = "edit" | "script";

// Espera a digitação parar antes de redesenhar o roteiro: textos longos têm centenas de parágrafos.
const RESPLIT_DELAY_MS = 250;

/**
 * Painel do texto: edição livre e o mesmo texto já dividido em parágrafos, com a
 * mesma regra da CLI (`splitParagraphs`).
 *
 * @example const pane = new TextPane(elements, bridge, (position) => player.playParagraph(position))
 */
export class TextPane {
  readonly script: ScriptView;
  private resplitTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly elements: TextPaneElements,
    private readonly bridge: DesktopBridge,
    onPlayParagraph: (position: number) => void,
  ) {
    this.script = new ScriptView(elements.scriptList, onPlayParagraph);
    elements.textarea.addEventListener("input", () => this.scheduleResplit());
    elements.editTab.addEventListener("click", () => this.showView("edit"));
    elements.scriptTab.addEventListener("click", () => this.showView("script"));
    elements.openFileButton.addEventListener("click", () => void this.openFile());
    this.resplit();
  }

  get text(): string {
    return this.elements.textarea.value;
  }

  /** Trava a edição durante a geração, para o roteiro na tela continuar igual ao que está sendo lido. */
  setLocked(locked: boolean): void {
    this.elements.textarea.readOnly = locked;
    this.elements.openFileButton.disabled = locked;
    if (locked) this.resplit();
  }

  showView(view: TextPaneView): void {
    this.elements.textarea.hidden = view !== "edit";
    this.elements.scriptList.hidden = view !== "script";
    this.elements.editTab.setAttribute("aria-selected", String(view === "edit"));
    this.elements.scriptTab.setAttribute("aria-selected", String(view === "script"));
  }

  private scheduleResplit(): void {
    clearTimeout(this.resplitTimer);
    this.resplitTimer = setTimeout(() => this.resplit(), RESPLIT_DELAY_MS);
  }

  private resplit(): void {
    clearTimeout(this.resplitTimer);
    const paragraphs = splitParagraphs(this.text);
    const overlong = findOverlongParagraphs(paragraphs);
    this.script.render(paragraphs, overlong);
    this.elements.scriptTab.textContent = `Parágrafos (${paragraphs.length})`;
    this.elements.notice.textContent = describeOverlong(overlong);
    this.elements.notice.hidden = overlong.length === 0;
  }

  private async openFile(): Promise<void> {
    try {
      const opened = await this.bridge.openTextFile();
      if (opened === undefined) return;
      this.elements.textarea.value = opened.text;
      this.resplit();
      this.showView("script");
    } catch (error) {
      this.elements.notice.textContent = remoteErrorMessage(error);
      this.elements.notice.hidden = false;
    }
  }
}

function describeOverlong(positions: readonly number[]): string {
  if (positions.length === 0) return "";
  const subject = positions.length === 1 ? `O parágrafo ${positions[0]} passa` : `Os parágrafos ${positions.join(", ")} passam`;
  return `${subject} do limite da OpenAI. Divida com uma linha em branco antes de gerar.`;
}

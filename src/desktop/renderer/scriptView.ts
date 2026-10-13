import { MAX_PARAGRAPH_LENGTH } from "../../speech/synthesizeParagraph.js";
import { paragraphStatus, type ScriptProgress } from "./scriptProgress.js";

/**
 * O texto como roteiro numerado: cada parágrafo mostra se já virou áudio, se está
 * sendo sintetizado e se está tocando agora.
 *
 * @example const view = new ScriptView(list, (position) => player.playParagraph(position))
 */
export class ScriptView {
  private items: HTMLLIElement[] = [];

  constructor(
    private readonly list: HTMLOListElement,
    private readonly onPlayParagraph: (position: number) => void,
  ) {
    list.addEventListener("click", (event) => this.handleClick(event));
  }

  render(paragraphs: readonly string[], overlongPositions: readonly number[]): void {
    this.items = paragraphs.map((text, index) =>
      createParagraphItem(text, index + 1, overlongPositions.includes(index + 1)),
    );
    this.list.replaceChildren(...this.items);
  }

  showProgress(progress: ScriptProgress): void {
    this.items.forEach((item, index) => {
      item.dataset["status"] = paragraphStatus(index, progress);
    });
  }

  /** Mostra o botão de ouvir no parágrafo cujo arquivo acabou de ser gravado. */
  markPlayable(position: number): void {
    const button = this.items[position - 1]?.querySelector("button");
    if (button !== null && button !== undefined) button.hidden = false;
  }

  showPlaying(position: number | undefined): void {
    this.items.forEach((item, index) => item.classList.toggle("is-playing", index + 1 === position));
    const playing = position === undefined ? undefined : this.items[position - 1];
    playing?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  private handleClick(event: MouseEvent): void {
    const button = event.target instanceof Element ? event.target.closest("button.script-play") : null;
    const position = Number(button?.closest("li")?.dataset["position"]);
    if (Number.isInteger(position) && position > 0) this.onPlayParagraph(position);
  }
}

function createParagraphItem(text: string, position: number, overlong: boolean): HTMLLIElement {
  const item = document.createElement("li");
  item.dataset["position"] = String(position);
  item.dataset["status"] = "pending";
  const body = document.createElement("p");
  body.textContent = text;
  item.append(createPlayButton(position), body);
  if (overlong) item.append(createOverlongNote(text.trim().length));
  return item;
}

function createPlayButton(position: number): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "script-play";
  button.hidden = true;
  button.setAttribute("aria-label", `Ouvir parágrafo ${position}`);
  button.textContent = "▶";
  return button;
}

function createOverlongNote(length: number): HTMLParagraphElement {
  const note = document.createElement("p");
  note.className = "script-warning";
  note.textContent = `${length} caracteres: a OpenAI aceita até ${MAX_PARAGRAPH_LENGTH}. Separe este trecho com uma linha em branco.`;
  return note;
}

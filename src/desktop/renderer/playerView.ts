import type { AudioTrack, DesktopBridge } from "../shared/desktopBridge.js";
import { remoteErrorMessage } from "./outputChoices.js";

export interface PlayerElements {
  audio: HTMLAudioElement;
  emptyNote: HTMLElement;
  trackList: HTMLUListElement;
  playAllButton: HTMLButtonElement;
  showInFolderButton: HTMLButtonElement;
  /** Controles de velocidade: só aparecem quando há algo para tocar. */
  speedControls: HTMLElement;
}

/**
 * Toca os áudios gerados: um de cada vez ou todos em sequência, avisando qual
 * parágrafo está tocando para o roteiro acompanhar.
 *
 * @example const player = new PlayerView(elements, bridge, (position) => script.showPlaying(position))
 */
export class PlayerView {
  private tracks: AudioTrack[] = [];
  private current: AudioTrack | undefined;
  private playingAll = false;

  constructor(
    private readonly elements: PlayerElements,
    private readonly bridge: DesktopBridge,
    private readonly onPlayingParagraphChange: (position: number | undefined) => void,
  ) {
    // Explícito porque é o que faz a prévia soar como o arquivo exportado (o atempo também mantém o tom).
    elements.audio.preservesPitch = true;
    elements.audio.addEventListener("ended", () => this.playNextOrStop());
    elements.playAllButton.addEventListener("click", () => this.playAll());
    elements.showInFolderButton.addEventListener("click", () => void this.showCurrentInFolder());
    elements.trackList.addEventListener("click", (event) => this.handleTrackClick(event));
  }

  get currentTrack(): AudioTrack | undefined {
    return this.current;
  }

  /** Muda a velocidade na hora; `defaultPlaybackRate` mantém a escolha ao trocar de faixa. */
  setSpeed(speed: number): void {
    this.elements.audio.defaultPlaybackRate = speed;
    this.elements.audio.playbackRate = speed;
  }

  /** Deixa a faixa pronta no player, sem tocar. */
  select(track: AudioTrack): void {
    this.playingAll = false;
    this.load(track);
    this.onPlayingParagraphChange(undefined);
  }

  clear(): void {
    this.elements.audio.pause();
    this.elements.audio.removeAttribute("src");
    this.tracks = [];
    this.current = undefined;
    this.elements.trackList.replaceChildren();
    this.syncVisibility();
    this.onPlayingParagraphChange(undefined);
  }

  addTrack(track: AudioTrack): void {
    this.tracks.push(track);
    this.elements.trackList.append(createTrackItem(track, this.tracks.length - 1));
    if (this.current === undefined) this.load(track);
    this.syncVisibility();
  }

  playParagraph(position: number): void {
    const track = this.tracks.find((candidate) => candidate.paragraphPosition === position);
    if (track === undefined) return;
    this.playingAll = false;
    this.play(track);
  }

  private playAll(): void {
    const first = this.tracks[0];
    if (first === undefined) return;
    this.playingAll = true;
    this.play(first);
  }

  private playNextOrStop(): void {
    const next = this.current === undefined ? undefined : this.tracks[this.tracks.indexOf(this.current) + 1];
    if (this.playingAll && next !== undefined) {
      this.play(next);
      return;
    }
    this.playingAll = false;
    this.onPlayingParagraphChange(undefined);
  }

  private play(track: AudioTrack): void {
    this.load(track);
    void this.elements.audio.play();
    this.onPlayingParagraphChange(track.paragraphPosition);
  }

  private load(track: AudioTrack): void {
    this.current = track;
    this.elements.audio.src = track.url;
    for (const item of this.elements.trackList.children) {
      item.classList.toggle("is-current", item.getAttribute("data-url") === track.url);
    }
  }

  private handleTrackClick(event: MouseEvent): void {
    const button = event.target instanceof Element ? event.target.closest("button[data-index]") : null;
    const track = this.tracks[Number(button?.getAttribute("data-index"))];
    if (track === undefined) return;
    this.playingAll = false;
    this.play(track);
  }

  private async showCurrentInFolder(): Promise<void> {
    if (this.current === undefined) return;
    try {
      await this.bridge.showInFolder(this.current.url);
    } catch (error) {
      this.elements.emptyNote.textContent = remoteErrorMessage(error);
      this.elements.emptyNote.hidden = false;
    }
  }

  private syncVisibility(): void {
    const hasTracks = this.tracks.length > 0;
    this.elements.emptyNote.hidden = hasTracks;
    this.elements.audio.hidden = !hasTracks;
    this.elements.showInFolderButton.hidden = !hasTracks;
    this.elements.speedControls.hidden = !hasTracks;
    this.elements.playAllButton.hidden = this.tracks.length < 2;
  }
}

function createTrackItem(track: AudioTrack, index: number): HTMLLIElement {
  const item = document.createElement("li");
  item.dataset["url"] = track.url;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset["index"] = String(index);
  button.textContent = track.paragraphPosition === undefined ? fileName(track.path) : `Parágrafo ${track.paragraphPosition}`;
  button.title = track.path;
  item.append(button);
  return item;
}

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

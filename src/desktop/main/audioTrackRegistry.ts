export const AUDIO_TRACK_SCHEME = "tts-audio";

const TRACK_URL = /^tts-audio:\/\/track\/(\d+)$/;

/**
 * Lista dos áudios que a janela pode tocar. A janela só recebe URLs com um número,
 * nunca caminhos: assim o protocolo não serve arquivos arbitrários do disco.
 *
 * @example registry.register("C:/aula.mp3") // "tts-audio://track/1"
 */
export class AudioTrackRegistry {
  private readonly pathsById = new Map<string, string>();
  private nextId = 1;

  /** Cada registro gera uma URL nova, então regravar o mesmo arquivo não toca a versão em cache. */
  register(path: string): string {
    const id = String(this.nextId++);
    this.pathsById.set(id, path);
    return `${AUDIO_TRACK_SCHEME}://track/${id}`;
  }

  pathFor(url: string): string | undefined {
    const id = TRACK_URL.exec(url)?.[1];
    return id === undefined ? undefined : this.pathsById.get(id);
  }
}

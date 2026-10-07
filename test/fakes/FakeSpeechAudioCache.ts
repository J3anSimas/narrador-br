import type { SpeechAudioCache } from "../../src/speech/speechAudioCache.js";

/** Cache de áudio em memória, no lugar da pasta de progresso em disco. */
export class FakeSpeechAudioCache implements SpeechAudioCache {
  readonly audioByKey = new Map<string, Uint8Array>();
  cleared = false;

  async read(key: string): Promise<Uint8Array | undefined> {
    return this.audioByKey.get(key);
  }

  async write(key: string, audio: Uint8Array): Promise<void> {
    this.audioByKey.set(key, audio);
  }

  async clear(): Promise<void> {
    this.audioByKey.clear();
    this.cleared = true;
  }
}

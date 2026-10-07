import type { Mp3Encoder } from "../../src/audio/mp3Encoder.js";

/** Encoder em memória: registra os WAVs recebidos e devolve um "MP3" fixo, sem ffmpeg. */
export class FakeMp3Encoder implements Mp3Encoder {
  readonly receivedWavs: Uint8Array[] = [];

  constructor(private readonly mp3: Uint8Array = new Uint8Array([0xff, 0xfb])) {}

  async encodeWavToMp3(wav: Uint8Array): Promise<Uint8Array> {
    this.receivedWavs.push(wav);
    return this.mp3;
  }
}

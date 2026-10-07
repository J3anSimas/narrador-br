import type { Mp3Encoder } from "../../src/audio/mp3Encoder.js";

/** Encoder que sempre falha, como o ffmpeg ausente ou quebrado. */
export class FailingMp3Encoder implements Mp3Encoder {
  constructor(private readonly message: string) {}

  async encodeWavToMp3(): Promise<Uint8Array> {
    throw new Error(this.message);
  }
}

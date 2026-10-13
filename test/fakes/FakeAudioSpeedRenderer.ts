import type { AudioSpeedRenderer, AudioSpeedRenderRequest } from "../../src/audio/audioSpeedRenderer.js";

/** Registra os pedidos sem chamar o ffmpeg; com `failure`, falha como um ffmpeg quebrado. */
export class FakeAudioSpeedRenderer implements AudioSpeedRenderer {
  readonly requests: AudioSpeedRenderRequest[] = [];

  constructor(private readonly failure?: Error) {}

  async renderAtSpeed(request: AudioSpeedRenderRequest): Promise<void> {
    this.requests.push(request);
    if (this.failure !== undefined) throw this.failure;
  }
}

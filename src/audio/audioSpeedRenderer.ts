/** Pedido de regravar um áudio em outra velocidade. */
export interface AudioSpeedRenderRequest {
  inputPath: string;
  /** Formato pela extensão: .mp3 ou .wav. */
  outputPath: string;
  speed: number;
}

/** Grava um áudio acelerado (ou desacelerado); isola o ffmpeg para testes. */
export interface AudioSpeedRenderer {
  renderAtSpeed(request: AudioSpeedRenderRequest): Promise<void>;
}

/** Converte WAV em MP3; isola o encoder externo (ffmpeg) para testes. */
export interface Mp3Encoder {
  encodeWavToMp3(wav: Uint8Array): Promise<Uint8Array>;
}

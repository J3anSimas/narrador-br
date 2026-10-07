/** Destino dos arquivos de áudio gerados; isola o acesso a disco para testes. */
export interface AudioFileWriter {
  writeAudioFile(path: string, audio: Uint8Array): Promise<void>;
}

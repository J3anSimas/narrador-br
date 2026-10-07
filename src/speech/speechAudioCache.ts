/** Armazena áudios já sintetizados, para que uma execução interrompida possa ser retomada. */
export interface SpeechAudioCache {
  read(key: string): Promise<Uint8Array | undefined>;
  write(key: string, audio: Uint8Array): Promise<void>;
  clear(): Promise<void>;
}

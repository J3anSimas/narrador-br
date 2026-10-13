import type { Mp3Encoder } from "../audio/mp3Encoder.js";
import type { AudioFileWriter } from "../output/audioFileWriter.js";
import type { SpeechApi } from "../speech/speechApi.js";
import type { SpeechAudioCache } from "../speech/speechAudioCache.js";

/** Pedido de gerar um arquivo de áudio por parágrafo dentro de `outputDir`. */
export interface AudioOutputRequest {
  outputDir: string;
  voice?: string;
}

/** Pedido de gerar um único áudio (WAV ou MP3, pela extensão) com todos os parágrafos. */
export interface AudioFileRequest {
  outputPath: string;
  voice?: string;
}

/** Dependências de I/O das gerações de áudio, compartilhadas pela CLI e pela interface desktop. */
export interface AudioJobDependencies {
  // Fábrica em vez de instância: o cliente da OpenAI exige a chave ao ser criado,
  // e o modo texto precisa funcionar sem ela.
  createSpeechApi: () => SpeechApi;
  writer: AudioFileWriter;
  /** Só usado com áudio único *.mp3; sem ele, só WAV funciona. */
  mp3Encoder?: Mp3Encoder;
  /** Cria o cache de progresso do áudio único; sem ele, uma queda perde tudo o que já foi sintetizado. */
  createSpeechCache?: (directory: string) => SpeechAudioCache;
}

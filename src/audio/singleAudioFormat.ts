/** Formatos aceitos por --audio-file: WAV sai direto; MP3 passa por um encoder externo. */
export const SINGLE_AUDIO_FORMATS = ["wav", "mp3"] as const;
export type SingleAudioFormat = (typeof SINGLE_AUDIO_FORMATS)[number];

/**
 * Deduz o formato do áudio único pela extensão do caminho, sem diferenciar maiúsculas.
 *
 * @example singleAudioFormatFromPath("aula.MP3") // "mp3"
 */
export function singleAudioFormatFromPath(path: string): SingleAudioFormat | undefined {
  const lowerPath = path.toLowerCase();
  return SINGLE_AUDIO_FORMATS.find((format) => lowerPath.endsWith(`.${format}`));
}

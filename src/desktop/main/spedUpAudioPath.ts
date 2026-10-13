import { formatSpeedNumber } from "../../audio/audioSpeed.js";

/**
 * Sugestão de nome para o áudio acelerado, ao lado do original. Mantém WAV se o original
 * for WAV; qualquer outro formato vira MP3 (a exportação só grava esses dois).
 *
 * @example spedUpAudioPath("C:\\aulas\\aula.m4a", 1.5) // "C:\\aulas\\aula (1,5x).mp3"
 */
export function spedUpAudioPath(sourcePath: string, speed: number): string {
  const extension = /\.wav$/i.test(sourcePath) ? "wav" : "mp3";
  const withoutExtension = sourcePath.replace(/\.[^.\\/]+$/, "");
  return `${withoutExtension} (${formatSpeedNumber(speed)}x).${extension}`;
}

export interface PcmFormat {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

const WAV_HEADER_SIZE = 44;

/**
 * Envolve amostras PCM cruas num arquivo WAV (cabeçalho RIFF canônico de 44 bytes).
 *
 * @example encodeWav(pcmBytes, api.pcmFormat) // bytes prontos para gravar em .wav
 */
export function encodeWav(pcm: Uint8Array, format: PcmFormat): Uint8Array {
  const wav = new Uint8Array(WAV_HEADER_SIZE + pcm.length);
  writeWavHeader(new DataView(wav.buffer), pcm.length, format);
  wav.set(pcm, WAV_HEADER_SIZE);
  return wav;
}

function writeWavHeader(view: DataView, dataSize: number, format: PcmFormat): void {
  const blockAlign = format.channels * (format.bitsPerSample / 8);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, WAV_HEADER_SIZE - 8 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // tamanho do bloco fmt para PCM
  view.setUint16(20, 1, true); // 1 = PCM sem compressão
  view.setUint16(22, format.channels, true);
  view.setUint32(24, format.sampleRate, true);
  view.setUint32(28, format.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, format.bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);
}

function writeAscii(view: DataView, offset: number, text: string): void {
  [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
}

/**
 * Gera silêncio PCM (amostras zeradas) com a duração pedida.
 *
 * @example createPcmSilence(500, { sampleRate: 24_000, channels: 1, bitsPerSample: 16 }).length // 24000 bytes
 */
export function createPcmSilence(durationMs: number, format: PcmFormat): Uint8Array {
  const blockAlign = format.channels * (format.bitsPerSample / 8);
  const frames = Math.round((format.sampleRate * durationMs) / 1000);
  return new Uint8Array(frames * blockAlign);
}

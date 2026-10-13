/**
 * Faixa de velocidades do controle e da exportação. Abaixo de 0,5× e acima de 4× o Chromium
 * silencia o `<audio>`, então a prévia não seria fiel; 3× já cobre aula acelerada.
 */
export const AUDIO_SPEED_LIMITS = { min: 0.5, max: 3, step: 0.05 } as const;

// Acima de 2, o atempo do ffmpeg descarta amostras em vez de misturá-las (ver doc do filtro):
// encadear fatores de até 2 soa melhor que um fator só.
const ATEMPO_MAX_FACTOR = 2;

/**
 * Falha se a velocidade estiver fora de `AUDIO_SPEED_LIMITS`.
 *
 * @example assertAudioSpeed(1.5) // ok; assertAudioSpeed(10) lança
 */
export function assertAudioSpeed(speed: number): void {
  if (Number.isFinite(speed) && speed >= AUDIO_SPEED_LIMITS.min && speed <= AUDIO_SPEED_LIMITS.max) return;
  throw new Error(
    `Velocidade inválida: ${speed} (esperado: número entre ${AUDIO_SPEED_LIMITS.min} e ${AUDIO_SPEED_LIMITS.max}).`,
  );
}

/**
 * Filtro do ffmpeg que muda a velocidade sem mudar o tom da voz.
 *
 * @example buildAtempoFilter(3) // "atempo=2,atempo=1.5"
 */
export function buildAtempoFilter(speed: number): string {
  assertAudioSpeed(speed);
  const factors: number[] = [];
  let remaining = speed;
  while (remaining > ATEMPO_MAX_FACTOR) {
    factors.push(ATEMPO_MAX_FACTOR);
    remaining /= ATEMPO_MAX_FACTOR;
  }
  factors.push(remaining);
  return factors.map((factor) => `atempo=${roundSpeed(factor, 6)}`).join(",");
}

/**
 * Velocidade no jeito brasileiro, sem zeros sobrando, para rótulos e nomes de arquivo.
 *
 * @example formatSpeedNumber(1.5) // "1,5"
 */
export function formatSpeedNumber(speed: number): string {
  return String(roundSpeed(speed, 2)).replace(".", ",");
}

// Limpa o resíduo de ponto flutuante (1.2500000001) que o slider e as divisões deixam.
function roundSpeed(speed: number, digits: number): number {
  return Number(speed.toFixed(digits));
}

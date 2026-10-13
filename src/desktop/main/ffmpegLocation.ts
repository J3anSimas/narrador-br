/**
 * Caminho do ffmpeg embutido, corrigido para fora do `app.asar`: o Windows não executa
 * binários de dentro do arquivo compactado, e o electron-builder os copia para
 * `app.asar.unpacked` (ver `asarUnpack` em electron-builder.json). Sem caminho, usa o do PATH.
 *
 * @example resolveFfmpegPath("C:/App/resources/app.asar/node_modules/ffmpeg-static/ffmpeg.exe")
 * // "C:/App/resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg.exe"
 */
export function resolveFfmpegPath(bundledPath: string | null): string {
  if (bundledPath === null) return "ffmpeg";
  return bundledPath.replace(/app\.asar([\\/])/, "app.asar.unpacked$1");
}

/**
 * O que acontece durante uma geração de áudio. A CLI transforma em linhas de texto;
 * a interface desktop, em barra de progresso e lista de arquivos.
 */
export type AudioJobEvent =
  | { kind: "progressSaved"; directory: string }
  | { kind: "paragraphSynthesized"; position: number; total: number }
  | { kind: "audioFileWritten"; path: string; position: number; total: number }
  | { kind: "paragraphsReused"; count: number }
  | { kind: "audioSaved"; path: string };

export type AudioJobListener = (event: AudioJobEvent) => void;

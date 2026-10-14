/**
 * Uma linha de texto de uma página de PDF, com a posição em pontos
 * (origem no canto inferior esquerdo, como no próprio PDF: `y` cresce para cima).
 */
export interface PdfTextLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Linhas de uma página, na ordem de leitura em que o PDF as entrega. */
export type PdfPage = readonly PdfTextLine[];

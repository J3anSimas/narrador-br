export type OutputFormat = "text" | "json";

export const OUTPUT_FORMATS: readonly OutputFormat[] = ["text", "json"];

/**
 * Serializa os parágrafos para a saída da CLI.
 * `text`: um parágrafo por bloco, separados por linha em branco.
 * `json`: lista de `{ index, text }`, com índice começando em 1.
 *
 * @example formatParagraphs(["A.", "B."], "text") // "A.\n\nB.\n"
 */
export function formatParagraphs(paragraphs: readonly string[], format: OutputFormat): string {
  if (format === "json") {
    const entries = paragraphs.map((text, position) => ({ index: position + 1, text }));
    return `${JSON.stringify(entries, null, 2)}\n`;
  }
  return paragraphs.length === 0 ? "" : `${paragraphs.join("\n\n")}\n`;
}

/**
 * Fronteira com a LLM que adapta um parágrafo longo ao limite da API de fala;
 * isola o SDK para que a lógica de ajuste seja testada sem rede.
 */
export interface TextRewriter {
  /** Modelo usado, para os avisos de reescrita. */
  readonly model: string;
  /**
   * Devolve o texto como um ou mais parágrafos, condensado e/ou quebrado em partes,
   * mirando no máximo `maxLength` caracteres por parte (a LLM pode errar a conta).
   */
  fitToLength(text: string, maxLength: number): Promise<string[]>;
}

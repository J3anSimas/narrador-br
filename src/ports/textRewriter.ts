/**
 * Porta da LLM que adapta um parágrafo longo ao limite da API de fala; o domínio
 * só conhece esta interface, e a lógica de ajuste é testada sem rede.
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

/**
 * A LLM respondeu, mas fora do formato pedido; vale como tentativa falha, não como erro fatal.
 * Faz parte do contrato da porta: todo adaptador lança este erro nesse caso.
 */
export class UnexpectedRewriteResponseError extends Error {
  override readonly name = "UnexpectedRewriteResponseError";
}

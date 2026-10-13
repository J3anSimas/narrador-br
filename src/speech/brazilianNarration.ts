/**
 * Instruções de estilo enviadas ao `gpt-4o-mini-tts` em todo pedido.
 *
 * Sem elas, o modelo deduz o idioma pelo texto: nos trechos com termos técnicos em inglês
 * ele troca para pronúncia/entonação americana e a narração em português fica com sotaque.
 * Escritas em português porque instruções no idioma-alvo puxam o modelo para ele.
 *
 * @example synthesizeParagraph("Fiz o deploy da API.", api, { instructions: BRAZILIAN_NARRATION_INSTRUCTIONS })
 */
export const BRAZILIAN_NARRATION_INSTRUCTIONS = [
  "Narre em português do Brasil, com sotaque brasileiro natural do começo ao fim de cada frase.",
  "O texto mistura termos técnicos em inglês (como deploy, framework, backend, pipeline, machine learning):",
  "pronuncie-os como um profissional de tecnologia brasileiro falaria numa conversa de trabalho,",
  "sem trocar para sotaque americano e sem mudar a entonação ou o ritmo da frase ao redor.",
  "Leia siglas como é costume no Brasil (TI como 'tê-í', API como 'a-pê-í').",
  "Tom didático, claro e calmo, com ritmo constante.",
].join(" ");

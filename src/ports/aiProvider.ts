import type { SpeechApi } from "./speechApi.js";
import type { TextRewriter } from "./textRewriter.js";

/**
 * Tudo o que a aplicação usa de IA (fala e LLM), vindo de um provedor só.
 * Os dados ficam disponíveis sem credencial; as fábricas podem exigi-la, e por isso
 * só são chamadas quando há áudio a gerar ou parágrafo longo a reescrever.
 *
 * @example createOpenAiProvider(process.env)
 */
export interface AiProvider {
  /** Nome mostrado na ajuda, ex.: "OpenAI". */
  readonly name: string;
  /** O que configurar para usar o provedor, ex.: "OPENAI_API_KEY no .env". */
  readonly setupHint: string;
  readonly speech: SpeechProvider;
  /** Sem LLM, parágrafos acima do limite da fala são divididos nos fins de frase. */
  readonly rewrite?: RewriteProvider;
}

export interface SpeechProvider {
  /** Mesmo valor de `SpeechApi#maxInputLength`, sem precisar criar a API. */
  readonly maxInputLength: number;
  readonly defaultVoice: string;
  create(): SpeechApi;
}

export interface RewriteProvider {
  readonly defaultModel: string;
  /** Sem `model`, usa `defaultModel`. */
  create(model: string | undefined): TextRewriter;
}

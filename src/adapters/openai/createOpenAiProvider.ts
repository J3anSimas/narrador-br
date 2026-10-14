import OpenAI from "openai";
import type { AiProvider } from "../../ports/aiProvider.js";
import { DEFAULT_VOICE, OPENAI_SPEECH_MAX_INPUT_LENGTH, OpenAiSpeechApi } from "./openAiSpeechApi.js";
import { DEFAULT_REWRITE_MODEL, OpenAiTextRewriter } from "./openAiTextRewriter.js";
import { requireOpenAiApiKey } from "./requireOpenAiApiKey.js";

/**
 * Monta o provedor de IA da OpenAI a partir das variáveis de ambiente. A chave só é
 * exigida quando a fala ou a LLM é criada: o modo texto com parágrafos curtos funciona sem ela.
 *
 * @example await runCli(argv, { ai: createOpenAiProvider(process.env), ... })
 */
export function createOpenAiProvider(env: Readonly<Record<string, string | undefined>>): AiProvider {
  return {
    name: "OpenAI",
    setupHint: "OPENAI_API_KEY no .env",
    speech: {
      maxInputLength: OPENAI_SPEECH_MAX_INPUT_LENGTH,
      defaultVoice: DEFAULT_VOICE,
      create: () => new OpenAiSpeechApi(createClient(env).audio.speech),
    },
    rewrite: {
      defaultModel: DEFAULT_REWRITE_MODEL,
      create: (model) => new OpenAiTextRewriter(createClient(env).responses, model),
    },
  };
}

function createClient(env: Readonly<Record<string, string | undefined>>): OpenAI {
  // Textos longos somam centenas de chamadas; o padrão do SDK (2 novas tentativas) é pouco
  // para atravessar um 429 ou 5xx passageiro sem abortar a execução.
  return new OpenAI({ apiKey: requireOpenAiApiKey(env), maxRetries: 5 });
}

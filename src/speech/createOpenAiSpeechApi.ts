import OpenAI from "openai";
import { requireOpenAiApiKey } from "../openai/requireOpenAiApiKey.js";
import { OpenAiSpeechApi } from "./openAiSpeechApi.js";

/**
 * Monta a `SpeechApi` real a partir das variáveis de ambiente.
 *
 * @example createOpenAiSpeechApi(process.env)
 */
export function createOpenAiSpeechApi(env: Readonly<Record<string, string | undefined>>): OpenAiSpeechApi {
  // Textos longos somam centenas de chamadas; o padrão do SDK (2 novas tentativas) é pouco
  // para atravessar um 429 ou 5xx passageiro sem abortar a execução.
  return new OpenAiSpeechApi(new OpenAI({ apiKey: requireOpenAiApiKey(env), maxRetries: 5 }).audio.speech);
}

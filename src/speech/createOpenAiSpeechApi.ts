import OpenAI from "openai";
import { OpenAiSpeechApi } from "./openAiSpeechApi.js";

/**
 * Monta a `SpeechApi` real a partir das variáveis de ambiente, com uma mensagem
 * que aponta para o `.env` quando a chave falta (a do SDK não menciona o arquivo).
 *
 * @example createOpenAiSpeechApi(process.env)
 */
export function createOpenAiSpeechApi(env: Readonly<Record<string, string | undefined>>): OpenAiSpeechApi {
  const apiKey = env["OPENAI_API_KEY"]?.trim();
  if (apiKey === undefined || apiKey.length === 0) {
    throw new Error(
      `OPENAI_API_KEY ausente ou vazia (recebido: "${apiKey ?? ""}"; esperado: OPENAI_API_KEY=sk-... no .env).`,
    );
  }
  // Textos longos somam centenas de chamadas; o padrão do SDK (2 novas tentativas) é pouco
  // para atravessar um 429 ou 5xx passageiro sem abortar a execução.
  return new OpenAiSpeechApi(new OpenAI({ apiKey, maxRetries: 5 }).audio.speech);
}

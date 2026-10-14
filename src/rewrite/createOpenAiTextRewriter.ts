import OpenAI from "openai";
import { requireOpenAiApiKey } from "../openai/requireOpenAiApiKey.js";
import { OpenAiTextRewriter } from "./openAiTextRewriter.js";

/**
 * Monta o `TextRewriter` real a partir das variáveis de ambiente.
 *
 * @example createOpenAiTextRewriter(process.env, "gpt-5.4-mini")
 */
export function createOpenAiTextRewriter(
  env: Readonly<Record<string, string | undefined>>,
  model?: string,
): OpenAiTextRewriter {
  const client = new OpenAI({ apiKey: requireOpenAiApiKey(env), maxRetries: 5 });
  return new OpenAiTextRewriter(client.responses, model);
}

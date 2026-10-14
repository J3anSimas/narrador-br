/**
 * Lê a chave da OpenAI do ambiente, com uma mensagem que aponta para o `.env`
 * quando ela falta (a do SDK não menciona o arquivo).
 *
 * @example new OpenAI({ apiKey: requireOpenAiApiKey(process.env) })
 */
export function requireOpenAiApiKey(env: Readonly<Record<string, string | undefined>>): string {
  const apiKey = env["OPENAI_API_KEY"]?.trim();
  if (apiKey === undefined || apiKey.length === 0) {
    throw new Error(
      `OPENAI_API_KEY ausente ou vazia (recebido: "${apiKey ?? ""}"; esperado: OPENAI_API_KEY=sk-... no .env).`,
    );
  }
  return apiKey;
}

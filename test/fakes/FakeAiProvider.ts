import type { AiProvider } from "../../src/ports/aiProvider.js";
import type { SpeechApi } from "../../src/ports/speechApi.js";
import type { TextRewriter } from "../../src/ports/textRewriter.js";
import { FAKE_MAX_INPUT_LENGTH, FakeSpeechApi } from "./FakeSpeechApi.js";

export interface FakeAiProviderOptions {
  createSpeechApi?: () => SpeechApi;
  /** Sem ela, o provedor não tem LLM. */
  createTextRewriter?: (model: string | undefined) => TextRewriter;
}

/** Provedor de IA para os testes da CLI: cada fábrica é trocável, nenhuma usa rede. */
export function fakeAiProvider(options: FakeAiProviderOptions = {}): AiProvider {
  const { createSpeechApi = () => new FakeSpeechApi(), createTextRewriter } = options;
  return {
    name: "Provedor Falso",
    setupHint: "FAKE_KEY no .env",
    speech: { maxInputLength: FAKE_MAX_INPUT_LENGTH, defaultVoice: "voz-falsa", create: createSpeechApi },
    ...(createTextRewriter && { rewrite: { defaultModel: "modelo-falso", create: createTextRewriter } }),
  };
}

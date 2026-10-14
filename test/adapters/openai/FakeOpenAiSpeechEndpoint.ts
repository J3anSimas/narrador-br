import type { SpeechCreateParams } from "openai/resources/audio/speech";
import type { OpenAiSpeechEndpoint } from "../../../src/adapters/openai/openAiSpeechApi.js";

/** Substitui `OpenAI#audio.speech`: guarda os corpos enviados e responde com bytes fixos. */
export class FakeOpenAiSpeechEndpoint implements OpenAiSpeechEndpoint {
  readonly bodies: SpeechCreateParams[] = [];

  // `Response` só aceita bytes sobre `ArrayBuffer`, não `SharedArrayBuffer`.
  constructor(private readonly audio: Uint8Array<ArrayBuffer>) {}

  async create(body: SpeechCreateParams): Promise<Response> {
    this.bodies.push(body);
    return new Response(this.audio);
  }
}

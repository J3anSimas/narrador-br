import type { SpeechCreateParams } from "openai/resources/audio/speech";
import type { SpeechApi, SpeechRequest } from "./speechApi.js";

/** Recorte de `OpenAI#audio.speech` usado aqui; permite trocar o SDK por um fake. */
export interface OpenAiSpeechEndpoint {
  create(body: SpeechCreateParams): Promise<Response>;
}

/**
 * Implementação de `SpeechApi` sobre o SDK oficial da OpenAI.
 *
 * @example new OpenAiSpeechApi(new OpenAI().audio.speech) // lê OPENAI_API_KEY do ambiente
 */
export class OpenAiSpeechApi implements SpeechApi {
  constructor(private readonly endpoint: OpenAiSpeechEndpoint) {}

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    const response = await this.endpoint.create(toSpeechCreateParams(request));
    return new Uint8Array(await response.arrayBuffer());
  }
}

function toSpeechCreateParams(request: SpeechRequest): SpeechCreateParams {
  return {
    input: request.text,
    model: request.model,
    voice: request.voice,
    response_format: request.format,
    ...(request.instructions !== undefined && { instructions: request.instructions }),
  };
}

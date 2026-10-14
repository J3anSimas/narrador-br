import type { SpeechCreateParams } from "openai/resources/audio/speech";
import type { PcmFormat } from "../../audio/wav.js";
import type { SpeechApi, SpeechRequest } from "../../ports/speechApi.js";

/** Limite de caracteres do campo `input` em `POST /v1/audio/speech`. */
export const OPENAI_SPEECH_MAX_INPUT_LENGTH = 4096;

/** Formato do `response_format: "pcm"` da OpenAI: 24 kHz, 16 bits com sinal, little-endian, mono. */
export const OPENAI_PCM_FORMAT: PcmFormat = { sampleRate: 24_000, channels: 1, bitsPerSample: 16 };

export const DEFAULT_SPEECH_MODEL = "gpt-4o-mini-tts";

// "marin" e "cedar" são as vozes de melhor qualidade segundo o guia de TTS da OpenAI.
export const DEFAULT_VOICE = "marin";

/** Recorte de `OpenAI#audio.speech` usado aqui; permite trocar o SDK por um fake. */
export interface OpenAiSpeechEndpoint {
  create(body: SpeechCreateParams): Promise<Response>;
}

/**
 * Adaptador da porta `SpeechApi` sobre o SDK oficial da OpenAI.
 *
 * @example new OpenAiSpeechApi(new OpenAI().audio.speech) // lê OPENAI_API_KEY do ambiente
 */
export class OpenAiSpeechApi implements SpeechApi {
  readonly maxInputLength = OPENAI_SPEECH_MAX_INPUT_LENGTH;
  readonly pcmFormat = OPENAI_PCM_FORMAT;

  constructor(
    private readonly endpoint: OpenAiSpeechEndpoint,
    readonly model: string = DEFAULT_SPEECH_MODEL,
  ) {}

  async createSpeech(request: SpeechRequest): Promise<Uint8Array> {
    const response = await this.endpoint.create(this.toSpeechCreateParams(request));
    return new Uint8Array(await response.arrayBuffer());
  }

  private toSpeechCreateParams(request: SpeechRequest): SpeechCreateParams {
    return {
      input: request.text,
      model: this.model,
      voice: request.voice ?? DEFAULT_VOICE,
      response_format: request.format,
      ...(request.instructions !== undefined && { instructions: request.instructions }),
    };
  }
}

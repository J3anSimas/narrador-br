export { splitParagraphs } from "./paragraphs/splitParagraphs.js";
export { fitParagraphsToLimit } from "./paragraphs/fitParagraphsToLimit.js";
export { fitParagraphsWithRewriter, type RewriteDependencies, type RewriteEvent } from "./rewrite/fitParagraphsWithRewriter.js";
export { formatParagraphs, type OutputFormat } from "./output/formatParagraphs.js";
export { readInputText, type InputRequest, type TextInputSource } from "./input/textInputSource.js";
export { NodeTextInputSource } from "./input/nodeTextInputSource.js";
export { extractPdfLines } from "./pdf/extractPdfLines.js";
export { pdfPagesToText } from "./pdf/pdfPagesToText.js";
export { type PdfPage, type PdfTextLine } from "./pdf/pdfTextLine.js";
export { synthesizeParagraph, DEFAULT_AUDIO_FORMAT, type SpeechOptions } from "./speech/synthesizeParagraph.js";
export { synthesizeParagraphs, type AudioBatchDependencies } from "./speech/synthesizeParagraphs.js";
export {
  synthesizeParagraphsToWav,
  DEFAULT_PARAGRAPH_PAUSE_MS,
  type SingleAudioDependencies,
  type SingleAudioOptions,
} from "./speech/synthesizeParagraphsToWav.js";
export { encodeWav, type PcmFormat } from "./audio/wav.js";
export { type AudioFileWriter } from "./output/audioFileWriter.js";
export { NodeAudioFileWriter } from "./output/nodeAudioFileWriter.js";
export { type Mp3Encoder } from "./audio/mp3Encoder.js";
export { FfmpegMp3Encoder } from "./audio/ffmpegMp3Encoder.js";
export { CachingSpeechApi, speechCacheKey } from "./speech/cachingSpeechApi.js";
export { type SpeechAudioCache } from "./speech/speechAudioCache.js";
export { NodeSpeechAudioCache } from "./output/nodeSpeechAudioCache.js";

// Portas de IA: o domínio só depende delas.
export { type AiProvider, type RewriteProvider, type SpeechProvider } from "./ports/aiProvider.js";
export { AUDIO_FORMATS, type AudioFormat, type SpeechApi, type SpeechRequest } from "./ports/speechApi.js";
export { UnexpectedRewriteResponseError, type TextRewriter } from "./ports/textRewriter.js";

// Adaptador da OpenAI.
export { createOpenAiProvider } from "./adapters/openai/createOpenAiProvider.js";
export {
  OpenAiSpeechApi,
  DEFAULT_SPEECH_MODEL,
  DEFAULT_VOICE,
  OPENAI_PCM_FORMAT,
  OPENAI_SPEECH_MAX_INPUT_LENGTH,
  type OpenAiSpeechEndpoint,
} from "./adapters/openai/openAiSpeechApi.js";
export {
  OpenAiTextRewriter,
  DEFAULT_REWRITE_MODEL,
  type OpenAiResponsesEndpoint,
} from "./adapters/openai/openAiTextRewriter.js";

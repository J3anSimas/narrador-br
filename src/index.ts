export { splitParagraphs } from "./paragraphs/splitParagraphs.js";
export { formatParagraphs, type OutputFormat } from "./output/formatParagraphs.js";
export { readInputText, type InputRequest, type TextInputSource } from "./input/textInputSource.js";
export { NodeTextInputSource } from "./input/nodeTextInputSource.js";
export { synthesizeParagraph, MAX_PARAGRAPH_LENGTH, type SpeechOptions } from "./speech/synthesizeParagraph.js";
export { AUDIO_FORMATS, type AudioFormat, type SpeechApi, type SpeechRequest } from "./speech/speechApi.js";
export { OpenAiSpeechApi, type OpenAiSpeechEndpoint } from "./speech/openAiSpeechApi.js";
export { createOpenAiSpeechApi } from "./speech/createOpenAiSpeechApi.js";
export { synthesizeParagraphs, type AudioBatchDependencies } from "./speech/synthesizeParagraphs.js";
export {
  synthesizeParagraphsToWav,
  DEFAULT_PARAGRAPH_PAUSE_MS,
  type SingleAudioDependencies,
  type SingleAudioOptions,
} from "./speech/synthesizeParagraphsToWav.js";
export { encodeWav, OPENAI_PCM_FORMAT, type PcmFormat } from "./audio/wav.js";
export { type AudioFileWriter } from "./output/audioFileWriter.js";
export { NodeAudioFileWriter } from "./output/nodeAudioFileWriter.js";
export { type Mp3Encoder } from "./audio/mp3Encoder.js";
export { FfmpegMp3Encoder } from "./audio/ffmpegMp3Encoder.js";
export { CachingSpeechApi, speechCacheKey } from "./speech/cachingSpeechApi.js";
export { type SpeechAudioCache } from "./speech/speechAudioCache.js";
export { NodeSpeechAudioCache } from "./output/nodeSpeechAudioCache.js";

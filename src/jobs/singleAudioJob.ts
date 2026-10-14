import type { Mp3Encoder } from "../audio/mp3Encoder.js";
import { singleAudioFormatFromPath } from "../audio/singleAudioFormat.js";
import { CachingSpeechApi } from "../speech/cachingSpeechApi.js";
import type { SpeechApi } from "../ports/speechApi.js";
import type { SpeechAudioCache } from "../speech/speechAudioCache.js";
import { synthesizeParagraphsToWav } from "../speech/synthesizeParagraphsToWav.js";
import type { AudioFileRequest, AudioJobDependencies } from "./audioJobDependencies.js";
import type { AudioJobListener } from "./audioJobEvent.js";

/** API a usar na síntese e o que fazer quando o áudio final estiver salvo. */
interface SynthesisProgress {
  api: SpeechApi;
  finish(): Promise<void>;
}

/**
 * Grava todos os parágrafos num único áudio (WAV ou MP3, pela extensão), avisando o progresso.
 *
 * @example await runSingleAudioJob(["Um.", "Dois."], { outputPath: "aula.mp3" }, deps, (event) => console.log(event))
 */
export async function runSingleAudioJob(
  paragraphs: readonly string[],
  request: AudioFileRequest,
  deps: AudioJobDependencies,
  onEvent: AudioJobListener,
): Promise<void> {
  const onParagraphSynthesized = (position: number, total: number): void => {
    onEvent({ kind: "paragraphSynthesized", position, total });
  };
  const progress = openSynthesisProgress(request.outputPath, deps, onEvent);
  const wav = await synthesizeParagraphsToWav(paragraphs, { api: progress.api, onParagraphSynthesized }, {
    voice: request.voice,
  });
  await writeSingleAudio(wav, request.outputPath, deps);
  // Só depois de o arquivo final existir: antes disso, a pasta de progresso é o único backup.
  await progress.finish();
  onEvent({ kind: "audioSaved", path: request.outputPath });
}

function openSynthesisProgress(
  outputPath: string,
  deps: AudioJobDependencies,
  onEvent: AudioJobListener,
): SynthesisProgress {
  const api = deps.createSpeechApi();
  if (deps.createSpeechCache === undefined) return { api, finish: async () => undefined };
  const directory = `${outputPath}.partes`;
  const cache = deps.createSpeechCache(directory);
  const cachingApi = new CachingSpeechApi(api, cache);
  onEvent({ kind: "progressSaved", directory });
  return { api: cachingApi, finish: () => finishCachedProgress(cachingApi, cache, onEvent) };
}

async function finishCachedProgress(
  api: CachingSpeechApi,
  cache: SpeechAudioCache,
  onEvent: AudioJobListener,
): Promise<void> {
  if (api.cacheHits > 0) onEvent({ kind: "paragraphsReused", count: api.cacheHits });
  await cache.clear();
}

async function writeSingleAudio(wav: Uint8Array, outputPath: string, deps: AudioJobDependencies): Promise<void> {
  if (singleAudioFormatFromPath(outputPath) !== "mp3") {
    await deps.writer.writeAudioFile(outputPath, wav);
    return;
  }
  await deps.writer.writeAudioFile(outputPath, await encodeMp3OrKeepWav(wav, outputPath, deps));
}

// A síntese já foi paga quando a conversão roda; se ela falhar, o WAV é salvo para não perder o áudio.
async function encodeMp3OrKeepWav(wav: Uint8Array, outputPath: string, deps: AudioJobDependencies): Promise<Uint8Array> {
  try {
    return await requireMp3Encoder(deps, outputPath).encodeWavToMp3(wav);
  } catch (error) {
    const fallbackPath = outputPath.replace(/\.mp3$/i, ".wav");
    await deps.writer.writeAudioFile(fallbackPath, wav);
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${reason}\nO áudio já sintetizado foi salvo como WAV em "${fallbackPath}".`);
  }
}

function requireMp3Encoder(deps: AudioJobDependencies, outputPath: string): Mp3Encoder {
  if (deps.mp3Encoder === undefined) {
    throw new Error(`"${outputPath}" pede MP3, mas não há encoder configurado (esperado: deps.mp3Encoder).`);
  }
  return deps.mp3Encoder;
}

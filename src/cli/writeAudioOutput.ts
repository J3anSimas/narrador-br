import type { Mp3Encoder } from "../audio/mp3Encoder.js";
import { singleAudioFormatFromPath } from "../audio/singleAudioFormat.js";
import type { AudioFileWriter } from "../output/audioFileWriter.js";
import { CachingSpeechApi } from "../speech/cachingSpeechApi.js";
import type { SpeechApi } from "../speech/speechApi.js";
import type { SpeechAudioCache } from "../speech/speechAudioCache.js";
import { synthesizeParagraphs } from "../speech/synthesizeParagraphs.js";
import { synthesizeParagraphsToWav } from "../speech/synthesizeParagraphsToWav.js";
import type { AudioFileRequest, AudioOutputRequest } from "./parseCliArgs.js";
import type { TextSink } from "./runCli.js";

/** Dependências só usadas com --audio / --audio-file. */
export interface AudioCliDependencies {
  // Fábrica em vez de instância: o cliente da OpenAI exige a chave ao ser criado,
  // e o modo texto precisa funcionar sem ela.
  createSpeechApi: () => SpeechApi;
  writer: AudioFileWriter;
  /** Só usado com --audio-file *.mp3; sem ele, só WAV funciona. */
  mp3Encoder?: Mp3Encoder;
  /** Cria o cache de progresso de --audio-file; sem ele, uma queda perde tudo o que já foi sintetizado. */
  createSpeechCache?: (directory: string) => SpeechAudioCache;
}

/** API a usar na síntese e o que fazer quando o áudio final estiver salvo. */
interface SynthesisProgress {
  api: SpeechApi;
  finish(): Promise<void>;
}

/**
 * Grava um arquivo de áudio por parágrafo, listando cada um no stdout.
 *
 * @example await writeParagraphsAsAudioFiles(["Um."], { outputDir: "saida" }, audio, process.stdout)
 */
export async function writeParagraphsAsAudioFiles(
  paragraphs: readonly string[],
  request: AudioOutputRequest,
  audio: AudioCliDependencies,
  stdout: TextSink,
): Promise<void> {
  const onAudioWritten = (path: string, position: number, total: number): void => {
    stdout.write(`[${position}/${total}] ${path}\n`);
  };
  const batchDeps = { api: audio.createSpeechApi(), writer: audio.writer, onAudioWritten };
  await synthesizeParagraphs(paragraphs, request.outputDir, batchDeps, { voice: request.voice });
}

/**
 * Grava todos os parágrafos num único áudio (WAV ou MP3, pela extensão), mostrando o progresso no stdout.
 *
 * @example await writeParagraphsAsSingleAudio(["Um.", "Dois."], { outputPath: "aula.mp3" }, audio, process.stdout)
 */
export async function writeParagraphsAsSingleAudio(
  paragraphs: readonly string[],
  request: AudioFileRequest,
  audio: AudioCliDependencies,
  stdout: TextSink,
): Promise<void> {
  const onParagraphSynthesized = (position: number, total: number): void => {
    stdout.write(`[${position}/${total}] parágrafo sintetizado\n`);
  };
  const progress = openSynthesisProgress(request.outputPath, audio, stdout);
  const deps = { api: progress.api, onParagraphSynthesized };
  const wav = await synthesizeParagraphsToWav(paragraphs, deps, { voice: request.voice });
  await writeSingleAudio(wav, request.outputPath, audio);
  // Só depois de o arquivo final existir: antes disso, a pasta de progresso é o único backup.
  await progress.finish();
  stdout.write(`Áudio salvo em ${request.outputPath}\n`);
}

function openSynthesisProgress(outputPath: string, audio: AudioCliDependencies, stdout: TextSink): SynthesisProgress {
  const api = audio.createSpeechApi();
  if (audio.createSpeechCache === undefined) return { api, finish: async () => undefined };
  const directory = `${outputPath}.partes`;
  const cache = audio.createSpeechCache(directory);
  const cachingApi = new CachingSpeechApi(api, cache);
  stdout.write(`Progresso salvo em ${directory} (se parar, rode o mesmo comando para continuar)\n`);
  return { api: cachingApi, finish: () => finishCachedProgress(cachingApi, cache, stdout) };
}

async function finishCachedProgress(api: CachingSpeechApi, cache: SpeechAudioCache, stdout: TextSink): Promise<void> {
  if (api.cacheHits > 0) {
    stdout.write(`${api.cacheHits} parágrafo(s) reaproveitado(s) de uma execução anterior\n`);
  }
  await cache.clear();
}

async function writeSingleAudio(wav: Uint8Array, outputPath: string, audio: AudioCliDependencies): Promise<void> {
  if (singleAudioFormatFromPath(outputPath) !== "mp3") {
    await audio.writer.writeAudioFile(outputPath, wav);
    return;
  }
  await audio.writer.writeAudioFile(outputPath, await encodeMp3OrKeepWav(wav, outputPath, audio));
}

// A síntese já foi paga quando a conversão roda; se ela falhar, o WAV é salvo para não perder o áudio.
async function encodeMp3OrKeepWav(
  wav: Uint8Array,
  outputPath: string,
  audio: AudioCliDependencies,
): Promise<Uint8Array> {
  try {
    return await requireMp3Encoder(audio, outputPath).encodeWavToMp3(wav);
  } catch (error) {
    const fallbackPath = outputPath.replace(/\.mp3$/i, ".wav");
    await audio.writer.writeAudioFile(fallbackPath, wav);
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${reason}\nO áudio já sintetizado foi salvo como WAV em "${fallbackPath}".`);
  }
}

function requireMp3Encoder(audio: AudioCliDependencies, outputPath: string): Mp3Encoder {
  if (audio.mp3Encoder === undefined) {
    throw new Error(
      `--audio-file "${outputPath}" pede MP3, mas a CLI foi montada sem encoder (esperado: deps.audio.mp3Encoder).`,
    );
  }
  return audio.mp3Encoder;
}

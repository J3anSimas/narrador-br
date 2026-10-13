import type { AudioFileRequest, AudioJobDependencies, AudioOutputRequest } from "../jobs/audioJobDependencies.js";
import type { AudioJobEvent, AudioJobListener } from "../jobs/audioJobEvent.js";
import { runParagraphAudioJob } from "../jobs/paragraphAudioJob.js";
import { runSingleAudioJob } from "../jobs/singleAudioJob.js";
import type { TextSink } from "./runCli.js";

/** Dependências só usadas com --audio / --audio-file. */
export type AudioCliDependencies = AudioJobDependencies;

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
  await runParagraphAudioJob(paragraphs, request, audio, printAudioJobEvents(stdout));
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
  await runSingleAudioJob(paragraphs, request, audio, printAudioJobEvents(stdout));
}

function printAudioJobEvents(stdout: TextSink): AudioJobListener {
  return (event) => {
    stdout.write(`${describeAudioJobEvent(event)}\n`);
  };
}

function describeAudioJobEvent(event: AudioJobEvent): string {
  switch (event.kind) {
    case "progressSaved":
      return `Progresso salvo em ${event.directory} (se parar, rode o mesmo comando para continuar)`;
    case "paragraphSynthesized":
      return `[${event.position}/${event.total}] parágrafo sintetizado`;
    case "audioFileWritten":
      return `[${event.position}/${event.total}] ${event.path}`;
    case "paragraphsReused":
      return `${event.count} parágrafo(s) reaproveitado(s) de uma execução anterior`;
    case "audioSaved":
      return `Áudio salvo em ${event.path}`;
  }
}

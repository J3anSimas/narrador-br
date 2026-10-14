import { parseArgs } from "node:util";
import { SINGLE_AUDIO_FORMATS, singleAudioFormatFromPath } from "../audio/singleAudioFormat.js";
import type { InputRequest } from "../input/textInputSource.js";
import { OUTPUT_FORMATS, type OutputFormat } from "../output/formatParagraphs.js";
import type { AiProvider } from "../ports/aiProvider.js";

import type { AudioFileRequest, AudioOutputRequest } from "../jobs/audioJobDependencies.js";

// Os pedidos moraram aqui antes de a interface desktop também precisar deles.
export type { AudioFileRequest, AudioOutputRequest } from "../jobs/audioJobDependencies.js";

export interface CliOptions {
  showHelp: boolean;
  input: InputRequest;
  outputFormat: OutputFormat;
  audio?: AudioOutputRequest;
  audioFile?: AudioFileRequest;
  /** Modelo da LLM que adapta parágrafos acima do limite; sem ele, vale o padrão. */
  rewriteModel?: string;
}

/**
 * Texto de ajuda, com os limites e padrões do provedor de IA configurado.
 *
 * @example helpText(createOpenAiProvider(process.env))
 */
export function helpText(ai: AiProvider): string {
  const { name, setupHint, speech, rewrite } = ai;
  const longParagraphs =
    rewrite === undefined
      ? "são divididos nos fins de frase"
      : `são condensados e/ou\nquebrados em vários por uma LLM da ${name} (requer ${setupHint})`;
  const rewriteModelOption =
    rewrite === undefined
      ? ""
      : `  --rewrite-model <nome> modelo da ${name} que adapta parágrafos longos (padrão: ${rewrite.defaultModel})\n`;
  return `Uso: paragrafos [opções] [texto]

Separa um texto (ou PDF) em parágrafos e, opcionalmente, os transforma em áudio.
Parágrafos com mais de ${speech.maxInputLength} caracteres (limite da API de fala) ${longParagraphs};
os demais não são alterados.

Entrada (escolha uma):
  -f, --file <caminho>   lê um PDF (.pdf, extraindo o texto) ou um arquivo de texto UTF-8
  [texto]                usa o texto passado como argumento
  (stdin)                sem --file nem texto, lê do stdin (ex.: cat arquivo.txt | paragrafos)

Opções:
  --format <text|json>   formato de saída (padrão: text)
  --audio-file <x.mp3|x.wav>
                         gera um único áudio com todos os parágrafos (requer ${setupHint};
                         .mp3 também requer ffmpeg no PATH)
  --audio <pasta>        gera paragrafo-001.mp3, paragrafo-002.mp3... na pasta (requer ${setupHint})
  --voice <nome>         voz da ${name} usada com --audio-file ou --audio (padrão: ${speech.defaultVoice})
${rewriteModelOption}  -h, --help             mostra esta ajuda
`;
}

const CLI_OPTION_SPEC = {
  file: { type: "string", short: "f" },
  format: { type: "string", default: "text" },
  audio: { type: "string" },
  "audio-file": { type: "string" },
  voice: { type: "string" },
  "rewrite-model": { type: "string" },
  help: { type: "boolean", short: "h", default: false },
} as const;

/**
 * Converte os argumentos da linha de comando em opções validadas.
 *
 * @example parseCliArgs(["--file", "aula.txt", "--audio", "saida", "--voice", "cedar"])
 */
export function parseCliArgs(argv: readonly string[]): CliOptions {
  const { values, positionals } = parseArgs({ args: [...argv], allowPositionals: true, options: CLI_OPTION_SPEC });
  return {
    showHelp: values.help ?? false,
    input: toInputRequest(values.file, positionals),
    outputFormat: toOutputFormat(values.format),
    ...toAudioRequests({ outputDir: values.audio, outputPath: values["audio-file"], voice: values.voice }),
    ...toRewriteModel(values["rewrite-model"]),
  };
}

function toInputRequest(filePath: string | undefined, positionals: readonly string[]): InputRequest {
  if (filePath !== undefined && positionals.length > 0) {
    throw new Error(
      `Use --file ou texto como argumento, não os dois (recebido: --file "${filePath}" e "${positionals.join(" ")}").`,
    );
  }
  if (filePath !== undefined) return { kind: "file", path: filePath };
  if (positionals.length > 0) return { kind: "inline", text: positionals.join(" ") };
  return { kind: "stdin" };
}

function toRewriteModel(rawModel: string | undefined): Pick<CliOptions, "rewriteModel"> {
  if (rawModel === undefined) return {};
  if (rawModel.trim().length === 0) {
    throw new Error(`--rewrite-model vazio (recebido: "${rawModel}"; esperado: nome de modelo).`);
  }
  return { rewriteModel: rawModel.trim() };
}

function toOutputFormat(rawFormat: string | undefined): OutputFormat {
  const match = OUTPUT_FORMATS.find((format) => format === rawFormat);
  if (match === undefined) {
    throw new Error(`Formato de saída inválido: "${rawFormat}" (esperado: ${OUTPUT_FORMATS.join(" | ")}).`);
  }
  return match;
}

interface RawAudioFlags {
  outputDir: string | undefined;
  outputPath: string | undefined;
  voice: string | undefined;
}

function toAudioRequests(flags: RawAudioFlags): Pick<CliOptions, "audio" | "audioFile"> {
  assertAudioFlagsCompatible(flags);
  const { outputDir, outputPath, voice } = flags;
  return {
    audio: outputDir === undefined ? undefined : withVoice({ outputDir }, voice),
    audioFile: outputPath === undefined ? undefined : withVoice({ outputPath }, voice),
  };
}

function assertAudioFlagsCompatible({ outputDir, outputPath, voice }: RawAudioFlags): void {
  if (outputDir !== undefined && outputPath !== undefined) {
    throw new Error(
      `Use --audio ou --audio-file, não os dois (recebido: --audio "${outputDir}" e --audio-file "${outputPath}").`,
    );
  }
  if (outputDir === undefined && outputPath === undefined && voice !== undefined) {
    throw new Error(`--voice "${voice}" só vale junto com --audio <pasta> ou --audio-file <arquivo.mp3|.wav>.`);
  }
  // A extensão decide o formato gravado; outra qualquer enganaria o player.
  if (outputPath !== undefined && singleAudioFormatFromPath(outputPath) === undefined) {
    const expected = SINGLE_AUDIO_FORMATS.map((format) => `.${format}`).join(" ou ");
    throw new Error(`--audio-file "${outputPath}" inválido (esperado: caminho terminando em ${expected}).`);
  }
}

function withVoice<T extends object>(request: T, voice: string | undefined): T & { voice?: string } {
  return voice === undefined ? request : { ...request, voice };
}

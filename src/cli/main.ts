#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createOpenAiProvider } from "../adapters/openai/createOpenAiProvider.js";
import { FfmpegMp3Encoder } from "../audio/ffmpegMp3Encoder.js";
import { NodeTextInputSource } from "../input/nodeTextInputSource.js";
import { NodeAudioFileWriter } from "../output/nodeAudioFileWriter.js";
import { NodeSpeechAudioCache } from "../output/nodeSpeechAudioCache.js";
import { loadEnvFileIfPresent } from "./loadEnvFileIfPresent.js";
import { createOverridingEnvFileLoader } from "./overridingEnvFileLoader.js";
import { runCli } from "./runCli.js";

loadEnvFileIfPresent(
  ".env",
  createOverridingEnvFileLoader(process.env, (path) => readFileSync(path, "utf8")),
);

const exitCode = await runCli(process.argv.slice(2), {
  source: new NodeTextInputSource(process.stdin),
  stdout: process.stdout,
  stderr: process.stderr,
  // Único ponto que escolhe o provedor de IA; trocar de provedor é trocar esta linha.
  ai: createOpenAiProvider(process.env),
  audio: {
    writer: new NodeAudioFileWriter(),
    mp3Encoder: new FfmpegMp3Encoder(),
    createSpeechCache: (directory) => new NodeSpeechAudioCache(directory),
  },
});
process.exitCode = exitCode;

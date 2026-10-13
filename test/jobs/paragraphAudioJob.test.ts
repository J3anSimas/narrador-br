import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AudioJobEvent } from "../../src/jobs/audioJobEvent.js";
import { runParagraphAudioJob } from "../../src/jobs/paragraphAudioJob.js";
import { FakeAudioFileWriter } from "../fakes/FakeAudioFileWriter.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

describe("runParagraphAudioJob", () => {
  it("emite um evento por arquivo gravado e devolve os caminhos na ordem", async () => {
    const events: AudioJobEvent[] = [];
    const api = new FakeSpeechApi();
    const deps = { createSpeechApi: () => api, writer: new FakeAudioFileWriter() };
    const paths = await runParagraphAudioJob(["Um.", "Dois."], { outputDir: "saida", voice: "cedar" }, deps, (event) =>
      events.push(event),
    );
    const first = join("saida", "paragrafo-001.mp3");
    expect(paths).toEqual([first, join("saida", "paragrafo-002.mp3")]);
    expect(events[0]).toEqual({ kind: "audioFileWritten", path: first, position: 1, total: 2 });
    expect(api.requests.map((request) => request.voice)).toEqual(["cedar", "cedar"]);
  });
});

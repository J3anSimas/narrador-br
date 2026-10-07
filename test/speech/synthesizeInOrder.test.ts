import { describe, expect, it } from "vitest";
import { synthesizeInOrder } from "../../src/speech/synthesizeInOrder.js";
import { FakeSpeechApi } from "../fakes/FakeSpeechApi.js";

async function collect(audios: AsyncIterable<Uint8Array>): Promise<Uint8Array[]> {
  const collected: Uint8Array[] = [];
  for await (const audio of audios) collected.push(audio);
  return collected;
}

describe("synthesizeInOrder", () => {
  it("sintetiza cada parágrafo na ordem do texto", async () => {
    const api = new FakeSpeechApi();
    expect(await collect(synthesizeInOrder(["Um.", "Dois."], api, { voice: "cedar" }))).toHaveLength(2);
    expect(api.requests.map((request) => [request.text, request.voice])).toEqual([
      ["Um.", "cedar"],
      ["Dois.", "cedar"],
    ]);
  });

  it("valida todos os parágrafos antes da primeira chamada", async () => {
    const api = new FakeSpeechApi();
    await expect(collect(synthesizeInOrder(["Válido.", " "], api))).rejects.toThrow(/Parágrafo vazio/);
    expect(api.requests).toHaveLength(0);
  });
});

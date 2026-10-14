import { describe, expect, it } from "vitest";
import { synthesizeInOrder } from "../../src/speech/synthesizeInOrder.js";
import { FakeSlowSpeechApi } from "../fakes/FakeSlowSpeechApi.js";
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

  it("mantém no máximo maxConcurrentRequests pedidos em andamento", async () => {
    const api = new FakeSlowSpeechApi(2);
    expect(await collect(synthesizeInOrder(["Um.", "Dois.", "Três.", "Quatro."], api))).toHaveLength(4);
    expect(api.maxInFlight).toBe(2);
  });

  it("entrega na ordem do texto mesmo quando um pedido posterior termina antes", async () => {
    const api = new FakeSlowSpeechApi(2, { "Um.": 20, "Dois.": 1 });
    const audios = await collect(synthesizeInOrder(["Um.", "Dois."], api));
    expect(audios.map((audio) => new TextDecoder().decode(audio))).toEqual(["Um.", "Dois."]);
  });

  it("propaga a falha de um pedido sem deixar rejeição pendente", async () => {
    const api = new FakeSlowSpeechApi(2, { "Um.": 1, "Dois.": 20 }, "Um.");
    await expect(collect(synthesizeInOrder(["Um.", "Dois."], api))).rejects.toThrow(/falha simulada em "Um\."/);
  });

  it("recusa um limite de concorrência inválido antes de chamar a API", async () => {
    const api = new FakeSlowSpeechApi(0);
    await expect(collect(synthesizeInOrder(["Um."], api))).rejects.toThrow(/maxConcurrentRequests = 0/);
    expect(api.requests).toHaveLength(0);
  });
});

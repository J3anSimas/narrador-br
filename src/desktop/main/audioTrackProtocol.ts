import { protocol } from "electron";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { AUDIO_TRACK_SCHEME, type AudioTrackRegistry } from "./audioTrackRegistry.js";
import { audioContentType, parseByteRange } from "./byteRange.js";

/** Precisa rodar antes de `app.whenReady()`; `stream` permite ao `<audio>` pular trechos. */
export function registerAudioTrackScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: AUDIO_TRACK_SCHEME, privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } },
  ]);
}

/**
 * Serve os áudios registrados para o `<audio>` da janela, com suporte a `Range`.
 * Responde intervalos manualmente: sem 206, o player não consegue avançar nem voltar.
 *
 * @example handleAudioTrackProtocol(registry) // depois de app.whenReady()
 */
export function handleAudioTrackProtocol(registry: AudioTrackRegistry): void {
  protocol.handle(AUDIO_TRACK_SCHEME, async (request) => {
    const path = registry.pathFor(request.url);
    if (path === undefined) return new Response(`Faixa não registrada: ${request.url}`, { status: 404 });
    try {
      return await respondWithAudioFile(path, request.headers.get("range"));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return new Response(`Não foi possível ler "${path}": ${reason}`, { status: 404 });
    }
  });
}

async function respondWithAudioFile(path: string, rangeHeader: string | null): Promise<Response> {
  const { size } = await stat(path);
  const range = parseByteRange(rangeHeader, size);
  const headers = { "Content-Type": audioContentType(path), "Accept-Ranges": "bytes" };
  if (range.kind === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
  }
  if (range.kind === "full") {
    return new Response(readFileBody(path, 0, size - 1), { headers: { ...headers, "Content-Length": String(size) } });
  }
  const partialHeaders = {
    ...headers,
    "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
    "Content-Length": String(range.end - range.start + 1),
  };
  return new Response(readFileBody(path, range.start, range.end), { status: 206, headers: partialHeaders });
}

function readFileBody(path: string, start: number, end: number): ReadableStream<Uint8Array> {
  // O ReadableStream de node:stream/web e o global são o mesmo objeto, mas os tipos diferem.
  return Readable.toWeb(createReadStream(path, { start, end })) as unknown as ReadableStream<Uint8Array>;
}

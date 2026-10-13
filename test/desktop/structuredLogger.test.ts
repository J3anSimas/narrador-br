import { describe, expect, it } from "vitest";
import { createJsonLineLogger } from "../../src/desktop/main/structuredLogger.js";

describe("createJsonLineLogger", () => {
  it("escreve uma linha JSON com nível, mensagem e campos", () => {
    const lines: string[] = [];
    createJsonLineLogger((line) => lines.push(line)).log("error", "job failed", { mode: "singleFile" });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/\n$/);
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({ level: "error", message: "job failed", mode: "singleFile" });
  });
});

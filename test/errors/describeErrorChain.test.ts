import { describe, expect, it } from "vitest";
import { describeErrorChain } from "../../src/errors/describeErrorChain.js";

class FakeSocketError extends Error {
  readonly code = "UND_ERR_SOCKET";
}

describe("describeErrorChain", () => {
  it("mostra a causa real de um 'terminated' do fetch, com o código", () => {
    const error = new TypeError("terminated", { cause: new FakeSocketError("other side closed") });
    expect(describeErrorChain(error)).toBe("terminated → other side closed [UND_ERR_SOCKET]");
  });

  it("devolve só a mensagem quando não há causa", () => {
    expect(describeErrorChain(new Error("429 Rate limit reached"))).toBe("429 Rate limit reached");
  });

  it("não repete o código já presente na mensagem nem mensagens iguais em sequência", () => {
    const inner = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });
    const error = new Error("read ECONNRESET", { cause: inner });
    expect(describeErrorChain(error)).toBe("read ECONNRESET");
  });

  it("aceita valores que não são Error", () => {
    expect(describeErrorChain("falhou")).toBe("falhou");
  });

  it("para num ciclo de causas", () => {
    const first = new Error("a");
    const second = new Error("b", { cause: first });
    Object.assign(first, { cause: second });
    expect(describeErrorChain(first)).toBe("a → b → a → b → a");
  });
});

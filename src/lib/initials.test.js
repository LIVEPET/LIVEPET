import { describe, it, expect } from "vitest";
import { initialsFrom } from "./initials";

describe("initialsFrom", () => {
  it("usa as iniciais de nome e sobrenome", () => {
    expect(initialsFrom("Ana Silva")).toBe("AS");
  });
  it("aguenta espaços duplicados", () => {
    expect(initialsFrom("Ana   Silva")).toBe("AS");
  });
  it("usa 2 letras quando há uma palavra só", () => {
    expect(initialsFrom("carlos@livepet.com")).toBe("CA");
  });
  it("retorna ? sem valor", () => {
    expect(initialsFrom("")).toBe("?");
    expect(initialsFrom(null)).toBe("?");
  });
});

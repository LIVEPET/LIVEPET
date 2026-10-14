import { describe, expect, it } from "vitest";
import { formatPhone, isValidPhone } from "./phone";

describe("formatPhone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatPhone("11999990000")).toBe("(11) 99999-0000");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("formata enquanto a pessoa digita", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("1")).toBe("(1");
    expect(formatPhone("11")).toBe("(11");
    expect(formatPhone("119")).toBe("(11) 9");
    expect(formatPhone("119999")).toBe("(11) 9999");
    expect(formatPhone("1199999")).toBe("(11) 9999-9");
  });

  it("ignora letras e símbolos e limita a 11 dígitos", () => {
    expect(formatPhone("(11) 9a9b9c9d9-0000 999")).toBe("(11) 99999-0000");
    expect(formatPhone("—")).toBe("");
    expect(formatPhone(undefined)).toBe("");
  });
});

describe("isValidPhone", () => {
  it("aceita celular e fixo com DDD", () => {
    expect(isValidPhone("(11) 99999-0000")).toBe(true);
    expect(isValidPhone("(62) 3333-4444")).toBe(true);
  });

  it("rejeita número curto, longo ou vazio", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("119999900001")).toBe(false);
  });

  it("rejeita DDD inválido e celular que não começa com 9", () => {
    expect(isValidPhone("(01) 99999-0000")).toBe(false);
    expect(isValidPhone("(10) 99999-0000")).toBe(false);
    expect(isValidPhone("(11) 89999-0000")).toBe(false);
  });
});
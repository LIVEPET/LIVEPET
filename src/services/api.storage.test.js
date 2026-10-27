import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredAuth,
  clearStoredClinicAuth,
  getAuthToken,
  getClinicAuthToken,
  getStoredClinic,
  getStoredUser,
  setStoredAuth,
  setStoredClinicAuth,
} from "./api";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("sessão do tutor no navegador", () => {
  it("guarda o token e o usuário depois do login", () => {
    setStoredAuth("token-abc", { id: 1, nome: "Yasmim Viana" });

    expect(getAuthToken()).toBe("token-abc");
    expect(getStoredUser()).toEqual({ id: 1, nome: "Yasmim Viana" });
    expect(localStorage.getItem("livepet_access_token")).toBe("token-abc");
  });

  it("apaga o token e o usuário ao sair", () => {
    setStoredAuth("token-abc", { id: 1 });
    clearStoredAuth();

    expect(getAuthToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it("continua de pé quando o navegador bloqueia o armazenamento", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });

    expect(() => setStoredAuth("token-abc", { id: 1 })).not.toThrow();
    expect(getAuthToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});

describe("sessão da clínica no navegador", () => {
  it("guarda e apaga o token da clínica", () => {
    setStoredClinicAuth("token-clinica", { id: 7, nome: "Clínica Teste" });
    expect(getClinicAuthToken()).toBe("token-clinica");
    expect(getStoredClinic()).toEqual({ id: 7, nome: "Clínica Teste" });

    clearStoredClinicAuth();
    expect(getClinicAuthToken()).toBeNull();
    expect(getStoredClinic()).toBeNull();
  });
});

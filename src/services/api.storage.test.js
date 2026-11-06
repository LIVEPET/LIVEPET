import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authService,
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

describe("conferência da senha atual (#176)", () => {
  const resposta = (status, body) =>
    Promise.resolve({ ok: status < 400, status, headers: { get: () => null }, json: async () => body });

  it("senha errada devolve false e mantém o tutor logado", async () => {
    setStoredAuth("token-abc", { id: 1, email: "yasmim@livepet.com" });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => resposta(401, { detail: "E-mail ou senha incorretos." }));

    await expect(authService.verifyPassword({ email: "yasmim@livepet.com", senha: "errada1" })).resolves.toBe(false);
    expect(getAuthToken()).toBe("token-abc");
    expect(getStoredUser()).toEqual({ id: 1, email: "yasmim@livepet.com" });
  });

  it("senha certa devolve true sem trocar o token guardado", async () => {
    setStoredAuth("token-abc", { id: 1 });
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      resposta(200, { access_token: "token-novo", user: { id: 1 } }),
    );

    await expect(authService.verifyPassword({ email: "yasmim@livepet.com", senha: "livepet1" })).resolves.toBe(true);
    expect(getAuthToken()).toBe("token-abc");
  });

  it("erro do servidor (não 401) é repassado para a tela avisar", async () => {
    setStoredAuth("token-abc", { id: 1 });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => resposta(503, { detail: "Serviço indisponível" }));

    await expect(authService.verifyPassword({ email: "a@b.com", senha: "livepet1" })).rejects.toThrow("Serviço indisponível");
    expect(getAuthToken()).toBe("token-abc");
  });
});

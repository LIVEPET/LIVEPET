import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ClinicAuthProvider } from "./ClinicAuthProvider";
import { ClinicProvider } from "./ClinicContext";
import ProtectedClinicRoute from "@/components/ProtectedClinicRoute";
import ClinicLogin from "@/pages/Clinic/ClinicLogin";
import ClinicLayout from "@/pages/Clinic/ClinicLayout";
import { clinicService, setStoredClinicAuth, setStoredAuth } from "@/services/api";

const clinic = { id: 7, nome: "Clínica Teste" };
const token = (claims = {}) => `header.${btoa(JSON.stringify({ role: "clinic", exp: Math.floor(Date.now() / 1000) + 3600, ...claims }))}.signature`;
const response = (body, status = 200) => ({ ok: status < 400, status, headers: new Headers(), json: async () => body });
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const open = (path = "/clinica/agenda") => render(
  <ClinicAuthProvider><ClinicProvider><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/clinica/entrar" element={<ClinicLogin />} />
    <Route element={<ProtectedClinicRoute />}><Route path="/clinica" element={<ClinicLayout />}>
      <Route index element={<p>Página reservada</p>} /><Route path="*" element={<p>Página reservada</p>} />
    </Route></Route>
  </Routes></MemoryRouter></ClinicProvider></ClinicAuthProvider>,
);
const submit = () => {
  fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: "CLINICA@EXAMPLE.COM" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Senha123" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar no painel" }));
};
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (url) => response(url.endsWith("/perfil") ? clinic :
    url.endsWith("/login") ? { access_token: token(), clinica: clinic } : [])));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Autenticação da clínica — issue #61", () => {
  it.each(["/clinica", "/clinica/agenda", "/clinica/pacientes", "/clinica/perfil", "/clinica/internacao"])("protege %s sem sessão", async (path) => {
    open(path);
    expect(await screen.findByRole("heading", { name: "Acesso da clínica" })).toBeInTheDocument();
    expect(screen.queryByText("Página reservada")).not.toBeInTheDocument();
  });
  it("envia credenciais, mostra carregamento e só libera a página após validar a sessão", async () => {
    const login = deferred(); const profile = deferred();
    fetch.mockImplementation((url) => url.endsWith("/login") ? login.promise : url.endsWith("/perfil") ? profile.promise : Promise.resolve(response([])));
    open(); await screen.findByText("Acesso da clínica"); submit();
    expect(screen.getByRole("button", { name: /Entrando/ })).toBeDisabled();
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: "clinica@example.com", senha: "Senha123" });
    await act(async () => login.resolve(response({ access_token: token(), clinica: clinic })));
    expect(screen.getByRole("status")).toHaveTextContent("Verificando sessão");
    expect(screen.queryByText("Página reservada")).not.toBeInTheDocument();
    await act(async () => profile.resolve(response(clinic)));
    expect(await screen.findByText("Página reservada")).toBeInTheDocument();
  });
  it("mostra credenciais inválidas sem encerrar a sessão do tutor", async () => {
    setStoredAuth("token-tutor", { id: 1 });
    fetch.mockResolvedValue(response({ detail: "E-mail ou senha incorretos." }, 401));
    open("/clinica/entrar"); submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
    expect(localStorage.getItem("livepet_access_token")).toBe("token-tutor");
  });
  it("restaura a sessão após recarregar e envia somente o token da clínica", async () => {
    const access = token(); setStoredClinicAuth(access, clinic); setStoredAuth("tutor", { id: 1 });
    const first = open(); await screen.findByText("Página reservada"); first.unmount();
    open(); await screen.findByText("Página reservada");
    expect(fetch.mock.calls.find(([url]) => url.endsWith("/perfil"))[1].headers.Authorization).toBe(`Bearer ${access}`);
  });
  it.each(["inválido", token({ role: "tutor" }), token({ exp: 1 })])("rejeita token inválido, de tutor ou expirado: %s", async (access) => {
    setStoredClinicAuth(access, clinic); open();
    await screen.findByText("Acesso da clínica");
    expect(localStorage.getItem("livepet_clinic_access_token")).toBeNull();
  });
  it.each([401, 403])("revoga sessão rejeitada pela API com %s", async (status) => {
    setStoredClinicAuth(token(), clinic); setStoredAuth("tutor", { id: 1 });
    fetch.mockResolvedValue(response({ detail: "Sessão inválida" }, status)); open();
    await screen.findByText("Acesso da clínica");
    expect(localStorage.getItem("livepet_current_clinic")).toBeNull();
    expect(localStorage.getItem("livepet_access_token")).toBe("tutor");
  });
  it("bloqueia conteúdo durante falha de rede e permite tentar novamente", async () => {
    setStoredClinicAuth(token(), clinic); fetch.mockRejectedValue(new Error("Sem rede")); open();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível verificar");
    expect(screen.queryByText("Página reservada")).not.toBeInTheDocument();
    fetch.mockResolvedValue(response(clinic)); fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByText("Página reservada");
  });
  it("logout pela interface limpa token, perfil e caches sem apagar o tutor", async () => {
    setStoredClinicAuth(token(), clinic); setStoredAuth("tutor", { id: 1 });
    localStorage.setItem("livepet_clinic_data_7", JSON.stringify({ patients: [{ id: 1, name: "Luna" }] }));
    open(); await screen.findByText("Página reservada");
    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));
    await screen.findByText("Acesso da clínica");
    expect(localStorage.getItem("livepet_clinic_access_token")).toBeNull();
    expect(localStorage.getItem("livepet_current_clinic")).toBeNull();
    expect(localStorage.getItem("livepet_clinic_data_7")).toBeNull();
    expect(localStorage.getItem("livepet_access_token")).toBe("tutor");
  });
  it("encerra a sessão ao expirar mesmo com a página aberta", async () => {
    vi.useFakeTimers(); setStoredClinicAuth(token({ exp: Math.floor(Date.now() / 1000) + 2 }), clinic); open();
    await act(async () => {});
    expect(screen.getByText("Página reservada")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(2100));
    expect(screen.getByText("Acesso da clínica")).toBeInTheDocument();
  });
  it("acompanha logout em outra aba", async () => {
    setStoredClinicAuth(token(), clinic); open(); await screen.findByText("Página reservada");
    act(() => { localStorage.removeItem("livepet_clinic_access_token"); window.dispatchEvent(new StorageEvent("storage", { key: "livepet_clinic_access_token" })); });
    await screen.findByText("Acesso da clínica");
  });
  it("uma resposta atrasada não restaura o perfil depois do logout", async () => {
    const pending = deferred(); setStoredClinicAuth(token(), clinic);
    fetch.mockImplementation((url) => url.endsWith("/perfil") ? pending.promise : Promise.resolve(response([])));
    open(); act(() => clinicService.logout());
    await act(async () => pending.resolve(response(clinic)));
    await screen.findByText("Acesso da clínica");
    expect(localStorage.getItem("livepet_current_clinic")).toBeNull();
    expect(screen.queryByText("Página reservada")).not.toBeInTheDocument();
  });
  it("não restaura dados de pacientes recebidos depois do logout", async () => {
    const pending = deferred(); setStoredClinicAuth(token(), clinic);
    fetch.mockImplementation((url) => url.endsWith("/pacientes") ? pending.promise : Promise.resolve(response(url.endsWith("/perfil") ? clinic : [])));
    open(); await screen.findByText("Página reservada");
    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));
    await act(async () => pending.resolve(response([{ id: 1, name: "Paciente da sessão antiga" }])));
    expect(localStorage.getItem("livepet_clinic_data_7")).toBeNull();
    expect(localStorage.getItem("livepet_clinic_data") || "").not.toContain("Paciente da sessão antiga");
  });
});

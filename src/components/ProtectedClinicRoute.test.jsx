import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProtectedClinicRoute from "./ProtectedClinicRoute";
import { useClinicAuth } from "@/contexts/clinicAuth";

vi.mock("@/contexts/clinicAuth", () => ({
  useClinicAuth: vi.fn(),
}));

const renderClinicAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/clinica/entrar" element={<p>Tela de login da clinica</p>} />
        <Route element={<ProtectedClinicRoute />}>
          <Route path="/clinica" element={<p>Painel da clinica</p>} />
          <Route path="/clinica/agenda" element={<p>Agenda da clinica</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedClinicRoute (Issue #56)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona para /clinica/entrar quando a clinica nao esta autenticada", () => {
    useClinicAuth.mockReturnValue({ status: "anonymous" });
    renderClinicAt("/clinica");
    expect(screen.getByText("Tela de login da clinica")).toBeTruthy();
    expect(screen.queryByText("Painel da clinica")).toBeNull();
  });

  it("bloqueia rota interna /clinica/agenda e redireciona para login", () => {
    useClinicAuth.mockReturnValue({ status: "anonymous" });
    renderClinicAt("/clinica/agenda");
    expect(screen.getByText("Tela de login da clinica")).toBeTruthy();
    expect(screen.queryByText("Agenda da clinica")).toBeNull();
  });

  it("permite acesso a rota /clinica quando a clinica esta autenticada", () => {
    useClinicAuth.mockReturnValue({ status: "authenticated" });
    renderClinicAt("/clinica");
    expect(screen.getByText("Painel da clinica")).toBeTruthy();
  });

  it("permite acesso a rota /clinica/agenda quando a clinica esta autenticada", () => {
    useClinicAuth.mockReturnValue({ status: "authenticated" });
    renderClinicAt("/clinica/agenda");
    expect(screen.getByText("Agenda da clinica")).toBeTruthy();
  });
});

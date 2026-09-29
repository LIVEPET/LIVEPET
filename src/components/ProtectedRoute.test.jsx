import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProtectedRoute from "./ProtectedRoute";
import { authService } from "@/services/api";

vi.mock("@/services/api", () => ({
  authService: { isAuthenticated: vi.fn() },
}));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/pets" element={<p>Area privada</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona para /login quando nao autenticado", () => {
    authService.isAuthenticated.mockReturnValue(false);
    renderAt("/pets");
    expect(screen.getByText("Tela de login")).toBeTruthy();
    expect(screen.queryByText("Area privada")).toBeNull();
  });

  it("renderiza a rota privada quando autenticado", () => {
    authService.isAuthenticated.mockReturnValue(true);
    renderAt("/pets");
    expect(screen.getByText("Area privada")).toBeTruthy();
  });
});

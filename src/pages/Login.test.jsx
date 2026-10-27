import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import Login from "./Login";

const renderizar = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>,
  );

beforeEach(() => localStorage.clear());

describe("<Login />", () => {
  it("não mostra o botão Entrar com Google, que ainda não funciona", () => {
    renderizar();

    expect(screen.queryByRole("button", { name: /Entrar com Google/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/ou continue com/i)).not.toBeInTheDocument();
  });

  it("mantém o login com e-mail e senha", () => {
    renderizar();

    expect(screen.getByPlaceholderText("voce@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });
});

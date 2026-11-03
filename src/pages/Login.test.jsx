import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";

// O aviso de senha curta sai por toast. Capturamos a mensagem para checar
// que ela continua chegando ao tutor depois da subida para o zod 4 (#185),
// onde `error.errors` deixou de existir e virou `error.issues`.
const toastErro = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args) => toastErro(...args),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

const renderizar = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  toastErro.mockClear();
});

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

  it("avisa que a senha é curta em vez de quebrar na validação", async () => {
    renderizar();

    fireEvent.change(screen.getByPlaceholderText("voce@email.com"), {
      target: { value: "tutor@livepet.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /Entrar na minha conta/i }));

    await waitFor(() =>
      expect(toastErro).toHaveBeenCalledWith("Senha precisa ter ao menos 6 caracteres"),
    );
  });
});

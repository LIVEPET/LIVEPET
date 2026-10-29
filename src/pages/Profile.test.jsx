import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import Profile from "./Profile";
import { authService, petsService } from "@/services/api";

vi.mock("@/services/api", () => ({
  authService: {
    getMe: vi.fn(),
    getCurrentUser: vi.fn(),
    updateMe: vi.fn(),
  },
  petsService: { list: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const TUTOR = {
  id: 1,
  nome: "Yasmim Souza",
  email: "yasmim@livepet.com",
  telefone: "(62) 99999-0000",
  cidade: "Goiânia",
  estado: "GO",
  nome_canil: "",
  bio: "",
  foto_url: "",
  criado_em: "2026-01-10T12:00:00Z",
};

const PETS = [
  { id: 10, nome: "Thor", especie: "Cachorro", raca: "Golden Retriever" },
  { id: 11, nome: "Mia", especie: "Gato", raca: "" },
];

const renderizar = () =>
  render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <Profile />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  authService.getMe.mockResolvedValue(TUTOR);
  petsService.list.mockResolvedValue(PETS);
});

describe("<Profile />", () => {
  it("mostra o carregamento e depois o nome do tutor", async () => {
    renderizar();

    expect(screen.getByText("Carregando seu perfil...")).toBeInTheDocument();
    expect(await screen.findByText("Yasmim Souza")).toBeInTheDocument();
    expect(screen.queryByText("Carregando seu perfil...")).not.toBeInTheDocument();
  });

  it("mostra a quantidade e o nome de cada pet", async () => {
    renderizar();

    const aba = await screen.findByRole("tab", { name: /Meus Pets \(2\)/i });
    expect(aba).toBeInTheDocument();

    const painel = screen.getByRole("tabpanel");
    expect(within(painel).getByText("Thor")).toBeInTheDocument();
    expect(within(painel).getByText("Mia")).toBeInTheDocument();
  });

  it("mostra o convite quando o tutor não tem pets", async () => {
    petsService.list.mockResolvedValue([]);
    renderizar();

    expect(await screen.findByText("Nenhum pet cadastrado ainda")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cadastrar primeiro pet/i })).toHaveAttribute(
      "href",
      "/pets/novo",
    );
  });

  it("edita o nome e salva chamando authService.updateMe", async () => {
    const user = userEvent.setup();
    authService.updateMe.mockResolvedValue({ ...TUTOR, nome: "Yasmim Lima" });
    renderizar();

    await user.click(await screen.findByRole("button", { name: /Editar perfil/i }));
    const campoNome = await screen.findByLabelText(/Nome Completo/i);
    await user.clear(campoNome);
    await user.type(campoNome, "Yasmim Lima");
    await user.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    expect(authService.updateMe).toHaveBeenCalledTimes(1);
    expect(authService.updateMe).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Yasmim Lima", cidade: "Goiânia", estado: "GO" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Perfil salvo com sucesso!", expect.anything());
    expect(await screen.findByText("Yasmim Lima")).toBeInTheDocument();
  });

  it("não salva com nome vazio e avisa o tutor", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByRole("button", { name: /Editar perfil/i }));
    const campoNome = await screen.findByLabelText(/Nome Completo/i);
    await user.clear(campoNome);
    // Só espaços: passa pelo "required" do navegador e cai na validação da tela
    await user.type(campoNome, "   ");
    await user.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    expect(toast.error).toHaveBeenCalledWith("Informe seu nome completo.");
    expect(authService.updateMe).not.toHaveBeenCalled();
  });
});

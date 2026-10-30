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
  vi.restoreAllMocks();
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

  it("mostra o esqueleto da tela enquanto carrega", async () => {
    renderizar();

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    await screen.findByText("Yasmim Souza");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("avisa quando os pets não carregam, sem fingir lista vazia, e tenta de novo", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    petsService.list.mockRejectedValueOnce(new Error("Falha na rede"));
    renderizar();

    expect(await screen.findByText("Não foi possível carregar seus pets")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum pet cadastrado ainda")).not.toBeInTheDocument();
    expect(screen.getByText("Yasmim Souza")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tentar de novo/i }));

    expect(await screen.findByRole("tab", { name: /Meus Pets \(2\)/i })).toBeInTheDocument();
    expect(screen.queryByText("Não foi possível carregar seus pets")).not.toBeInTheDocument();
    expect(petsService.list).toHaveBeenCalledTimes(2);
  });

  it("avisa quando os dados do tutor não carregam e tenta de novo", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    authService.getMe.mockRejectedValueOnce(new Error("Falha na rede"));
    authService.getCurrentUser.mockReturnValueOnce(null);
    renderizar();

    expect(await screen.findByText("Não foi possível carregar seu perfil")).toBeInTheDocument();
    expect(screen.queryByText("Tutor Responsável")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tentar de novo/i }));

    expect(await screen.findByText("Yasmim Souza")).toBeInTheDocument();
    expect(screen.queryByText("Não foi possível carregar seu perfil")).not.toBeInTheDocument();
  });

  it("não mostra selo Oficial nem botão Compartilhar no cabeçalho", async () => {
    renderizar();

    await screen.findByText("Yasmim Souza");
    expect(screen.queryByText("Oficial")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Compartilhar perfil/i })).not.toBeInTheDocument();
  });

  it("pet com raça e sem linhagem não conta como pedigree", async () => {
    const user = userEvent.setup();
    renderizar();

    const aba = await screen.findByRole("tab", { name: /Pedigrees/i });
    expect(aba).not.toHaveTextContent("(1)");
    expect(aba).toHaveTextContent("(0)");

    await user.click(aba);
    expect(await screen.findByText("Nenhum pedigree cadastrado ainda")).toBeInTheDocument();
    expect(screen.queryByText(/CBKC/)).not.toBeInTheDocument();
  });

  it("lista só pets com linhagem, com o registro e o status reais", async () => {
    const user = userEvent.setup();
    petsService.list.mockResolvedValue([
      ...PETS,
      {
        id: 12,
        nome: "Luna",
        especie: "Cachorro",
        raca: "Border Collie",
        lineage: { registro: "CBKC 4521987", status_verificacao: "aprovado" },
      },
      { id: 13, nome: "Bob", especie: "Cachorro", raca: "Beagle", lineage: { status_verificacao: "declaratorio" } },
    ]);
    renderizar();

    const aba = await screen.findByRole("tab", { name: /Pedigrees \(2\)/i });
    await user.click(aba);

    const painel = await screen.findByRole("tabpanel");
    expect(within(painel).getByText("Luna")).toBeInTheDocument();
    expect(within(painel).getByText("Bob")).toBeInTheDocument();
    expect(within(painel).queryByText("Thor")).not.toBeInTheDocument();
    expect(within(painel).getByText("Registro: CBKC 4521987")).toBeInTheDocument();
    expect(within(painel).getAllByText(/^Registro:/)).toHaveLength(1);
    expect(within(painel).getByText("Verificado")).toBeInTheDocument();
    expect(within(painel).getByText("Declarado pelo tutor")).toBeInTheDocument();
    expect(within(painel).queryByText(/emitidos junto à CBKC/i)).not.toBeInTheDocument();
  });

  it("Cancelar descarta o que foi digitado e o modal reabre com os dados salvos", async () => {
    const user = userEvent.setup();
    renderizar();

    // Passo a passo do erro da #153: editar, trocar o nome, cancelar e abrir de novo
    await user.click(await screen.findByRole("button", { name: /Editar perfil/i }));
    const campoNome = await screen.findByLabelText(/Nome Completo/i);
    await user.clear(campoNome);
    await user.type(campoNome, "Nome que desisti");
    await user.click(screen.getByRole("button", { name: /^Cancelar$/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome Completo/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Editar perfil/i }));
    expect(await screen.findByLabelText(/Nome Completo/i)).toHaveValue("Yasmim Souza");
    expect(authService.updateMe).not.toHaveBeenCalled();
  });

  it("fechar com alterações pede confirmação e Continuar editando mantém o texto", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByRole("button", { name: /Editar perfil/i }));
    const campoCidade = await screen.findByLabelText(/Cidade/i);
    await user.clear(campoCidade);
    await user.type(campoCidade, "Palmas");
    await user.keyboard("{Escape}");

    const confirmacao = await screen.findByRole("alertdialog");
    expect(within(confirmacao).getByText("Descartar alterações?")).toBeInTheDocument();

    await user.click(within(confirmacao).getByRole("button", { name: /Continuar editando/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Cidade/i)).toHaveValue("Palmas");
  });

  it("fechar com alterações e escolher Descartar volta aos dados salvos", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByRole("button", { name: /Editar perfil/i }));
    const campoCidade = await screen.findByLabelText(/Cidade/i);
    await user.clear(campoCidade);
    await user.type(campoCidade, "Palmas");
    await user.click(screen.getByRole("button", { name: /Close/i }));

    const confirmacao = await screen.findByRole("alertdialog");
    await user.click(within(confirmacao).getByRole("button", { name: /^Descartar$/i }));

    expect(screen.queryByLabelText(/Cidade/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Editar perfil/i }));
    expect(await screen.findByLabelText(/Cidade/i)).toHaveValue("Goiânia");
  });

  it("fechar sem alterações não pede confirmação", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByRole("button", { name: /Editar perfil/i }));
    await screen.findByLabelText(/Nome Completo/i);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome Completo/i)).not.toBeInTheDocument();
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

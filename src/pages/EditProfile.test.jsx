import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import EditProfile from "./EditProfile";
import Profile from "./Profile";
import { authService, petsService } from "@/services/api";

vi.mock("@/services/api", () => ({
  authService: {
    getMe: vi.fn(),
    getCurrentUser: vi.fn(),
    updateMe: vi.fn(),
    verifyPassword: vi.fn(),
  },
  petsService: { list: vi.fn() },
}));

vi.mock("@/lib/image", () => ({
  compressImage: vi.fn(async () => "data:image/jpeg;base64,FOTO_NOVA"),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const TUTOR = {
  id: "user-123",
  nome: "Yasmim Souza",
  email: "yasmim@livepet.com",
  telefone: "(62) 99999-0000",
  cidade: "Goiânia",
  estado: "GO",
  nome_canil: "",
  bio: "Amante de animais",
  foto_url: "",
  criado_em: "2026-01-10T12:00:00Z",
};

const renderApp = (initialEntry = "/perfil/editar") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/perfil" element={<Profile />} />
        <Route path="/perfil/editar" element={<EditProfile />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  authService.getMe.mockResolvedValue(TUTOR);
  authService.getCurrentUser.mockReturnValue(TUTOR);
  petsService.list.mockResolvedValue([]);
});

describe("<EditProfile /> — Página dedicada sem modais", () => {
  it("renderiza a página dedicada com título, campos preenchidos e botão de voltar", async () => {
    renderApp("/perfil/editar");

    expect(await screen.findByText("Editar Perfil do Tutor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar para o perfil" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/i)).toHaveValue("Yasmim Souza");
    expect(screen.getByLabelText(/E-mail/i)).toHaveValue("yasmim@livepet.com");
    expect(screen.getByLabelText(/Telefone/i)).toHaveValue("(62) 99999-0000");
    expect(screen.getByLabelText(/Cidade/i)).toHaveValue("Goiânia");
    expect(screen.getByLabelText(/Estado \(UF\)/i)).toHaveValue("GO");
    expect(screen.getByLabelText(/Bio/i)).toHaveValue("Amante de animais");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite alterar dados e salva com sucesso chamando authService.updateMe e voltando para o perfil", async () => {
    const user = userEvent.setup();
    authService.updateMe.mockResolvedValue({
      ...TUTOR,
      nome: "Yasmim Lima",
      cidade: "Palmas",
      estado: "TO",
    });

    renderApp("/perfil/editar");

    const campoNome = await screen.findByLabelText(/Nome Completo/i);
    await user.clear(campoNome);
    await user.type(campoNome, "Yasmim Lima");

    const campoCidade = screen.getByLabelText(/Cidade/i);
    await user.clear(campoCidade);
    await user.type(campoCidade, "Palmas");

    const campoEstado = screen.getByLabelText(/Estado \(UF\)/i);
    await user.selectOptions(campoEstado, "TO");

    await user.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    expect(authService.updateMe).toHaveBeenCalledTimes(1);
    expect(authService.updateMe).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Yasmim Lima",
        cidade: "Palmas",
        estado: "TO",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Perfil salvo com sucesso!", expect.anything());
    expect(await screen.findByText("Yasmim Lima")).toBeInTheDocument();
  });

  it("clicar em Cancelar retorna para o perfil sem salvar", async () => {
    const user = userEvent.setup();
    renderApp("/perfil/editar");

    const campoNome = await screen.findByLabelText(/Nome Completo/i);
    await user.clear(campoNome);
    await user.type(campoNome, "Nome Cancelado");

    await user.click(screen.getByRole("button", { name: /^Cancelar$/i }));

    expect(authService.updateMe).not.toHaveBeenCalled();
    expect(await screen.findByText("Yasmim Souza")).toBeInTheDocument();
  });

  it("clicar em Voltar para o perfil retorna sem salvar", async () => {
    const user = userEvent.setup();
    renderApp("/perfil/editar");

    await screen.findByText("Editar Perfil do Tutor");
    await user.click(screen.getByRole("button", { name: /Voltar para o perfil/i }));

    expect(authService.updateMe).not.toHaveBeenCalled();
    expect(await screen.findByText("Yasmim Souza")).toBeInTheDocument();
  });

  it("foca automaticamente no campo telefone quando navegado com parâmetro de campo", async () => {
    renderApp("/perfil/editar?campo=telefone");

    const campoTel = await screen.findByLabelText(/Telefone/i);
    await waitFor(() => expect(campoTel).toHaveFocus());
  });
});

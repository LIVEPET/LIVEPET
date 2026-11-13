import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import NewVaccine from "./NewVaccine";
import PetHealth from "./PetHealth";
import { petsService } from "@/services/api";

vi.mock("@/services/api", () => ({
  petsService: {
    list: vi.fn(),
    addVaccine: vi.fn(),
  },
  getStoredUser: vi.fn(() => ({ nome: "Tutor Teste" })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const PETS = [
  { id: 1, nome: "Thor", especie: "Cachorro", raca: "Golden Retriever" },
  { id: 2, nome: "Mia", especie: "Gato", raca: "SRD" },
];

const renderPage = (initialEntry = "/saude/vacinas/nova?petId=1") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/saude" element={<PetHealth />} />
        <Route path="/saude/vacinas/nova" element={<NewVaccine />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  petsService.list.mockResolvedValue(PETS);
  petsService.addVaccine.mockResolvedValue({ id: 10, nome: "V10" });
});

describe("<NewVaccine /> — Página dedicada sem modais (/saude/vacinas/nova)", () => {
  it("renderiza a página com título, campos e link de voltar para saúde", async () => {
    renderPage("/saude/vacinas/nova?petId=1");

    expect(await screen.findByText(/Registrar Vacina/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Voltar para saúde do pet/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome da Vacina \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de Aplicação \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Próximo Reforço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número do Lote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Clínica \/ Veterinário/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar Vacina/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite registrar vacina com sucesso chamando petsService.addVaccine", async () => {
    const user = userEvent.setup();
    renderPage("/saude/vacinas/nova?petId=1");

    const inputNome = await screen.findByLabelText(/Nome da Vacina \*/i);
    await user.type(inputNome, "Antirrábica Anual");

    const inputLote = screen.getByLabelText(/Número do Lote/i);
    await user.type(inputLote, "LT-999");

    const botaoSalvar = screen.getByRole("button", { name: /Salvar Vacina/i });
    await user.click(botaoSalvar);

    await waitFor(() => {
      expect(petsService.addVaccine).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          nome: "Antirrábica Anual",
          lote: "LT-999",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Antirrábica Anual registrada com sucesso!"),
        expect.anything(),
      );
    });
  });

  it("exibe erro ao tentar submeter sem informar o nome", async () => {
    const user = userEvent.setup();
    renderPage("/saude/vacinas/nova?petId=1");

    const botaoSalvar = await screen.findByRole("button", { name: /Salvar Vacina/i });
    await user.click(botaoSalvar);

    expect(toast.error).toHaveBeenCalledWith("Informe o nome da vacina.");
  });
});

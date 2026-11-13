import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import NewMedicalRecord from "./NewMedicalRecord";
import MedicalHistory from "./MedicalHistory";
import { petsService } from "@/services/api";

vi.mock("@/services/api", () => ({
  petsService: {
    list: vi.fn(),
    addMedicalRecord: vi.fn(),
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

const renderPage = (initialEntry = "/historico-medico/novo?petId=1") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/historico-medico" element={<MedicalHistory />} />
        <Route path="/historico-medico/novo" element={<NewMedicalRecord />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  petsService.list.mockResolvedValue(PETS);
  petsService.addMedicalRecord.mockResolvedValue({ id: 50 });
});

describe("<NewMedicalRecord /> — Página dedicada sem modais (/historico-medico/novo)", () => {
  it("renderiza a página com título, campos e link de voltar para histórico", async () => {
    renderPage("/historico-medico/novo?petId=1");

    expect(await screen.findByText(/Novo Registro no Prontuário/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Voltar para histórico médico/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Pet \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de Atendimento \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Peso Aferido \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição \/ Laudo Clínico \*/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar no Histórico/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("salva o registro no prontuário com sucesso chamando petsService.addMedicalRecord", async () => {
    const user = userEvent.setup();
    renderPage("/historico-medico/novo?petId=1");

    const inputPeso = await screen.findByLabelText(/Peso Aferido \(kg\)/i);
    await user.type(inputPeso, "14.5");

    const inputDesc = screen.getByLabelText(/Descrição \/ Laudo Clínico \*/i);
    await user.type(inputDesc, "Consulta de rotina com exame cardiológico limpo.");

    const botaoSalvar = screen.getByRole("button", { name: /Salvar no Histórico/i });
    await user.click(botaoSalvar);

    await waitFor(() => {
      expect(petsService.addMedicalRecord).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          tipo: "Consulta de Rotina",
          descricao: "Consulta de rotina com exame cardiológico limpo.",
          peso_registrado: 14.5,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Registro clínico adicionado com sucesso!",
        expect.anything(),
      );
    });
  });

  it("exibe erro ao tentar salvar sem descrição", async () => {
    const user = userEvent.setup();
    renderPage("/historico-medico/novo?petId=1");

    const botaoSalvar = await screen.findByRole("button", { name: /Salvar no Histórico/i });
    await user.click(botaoSalvar);

    expect(toast.error).toHaveBeenCalledWith("Preencha a descrição do atendimento.");
  });
});

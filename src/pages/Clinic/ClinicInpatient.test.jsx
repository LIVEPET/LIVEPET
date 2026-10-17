import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider } from "@/contexts/ClinicContext";
import ClinicInpatient from "./ClinicInpatient";

vi.mock("@/services/api", () => ({
  clinicService: {
    getCurrentClinic: () => null,
    isAuthenticated: () => false,
    getProfile: vi.fn().mockResolvedValue(null),
    listPatients: vi.fn().mockResolvedValue([]),
    getSpecies: vi.fn().mockResolvedValue(["Cão", "Gato"]),
  },
}));

const renderInpatient = () =>
  render(
    <MemoryRouter initialEntries={["/clinica/internacao"]}>
      <ClinicProvider>
        <ClinicInpatient />
      </ClinicProvider>
    </MemoryRouter>,
  );

describe("ClinicInpatient — Mapa de Leitos e Internação Veterinária (Issue #82)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("inicia com todas as baias livres (sem pets de exemplo) e filtra por setor", () => {
    renderInpatient();

    // Contadores iniciais: 8 livres, 0 ocupadas, 0 em higienização
    expect(within(screen.getByTestId("counter-free-beds")).getByText("8")).toBeInTheDocument();
    expect(within(screen.getByTestId("counter-occupied-beds")).getByText("0")).toBeInTheDocument();
    expect(within(screen.getByTestId("counter-cleaning-beds")).getByText("0")).toBeInTheDocument();

    // Filtro por setor: Gatil
    fireEvent.click(screen.getByRole("tab", { name: "Gatil" }));
    expect(screen.getByTestId("bed-card-gatil-01")).toBeInTheDocument();
    expect(screen.queryByTestId("bed-card-canil-01")).not.toBeInTheDocument();
  });

  it("permite admitir paciente manualmente em baia Livre, exibir card ocupado completo, registrar evolução e mudar para Em Higienização ao dar Alta Médica", () => {
    renderInpatient();

    // 1. Clica na baia Livre (Canil 01) e admite um paciente manualmente
    const canil01 = screen.getByTestId("bed-card-canil-01");
    expect(within(canil01).getByText("Livre")).toBeInTheDocument();
    fireEvent.click(canil01);

    fireEvent.change(screen.getByLabelText(/Nome do Pet/i), { target: { value: "Max" } });
    fireEvent.change(screen.getByLabelText(/Veterinário Responsável/i), {
      target: { value: "Dr. Ricardo" },
    });
    fireEvent.change(screen.getByLabelText(/Motivo da Internação/i), {
      target: { value: "Desidratação severa" },
    });
    fireEvent.change(screen.getByLabelText(/Dieta Hospitalar/i), {
      target: { value: "Dieta líquida assistida" },
    });
    fireEvent.change(screen.getByLabelText(/Horário da Próxima Medicação/i), {
      target: { value: "16:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Internação/i }));

    // Agora Canil 01 deve estar Ocupada com Max e todos os campos destacados
    const occupiedCanil01 = screen.getByTestId("bed-card-canil-01");
    expect(within(occupiedCanil01).getByText("Ocupada")).toBeInTheDocument();
    expect(within(occupiedCanil01).getByText("Max")).toBeInTheDocument();
    expect(within(occupiedCanil01).getByText(/Dr\. Ricardo/)).toBeInTheDocument();
    expect(within(occupiedCanil01).getByText(/Desidratação severa/)).toBeInTheDocument();
    expect(within(occupiedCanil01).getByText(/Dieta líquida assistida/)).toBeInTheDocument();
    expect(within(occupiedCanil01).getByText("16:30")).toBeInTheDocument();

    // 2. Clica na baia Ocupada (Canil 01) para registrar evolução e dar Alta Médica
    fireEvent.click(occupiedCanil01);
    fireEvent.change(screen.getByLabelText(/Observações da Evolução Clínica/i), {
      target: { value: "Paciente apresentou excelente recuperação clínica." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Evolução/i }));
    expect(
      screen.getByText("Paciente apresentou excelente recuperação clínica."),
    ).toBeInTheDocument();

    // 3. Clica em Dar Alta Médica -> Baia deve mudar para Em Higienização
    fireEvent.click(screen.getByTestId("btn-discharge-patient"));

    const dischargedCanil01 = screen.getByTestId("bed-card-canil-01");
    expect(within(dischargedCanil01).getByText("Em Higienização")).toBeInTheDocument();

    // 4. Clica em Liberar baia -> volta para Livre
    fireEvent.click(within(dischargedCanil01).getByRole("button", { name: /Liberar baia/i }));
    expect(within(screen.getByTestId("bed-card-canil-01")).getByText("Livre")).toBeInTheDocument();
  });
});

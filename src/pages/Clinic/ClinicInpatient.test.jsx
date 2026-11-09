import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicInpatient from "./ClinicInpatient";
import ClinicPatients from "./ClinicPatients";

const savePdfMock = vi.fn();

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(function () {
      return {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
          },
        },
        setFillColor: vi.fn(),
        rect: vi.fn(),
        roundedRect: vi.fn(),
        setFont: vi.fn(),
        setFontSize: vi.fn(),
        setTextColor: vi.fn(),
        setDrawColor: vi.fn(),
        setLineWidth: vi.fn(),
        line: vi.fn(),
        text: vi.fn(),
        splitTextToSize: vi.fn((text) => [String(text)]),
        addPage: vi.fn(),
        save: savePdfMock,
      };
    }),
  };
});

vi.mock("@/services/api", () => ({
  clinicService: {
    getCurrentClinic: () => null,
    isAuthenticated: () => false,
    getProfile: vi.fn().mockResolvedValue(null),
    listPatients: vi.fn().mockResolvedValue([]),
    listAppointments: vi.fn().mockResolvedValue([]),
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

describe("ClinicInpatient — Mapa de Leitos, Aprazamento e Boletim de Alta (Issues #82 e #180)", () => {
  beforeEach(() => {
    stubRadixForJsdom();
    window.localStorage.clear();
    savePdfMock.mockClear();
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

  it("Issue #180: gerencia o Mapa de Aprazamento no leito, exibe doses pendentes vs administradas no card, emite Boletim de Alta Timbrado (PDF/Impressão) e sincroniza o histórico no prontuário do paciente", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        profile: {
          name: "Hospital Veterinário Vida Pet",
          crmv: "CRMV-SP 99887",
          phone: "(11) 4002-8922",
          address: "Rua das Acácias, 450 — São Paulo, SP",
          services: [],
          hours: [],
          team: ["Dra. Helena Costa"],
        },
        appointments: [],
        patients: [
          {
            id: "pat-apollo-1",
            name: "Apollo",
            species: "Cão",
            breed: "Labrador",
            age: "4 anos",
            weight: "28 kg",
            tutor: "Fernanda Lima",
            phone: "(11) 97766-5544",
            alerts: [],
            vaccines: [],
            history: [],
          },
        ],
        beds: [],
      }),
    );

    render(
      <MemoryRouter initialEntries={["/clinica/internacao"]}>
        <ClinicProvider>
          <ClinicInpatient />
          <ClinicPatients />
        </ClinicProvider>
      </MemoryRouter>,
    );

    // 1. Admite o paciente Apollo no Canil 01
    fireEvent.click(screen.getByTestId("bed-card-canil-01"));
    fireEvent.change(screen.getByLabelText(/Nome do Pet/i), { target: { value: "Apollo" } });
    fireEvent.change(screen.getByLabelText(/^Tutor$/i), { target: { value: "Fernanda Lima" } });
    fireEvent.change(screen.getByLabelText(/Veterinário Responsável/i), {
      target: { value: "Dra. Helena Costa" },
    });
    fireEvent.change(screen.getByLabelText(/Motivo da Internação/i), {
      target: { value: "Gastroenterite aguda" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Internação/i }));

    // 2. Abre o prontuário da baia e adiciona 2 itens ao Mapa de Aprazamento
    fireEvent.click(screen.getByTestId("bed-card-canil-01"));

    const medSection = screen.getByTestId("medication-schedule-section");
    fireEvent.change(within(medSection).getByLabelText(/Medicamento \/ Cuidado/i), {
      target: { value: "Ondansetrona" },
    });
    fireEvent.change(within(medSection).getByLabelText(/Dose \/ Via/i), {
      target: { value: "0,5 mg/kg IV" },
    });
    fireEvent.change(within(medSection).getByLabelText(/Horário/i), {
      target: { value: "10:00" },
    });
    fireEvent.click(screen.getByTestId("btn-add-medication-schedule"));

    fireEvent.change(within(medSection).getByLabelText(/Medicamento \/ Cuidado/i), {
      target: { value: "Dipirona Sódica" },
    });
    fireEvent.change(within(medSection).getByLabelText(/Dose \/ Via/i), {
      target: { value: "25 mg/kg IV" },
    });
    fireEvent.change(within(medSection).getByLabelText(/Horário/i), {
      target: { value: "16:00" },
    });
    fireEvent.click(screen.getByTestId("btn-add-medication-schedule"));

    expect(screen.getByTestId("schedule-administered-badge")).toHaveTextContent("0 administrada(s)");
    expect(screen.getByTestId("schedule-pending-badge")).toHaveTextContent("2 pendente(s)");

    // 3. Marca a primeira dose (Ondansetrona) como Administrado
    const checkButtons = within(screen.getByTestId("medication-schedule-list")).getAllByRole(
      "button",
      { name: /Checar dose/i },
    );
    fireEvent.click(checkButtons[0]);

    expect(screen.getByTestId("schedule-administered-badge")).toHaveTextContent("1 administrada(s)");
    expect(screen.getByTestId("schedule-pending-badge")).toHaveTextContent("1 pendente(s)");

    // Verifica no card da baia o indicador de doses pendentes vs administradas
    const bedProgress = screen.getByTestId("bed-med-progress-canil-01");
    expect(bedProgress).toHaveTextContent(/1\/2 administrada\(s\)/i);
    expect(bedProgress).toHaveTextContent(/1 pendente\(s\)/i);

    // 4. Registra uma evolução clínica e recomendações de alta
    fireEvent.change(screen.getByLabelText(/Temperatura \(°C\)/i), {
      target: { value: "38.4" },
    });
    fireEvent.change(screen.getByLabelText(/Observações da Evolução Clínica/i), {
      target: { value: "Normohidratado, sem êmese nas últimas 12h." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Evolução/i }));

    fireEvent.change(screen.getByLabelText(/Recomendações de Alta Hospitalar/i), {
      target: { value: "Manter dieta gastrointestinal pastosa por 5 dias e retorno em 7 dias." },
    });

    // 5. Abre o Boletim de Alta Hospitalar Timbrado e testa Impressão + PDF + Conclusão de Alta
    fireEvent.click(screen.getByTestId("btn-open-discharge-bulletin"));

    const preview = screen.getByTestId("discharge-bulletin-preview");
    expect(within(preview).getByText("Hospital Veterinário Vida Pet")).toBeInTheDocument();
    expect(within(preview).getAllByText(/CRMV-SP 99887/i).length).toBeGreaterThan(0);
    expect(within(preview).getByText(/Gastroenterite aguda/i)).toBeInTheDocument();
    expect(within(preview).getByText(/Ondansetrona/i)).toBeInTheDocument();
    expect(within(preview).getByText(/Normohidratado, sem êmese/i)).toBeInTheDocument();
    expect(
      within(preview).getByText(/Manter dieta gastrointestinal pastosa por 5 dias/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Imprimir/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Baixar PDF/i }));
    expect(savePdfMock).toHaveBeenCalledTimes(1);

    // Conclui a alta diretamente pelo Boletim de Alta
    fireEvent.click(screen.getByTestId("btn-confirm-discharge-from-bulletin"));

    // 6. Verifica sincronização na linha do tempo (history) do prontuário do paciente em ClinicPatients
    const rawSaved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const apolloPatient = rawSaved.patients.find((p) => p.name === "Apollo");
    expect(apolloPatient.history.length).toBe(1);
    expect(apolloPatient.history[0].type).toBe("Alta Hospitalar (Canil 01)");
    expect(apolloPatient.history[0].summary).toMatch(/Motivo: Gastroenterite aguda/i);
    expect(apolloPatient.history[0].summary).toMatch(/1 dose\(s\) administrada\(s\)/i);
    expect(apolloPatient.history[0].summary).toMatch(
      /Manter dieta gastrointestinal pastosa por 5 dias/i,
    );

    printSpy.mockRestore();
  });
});

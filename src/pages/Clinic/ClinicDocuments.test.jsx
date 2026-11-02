import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicSchedule from "./ClinicSchedule";
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
    createAppointment: vi.fn().mockResolvedValue({}),
    updateAppointmentStatus: vi.fn().mockResolvedValue({}),
    concludeAppointment: vi.fn().mockResolvedValue({}),
  },
}));

const seedState = () => {
  const initialState = {
    version: 1,
    profile: {
      name: "Hospital Veterinário São Francisco",
      crmv: "CRMV-SP 55443-J",
      phone: "(11) 3344-5566",
      email: "contato@saofco.vet.br",
      address: "Av. Paulista, 1500 — São Paulo, SP",
      hours: [],
      about: "",
      monthlyRevenueGoal: 20000,
      services: ["Consulta Clínica"],
      team: ["Dra. Camila Mendes"],
    },
    appointments: [
      {
        id: "app-doc-1",
        patientId: "pat-doc-1",
        date: new Date().toISOString().split("T")[0],
        time: "14:30",
        petName: "Simba",
        species: "Gato",
        breed: "Maine Coon",
        tutor: "Beatriz Souza",
        phone: "(11) 98877-6655",
        service: "Cirurgia Eletiva",
        vet: "Dra. Camila Mendes",
        status: "Concluído",
        priority: "Rotina",
        temperatura: 38.4,
        peso: 6.8,
        frequencia_cardiaca: 160,
        frequencia_respiratoria: 28,
        mucosas: "Normocoradas",
        diagnostico: "Higidez clínica confirmada em avaliação pré-operatória.",
      },
    ],
    patients: [
      {
        id: "pat-doc-1",
        name: "Simba",
        species: "Gato",
        breed: "Maine Coon",
        age: "3 anos",
        weight: "6.8 kg",
        tutor: "Beatriz Souza",
        phone: "(11) 98877-6655",
        vaccinesUpToDate: true,
        lastVisit: "Hoje",
        alerts: [],
        history: [],
      },
    ],
    inpatients: [],
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
};

describe("Issue #132 - Gerador Visual de Atestado de Saúde, Termo de Consentimento e Declaração", () => {
  beforeEach(() => {
    stubRadixForJsdom();
    window.localStorage.clear();
    savePdfMock.mockClear();
    seedState();
  });

  it("abre o gerador na Agenda com 3 modelos, cabeçalho timbrado, vitais aferidos, assinatura do tutor no Termo e exporta PDF/Impressão", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <ClinicProvider>
          <ClinicSchedule />
        </ClinicProvider>
      </MemoryRouter>,
    );

    const openDocBtn = screen.getByTestId("open-documents-app-doc-1");
    fireEvent.click(openDocBtn);

    // 1. Verifica os 3 seletores de modelos clínicos
    const selector = screen.getByTestId("document-template-selector");
    expect(within(selector).getByText("Atestado de Saúde Veterinário")).toBeInTheDocument();
    expect(
      within(selector).getByText("Termo de Consentimento para Procedimento / Internação"),
    ).toBeInTheDocument();
    expect(within(selector).getByText("Declaração de Comparecimento")).toBeInTheDocument();

    // 2. Verifica preenchimento automático do cabeçalho timbrado, paciente/tutor e últimos sinais vitais
    const preview = screen.getByTestId("clinical-document-preview");
    expect(within(preview).getByText("Hospital Veterinário São Francisco")).toBeInTheDocument();
    expect(within(preview).getAllByText(/CRMV-SP 55443-J/i).length).toBeGreaterThan(0);
    expect(within(preview).getByText(/Av\. Paulista, 1500/i)).toBeInTheDocument();
    expect(within(preview).getByText("Simba")).toBeInTheDocument();
    expect(within(preview).getAllByText("Beatriz Souza").length).toBeGreaterThan(0);

    const vitalsBox = within(preview).getByTestId("document-vitals-summary");
    expect(within(vitalsBox).getByText(/6\.8 kg/i)).toBeInTheDocument();
    expect(within(vitalsBox).getByText(/38\.4 °C/i)).toBeInTheDocument();
    expect(within(vitalsBox).getByText(/160 bpm/i)).toBeInTheDocument();
    expect(within(vitalsBox).getByText(/Normocoradas/i)).toBeInTheDocument();

    // No Atestado de Saúde, há assinatura do veterinário mas não do tutor
    expect(within(preview).getByTestId("vet-signature-block")).toBeInTheDocument();
    expect(within(preview).queryByTestId("tutor-signature-block")).not.toBeInTheDocument();

    // 3. Alterna para Termo de Consentimento e verifica bloco de assinatura do tutor
    fireEvent.click(screen.getByTestId("template-option-termo_consentimento"));
    expect(within(preview).getByTestId("vet-signature-block")).toBeInTheDocument();
    expect(within(preview).getByTestId("tutor-signature-block")).toBeInTheDocument();

    // 4. Personaliza observações complementares e verifica atualização em tempo real no preview
    const obsInput = screen.getByLabelText(/Observações Complementares/i);
    fireEvent.change(obsInput, {
      target: { value: "Jejum alimentar de 8 horas confirmado pelo responsável." },
    });
    expect(
      within(preview).getByText("Jejum alimentar de 8 horas confirmado pelo responsável."),
    ).toBeInTheDocument();

    // 5. Alterna para Declaração de Comparecimento
    fireEvent.click(screen.getByTestId("template-option-declaracao_comparecimento"));
    expect(
      within(preview).getByText(/esteve presente na Hospital Veterinário São Francisco/i),
    ).toBeInTheDocument();

    // 6. Testa botões Imprimir e Baixar PDF
    fireEvent.click(screen.getByRole("button", { name: /Imprimir/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Baixar PDF/i }));
    expect(savePdfMock).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it("permite emitir documentos clínicos diretamente a partir da ficha do paciente na aba Pacientes", () => {
    render(
      <MemoryRouter>
        <ClinicProvider>
          <ClinicPatients />
        </ClinicProvider>
      </MemoryRouter>,
    );

    // Abre a ficha lateral do paciente Simba
    fireEvent.click(screen.getByText("Simba"));

    const emitBtn = screen.getByTestId("open-patient-documents-btn");
    fireEvent.click(emitBtn);

    const preview = screen.getByTestId("clinical-document-preview");
    expect(within(preview).getByText("Hospital Veterinário São Francisco")).toBeInTheDocument();
    expect(within(preview).getByText("Simba")).toBeInTheDocument();
    expect(within(preview).getByTestId("document-vitals-summary")).toBeInTheDocument();
  });
});

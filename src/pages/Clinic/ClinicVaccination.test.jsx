import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PatientVaccinationSection } from "./PatientVaccination";
import ClinicDashboard from "./ClinicDashboard";
import { ClinicProvider } from "@/contexts/ClinicContext";

describe("Clinic Vaccination Management (Issue #131)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("PatientVaccinationSection", () => {
    const mockPatient = {
      id: "pat-1",
      name: "Rex",
      tutor: "Carlos Silva",
      vaccines: [
        {
          id: "vac-1",
          nome: "V8 Canina",
          lote: "LOTE-998",
          data_aplicacao: "2025-10-01",
          proxima_dose: "2026-10-01", // Atrasada
          veterinario: "Clínica Anterior",
        },
      ],
    };

    const mockAppointments = [
      {
        id: "apt-1",
        petName: "Rex",
        tutor: "Carlos Silva",
        date: "2026-11-01",
        vet: "Dra. Paula",
        vacina_aplicada: "Antirrábica",
        vacina_lote: "LOTE-RAIV-2026",
        vacina_proxima_dose: "2027-11-01", // Em dia
      },
    ];

    it("renderiza histórico consolidado de vacinas de atendimentos e manuais", () => {
      render(
        <PatientVaccinationSection
          patient={mockPatient}
          appointments={mockAppointments}
          onAddVaccine={vi.fn()}
        />,
      );

      expect(screen.getByText("Carteira de Vacinação")).toBeInTheDocument();
      expect(screen.getByText("2 doses registradas")).toBeInTheDocument();
      expect(screen.getByText("V8 Canina")).toBeInTheDocument();
      expect(screen.getByText("Antirrábica")).toBeInTheDocument();
      expect(screen.getByText("LOTE-998")).toBeInTheDocument();
      expect(screen.getByText("LOTE-RAIV-2026")).toBeInTheDocument();
      expect(screen.getByText("Dra. Paula")).toBeInTheDocument();
    });

    it("calcula e exibe badges de status corretos para doses", () => {
      render(
        <PatientVaccinationSection
          patient={mockPatient}
          appointments={mockAppointments}
          onAddVaccine={vi.fn()}
        />,
      );

      const statusBadges = screen.getAllByTestId("dose-status-badge");
      expect(statusBadges.some((b) => b.textContent.includes("Atrasada"))).toBe(true);
      expect(statusBadges.some((b) => b.textContent.includes("Em dia"))).toBe(true);
    });

    it("permite registrar manualmente uma dose pregressa via modal", () => {
      const onAddVaccineMock = vi.fn();
      render(
        <PatientVaccinationSection
          patient={mockPatient}
          appointments={mockAppointments}
          onAddVaccine={onAddVaccineMock}
        />,
      );

      const openBtn = screen.getByTestId("btn-add-vaccine");
      fireEvent.click(openBtn);

      expect(screen.getByText(/Registrar Vacina \/ Dose Pregressa/i)).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Nome da vacina/i);
      const loteInput = screen.getByLabelText(/Lote/i);
      const nextDoseInput = screen.getByLabelText(/Próxima dose/i);

      fireEvent.change(nameInput, { target: { value: "Giárdia" } });
      fireEvent.change(loteInput, { target: { value: "LOTE-GIA-123" } });
      fireEvent.change(nextDoseInput, { target: { value: "2027-01-15" } });

      const submitBtn = screen.getByTestId("submit-vaccine-btn");
      fireEvent.click(submitBtn);

      expect(onAddVaccineMock).toHaveBeenCalledWith(
        "pat-1",
        expect.objectContaining({
          nome: "Giárdia",
          lote: "LOTE-GIA-123",
          proxima_dose: "2027-01-15",
        }),
      );
    });

    it("exibe estado vazio quando o pet não possui nenhuma vacina", () => {
      const emptyPatient = { id: "pat-2", name: "Bolinha", vaccines: [] };
      render(
        <PatientVaccinationSection
          patient={emptyPatient}
          appointments={[]}
          onAddVaccine={vi.fn()}
        />,
      );

      expect(screen.getByText("Nenhuma vacina registrada")).toBeInTheDocument();
      expect(screen.getByText("Sem registro")).toBeInTheDocument();
    });
  });

  describe("ClinicDashboard Vaccine Alerts", () => {
    it("destaca pacientes com reforço vacinal atrasado ou próximo no bloco Precisam de Atenção", () => {
      const storageData = {
        patients: [
          {
            id: "p-alert-1",
            name: "Max Atrasado",
            tutor: "Ana",
            alerts: [],
            vaccines: [
              {
                nome: "V10",
                data_aplicacao: "2025-10-01",
                proxima_dose: "2026-10-01", // Atrasada
              },
            ],
          },
          {
            id: "p-alert-2",
            name: "Mel Saudável",
            tutor: "Beto",
            alerts: [],
            vaccines: [
              {
                nome: "Raiva",
                data_aplicacao: "2026-10-01",
                proxima_dose: "2027-10-01", // Em dia
              },
            ],
          },
        ],
        appointments: [],
      };

      localStorage.setItem("livepet_clinic_data", JSON.stringify(storageData));

      render(
        <MemoryRouter>
          <ClinicProvider>
            <ClinicDashboard />
          </ClinicProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText("Precisam de atenção")).toBeInTheDocument();
      expect(screen.getByText("Max Atrasado")).toBeInTheDocument();
      expect(screen.getByText("Vacina atrasada")).toBeInTheDocument();
      expect(screen.queryByText("Mel Saudável")).not.toBeInTheDocument();
    });
  });
});

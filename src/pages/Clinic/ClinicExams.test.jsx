import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicLayout from "./ClinicLayout";
import ClinicSchedule from "./ClinicSchedule";
import ClinicPatients from "./ClinicPatients";
import { QUICK_EXAM_OPTIONS } from "./ClinicExams";

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

const today = new Date().toISOString().split("T")[0];

const seedClinic = ({ appointments = [], patients = [] }) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profile: {
        name: "Clínica Vet Diagnóstico",
        crmv: "CRMV-SP 12345",
        services: ["Consulta clínica"],
        team: ["Dr. Lucas Mendes"],
        hours: [],
      },
      appointments,
      patients,
    }),
  );
};

const renderClinicApp = (initialEntry = "/clinica/agenda") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ClinicProvider>
        <Routes>
          <Route path="/clinica" element={<ClinicLayout />}>
            <Route path="agenda" element={<ClinicSchedule />} />
            <Route path="pacientes" element={<ClinicPatients />} />
          </Route>
        </Routes>
      </ClinicProvider>
    </MemoryRouter>,
  );

describe("ClinicExams — Solicitação de Exames Complementares e Laudos (Issue #86)", () => {
  beforeEach(() => {
    stubRadixForJsdom();
    window.localStorage.clear();
  });

  it("exibe botões de seleção rápida e campo personalizado no modal de Atendimento Clínico e salva os exames ao concluir", () => {
    seedClinic({
      appointments: [
        {
          id: "app-ex-1",
          date: today,
          time: "11:00",
          petName: "Simba",
          species: "Cão",
          breed: "Golden Retriever",
          tutor: "Ricardo",
          phone: "(11) 98888-1234",
          service: "Consulta clínica",
          vet: "Dr. Lucas Mendes",
          status: "Em atendimento",
          priority: "Rotina",
        },
      ],
      patients: [
        {
          id: "p-simba",
          name: "Simba",
          species: "Cão",
          breed: "Golden Retriever",
          age: "4 anos",
          weight: "28 kg",
          tutor: "Ricardo",
          phone: "(11) 98888-1234",
          alerts: [],
          vaccinesUpToDate: true,
          lastVisit: today,
          history: [],
        },
      ],
    });

    renderClinicApp("/clinica/agenda");

    const card = screen.getByTestId("appointment-card-app-ex-1");
    fireEvent.click(within(card).getByRole("button", { name: /atender \/ concluir/i }));

    const examsSection = screen.getByTestId("complementary-exams-section");
    expect(within(examsSection).getByText("Exames Complementares")).toBeInTheDocument();

    // Verifica todos os 7 botões de seleção rápida exigidos no critério de aceite
    QUICK_EXAM_OPTIONS.forEach((examName) => {
      expect(
        within(examsSection).getByRole("button", { name: examName }),
      ).toBeInTheDocument();
    });

    // Seleciona "Hemograma Completo" e "Ultrassonografia" via botões rápidos
    fireEvent.click(within(examsSection).getByRole("button", { name: "Hemograma Completo" }));
    fireEvent.click(within(examsSection).getByRole("button", { name: "Ultrassonografia" }));

    // Adiciona um exame personalizado ("Ecocardiograma Doppler")
    fireEvent.change(
      within(examsSection).getByLabelText(/outro exame complementar/i),
      { target: { value: "Ecocardiograma Doppler" } },
    );
    fireEvent.click(within(examsSection).getByRole("button", { name: /adicionar exame/i }));

    const selectedList = screen.getByTestId("selected-exams-list");
    expect(within(selectedList).getByText("Hemograma Completo")).toBeInTheDocument();
    expect(within(selectedList).getByText("Ultrassonografia")).toBeInTheDocument();
    expect(within(selectedList).getByText("Ecocardiograma Doppler")).toBeInTheDocument();

    // Conclui a consulta
    fireEvent.click(screen.getByRole("button", { name: /concluir e registrar no prontuário/i }));

    // Verifica que os exames ficaram salvos junto ao registro do atendimento no localStorage
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const concludedApp = saved.appointments.find((a) => a.id === "app-ex-1");
    expect(concludedApp.status).toBe("Concluído");
    expect(concludedApp.exames_complementares).toHaveLength(3);
    expect(concludedApp.exames_complementares.map((e) => e.nome)).toEqual([
      "Hemograma Completo",
      "Ultrassonografia",
      "Ecocardiograma Doppler",
    ]);
  });

  it("exibe os exames vinculados no painel lateral do paciente com badges de status e permite registrar o resultado/laudo", () => {
    seedClinic({
      patients: [
        {
          id: "p-nala",
          name: "Nala",
          species: "Gato",
          breed: "Siamês",
          age: "2 anos",
          weight: "3.8 kg",
          tutor: "Beatriz",
          phone: "(11) 97777-4321",
          alerts: [],
          vaccinesUpToDate: true,
          lastVisit: "25/10/2026",
          history: [],
        },
      ],
      appointments: [
        {
          id: "app-ex-2",
          date: "2026-10-25",
          time: "15:00",
          petName: "Nala",
          species: "Gato",
          breed: "Siamês",
          tutor: "Beatriz",
          phone: "(11) 97777-4321",
          service: "Consulta clínica",
          vet: "Dr. Lucas Mendes",
          status: "Concluído",
          exames_complementares: [
            {
              id: "ex-hemograma",
              nome: "Hemograma Completo",
              status: "Solicitado",
              resultado: "",
            },
            {
              id: "ex-renal",
              nome: "Perfil Renal",
              status: "Concluído / Laudo",
              resultado: "Ureia e creatinina dentro dos valores de referência para felinos.",
            },
          ],
        },
      ],
    });

    renderClinicApp("/clinica/pacientes");

    // Abre o painel lateral (Sheet) da paciente Nala
    fireEvent.click(screen.getByText("Nala"));

    const examsSection = screen.getByTestId("patient-exams-section");
    expect(
      within(examsSection).getByText("Exames Complementares & Laudos"),
    ).toBeInTheDocument();

    // Verifica os cards dos dois exames e seus badges iniciais
    const hemogramaCard = within(examsSection).getByTestId(
      "patient-exam-card-Hemograma Completo",
    );
    expect(within(hemogramaCard).getByText("Solicitado")).toBeInTheDocument();

    const renalCard = within(examsSection).getByTestId("patient-exam-card-Perfil Renal");
    expect(within(renalCard).getByText("Concluído / Laudo")).toBeInTheDocument();
    expect(
      within(renalCard).getByText(
        /Ureia e creatinina dentro dos valores de referência/i,
      ),
    ).toBeInTheDocument();

    // Registra o resultado/observação para o Hemograma Completo
    fireEvent.click(
      within(hemogramaCard).getByRole("button", { name: /registrar laudo/i }),
    );
    fireEvent.change(
      within(hemogramaCard).getByLabelText(/resultado \/ observação do exame/i),
      {
        target: {
          value: "Série vermelha e branca sem alterações. Plaquetas normais.",
        },
      },
    );
    fireEvent.click(within(hemogramaCard).getByRole("button", { name: /salvar laudo/i }));

    // Verifica que o status mudou para "Concluído / Laudo" e o resultado aparece no card
    expect(within(hemogramaCard).getByText("Concluído / Laudo")).toBeInTheDocument();
    expect(
      within(hemogramaCard).getByText(
        /Série vermelha e branca sem alterações\. Plaquetas normais\./i,
      ),
    ).toBeInTheDocument();
  });
});


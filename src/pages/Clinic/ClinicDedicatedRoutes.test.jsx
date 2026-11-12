import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicSchedule from "./ClinicSchedule";
import ClinicEditAppointment from "./ClinicEditAppointment";
import ClinicConsultation from "./ClinicConsultation";
import ClinicDocumentsPage from "./ClinicDocumentsPage";
import ClinicPrescriptionPage from "./ClinicPrescriptionPage";
import ClinicReceiptPage from "./ClinicReceiptPage";

vi.mock("@/services/api", () => ({
  getClinicAuthToken: () => null,
  clinicService: {
    getCurrentClinic: () => null,
    isAuthenticated: () => false,
    getProfile: vi.fn().mockResolvedValue(null),
    listPatients: vi.fn().mockResolvedValue([]),
    listAppointments: vi.fn().mockResolvedValue([]),
    getSpecies: vi.fn().mockResolvedValue(["Cão", "Gato"]),
    createAppointment: vi.fn().mockResolvedValue({}),
    updateAppointment: vi.fn().mockResolvedValue({}),
    deleteAppointment: vi.fn().mockResolvedValue(null),
    updateAppointmentStatus: vi.fn().mockResolvedValue({}),
    concludeAppointment: vi.fn().mockResolvedValue({}),
  },
}));

const today = new Date().toISOString().split("T")[0];

const seedClinicData = () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profile: {
        name: "Clínica Vet Modelo",
        crmv: "CRMV-SP 12345",
        phone: "(11) 3344-5566",
        address: "Rua das Flores, 100",
        services: ["Consulta clínica"],
        team: ["Dra. Sofia Mendes"],
        hours: [],
      },
      appointments: [
        {
          id: "app-test-1",
          patientId: "pat-1",
          date: today,
          time: "10:00",
          petName: "Max",
          species: "Cão",
          breed: "Poodle",
          tutor: "Juliana Silva",
          phone: "(11) 98888-0000",
          service: "Consulta clínica",
          vet: "Dra. Sofia Mendes",
          status: "Confirmado",
          priority: "Rotina",
          peso: 8.5,
          temperatura: 38.6,
          frequencia_cardiaca: 120,
          frequencia_respiratoria: 26,
          mucosas: "Normocoradas",
          diagnostico: "Gastroenterite leve",
          prescricao: "Manter hidratação oral.",
          prescricao_itens: [
            {
              id: "item-1",
              nome: "Omeprazol Vet",
              concentracao: "10 mg",
              via: "Uso Oral",
              posologia: "1 cápsula pela manhã",
              duracao: "7 dias",
            },
          ],
          notes: "Tutor relata vômitos pontuais",
        },
      ],
      patients: [
        {
          id: "pat-1",
          name: "Max",
          species: "Cão",
          breed: "Poodle",
          age: "3 anos",
          weight: "8.5 kg",
          tutor: "Juliana Silva",
          phone: "(11) 98888-0000",
          vaccinesUpToDate: true,
          lastVisit: today,
          alerts: [],
          history: [],
        },
      ],
    }),
  );
};

const renderAppWithRoutes = (initialEntry = "/clinica/agenda") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ClinicProvider>
        <Routes>
          <Route path="/clinica/agenda" element={<ClinicSchedule />} />
          <Route path="/clinica/agenda/editar/:id" element={<ClinicEditAppointment />} />
          <Route path="/clinica/atendimento/:id" element={<ClinicConsultation />} />
          <Route path="/clinica/documentos/:id" element={<ClinicDocumentsPage />} />
          <Route path="/clinica/prescricao/:id" element={<ClinicPrescriptionPage />} />
          <Route path="/clinica/recibo/:id" element={<ClinicReceiptPage />} />
        </Routes>
      </ClinicProvider>
    </MemoryRouter>,
  );

beforeAll(stubRadixForJsdom);
beforeEach(() => {
  window.localStorage.clear();
  seedClinicData();
});

describe("Etapa 4 — Rotas dedicadas da Clínica (Sem modais flutuantes)", () => {
  it("navega da Agenda para a rota dedicada de edição e volta após salvar", async () => {
    renderAppWithRoutes("/clinica/agenda");

    fireEvent.click(screen.getByRole("button", { name: "Editar atendimento de Max" }));

    // Página dedicada em tela cheia com botão de retorno
    expect(await screen.findByText("Editar atendimento: Max")).toBeInTheDocument();
    expect(screen.getByText("Voltar para a agenda")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();

    // Atualiza o horário e salva
    const inputHora = screen.getByLabelText("Horário");
    fireEvent.change(inputHora, { target: { value: "15:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    // Retorna para a agenda com o novo horário exibido
    await waitFor(() => expect(screen.getByText("15:00")).toBeInTheDocument());
  });

  it("navega da Agenda para a rota de Atendimento Clínico & Anamnese em tela cheia", async () => {
    renderAppWithRoutes("/clinica/agenda");

    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }));

    // Página de consulta
    expect(await screen.findByText("Atendimento Clínico & Anamnese")).toBeInTheDocument();
    expect(screen.getByText("Classificação de Risco (Triagem Veterinária)")).toBeInTheDocument();
    expect(screen.getByText("Sinais Vitais e Avaliação Física")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();

    // Conclui atendimento
    fireEvent.click(screen.getByRole("button", { name: "Concluir e registrar no prontuário" }));

    await waitFor(() => expect(screen.getByText("Atendimentos de hoje")).toBeInTheDocument());
  });

  it("navega para a rota de Emissão de Documentos Clínicos sem abrir modal", async () => {
    renderAppWithRoutes("/clinica/agenda");

    const docBtn = screen.getByTestId("open-documents-app-test-1");
    fireEvent.click(docBtn);

    expect(await screen.findByText("Emissor de Documentos Clínicos Timbrados")).toBeInTheDocument();
    expect(screen.getByTestId("document-template-selector")).toBeInTheDocument();
    expect(screen.getByTestId("clinical-document-preview")).toBeInTheDocument();
    expect(screen.getByText("Voltar para a agenda")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("navega para a rota de Receituário Timbrado sem abrir modal", async () => {
    renderAppWithRoutes("/clinica/agenda");

    const rxBtn = screen.getByRole("button", { name: /visualizar receituário/i });
    fireEvent.click(rxBtn);

    expect(await screen.findByText("Receituário Veterinário Timbrado")).toBeInTheDocument();
    expect(screen.getByTestId("prescription-sheet-preview")).toBeInTheDocument();
    expect(screen.getByText("Voltar para a agenda")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("navega para a rota de Recibo de Atendimento sem abrir modal", async () => {
    renderAppWithRoutes("/clinica/agenda");

    const receiptBtn = screen.getByTestId("btn-receipt-app-test-1");
    fireEvent.click(receiptBtn);

    expect(await screen.findByText("Recibo de Atendimento")).toBeInTheDocument();
    expect(screen.getByTestId("receipt-preview")).toBeInTheDocument();
    expect(screen.getByText("Voltar para a agenda")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("exibe confirmação de exclusão inline diretamente no card sem abrir alertdialog modal", async () => {
    renderAppWithRoutes("/clinica/agenda");

    expect(screen.queryByRole("alertdialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Excluir atendimento de Max" }));

    const inlineConfirm = await screen.findByRole("alertdialog");
    expect(within(inlineConfirm).getByText("Excluir este atendimento?")).toBeInTheDocument();
    expect(within(inlineConfirm).getByRole("button", { name: "Manter" })).toBeInTheDocument();
    expect(within(inlineConfirm).getByRole("button", { name: "Excluir" })).toBeInTheDocument();

    // Cancelar mantém o registro
    fireEvent.click(within(inlineConfirm).getByRole("button", { name: "Manter" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(screen.getByText("Max")).toBeInTheDocument();
  });
});


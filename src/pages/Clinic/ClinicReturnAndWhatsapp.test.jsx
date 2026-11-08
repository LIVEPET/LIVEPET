import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicSchedule from "./ClinicSchedule";
import { addDaysToIsoDate, buildWhatsAppUrl } from "./ClinicReturnAndWhatsapp";

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

const todayIso = new Date().toISOString().split("T")[0];

const seedState = () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profile: {
        name: "Clínica Veterinária Central Pet",
        crmv: "CRMV-SP 44556",
        phone: "(11) 3222-4455",
        whatsapp: "(11) 98888-7777",
        address: "Av. Brasil, 900 — São Paulo, SP",
        services: [
          { name: "Consulta Clínica", price: "R$ 150" },
          { name: "Retorno Clínico", price: "R$ 0" },
        ],
        hours: [],
        team: ["Dr. Gabriel Souza"],
      },
      appointments: [
        {
          id: "app-ret-1",
          patientId: "pat-ret-1",
          date: todayIso,
          time: "09:30",
          petName: "Bidu",
          species: "Cão",
          breed: "Schnauzer",
          tutor: "Roberto Alves",
          phone: "(11) 99123-4567",
          service: "Consulta Clínica",
          vet: "Dr. Gabriel Souza",
          status: "Em atendimento",
          priority: "Rotina",
          notes: "Avaliação dermatológica inicial",
        },
      ],
      patients: [
        {
          id: "pat-ret-1",
          name: "Bidu",
          species: "Cão",
          breed: "Schnauzer",
          age: "5 anos",
          weight: "8.2 kg",
          tutor: "Roberto Alves",
          phone: "(11) 99123-4567",
          alerts: [],
          vaccines: [],
          history: [],
        },
      ],
      beds: [],
    }),
  );
};

describe("Issue #181 — Agendamento Rápido de Retorno Clínico e WhatsApp na Agenda", () => {
  beforeEach(() => {
    stubRadixForJsdom();
    window.localStorage.clear();
    seedState();
  });

  it("gera link formatado do WhatsApp com dados da clínica, pet, tutor, data, horário e veterinário", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <MemoryRouter initialEntries={["/clinica/agenda"]}>
        <ClinicProvider>
          <ClinicSchedule />
        </ClinicProvider>
      </MemoryRouter>,
    );

    const whatsappBtn = screen.getByTestId("btn-whatsapp-app-ret-1");
    fireEvent.click(whatsappBtn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const calledUrl = openSpy.mock.calls[0][0];
    expect(calledUrl).toContain("https://wa.me/5511991234567?text=");

    const decoded = decodeURIComponent(calledUrl.split("text=")[1]);
    expect(decoded).toContain("Roberto Alves");
    expect(decoded).toContain("Clínica Veterinária Central Pet");
    expect(decoded).toContain("Consulta Clínica");
    expect(decoded).toContain("Bidu");
    expect(decoded).toContain("09:30");
    expect(decoded).toContain("Dr. Gabriel Souza");

    openSpy.mockRestore();
  });

  it("permite programar Retorno Clínico com atalhos (+7, +15, +30 dias) ao concluir atendimento e filtrar pela aba Retornos com destaque visual", () => {
    render(
      <MemoryRouter initialEntries={["/clinica/agenda"]}>
        <ClinicProvider>
          <ClinicSchedule />
        </ClinicProvider>
      </MemoryRouter>,
    );

    // 1. Abre o modal de Atendimento Clínico do Bidu
    fireEvent.click(screen.getByRole("button", { name: /Atender \/ Concluir/i }));

    // 2. Ativa a seção Programar Retorno / Reavaliação
    const returnSection = screen.getByTestId("return-scheduling-section");
    const toggle = within(returnSection).getByTestId("toggle-schedule-return");
    fireEvent.click(toggle);

    // 3. Clica no atalho de +15 dias e preenche horário e motivo do retorno
    fireEvent.click(within(returnSection).getByTestId("btn-return-15d"));
    const expectedDate15d = addDaysToIsoDate(todayIso, 15);
    expect(within(returnSection).getByLabelText(/Data do Retorno/i)).toHaveValue(expectedDate15d);

    fireEvent.change(within(returnSection).getByLabelText(/Horário do Retorno/i), {
      target: { value: "15:00" },
    });
    fireEvent.change(within(returnSection).getByLabelText(/Motivo \/ Orientações do Retorno/i), {
      target: { value: "Reavaliação dermatológica e controle de lesões" },
    });

    // 4. Conclui o atendimento
    fireEvent.click(
      screen.getByRole("button", { name: /Concluir e registrar no prontuário/i }),
    );

    // 5. Filtra pelos Retornos programados e verifica o novo agendamento futuro com badge "Retorno"
    fireEvent.click(screen.getByTestId("filter-returns-btn"));

    expect(screen.getByText("Retornos programados")).toBeInTheDocument();
    expect(
      screen.getByText(/Reavaliação dermatológica e controle de lesões/i),
    ).toBeInTheDocument();

    // Verifica que o agendamento de retorno possui o destaque visual (badge "Retorno") e serviço "Retorno Clínico"
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const createdReturn = stored.appointments.find((a) => a.service === "Retorno Clínico");
    expect(createdReturn).toBeDefined();
    expect(createdReturn.date).toBe(expectedDate15d);
    expect(createdReturn.time).toBe("15:00");
    expect(createdReturn.isReturn).toBe(true);
    expect(screen.getByTestId(`badge-return-${createdReturn.id}`)).toBeInTheDocument();

    // Verifica função utilitária buildWhatsAppUrl para o retorno criado
    const returnUrl = buildWhatsAppUrl(createdReturn, stored.profile);
    expect(decodeURIComponent(returnUrl)).toContain("Retorno Clínico");
  });
});


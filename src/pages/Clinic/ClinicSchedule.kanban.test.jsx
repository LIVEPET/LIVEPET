import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import ClinicSchedule from "./ClinicSchedule";

vi.mock("@/services/api", () => ({
  clinicService: {
    getCurrentClinic: () => null,
    isAuthenticated: () => false,
    getProfile: vi.fn().mockResolvedValue(null),
    listPatients: vi.fn().mockResolvedValue([]),
    getSpecies: vi.fn().mockResolvedValue(["Cão", "Gato"]),
    createAppointment: vi.fn().mockResolvedValue({}),
    updateAppointmentStatus: vi.fn().mockResolvedValue({}),
    concludeAppointment: vi.fn().mockResolvedValue({}),
  },
}));

const today = new Date().toISOString().split("T")[0];

const seedStorage = (appointments = []) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profile: {
        name: "Clínica Vet Vida",
        services: ["Consulta clínica", "Emergência 24h"],
        team: ["Dra. Sofia"],
        hours: [],
      },
      appointments,
      patients: [],
    }),
  );
};

const renderSchedule = () =>
  render(
    <MemoryRouter initialEntries={["/clinica/agenda"]}>
      <ClinicProvider>
        <ClinicSchedule />
      </ClinicProvider>
    </MemoryRouter>,
  );

describe("ClinicSchedule — Kanban & Classificação de Risco (Issue #81)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("exibe seletor de prioridade no modal de agendamento e aplica borda e badge semafórico no card", () => {
    seedStorage([
      {
        id: "app-1",
        date: today,
        time: "09:00",
        petName: "Thor",
        species: "Cão",
        breed: "Golden",
        tutor: "Carlos",
        phone: "(11) 99999-1111",
        service: "Emergência 24h",
        vet: "Dra. Sofia",
        status: "Aguardando",
        priority: "Emergência",
        notes: "Intoxicação aguda",
      },
      {
        id: "app-2",
        date: today,
        time: "10:00",
        petName: "Luna",
        species: "Gato",
        breed: "Siamês",
        tutor: "Mariana",
        phone: "(11) 98888-2222",
        service: "Consulta clínica",
        vet: "Dra. Sofia",
        status: "Confirmado",
        priority: "Rotina",
        notes: "Check-up",
      },
    ]);

    renderSchedule();

    // Card de Emergência deve ter borda vermelha e badge Emergência (Vermelho)
    const thorCard = screen.getByTestId("appointment-card-app-1");
    expect(thorCard.className).toContain("border-l-red-600");
    expect(within(thorCard).getByText("Emergência (Vermelho)")).toBeInTheDocument();

    // Card de Rotina deve ter borda verde e badge Rotina (Verde)
    const lunaCard = screen.getByTestId("appointment-card-app-2");
    expect(lunaCard.className).toContain("border-l-emerald-500");
    expect(within(lunaCard).getByText("Rotina (Verde)")).toBeInTheDocument();

    // Abre modal de novo atendimento e verifica opções de triagem
    fireEvent.click(screen.getByRole("button", { name: /novo atendimento/i }));
    const radioGroup = screen.getByRole("radiogroup", { name: /classificação de risco/i });
    expect(within(radioGroup).getByRole("radio", { name: /Rotina \(Verde\)/i })).toBeInTheDocument();
    expect(within(radioGroup).getByRole("radio", { name: /Prioritário \(Amarelo\)/i })).toBeInTheDocument();
    expect(within(radioGroup).getByRole("radio", { name: /Urgência \(Laranja\)/i })).toBeInTheDocument();
    expect(within(radioGroup).getByRole("radio", { name: /Emergência \(Vermelho\)/i })).toBeInTheDocument();
  });

  it("alterna entre Lista e Quadro Kanban, agrupa por colunas e avança o status com um clique", () => {
    seedStorage([
      {
        id: "app-wait",
        date: today,
        time: "08:30",
        petName: "Bolinha",
        species: "Cão",
        breed: "Poodle",
        tutor: "Ana",
        phone: "(11) 97777-3333",
        service: "Consulta clínica",
        vet: "Dra. Sofia",
        status: "Aguardando",
        priority: "Urgência",
      },
      {
        id: "app- consult",
        date: today,
        time: "09:15",
        petName: "Mingau",
        species: "Gato",
        breed: "Persa",
        tutor: "Pedro",
        phone: "(11) 96666-4444",
        service: "Consulta clínica",
        vet: "Dra. Sofia",
        status: "Em atendimento",
        priority: "Prioritário",
      },
      {
        id: "app-done",
        date: today,
        time: "08:00",
        petName: "Rex",
        species: "Cão",
        breed: "Pastor",
        tutor: "João",
        phone: "(11) 95555-5555",
        service: "Consulta clínica",
        vet: "Dra. Sofia",
        status: "Concluído",
        priority: "Rotina",
      },
    ]);

    renderSchedule();

    // Alterna para Quadro Kanban
    fireEvent.click(screen.getByRole("button", { name: /quadro kanban/i }));

    const colWaiting = screen.getByTestId("kanban-col-waiting");
    const colInProgress = screen.getByTestId("kanban-col-in_progress");
    const colDone = screen.getByTestId("kanban-col-done");

    expect(within(colWaiting).getByText("Na Espera")).toBeInTheDocument();
    expect(within(colInProgress).getByText("Em Consulta")).toBeInTheDocument();
    expect(within(colDone).getByText("Concluídos")).toBeInTheDocument();

    // Verifica agrupamento inicial
    expect(within(colWaiting).getByText(/Bolinha/)).toBeInTheDocument();
    expect(within(colInProgress).getByText(/Mingau/)).toBeInTheDocument();
    expect(within(colDone).getByText(/Rex/)).toBeInTheDocument();

    // Avança Bolinha de "Na Espera" para "Em Consulta" com 1 clique
    const bolinhaCard = within(colWaiting).getByTestId("kanban-card-app-wait");
    expect(bolinhaCard.className).toContain("border-l-orange-500");
    fireEvent.click(within(bolinhaCard).getByRole("button", { name: /avançar/i }));

    expect(within(colWaiting).queryByText(/Bolinha/)).not.toBeInTheDocument();
    expect(within(colInProgress).getByText(/Bolinha/)).toBeInTheDocument();

    // Avança Bolinha de "Em Consulta" para "Concluídos" com 1 clique
    const bolinhaInConsultCard = within(colInProgress).getByTestId("kanban-card-app-wait");
    fireEvent.click(within(bolinhaInConsultCard).getByRole("button", { name: /concluir/i }));

    expect(within(colInProgress).queryByText(/Bolinha/)).not.toBeInTheDocument();
    expect(within(colDone).getByText(/Bolinha/)).toBeInTheDocument();
  });
});


import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClinicProvider } from "@/contexts/ClinicContext";
import ClinicDashboard, { computeDashboardMetrics } from "./ClinicDashboard";

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <ClinicProvider>
        <ClinicDashboard />
      </ClinicProvider>
    </MemoryRouter>,
  );

describe("ClinicDashboard — Gráficos, Espécies e Metas Reais (Issue #83)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inicia sem dados pré-populados e exibe valores numéricos reais (0 e 0%) no lugar de traços estáticos", () => {
    renderDashboard();

    const kpiVaccines = screen.getByTestId("kpi-vaccines");
    expect(within(kpiVaccines).getByText("0")).toBeInTheDocument();
    expect(within(kpiVaccines).getByText("Vacinas do mês")).toBeInTheDocument();

    const kpiOccupancy = screen.getByTestId("kpi-occupancy");
    expect(within(kpiOccupancy).getByText("0%")).toBeInTheDocument();
    expect(within(kpiOccupancy).getByText(/0\/10 horários preenchidos/i)).toBeInTheDocument();

    const goalsCard = screen.getByTestId("monthly-goals-card");
    expect(within(goalsCard).getByText("0/20 (0%)")).toBeInTheDocument();
    expect(within(goalsCard).getByText("0/15 (0%)")).toBeInTheDocument();
    expect(within(goalsCard).getByText("0/10 (0%)")).toBeInTheDocument();
  });

  it("renderiza os gráficos de Volume de Atendimentos e Distribuição por Espécie & Serviços e permite alternar visualização", () => {
    renderDashboard();

    const volumeCard = screen.getByTestId("chart-appointments-volume");
    expect(within(volumeCard).getByText("Volume de Atendimentos")).toBeInTheDocument();
    expect(within(volumeCard).getByText(/Confirmado:/i)).toBeInTheDocument();

    const weekdayBtn = within(volumeCard).getByRole("button", { name: /Dia da Semana/i });
    fireEvent.click(weekdayBtn);
    expect(within(volumeCard).getByText(/Seg:/i)).toBeInTheDocument();
    expect(within(volumeCard).getByText(/Sex:/i)).toBeInTheDocument();

    const speciesServicesCard = screen.getByTestId("chart-species-services");
    expect(
      within(speciesServicesCard).getByText("Distribuição por Espécie & Serviços"),
    ).toBeInTheDocument();
    expect(within(speciesServicesCard).getByTestId("service-stat-Consultas")).toBeInTheDocument();
    expect(within(speciesServicesCard).getByTestId("service-stat-Vacinas")).toBeInTheDocument();
    expect(within(speciesServicesCard).getByTestId("service-stat-Retornos")).toBeInTheDocument();
    expect(within(speciesServicesCard).getByTestId("service-stat-Exames")).toBeInTheDocument();
  });

  it("calcula corretamente KPIs de vacinas, ocupação da agenda, espécies, serviços e metas do mês com dados reais", () => {
    const todayIso = new Date().toISOString().split("T")[0];
    const appointments = [
      {
        id: "a1",
        petName: "Thor",
        tutor: "João",
        species: "Cão",
        service: "Vacina V10",
        status: "Concluído",
        date: todayIso,
        vacina_aplicada: "V10",
      },
      {
        id: "a2",
        petName: "Luna",
        tutor: "Maria",
        species: "Gato",
        service: "Retorno clínico",
        status: "Concluído",
        date: todayIso,
      },
      {
        id: "a3",
        petName: "Max",
        tutor: "Pedro",
        species: "Cão",
        service: "Exame Hemograma",
        status: "Confirmado",
        date: todayIso,
      },
      {
        id: "a4",
        petName: "Mel",
        tutor: "Carla",
        species: "Gato",
        service: "Consulta geral",
        status: "Cancelado",
        date: todayIso,
      },
    ];

    const patients = [
      { id: "p1", name: "Thor", tutor: "João", species: "Cão", vaccinesUpToDate: true, alerts: [] },
      { id: "p2", name: "Luna", tutor: "Maria", species: "Gato", vaccinesUpToDate: false, alerts: [] },
    ];

    const metrics = computeDashboardMetrics(appointments, patients);

    // 3 agendamentos ativos hoje (excluindo Cancelado) em uma agenda de 10 horários = 30%
    expect(metrics.occupancyRate).toBe(30);
    expect(metrics.vaccinesMonthCount).toBe(1);

    // Metas do mês: 2 concluídos de 20 (10%), 1 vacina de 15 (7%), 1 retorno concluído de 10 (10%)
    expect(metrics.goals[0].current).toBe(2);
    expect(metrics.goals[0].value).toBe(10);
    expect(metrics.goals[1].current).toBe(1);
    expect(metrics.goals[1].value).toBe(7);
    expect(metrics.goals[2].current).toBe(1);
    expect(metrics.goals[2].value).toBe(10);

    // Espécies: 2 Cães (Thor, Max) e 2 Gatos (Luna, Mel)
    const dogs = metrics.bySpecies.find((s) => s.name === "Cão");
    const cats = metrics.bySpecies.find((s) => s.name === "Gato");
    expect(dogs.value).toBe(2);
    expect(cats.value).toBe(2);

    // Serviços: Vacinas (1), Retornos (1), Exames (1), Consultas (1)
    const srvVacinas = metrics.byService.find((s) => s.name === "Vacinas");
    const srvRetornos = metrics.byService.find((s) => s.name === "Retornos");
    const srvExames = metrics.byService.find((s) => s.name === "Exames");
    expect(srvVacinas.count).toBe(1);
    expect(srvRetornos.count).toBe(1);
    expect(srvExames.count).toBe(1);
  });
});


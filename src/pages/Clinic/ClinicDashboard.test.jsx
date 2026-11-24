import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicDashboard, { computeDashboardMetrics } from "./ClinicDashboard";
import ClinicPatients from "./ClinicPatients";

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <ClinicProvider>
        <ClinicDashboard />
      </ClinicProvider>
    </MemoryRouter>,
  );

describe("ClinicDashboard — Gráficos, Espécies e Metas Reais (Issues #83 e #214)", () => {
  beforeEach(() => {
    stubRadixForJsdom();
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

  it("Issue #214: diferencia Atendimentos hoje de retornos futuros, exibe data em Próximos atendimentos futuros e abre prontuário ao clicar em alerta", () => {
    const todayIso = new Date().toISOString().split("T")[0];
    const futureDate = "2099-12-15";

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        profile: { name: "Clínica Central" },
        appointments: [
          {
            id: "today-1",
            petName: "Rex",
            species: "Cão",
            breed: "Pastor",
            tutor: "Carlos",
            service: "Consulta clínica",
            vet: "Dr. Paulo",
            date: todayIso,
            time: "10:00",
            status: "Confirmado",
          },
          {
            id: "future-1",
            petName: "Mimi",
            species: "Gato",
            breed: "Siamês",
            tutor: "Beatriz",
            service: "Retorno Clínico",
            vet: "Dra. Marina",
            date: futureDate,
            time: "15:30",
            status: "Confirmado",
          },
        ],
        patients: [
          {
            id: "pat-alert-1",
            name: "Rex",
            species: "Cão",
            breed: "Pastor",
            age: "5 anos",
            weight: "30 kg",
            tutor: "Carlos",
            phone: "(11) 98888-1111",
            alerts: ["Alérgico a anti-inflamatórios"],
            vaccines: [],
            history: [],
          },
        ],
        beds: [],
      }),
    );

    render(
      <MemoryRouter initialEntries={["/clinica"]}>
        <ClinicProvider>
          <Routes>
            <Route path="/clinica" element={<ClinicDashboard />} />
            <Route path="/clinica/pacientes" element={<ClinicPatients />} />
          </Routes>
        </ClinicProvider>
      </MemoryRouter>,
    );

    // 1. O KPI "Atendimentos hoje" deve mostrar 1 (apenas o de hoje) e não 2 (total global com retorno futuro)
    const kpiAppointments = screen.getByTestId("kpi-appointments");
    expect(within(kpiAppointments).getByText("1")).toBeInTheDocument();

    // 2. Em "Próximos atendimentos", o agendamento futuro deve exibir a data formatada (15/12/2099 · 15:30)
    const futureCard = screen.getByTestId("next-appointment-future-1");
    expect(within(futureCard).getByText(/15\/12\/2099 · 15:30/)).toBeInTheDocument();

    // 3. Ao clicar no alerta de "Precisam de atenção", navega para /clinica/pacientes com o prontuário do paciente aberto
    const alertItem = screen.getByTestId("attention-item-pat-alert-1");
    fireEvent.click(alertItem);

    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByText("Rex")).toBeInTheDocument();
    expect(within(sheet).getByText("Alérgico a anti-inflamatórios")).toBeInTheDocument();
  });
});

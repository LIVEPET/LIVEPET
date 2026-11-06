import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicSchedule from "./ClinicSchedule";

// Edição e exclusão de agendamentos pela agenda (#62).

vi.mock("@/services/api", () => ({
  getClinicAuthToken: () => null,
  clinicService: {
    getCurrentClinic: () => null,
    isAuthenticated: () => false,
    getProfile: vi.fn().mockResolvedValue(null),
    listPatients: vi.fn().mockResolvedValue([]),
    getSpecies: vi.fn().mockResolvedValue(["Cão", "Gato"]),
    createAppointment: vi.fn().mockResolvedValue({}),
    updateAppointment: vi.fn().mockResolvedValue({}),
    deleteAppointment: vi.fn().mockResolvedValue(null),
    updateAppointmentStatus: vi.fn().mockResolvedValue({}),
    concludeAppointment: vi.fn().mockResolvedValue({}),
  },
}));

const today = new Date().toISOString().split("T")[0];

const seed = () =>
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profile: { name: "Clínica Vet Vida", services: ["Consulta clínica", "Vacinação"], team: ["Dra. Sofia"], hours: [] },
      appointments: [
        {
          id: "app-1",
          date: today,
          time: "09:00",
          petName: "Thor",
          species: "Cão",
          breed: "Labrador",
          tutor: "Ana",
          phone: "(11) 99999-0000",
          service: "Consulta clínica",
          vet: "Dra. Sofia",
          status: "Confirmado",
          priority: "Rotina",
          notes: "",
        },
      ],
      patients: [],
    }),
  );

const renderSchedule = () =>
  render(
    <MemoryRouter initialEntries={["/clinica/agenda"]}>
      <ClinicProvider>
        <ClinicSchedule />
      </ClinicProvider>
    </MemoryRouter>,
  );

beforeAll(stubRadixForJsdom);
beforeEach(() => {
  window.localStorage.clear();
  seed();
});

describe("ClinicSchedule — editar e excluir agendamento (#62)", () => {
  it("abre o atendimento preenchido, salva o novo horário e reflete na lista", async () => {
    renderSchedule();

    fireEvent.click(screen.getByRole("button", { name: "Editar atendimento de Thor" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Editar atendimento")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Pet")).toHaveValue("Thor");
    expect(within(dialog).getByLabelText("Tutor")).toHaveValue("Ana");

    const hora = within(dialog).getByLabelText("Horário");
    expect(hora).toHaveValue("09:00");
    fireEvent.change(hora, { target: { value: "11:30" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("11:30")).toBeInTheDocument();
    expect(screen.queryByText("09:00")).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).appointments[0].time).toBe("11:30");
  });

  it("não deixa salvar a edição com campo obrigatório vazio", async () => {
    renderSchedule();

    fireEvent.click(screen.getByRole("button", { name: "Editar atendimento de Thor" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Tutor"), { target: { value: "" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));

    expect(await within(dialog).findByText("Informe o nome do tutor.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("fechar o modal de edição e abrir 'Novo atendimento' volta ao formulário vazio", async () => {
    renderSchedule();

    fireEvent.click(screen.getByRole("button", { name: "Editar atendimento de Thor" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Novo atendimento/i }));
    const novo = await screen.findByRole("dialog");
    expect(within(novo).getByText("Agendar atendimento")).toBeInTheDocument();
    expect(within(novo).getByLabelText("Pet")).toHaveValue("");
  });

  it("excluir pede confirmação e só remove depois do 'Excluir'", async () => {
    renderSchedule();

    fireEvent.click(screen.getByRole("button", { name: "Excluir atendimento de Thor" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText("Excluir este atendimento?")).toBeInTheDocument();

    fireEvent.click(within(confirm).getByRole("button", { name: "Manter" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByText("Thor")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Excluir atendimento de Thor" }));
    const confirm2 = await screen.findByRole("alertdialog");
    fireEvent.click(within(confirm2).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(screen.queryByText("Thor")).not.toBeInTheDocument());
    expect(screen.getByText("Nenhum atendimento hoje")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).appointments).toEqual([]);
  });
});

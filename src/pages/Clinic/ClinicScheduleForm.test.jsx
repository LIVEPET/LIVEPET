import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, ClinicProvider } from "@/contexts/ClinicContext";
import {
  chooseOption,
  fillAppointmentForm,
  openNewAppointment,
  stubRadixForJsdom,
} from "@/test/clinicTestUtils";
import ClinicLayout from "./ClinicLayout";
import ClinicSchedule from "./ClinicSchedule";

const app = () => (
  <ClinicProvider><MemoryRouter initialEntries={["/clinica/agenda"]}>
    <Routes>
      <Route path="/clinica" element={<ClinicLayout />}>
        <Route path="agenda" element={<ClinicSchedule />} />
        <Route path="perfil" element={<div>TELA DE PERFIL</div>} />
      </Route>
    </Routes>
  </MemoryRouter></ClinicProvider>
);

const submit = () => userEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));

beforeAll(stubRadixForJsdom);
beforeEach(() => localStorage.clear());

describe("modal Novo atendimento", () => {
  it("mostra erro em cada campo obrigatório e mantém o modal aberto", async () => {
    render(app());
    await openNewAppointment();
    await submit();

    expect(await screen.findByText("Informe o nome do pet.")).toBeTruthy();
    expect(screen.getByText("Selecione a espécie.")).toBeTruthy();
    expect(screen.getByText("Informe o horário.")).toBeTruthy();
    expect(screen.getByText("Informe o nome do tutor.")).toBeTruthy();
    expect(screen.getByText("Informe o telefone do tutor.")).toBeTruthy();
    expect(screen.getByText("Informe o serviço.")).toBeTruthy();
    expect(screen.getByText("Agendar atendimento")).toBeTruthy();
    expect(screen.getByLabelText("Pet")).toHaveAttribute("aria-invalid", "true");
  });

  it("limpa o erro do campo quando a pessoa corrige", async () => {
    render(app());
    await openNewAppointment();
    await submit();
    await screen.findByText("Informe o nome do pet.");

    await userEvent.type(screen.getByLabelText("Pet"), "Thor");
    expect(screen.queryByText("Informe o nome do pet.")).toBeNull();
    expect(screen.getByText("Informe o nome do tutor.")).toBeTruthy();
  });

  it("não aceita nome só com espaços", async () => {
    render(app());
    await openNewAppointment();
    await userEvent.type(screen.getByLabelText("Pet"), "   ");
    await submit();
    expect(await screen.findByText("Informe o nome do pet.")).toBeTruthy();
  });

  it("rejeita telefone inválido", async () => {
    render(app());
    await openNewAppointment();
    await fillAppointmentForm({ phone: "123" });
    await submit();

    expect(await screen.findByText(/Telefone inválido/)).toBeTruthy();
    expect(screen.getByText("Agendar atendimento")).toBeTruthy();
  });

  it("aplica a máscara de telefone enquanto digita", async () => {
    render(app());
    await openNewAppointment();
    await userEvent.type(screen.getByLabelText("Telefone"), "11999990000");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(11) 99999-0000");
  });

  it("grava espécie, raça e telefone informados, sem valores fixos", async () => {
    render(app());
    await openNewAppointment();
    await fillAppointmentForm({ species: "Gato", breed: "Siamês", pet: "Mia" });
    await submit();

    expect(await screen.findByText(/Gato · Siamês/)).toBeTruthy();
    expect(screen.getByText("(11) 99999-0000")).toBeTruthy();
    expect(screen.queryByText("(11) 90000-0000")).toBeNull();
    expect(screen.queryByText("Agendar atendimento")).toBeNull();
  });

  it("usa — quando a raça não é informada", async () => {
    render(app());
    await openNewAppointment();
    await fillAppointmentForm();
    await submit();
    expect(await screen.findByText(/Cão · —/)).toBeTruthy();
  });

  it("limpa o formulário depois de agendar", async () => {
    render(app());
    await openNewAppointment();
    await fillAppointmentForm();
    await submit();
    await screen.findByText("Thor");

    await openNewAppointment();
    expect(screen.getByLabelText("Pet")).toHaveValue("");
    expect(screen.getByLabelText("Telefone")).toHaveValue("");
  });

  it("usa seletores quando serviços e equipe estão cadastrados no Perfil", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: {
          services: ["Consulta clínica", "Vacinação"],
          team: [{ name: "Dra. Marina Alves", role: "Veterinária", crmv: "SP-1" }],
        },
      }),
    );
    render(app());
    await openNewAppointment();
    await fillAppointmentForm({ service: null });

    await submit();
    expect(await screen.findByText("Selecione o serviço.")).toBeTruthy();

    await chooseOption("Serviço", "Vacinação");
    await chooseOption("Responsável", "Dra. Marina Alves");
    await submit();

    expect(await screen.findByText("Vacinação — Dra. Marina Alves")).toBeTruthy();
  });

  it("sem equipe cadastrada, usa Equipe da clínica e orienta ir ao Perfil", async () => {
    render(app());
    await openNewAppointment();

    const vet = screen.getByLabelText("Responsável");
    expect(vet).toBeDisabled();
    expect(vet).toHaveValue("Equipe da clínica");
    expect(screen.getByRole("link", { name: /Cadastre serviços no Perfil/ })).toHaveAttribute(
      "href",
      "/clinica/perfil",
    );

    await fillAppointmentForm();
    await submit();
    expect(await screen.findByText("Consulta — Equipe da clínica")).toBeTruthy();
  });

  it("o atendimento criado gera o paciente em Pacientes (Context)", async () => {
    render(app());
    await openNewAppointment();
    await fillAppointmentForm();
    await submit();
    await screen.findByText("Thor");

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.patients).toHaveLength(1);
    expect(saved.patients[0]).toMatchObject({ name: "Thor", species: "Cão", phone: "(11) 99999-0000" });
    expect(within(document.querySelector("aside")).getByText("Agenda")).toBeTruthy();
  });

  it("salva observações e exibe no card do atendimento", async () => {
    render(app());
    await openNewAppointment();
    await fillAppointmentForm();
    await userEvent.type(
      screen.getByLabelText(/Observações/),
      "Tosse seca e perda de apetite",
    );
    await submit();

    expect(await screen.findByText("Tosse seca e perda de apetite")).toBeTruthy();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.appointments[0].notes).toBe("Tosse seca e perda de apetite");
    expect(saved.appointments[0].date).toBeTruthy();
  });

  it("exige data válida quando o campo é limpo", async () => {
    render(app());
    await openNewAppointment();
    await userEvent.clear(screen.getByLabelText("Data"));
    await submit();

    expect(await screen.findByText("Informe a data.")).toBeTruthy();
  });
});
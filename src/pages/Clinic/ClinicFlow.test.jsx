import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import ClinicLayout from "./ClinicLayout";
import ClinicDashboard from "./ClinicDashboard";
import ClinicSchedule from "./ClinicSchedule";
import ClinicPatients from "./ClinicPatients";
import ClinicProfile from "./ClinicProfile";

const app = (initial = "/clinica") => (
  <MemoryRouter initialEntries={[initial]}>
    <Routes>
      <Route path="/clinica" element={<ClinicLayout />}>
        <Route index element={<ClinicDashboard />} />
        <Route path="agenda" element={<ClinicSchedule />} />
        <Route path="pacientes" element={<ClinicPatients />} />
        <Route path="perfil" element={<ClinicProfile />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

const goTo = (label) => userEvent.click(within(document.querySelector("aside")).getByText(label));

beforeEach(() => localStorage.clear());

describe("fluxo da clínica com estado compartilhado", () => {
  it("atendimento criado na Agenda aparece no Painel e em Pacientes", async () => {
    render(app());
    await goTo("Agenda");

    await userEvent.click(screen.getAllByRole("button", { name: /Novo atendimento/ })[0]);
    fireEvent.change(await screen.findByLabelText("Horário"), { target: { value: "09:00" } });
    await userEvent.type(screen.getByLabelText("Pet"), "Thor");
    await userEvent.type(screen.getByLabelText("Tutor"), "Ana");
    await userEvent.type(screen.getByLabelText("Serviço"), "Consulta");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));
    expect(await screen.findByText("Thor")).toBeTruthy();

    await goTo("Painel");
    expect(await screen.findByText("Próximos atendimentos")).toBeTruthy();
    expect(screen.getByText("Thor")).toBeTruthy();
    expect(screen.getByText("Cadastrados na clínica")).toBeTruthy();

    await goTo("Pacientes");
    expect(await screen.findByText("Thor")).toBeTruthy();
    expect(screen.getByText("Sem registro de vacinas")).toBeTruthy();
  });

  it("mudar o status na Agenda atualiza o Painel", async () => {
    render(app("/clinica/agenda"));
    await userEvent.click(screen.getAllByRole("button", { name: /Novo atendimento/ })[0]);
    fireEvent.change(await screen.findByLabelText("Horário"), { target: { value: "09:00" } });
    await userEvent.type(screen.getByLabelText("Pet"), "Thor");
    await userEvent.type(screen.getByLabelText("Tutor"), "Ana");
    await userEvent.type(screen.getByLabelText("Serviço"), "Consulta");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));

    await userEvent.click(await screen.findByRole("button", { name: "Iniciar" }));
    await userEvent.click(await screen.findByRole("button", { name: "Concluir" }));

    await goTo("Painel");
    expect(await screen.findByText("1 concluído(s)")).toBeTruthy();
  });

  it("perfil salvo aparece na saudação do Painel e na Sidebar", async () => {
    render(app("/clinica/perfil"));
    await userEvent.type(screen.getByLabelText("Nome"), "Clínica Pet Feliz");
    await userEvent.type(screen.getByLabelText("Registro (CRMV)"), "SP-123");
    await userEvent.type(screen.getByLabelText("E-mail"), "contato@petfeliz.com");
    await userEvent.type(screen.getByLabelText("Telefone"), "11999990000");
    await userEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    const aside = document.querySelector("aside");
    expect(await within(aside).findByText("Clínica Pet Feliz")).toBeTruthy();
    expect(within(aside).getByText("SP-123")).toBeTruthy();

    await goTo("Painel");
    expect(await screen.findByText(/Olá, Clínica Pet Feliz/)).toBeTruthy();
  });

  it("os dados continuam depois de recarregar a página", async () => {
    const first = render(app("/clinica/agenda"));
    await userEvent.click(screen.getAllByRole("button", { name: /Novo atendimento/ })[0]);
    fireEvent.change(await screen.findByLabelText("Horário"), { target: { value: "09:00" } });
    await userEvent.type(screen.getByLabelText("Pet"), "Thor");
    await userEvent.type(screen.getByLabelText("Tutor"), "Ana");
    await userEvent.type(screen.getByLabelText("Serviço"), "Consulta");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));
    await screen.findByText("Thor");
    first.unmount();

    render(app("/clinica/agenda"));
    expect(await screen.findByText("Thor")).toBeTruthy();
  });
});
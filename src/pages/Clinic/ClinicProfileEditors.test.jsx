import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/contexts/ClinicContext";
import { chooseOption, openNewAppointment, stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicLayout from "./ClinicLayout";
import ClinicProfile from "./ClinicProfile";
import ClinicSchedule from "./ClinicSchedule";

const app = (initial = "/clinica/perfil") => (
  <MemoryRouter initialEntries={[initial]}>
    <Routes>
      <Route path="/clinica" element={<ClinicLayout />}>
        <Route path="agenda" element={<ClinicSchedule />} />
        <Route path="perfil" element={<ClinicProfile />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY));
const seed = (profile) => localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile }));
const click = (name) => userEvent.click(screen.getByRole("button", { name }));
const goTo = (label) => userEvent.click(within(document.querySelector("aside")).getByText(label));

const addService = async (name, duration = "", price = "") => {
  await click("Adicionar serviço");
  await userEvent.type(await screen.findByLabelText("Nome do serviço"), name);
  if (duration) await userEvent.type(screen.getByLabelText("Duração (minutos)"), duration);
  if (price) await userEvent.type(screen.getByLabelText("Preço (R$)"), price);
  await click("Salvar serviço");
};

beforeAll(stubRadixForJsdom);
beforeEach(() => localStorage.clear());

describe("Perfil: serviços", () => {
  it("valida o nome e adiciona com duração e preço", async () => {
    render(app());
    await click("Adicionar serviço");
    await click("Salvar serviço");
    expect(await screen.findByText("Informe o nome do serviço.")).toBeTruthy();

    await userEvent.type(screen.getByLabelText("Nome do serviço"), "Consulta clínica");
    await userEvent.type(screen.getByLabelText("Duração (minutos)"), "30");
    await userEvent.type(screen.getByLabelText("Preço (R$)"), "80,5");
    await click("Salvar serviço");

    expect(await screen.findByText("Consulta clínica")).toBeTruthy();
    expect(screen.getByText(/30 min · R\$\s*80,50/)).toBeTruthy();
    expect(screen.queryByText("Nenhum serviço cadastrado")).toBeNull();
    expect(saved().profile.services).toEqual([{ name: "Consulta clínica", duration: 30, price: 80.5 }]);
  });

  it("recusa duração e preço inválidos", async () => {
    render(app());
    await click("Adicionar serviço");
    await userEvent.type(screen.getByLabelText("Nome do serviço"), "Exame");
    await userEvent.type(screen.getByLabelText("Duração (minutos)"), "abc");
    await userEvent.type(screen.getByLabelText("Preço (R$)"), "-5");
    await click("Salvar serviço");

    expect(await screen.findByText(/número inteiro de minutos/)).toBeTruthy();
    expect(screen.getByText(/Preço inválido/)).toBeTruthy();
    expect(screen.getByText("Adicionar serviço", { selector: "h2" })).toBeTruthy();
  });

  it("não aceita nome repetido", async () => {
    render(app());
    await addService("Consulta");
    await screen.findByText("Consulta");
    await addService(" consulta ");
    expect(await screen.findByText("Já existe um serviço com esse nome.")).toBeTruthy();
  });

  it("edita um serviço", async () => {
    seed({ services: [{ name: "Consulta", duration: 30, price: 80 }] });
    render(app());
    await click("Editar serviço Consulta");

    const name = await screen.findByLabelText("Nome do serviço");
    expect(name).toHaveValue("Consulta");
    expect(screen.getByLabelText("Preço (R$)")).toHaveValue("80,00");
    await userEvent.clear(name);
    await userEvent.type(name, "Consulta geral");
    await userEvent.clear(screen.getByLabelText("Preço (R$)"));
    await click("Salvar serviço");

    expect(await screen.findByText("Consulta geral")).toBeTruthy();
    expect(saved().profile.services).toEqual([{ name: "Consulta geral", duration: 30, price: null }]);
  });

  it("só remove depois da confirmação", async () => {
    seed({ services: [{ name: "Consulta" }, { name: "Vacina" }] });
    render(app());

    await click("Remover serviço Consulta");
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    await click("Cancelar");
    expect(screen.getByText("Consulta")).toBeTruthy();

    await click("Remover serviço Consulta");
    await click("Remover");
    expect(screen.queryByText("Consulta")).toBeNull();
    expect(screen.getByText("Vacina")).toBeTruthy();
    expect(saved().profile.services.map((s) => s.name)).toEqual(["Vacina"]);
  });

  it("voltar ao estado vazio quando o último serviço é removido", async () => {
    seed({ services: ["Consulta"] });
    render(app());
    await click("Remover serviço Consulta");
    await click("Remover");
    expect(await screen.findByText("Nenhum serviço cadastrado")).toBeTruthy();
  });
});

describe("Perfil: equipe", () => {
  it("exige o nome e adiciona o profissional", async () => {
    render(app());
    await click("Adicionar profissional");
    await click("Salvar profissional");
    expect(await screen.findByText("Informe o nome do profissional.")).toBeTruthy();

    await userEvent.type(screen.getByLabelText("Nome do profissional"), "Dra. Marina Alves");
    await userEvent.type(screen.getByLabelText("Função"), "Veterinária");
    await userEvent.type(screen.getByLabelText("CRMV"), "SP-1234");
    await click("Salvar profissional");

    expect(await screen.findByText("Dra. Marina Alves")).toBeTruthy();
    expect(screen.getByText("Veterinária · SP-1234")).toBeTruthy();
    expect(saved().profile.team).toEqual([
      { name: "Dra. Marina Alves", role: "Veterinária", crmv: "SP-1234" },
    ]);
  });

  it("edita e remove com confirmação", async () => {
    seed({ team: [{ name: "Dr. Paulo", role: "Veterinário", crmv: "SP-1" }] });
    render(app());

    await click("Editar Dr. Paulo");
    const role = await screen.findByLabelText("Função");
    await userEvent.clear(role);
    await userEvent.type(role, "Cirurgião");
    await click("Salvar profissional");
    expect(await screen.findByText("Cirurgião · SP-1")).toBeTruthy();

    await click("Remover Dr. Paulo");
    await click("Remover");
    expect(await screen.findByText("Equipe não cadastrada")).toBeTruthy();
    expect(saved().profile.team).toEqual([]);
  });
});

describe("Perfil: horários", () => {
  it("sugere uma semana padrão e salva", async () => {
    render(app());
    await click("Adicionar horários");

    expect(await screen.findByRole("switch", { name: "Aberto Seg" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Aberto Dom" })).not.toBeChecked();
    expect(screen.getByLabelText("Abertura Dom")).toBeDisabled();
    await click("Salvar horários");

    expect(await screen.findAllByText("08:00 às 18:00")).toHaveLength(5);
    expect(screen.getByText("08:00 às 12:00")).toBeTruthy();
    expect(screen.getByText("Fechado")).toBeTruthy();
    expect(saved().profile.hours[0]).toMatchObject({
      day: "Seg",
      open: true,
      from: "08:00",
      to: "18:00",
      time: "08:00 às 18:00",
    });
    expect(saved().profile.hours[6]).toMatchObject({ day: "Dom", open: false, time: "Fechado" });
  });

  it("recusa fechamento antes da abertura e mantém o modal aberto", async () => {
    render(app());
    await click("Adicionar horários");
    fireEvent.change(await screen.findByLabelText("Abertura Seg"), { target: { value: "19:00" } });
    await click("Salvar horários");

    expect(await screen.findByText("O fechamento deve ser depois da abertura.")).toBeTruthy();
    expect(screen.getByText("Horários de atendimento")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Abertura Seg"), { target: { value: "07:00" } });
    expect(screen.queryByText("O fechamento deve ser depois da abertura.")).toBeNull();
  });

  it("fechar um dia desativa os campos de horário", async () => {
    render(app());
    await click("Adicionar horários");
    await userEvent.click(await screen.findByRole("switch", { name: "Aberto Ter" }));
    expect(screen.getByLabelText("Abertura Ter")).toBeDisabled();
    await click("Salvar horários");

    expect(await screen.findAllByText("Fechado")).toHaveLength(2);
  });

  it("lê e edita horários salvos no formato antigo", async () => {
    seed({ hours: [{ day: "Seg", time: "09:00 às 17:00" }] });
    render(app());
    expect(screen.getByText("09:00 às 17:00")).toBeTruthy();

    await click("Editar horários");
    expect(await screen.findByLabelText("Abertura Seg")).toHaveValue("09:00");
    expect(screen.getByRole("switch", { name: "Aberto Ter" })).not.toBeChecked();
  });
});

describe("Perfil alimenta a Agenda", () => {
  it("serviço e profissional cadastrados viram opções do modal Novo atendimento", async () => {
    render(app());
    await addService("Vacinação", "20", "120");
    await screen.findByText("Vacinação");
    await click("Adicionar profissional");
    await userEvent.type(await screen.findByLabelText("Nome do profissional"), "Dra. Marina Alves");
    await click("Salvar profissional");
    await screen.findByText("Dra. Marina Alves");

    await goTo("Agenda");
    await openNewAppointment();
    await chooseOption("Serviço", "Vacinação");
    await chooseOption("Responsável", "Dra. Marina Alves");
    expect(screen.getByLabelText("Serviço")).toHaveTextContent("Vacinação");
    expect(screen.getByLabelText("Responsável")).toHaveTextContent("Dra. Marina Alves");
  });

  it("os cadastros continuam depois de recarregar a página", async () => {
    const first = render(app());
    await addService("Consulta", "30", "80");
    await screen.findByText("Consulta");
    first.unmount();

    render(app());
    expect(screen.getByText("Consulta")).toBeTruthy();
    expect(screen.getByText(/30 min · R\$\s*80,00/)).toBeTruthy();
  });
});
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, ClinicProvider } from "@/contexts/ClinicContext";
import { chooseOption, stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicLayout from "./ClinicLayout";
import ClinicPatients from "./ClinicPatients";

const app = () => (
  <ClinicProvider><MemoryRouter initialEntries={["/clinica/pacientes"]}>
    <Routes>
      <Route path="/clinica" element={<ClinicLayout />}>
        <Route path="pacientes" element={<ClinicPatients />} />
      </Route>
    </Routes>
  </MemoryRouter></ClinicProvider>
);

const patient = (extra) => ({
  id: "p1",
  name: "Thor",
  species: "Cão",
  breed: "Labrador",
  age: "3 anos",
  weight: "12.5 kg",
  tutor: "Ana",
  phone: "(11) 99999-0000",
  photo: null,
  alerts: [],
  vaccinesUpToDate: true,
  lastVisit: "01/10/2026",
  history: [{ date: "2026-10-01", type: "Consulta", vet: "Dra. Marina", summary: "Controle de rotina" }],
  ...extra,
});

const concluded = (extra) => ({
  petName: "Thor",
  tutor: "Ana",
  status: "Concluído",
  time: "09:00",
  service: "Consulta",
  vet: "Dra. Marina",
  species: "Cão",
  breed: "Labrador",
  phone: "(11) 99999-0000",
  ...extra,
});

const seed = ({ patients, appointments = [] }) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: {}, patients, appointments }));

const THOR_APPOINTMENTS = [
  concluded({ id: "a1", date: "2026-09-01", peso: 11.8, temperatura: 38.5, frequencia_cardiaca: 100, frequencia_respiratoria: 24, mucosas: "Pálidas" }),
  concluded({ id: "a2", date: "2026-10-01", peso: 12.5, temperatura: 38.9, frequencia_cardiaca: 110, frequencia_respiratoria: 28, mucosas: "Normocoradas" }),
  concluded({ id: "a3", petName: "Mel", tutor: "Beto", date: "2026-10-05", peso: 4 }),
];

const openRecord = async (name = "Thor") => {
  render(app());
  await userEvent.click(await screen.findByText(name));
  return screen.findByRole("dialog");
};

beforeAll(stubRadixForJsdom);
beforeEach(() => localStorage.clear());

describe("prontuário do paciente", () => {
  it("organiza o prontuário em três abas", async () => {
    seed({ patients: [patient()], appointments: THOR_APPOINTMENTS });
    const sheet = await openRecord();

    expect(within(sheet).getByRole("tab", { name: /Resumo & Sinais Vitais/ })).toHaveAttribute("aria-selected", "true");
    expect(within(sheet).getByRole("tab", { name: "Evolução de Peso" })).toBeTruthy();
    expect(within(sheet).getByRole("tab", { name: "Histórico Clínico" })).toBeTruthy();
  });

  it("destaca alergias e alertas no topo, em banner de atenção", async () => {
    seed({ patients: [patient({ alerts: ["Alérgico a dipirona", "Cardiopata"] })] });
    const sheet = await openRecord();

    const banner = within(sheet).getByRole("alert");
    expect(within(banner).getByText(/Atenção: alergias e alertas clínicos/)).toBeTruthy();
    expect(within(banner).getByText("Alérgico a dipirona")).toBeTruthy();
    expect(within(banner).getByText("Cardiopata")).toBeTruthy();
  });

  it("não mostra o banner quando não há alertas", async () => {
    seed({ patients: [patient()] });
    const sheet = await openRecord();
    expect(within(sheet).queryByRole("alert")).toBeNull();
  });

  it("mostra os últimos sinais vitais medidos, com a variação de peso", async () => {
    seed({ patients: [patient()], appointments: THOR_APPOINTMENTS });
    const sheet = await openRecord();

    expect(within(sheet).getByText("12,5")).toBeTruthy();
    expect(within(sheet).getByLabelText("Variação de +0,7 kg desde a pesagem anterior")).toBeTruthy();
    expect(within(sheet).getByText("38,9")).toBeTruthy();
    expect(within(sheet).getByText("110")).toBeTruthy();
    expect(within(sheet).getByText("28")).toBeTruthy();
    expect(within(sheet).getByText("Normocoradas")).toBeTruthy();
    expect(within(sheet).queryByText("Pálidas")).toBeNull();
  });

  it("não mistura atendimentos de outro paciente", async () => {
    seed({
      patients: [patient(), patient({ id: "p2", name: "Mel", tutor: "Beto", weight: "—" })],
      appointments: THOR_APPOINTMENTS,
    });
    const sheet = await openRecord("Mel");
    expect(within(sheet).getByText("4", { selector: "p" })).toBeTruthy();
    expect(within(sheet).queryByText("12,5")).toBeNull();
  });

  it("sem atendimentos, usa o peso do cadastro e indica a origem", async () => {
    seed({ patients: [patient({ weight: "9.8 kg" })] });
    const sheet = await openRecord();

    expect(within(sheet).getByText("9,8")).toBeTruthy();
    expect(within(sheet).getByText("Do cadastro")).toBeTruthy();
    expect(within(sheet).getAllByText("Sem registro").length).toBeGreaterThan(0);
  });

  it("mostra a escala de ECC como não avaliado e orienta como preencher", async () => {
    seed({ patients: [patient()] });
    const sheet = await openRecord();

    expect(within(sheet).getByRole("img", { name: "Escore de condição corporal não avaliado" })).toBeTruthy();
    expect(within(sheet).getByText("Não avaliado")).toBeTruthy();
  });

  it("mostra o ECC salvo no paciente com a faixa correspondente", async () => {
    seed({ patients: [patient({ ecc: 4 })] });
    const sheet = await openRecord();

    expect(within(sheet).getByRole("img", { name: "Escore de condição corporal 4 de 9: Ideal" })).toBeTruthy();
    expect(within(sheet).getByText("ECC 4 · Ideal")).toBeTruthy();
  });

  it("permite definir o ECC pela edição do paciente", async () => {
    seed({ patients: [patient()] });
    const sheet = await openRecord();

    await userEvent.click(within(sheet).getByRole("button", { name: /Editar/ }));
    await chooseOption("Escore de condição corporal (ECC)", "7 · Sobrepeso");
    await userEvent.click(await screen.findByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("ECC 7 · Sobrepeso")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).patients[0].ecc).toBe(7);
  });

  it("mostra o gráfico e a tabela de pesagens na aba Evolução de Peso", async () => {
    seed({ patients: [patient()], appointments: THOR_APPOINTMENTS });
    const sheet = await openRecord();

    await userEvent.click(within(sheet).getByRole("tab", { name: "Evolução de Peso" }));

    expect(
      await within(sheet).findByRole("img", {
        name: "Gráfico da evolução de peso: 11,8 kg em 01/09/2026 até 12,5 kg em 01/10/2026",
      }),
    ).toBeTruthy();
    const rows = within(within(sheet).getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("01/10/2026")).toBeTruthy();
    expect(within(rows[1]).getByText("+0,7 kg")).toBeTruthy();
    expect(within(rows[2]).getByText("01/09/2026")).toBeTruthy();
    expect(within(rows[2]).getByText("—")).toBeTruthy();
  });

  it("com uma única pesagem, explica que a curva precisa de duas", async () => {
    seed({ patients: [patient()], appointments: [THOR_APPOINTMENTS[0]] });
    const sheet = await openRecord();

    await userEvent.click(within(sheet).getByRole("tab", { name: "Evolução de Peso" }));
    expect(await within(sheet).findByText(/ao menos duas pesagens/)).toBeTruthy();
    expect(within(sheet).getByRole("table")).toBeTruthy();
  });

  it("sem nenhuma pesagem, mostra o aviso e nenhuma tabela", async () => {
    seed({ patients: [patient({ weight: "—" })] });
    const sheet = await openRecord();

    await userEvent.click(within(sheet).getByRole("tab", { name: "Evolução de Peso" }));
    expect(await within(sheet).findByText(/Nenhuma pesagem registrada/)).toBeTruthy();
    expect(within(sheet).queryByRole("table")).toBeNull();
  });

  it("mantém o histórico veterinário na aba Histórico Clínico", async () => {
    seed({ patients: [patient()] });
    const sheet = await openRecord();

    await userEvent.click(within(sheet).getByRole("tab", { name: "Histórico Clínico" }));
    expect(await within(sheet).findByText("Controle de rotina")).toBeTruthy();
  });

  it("mantém tutor, vínculo e situação de vacinas no resumo", async () => {
    seed({ patients: [patient()] });
    const sheet = await openRecord();

    expect(within(sheet).getByText("Tutor responsável")).toBeTruthy();
    expect(within(sheet).getByText("Vínculo LivePet")).toBeTruthy();
    expect(within(sheet).getByText("Carteira de vacinas em dia")).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "Registrar novo atendimento" })).toBeTruthy();
  });
});
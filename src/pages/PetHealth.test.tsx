import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PetHealth from "./PetHealth";
import { calcularStatus, formatarData } from "@/lib/vacinas";
import type { PetSaude } from "@/lib/petsSaude";

const HOJE = new Date(2026, 8, 22); // 22/09/2026

const PETS: PetSaude[] = [
  {
    id: "thor",
    nome: "Thor do Vale Imperial",
    apelido: "Thor",
    especie: "Cachorro",
    raca: "Golden Retriever",
    registro: "CBKC 12.847",
    img: "thor.jpg",
    vacinas: [
      {
        id: "t1",
        nome: "V10 (Polivalente)",
        dose: "3ª dose",
        dataAplicacao: "2026-03-14",
        dataReforco: "2027-03-14",
        clinica: "Clínica Vale Verde",
      },
      {
        id: "t2",
        nome: "Antirrábica",
        dose: "Anual",
        dataAplicacao: "2025-02-02",
        dataReforco: "2026-02-02",
        clinica: "Clínica Vale Verde",
      },
    ],
    avisos: {
      alergias: [
        {
          id: "ta1",
          titulo: "Alergia grave a sulfas",
          detalhe: "Reação em 2024.",
        },
      ],
      recomendacoes: [
        { id: "tr1", titulo: "Controle de peso", detalhe: "Pesagem mensal." },
      ],
    },
  },
  {
    id: "mia",
    nome: "Mia",
    apelido: "Mia",
    especie: "Gato",
    raca: "SRD",
    registro: "Microchip 982",
    img: "mia.jpg",
    vacinas: [
      {
        id: "m1",
        nome: "Tríplice felina",
        dose: "Reforço anual",
        dataAplicacao: "2026-01-10",
        dataReforco: "2027-01-10",
        clinica: "Clínica Bicho Feliz",
      },
    ],
    avisos: {
      alergias: [],
      recomendacoes: [
        {
          id: "mr1",
          titulo: "Limpeza dentária anual",
          detalhe: "Tártaro leve.",
        },
      ],
    },
  },
];

const renderizar = (props = {}) =>
  render(
    <MemoryRouter>
      <PetHealth pets={PETS} {...props} />
    </MemoryRouter>
  );

beforeAll(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(HOJE);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("calcularStatus", () => {
  it("marca como atrasada quando o reforço já passou", () => {
    expect(calcularStatus("2026-02-02", HOJE).tipo).toBe("atrasada");
  });

  it("marca como em dia quando o reforço é futuro", () => {
    expect(calcularStatus("2027-03-14", HOJE).tipo).toBe("em-dia");
  });

  it("considera o reforço de hoje como em dia", () => {
    expect(calcularStatus("2026-09-22", HOJE).tipo).toBe("em-dia");
  });
});

describe("formatarData", () => {
  it("formata no padrão brasileiro sem deslocar o fuso", () => {
    expect(formatarData("2026-03-14")).toBe("14/03/2026");
  });
});

describe("<PetHealth />", () => {
  it("lista cada vacina do pet selecionado com aplicação, reforço e status", () => {
    renderizar();

    const linhaV10 = screen.getByText("V10 (Polivalente)").closest("tr");
    expect(linhaV10).not.toBeNull();
    expect(within(linhaV10!).getByText("14/03/2026")).toBeInTheDocument();
    expect(within(linhaV10!).getByText("14/03/2027")).toBeInTheDocument();
    expect(within(linhaV10!).getByText("Em dia")).toBeInTheDocument();

    const linhaAntirrabica = screen.getByText("Antirrábica").closest("tr");
    expect(within(linhaAntirrabica!).getByText("Atrasada")).toBeInTheDocument();
  });

  it("começa pelo primeiro pet da lista", () => {
    renderizar();

    expect(screen.getByRole("button", { name: /Thor/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("respeita o pet informado em petInicial", () => {
    renderizar({ petInicial: "mia" });

    expect(screen.getByText("Tríplice felina")).toBeInTheDocument();
    expect(screen.queryByText("V10 (Polivalente)")).not.toBeInTheDocument();
  });

  it("troca as vacinas e os avisos ao selecionar outro pet", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderizar();

    expect(screen.getByText("Alergia grave a sulfas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Mia/ }));

    expect(screen.getByText("Tríplice felina")).toBeInTheDocument();
    expect(screen.queryByText("V10 (Polivalente)")).not.toBeInTheDocument();
    expect(screen.queryByText("Alergia grave a sulfas")).not.toBeInTheDocument();
    expect(screen.getByText("Limpeza dentária anual")).toBeInTheDocument();
  });

  it("marca no seletor quantas vacinas estão atrasadas por pet", () => {
    renderizar();

    const botaoThor = screen.getByRole("button", { name: /Thor/ });
    expect(within(botaoThor).getByText("1")).toBeInTheDocument();
  });

  it("exibe o bloco de avisos com alergias e recomendações", () => {
    renderizar();

    expect(screen.getByText("Avisos importantes")).toBeInTheDocument();
    expect(screen.getByText("Alergia grave a sulfas")).toBeInTheDocument();
    expect(screen.getByText("Controle de peso")).toBeInTheDocument();
  });

  it("resume quantas doses precisam de reforço", () => {
    renderizar();

    expect(screen.getByText("1 dose precisa de reforço.")).toBeInTheDocument();
  });

  it("mostra mensagem quando o pet não tem vacinas registradas", () => {
    const semVacinas: PetSaude[] = [{ ...PETS[0], vacinas: [] }];
    renderizar({ pets: semVacinas });

    expect(screen.getByText(/Nenhuma vacina registrada/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
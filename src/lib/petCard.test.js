import { describe, expect, it } from "vitest";
import { buildHealthSummary, buildPetTags, buildPetWeight } from "./petCard";

const max = {
  especie: "Cachorro",
  raca: "Golden Retriever",
  sexo: "Macho",
  cor: "Dourado",
  peso: 32.4,
  data_nascimento: "2021-04-12",
};

describe("buildPetTags", () => {
  it("usa sexo, raça e cor do pet", () => {
    expect(buildPetTags(max)).toEqual(["Macho", "Golden Retriever", "Dourado"]);
  });

  it("ignora campos vazios e repetidos", () => {
    expect(buildPetTags({ sexo: "Fêmea", raca: " ", cor: "Fêmea" })).toEqual(["Fêmea"]);
    expect(buildPetTags({})).toEqual([]);
  });

  it("nunca devolve as etiquetas fixas antigas", () => {
    expect(buildPetTags(max)).not.toContain("Dócil");
  });
});

describe("buildPetWeight", () => {
  it("mostra o peso no formato brasileiro", () => {
    expect(buildPetWeight(max)).toBe("Peso: 32,4 kg");
    expect(buildPetWeight({ peso: 3 })).toBe("Peso: 3 kg");
  });

  it("fica vazio sem peso cadastrado", () => {
    expect(buildPetWeight({ peso: null })).toBe("");
    expect(buildPetWeight({})).toBe("");
  });
});

describe("buildHealthSummary", () => {
  it("conta vacinas e consultas e mostra a consulta mais recente", () => {
    const pet = {
      vaccines: [{}, {}, {}],
      medical_records: [
        { descricao: "Consulta antiga", data_registro: "2025-01-10T10:00:00Z" },
        { descricao: "Check-up anual sem alterações", data_registro: "2026-03-02T10:00:00Z" },
      ],
    };
    expect(buildHealthSummary(pet)).toEqual({
      counts: "3 vacinas · 2 consultas",
      note: "Check-up anual sem alterações",
    });
  });

  it("usa singular para um item", () => {
    const pet = { vaccines: [{}], medical_records: [{ descricao: "Retorno" }] };
    expect(buildHealthSummary(pet).counts).toBe("1 vacina · 1 consulta");
  });

  it("não inventa acompanhamento quando não há registros", () => {
    expect(buildHealthSummary({})).toEqual({
      counts: "0 vacinas · 0 consultas",
      note: "Nenhuma consulta registrada ainda.",
    });
  });
});

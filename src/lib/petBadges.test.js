import { describe, expect, it } from "vitest";
import { formatTutorCity, hasApprovedPedigree, hasVetRecord } from "./petBadges";

describe("hasApprovedPedigree", () => {
  it("mostra o selo apenas para pedigree aprovado", () => {
    expect(hasApprovedPedigree({ lineage: { status_verificacao: "aprovado" } })).toBe(true);
  });

  it("não mostra para pedigree pendente ou declaratório", () => {
    expect(hasApprovedPedigree({ lineage: { status_verificacao: "pendente" } })).toBe(false);
    expect(hasApprovedPedigree({ lineage: { status_verificacao: "declaratorio" } })).toBe(false);
  });

  it("não mostra só por ter raça preenchida", () => {
    expect(hasApprovedPedigree({ raca: "Labrador", lineage: null })).toBe(false);
    expect(hasApprovedPedigree({ raca: "Labrador" })).toBe(false);
  });

  it("aceita pet indefinido sem quebrar", () => {
    expect(hasApprovedPedigree(undefined)).toBe(false);
  });
});

describe("hasVetRecord", () => {
  it("mostra o selo com vacina ou registro médico", () => {
    expect(hasVetRecord({ vaccines: [{ nome: "V10" }], medical_records: [] })).toBe(true);
    expect(hasVetRecord({ vaccines: [], medical_records: [{ tipo: "Consulta" }] })).toBe(true);
  });

  it("não mostra sem nenhum registro", () => {
    expect(hasVetRecord({ vaccines: [], medical_records: [] })).toBe(false);
    expect(hasVetRecord({})).toBe(false);
  });
});

describe("formatTutorCity", () => {
  it("junta cidade e estado", () => {
    expect(formatTutorCity({ cidade: "Goiânia", estado: "GO" })).toBe("Goiânia, GO");
  });

  it("usa só a cidade quando não há estado", () => {
    expect(formatTutorCity({ cidade: "Goiânia" })).toBe("Goiânia");
  });

  it("fica vazio quando a cidade não foi informada", () => {
    expect(formatTutorCity({ estado: "GO" })).toBe("");
    expect(formatTutorCity(null)).toBe("");
  });
});

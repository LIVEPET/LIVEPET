import { describe, expect, it } from "vitest";
import {
  formatTutorCity,
  hasApprovedPedigree,
  hasLineage,
  hasVetRecord,
  lineageStatusLabel,
} from "./petBadges";

describe("hasLineage", () => {
  it("conta como pedigree só quando o pet tem linhagem", () => {
    expect(hasLineage({ lineage: { status_verificacao: "declaratorio" } })).toBe(true);
  });

  it("não conta pet só com raça", () => {
    expect(hasLineage({ raca: "Golden Retriever", lineage: null })).toBe(false);
    expect(hasLineage({ raca: "Golden Retriever" })).toBe(false);
    expect(hasLineage(undefined)).toBe(false);
  });
});

describe("lineageStatusLabel", () => {
  it("traduz o status real da linhagem", () => {
    expect(lineageStatusLabel({ lineage: { status_verificacao: "aprovado" } })).toBe("Verificado");
    expect(lineageStatusLabel({ lineage: { status_verificacao: "pendente" } })).toBe("Em análise");
    expect(lineageStatusLabel({ lineage: { status_verificacao: "declaratorio" } })).toBe(
      "Declarado pelo tutor",
    );
  });

  it("status desconhecido vira declarado e sem linhagem fica vazio", () => {
    expect(lineageStatusLabel({ lineage: {} })).toBe("Declarado pelo tutor");
    expect(lineageStatusLabel({ raca: "Poodle" })).toBe("");
  });
});

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

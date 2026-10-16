import { describe, expect, it } from "vitest";
import {
  WEEK_DAYS,
  buildHour,
  defaultHours,
  hoursForDisplay,
  hoursForEditing,
  isDuplicateName,
  memberMeta,
  normalizeHour,
  normalizeMember,
  normalizeService,
  parseDuration,
  parsePrice,
  serviceMeta,
  validateHours,
} from "./clinicProfile";

describe("horários", () => {
  it("monta o rótulo de aberto e de fechado", () => {
    expect(buildHour("Seg", true, "08:00", "18:00").time).toBe("08:00 às 18:00");
    expect(buildHour("Dom", false)).toMatchObject({ open: false, time: "Fechado", from: "", to: "" });
  });

  it("sugere seg a sex abertos, sábado até 12h e domingo fechado", () => {
    const hours = defaultHours();
    expect(hours.map((h) => h.day)).toEqual(WEEK_DAYS);
    expect(hours[0].time).toBe("08:00 às 18:00");
    expect(hours[5].time).toBe("08:00 às 12:00");
    expect(hours[6].open).toBe(false);
  });

  it("entende o formato antigo { day, time }", () => {
    expect(normalizeHour("Seg", { day: "Seg", time: "09:00 às 17:30" })).toMatchObject({
      open: true,
      from: "09:00",
      to: "17:30",
    });
    expect(normalizeHour("Dom", { day: "Dom", time: "Fechado" }).open).toBe(false);
    expect(normalizeHour("Ter", null).open).toBe(false);
  });

  it("hoursForEditing devolve sempre os 7 dias na ordem da semana", () => {
    const rows = hoursForEditing([
      { day: "Qua", open: true, from: "10:00", to: "14:00" },
      { day: "Seg", open: true, from: "08:00", to: "18:00" },
    ]);
    expect(rows.map((r) => r.day)).toEqual(WEEK_DAYS);
    expect(rows.find((r) => r.day === "Qua").from).toBe("10:00");
    expect(rows.find((r) => r.day === "Ter").open).toBe(false);
    expect(hoursForEditing([])).toHaveLength(7);
    expect(hoursForEditing(undefined)).toHaveLength(7);
  });

  it("hoursForDisplay ordena e mostra só os dias cadastrados", () => {
    const list = hoursForDisplay([
      { day: "Sex", open: false },
      { day: "Seg", open: true, from: "08:00", to: "18:00" },
    ]);
    expect(list.map((h) => h.day)).toEqual(["Seg", "Sex"]);
    expect(list[1].time).toBe("Fechado");
  });

  it("valida abertura, fechamento e a ordem dos horários", () => {
    const errors = validateHours([
      buildHour("Seg", true, "08:00", "18:00"),
      buildHour("Ter", true, "", "18:00"),
      buildHour("Qua", true, "08:00", ""),
      buildHour("Qui", true, "18:00", "08:00"),
      buildHour("Sex", true, "08:00", "08:00"),
      buildHour("Dom", false),
    ]);
    expect(Object.keys(errors)).toEqual(["Ter", "Qua", "Qui", "Sex"]);
    expect(errors.Ter).toMatch(/abertura/);
    expect(errors.Qua).toMatch(/fechamento/);
    expect(errors.Qui).toMatch(/depois da abertura/);
  });
});

describe("preço e duração", () => {
  it("interpreta formatos brasileiros e americanos", () => {
    expect(parsePrice("80")).toBe(80);
    expect(parsePrice("80,5")).toBe(80.5);
    expect(parsePrice("80.50")).toBe(80.5);
    expect(parsePrice("R$ 1.200,00")).toBe(1200);
    expect(parsePrice("0")).toBe(0);
  });

  it("vazio é sem preço e inválido é NaN", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("  ")).toBeNull();
    expect(parsePrice("abc")).toBeNaN();
    expect(parsePrice("-5")).toBeNaN();
    expect(parsePrice("1.200")).toBeNaN();
    expect(parsePrice("10,555")).toBeNaN();
  });

  it("duração aceita inteiros de 1 a 1440", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("30")).toBe(30);
    expect(parseDuration("1440")).toBe(1440);
    expect(parseDuration("0")).toBeNaN();
    expect(parseDuration("1441")).toBeNaN();
    expect(parseDuration("2,5")).toBeNaN();
    expect(parseDuration("abc")).toBeNaN();
  });
});

describe("serviços e equipe", () => {
  it("normaliza serviço em texto puro e em objeto", () => {
    expect(normalizeService("Vacinação")).toEqual({ name: "Vacinação", duration: null, price: null });
    expect(normalizeService({ name: " Consulta ", duration: 30, price: 80 })).toEqual({
      name: "Consulta",
      duration: 30,
      price: 80,
    });
    expect(normalizeService(null).name).toBe("");
  });

  it("monta o resumo do serviço com duração e preço", () => {
    expect(serviceMeta({ duration: 30, price: 80.5 })).toMatch(/^30 min · R\$\s*80,50$/);
    expect(serviceMeta({ duration: null, price: 0 })).toMatch(/^R\$\s*0,00$/);
    expect(serviceMeta({ duration: null, price: null })).toBe("");
  });

  it("normaliza membro da equipe e junta função e CRMV", () => {
    expect(normalizeMember({ name: "Dra. Marina", role: "Veterinária", crmv: "SP-1" })).toEqual({
      name: "Dra. Marina",
      role: "Veterinária",
      crmv: "SP-1",
    });
    expect(memberMeta({ role: "Veterinária", crmv: "SP-1" })).toBe("Veterinária · SP-1");
    expect(memberMeta({ role: "", crmv: "SP-1" })).toBe("SP-1");
    expect(memberMeta({ role: "", crmv: "" })).toBe("");
  });

  it("detecta nome repetido ignorando maiúsculas e o item em edição", () => {
    const a = { name: "Consulta" };
    const b = { name: "Vacina" };
    expect(isDuplicateName([a, b], " consulta ", null, normalizeService)).toBe(true);
    expect(isDuplicateName([a, b], "Consulta", a, normalizeService)).toBe(false);
    expect(isDuplicateName([a, b], "Exame", null, normalizeService)).toBe(false);
  });
});
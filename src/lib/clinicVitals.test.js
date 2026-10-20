import { describe, expect, it } from "vitest";
import {
  ECC_OPTIONS,
  belongsToPatient,
  buildVitals,
  formatDate,
  formatDelta,
  formatNumber,
  getBodyCondition,
  normalizeEcc,
  parseDate,
  toNumber,
  weightFromText,
} from "./clinicVitals";

const thor = { id: "p1", name: "Thor", tutor: "Ana", weight: "—" };

const done = (extra) => ({
  petName: "Thor",
  tutor: "Ana",
  status: "Concluído",
  time: "09:00",
  ...extra,
});

describe("números e datas", () => {
  it("converte textos em número", () => {
    expect(toNumber("12,5")).toBe(12.5);
    expect(toNumber(" 8 ")).toBe(8);
    expect(toNumber("")).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber("abc")).toBeNull();
    expect(weightFromText("12.5 kg")).toBe(12.5);
    expect(weightFromText("—")).toBeNull();
  });

  it("formata número e variação em português", () => {
    expect(formatNumber(12.5)).toBe("12,5");
    expect(formatNumber(10)).toBe("10");
    expect(formatDelta(0.7)).toBe("+0,7");
    expect(formatDelta(-0.3)).toBe("−0,3");
    expect(formatDelta(0)).toBe("0");
  });

  it("entende datas ISO e dd/mm/aaaa", () => {
    expect(formatDate("2026-10-16")).toBe("16/10");
    expect(formatDate("2026-10-16", "full")).toBe("16/10/2026");
    expect(formatDate("16/10/2026", "full")).toBe("16/10/2026");
    expect(formatDate("")).toBe("");
    expect(parseDate("não é data")).toBeNull();
  });
});

describe("belongsToPatient", () => {
  it("usa o id quando o atendimento tem patientId", () => {
    expect(belongsToPatient(thor, { patientId: 1, petName: "Outro", tutor: "X" })).toBe(false);
    expect(belongsToPatient(thor, { patientId: "p1", petName: "Outro", tutor: "X" })).toBe(true);
  });

  it("sem patientId, compara nome e tutor ignorando maiúsculas", () => {
    expect(belongsToPatient(thor, { petName: " thor ", tutor: "ANA" })).toBe(true);
    expect(belongsToPatient(thor, { petName: "Thor", tutor: "Beto" })).toBe(false);
  });
});

describe("buildVitals", () => {
  const appointments = [
    done({ id: "a2", date: "2026-10-01", peso: 12.5, temperatura: 38.9, frequencia_cardiaca: 110, frequencia_respiratoria: 28, mucosas: "Normocoradas" }),
    done({ id: "a1", date: "2026-09-01", peso: 11.8, temperatura: 38.5, frequencia_cardiaca: 100, frequencia_respiratoria: 24, mucosas: "Pálidas" }),
    done({ id: "x", petName: "Mel", date: "2026-10-05", peso: 4 }),
    { ...done({ id: "y", date: "2026-10-10", peso: 99 }), status: "Confirmado" },
  ];

  it("usa só atendimentos concluídos do próprio paciente", () => {
    const vitals = buildVitals(thor, appointments);
    expect(vitals.hasData).toBe(true);
    expect(vitals.weightSeries.map((p) => p.peso)).toEqual([11.8, 12.5]);
  });

  it("ordena a série por data e calcula a variação entre pesagens", () => {
    const { weightSeries, weightChange } = buildVitals(thor, appointments);
    expect(weightSeries[0]).toMatchObject({ date: "2026-09-01", label: "01/09", delta: null });
    expect(weightSeries[1]).toMatchObject({ date: "2026-10-01", delta: 0.7 });
    expect(weightChange).toBe(0.7);
  });

  it("pega o último valor medido de cada sinal vital", () => {
    const { latest } = buildVitals(thor, appointments);
    expect(latest.peso).toEqual({ value: 12.5, date: "2026-10-01" });
    expect(latest.temperatura.value).toBe(38.9);
    expect(latest.fc.value).toBe(110);
    expect(latest.fr.value).toBe(28);
    expect(latest.mucosas.value).toBe("Normocoradas");
  });

  it("não deixa um atendimento sem peso apagar o último peso conhecido", () => {
    const list = [...appointments, done({ id: "a3", date: "2026-10-20", temperatura: 39.1 })];
    const { latest, weightSeries } = buildVitals(thor, list);
    expect(latest.temperatura.value).toBe(39.1);
    expect(latest.peso.value).toBe(12.5);
    expect(weightSeries).toHaveLength(2);
  });

  it("aceita números como texto vindos do backend", () => {
    const { weightSeries } = buildVitals(thor, [done({ date: "2026-10-01", peso: "12.5" })]);
    expect(weightSeries[0].peso).toBe(12.5);
  });

  it("mostra o ano no rótulo quando as pesagens passam de um ano", () => {
    const list = [done({ date: "2025-12-20", peso: 10 }), done({ date: "2026-01-10", peso: 10.4 })];
    expect(buildVitals(thor, list).weightSeries.map((p) => p.label)).toEqual(["20/12/2025", "10/01/2026"]);
  });

  it("sem atendimentos, usa o peso do cadastro como alternativa", () => {
    const vitals = buildVitals({ ...thor, weight: "9.8 kg" }, []);
    expect(vitals.hasData).toBe(false);
    expect(vitals.latest.peso).toEqual({ value: 9.8, date: null, fromRegistration: true });
    expect(vitals.weightSeries).toEqual([]);
    expect(vitals.weightChange).toBeNull();
    expect(vitals.latest.temperatura).toBeNull();
  });

  it("não quebra com lista vazia ou ausente", () => {
    expect(buildVitals(thor, undefined).hasData).toBe(false);
    expect(buildVitals(thor, [null, {}]).hasData).toBe(false);
  });
});

describe("Escore de Condição Corporal", () => {
  it("classifica a escala de 1 a 9", () => {
    expect(getBodyCondition(1).label).toBe("Abaixo do peso");
    expect(getBodyCondition(3).label).toBe("Abaixo do peso");
    expect(getBodyCondition(4).label).toBe("Ideal");
    expect(getBodyCondition(5).label).toBe("Ideal");
    expect(getBodyCondition(6).label).toBe("Sobrepeso");
    expect(getBodyCondition(7).label).toBe("Sobrepeso");
    expect(getBodyCondition(8).label).toBe("Obeso");
    expect(getBodyCondition(9).label).toBe("Obeso");
  });

  it("rejeita valores fora da escala", () => {
    expect(getBodyCondition(0)).toBeNull();
    expect(getBodyCondition(10)).toBeNull();
    expect(getBodyCondition(5.5)).toBeNull();
    expect(getBodyCondition(null)).toBeNull();
    expect(normalizeEcc("7")).toBe(7);
    expect(normalizeEcc("abc")).toBeNull();
  });

  it("gera as 9 opções do seletor", () => {
    expect(ECC_OPTIONS).toHaveLength(9);
    expect(ECC_OPTIONS[6]).toEqual({ value: "7", label: "7 · Sobrepeso" });
  });
});
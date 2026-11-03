import { describe, expect, it } from "vitest";
import {
  VACCINE_STATUS,
  buildPatientVaccinationHistory,
  calculateDoseStatus,
  getDaysDifference,
  getVaccineAlertsForDashboard,
} from "./vaccineSchedule";

describe("vaccineSchedule", () => {
  const refDate = "2026-11-03";

  describe("getDaysDifference", () => {
    it("calcula dias futuros positivos e passados negativos", () => {
      expect(getDaysDifference("2026-11-10", refDate)).toBe(7);
      expect(getDaysDifference("2026-11-03", refDate)).toBe(0);
      expect(getDaysDifference("2026-10-31", refDate)).toBe(-3);
      expect(getDaysDifference(null, refDate)).toBeNull();
    });
  });

  describe("calculateDoseStatus", () => {
    it("retorna sem_reforco quando não há data de próxima dose", () => {
      const res = calculateDoseStatus(null, refDate);
      expect(res.status).toBe(VACCINE_STATUS.NO_BOOSTER);
      expect(res.label).toContain("Dose única");
    });

    it("retorna atrasada quando a data do reforço já passou", () => {
      const res = calculateDoseStatus("2026-10-25", refDate);
      expect(res.status).toBe(VACCINE_STATUS.OVERDUE);
      expect(res.label).toBe("Atrasada");
      expect(res.detail).toContain("9 dias");
      expect(res.daysRemaining).toBe(-9);
    });

    it("retorna vence_em_breve quando a data é em até 15 dias", () => {
      const resExact = calculateDoseStatus("2026-11-18", refDate); // 15 dias
      expect(resExact.status).toBe(VACCINE_STATUS.DUE_SOON);
      expect(resExact.label).toBe("Vence em breve");
      expect(resExact.daysRemaining).toBe(15);

      const resToday = calculateDoseStatus("2026-11-03", refDate);
      expect(resToday.status).toBe(VACCINE_STATUS.DUE_SOON);
      expect(resToday.detail).toBe("Vence hoje");
    });

    it("retorna em_dia quando a data é superior a 15 dias", () => {
      const res = calculateDoseStatus("2026-12-01", refDate);
      expect(res.status).toBe(VACCINE_STATUS.UP_TO_DATE);
      expect(res.label).toBe("Em dia");
      expect(res.daysRemaining).toBeGreaterThan(15);
    });
  });

  describe("buildPatientVaccinationHistory", () => {
    it("combina vacinas pregressas manuais e de atendimentos", () => {
      const patient = {
        name: "Max",
        tutor: "Ana Silva",
        vaccines: [
          {
            nome: "V8 Canina",
            lote: "LOTE-111",
            data_aplicacao: "2025-11-01",
            proxima_dose: "2026-11-01", // Atrasada em 2 dias
          },
        ],
      };

      const appointments = [
        {
          id: 1,
          petName: "Max",
          tutor: "Ana Silva",
          date: "2026-06-15",
          vet: "Dra. Beatriz",
          vacina_aplicada: "Anti-rábica",
          vacina_lote: "LOTE-222",
          vacina_proxima_dose: "2027-06-15", // Em dia
        },
      ];

      const history = buildPatientVaccinationHistory(patient, appointments, refDate);
      expect(history.doses).toHaveLength(2);
      expect(history.doses[0].nome).toBe("Anti-rábica"); // mais recente (2026) primeiro
      expect(history.doses[1].nome).toBe("V8 Canina");

      // Por conter uma atrasada, o resumo consolidado acusa atraso
      expect(history.summary.status).toBe(VACCINE_STATUS.OVERDUE);
      expect(history.summary.label).toBe("Reforço atrasado");
      expect(history.summary.overdueCount).toBe(1);
    });

    it("informa sem_registro quando pet não tem vacinas", () => {
      const patient = { name: "Pipoca", vaccines: [] };
      const history = buildPatientVaccinationHistory(patient, [], refDate);
      expect(history.doses).toHaveLength(0);
      expect(history.summary.status).toBe(VACCINE_STATUS.NO_RECORD);
    });
  });

  describe("getVaccineAlertsForDashboard", () => {
    it("identifica pets com vacinas atrasadas ou vencendo em breve", () => {
      const patients = [
        {
          id: "p1",
          name: "Thor",
          tutor: "Carlos",
          vaccines: [
            {
              nome: "V10",
              data_aplicacao: "2025-10-01",
              proxima_dose: "2026-10-01", // Atrasada
            },
          ],
        },
        {
          id: "p2",
          name: "Mel",
          tutor: "Juliana",
          vaccines: [
            {
              nome: "Giárdia",
              data_aplicacao: "2026-05-10",
              proxima_dose: "2026-11-10", // Vence em 7 dias
            },
          ],
        },
        {
          id: "p3",
          name: "Rex",
          tutor: "Marcos",
          vaccines: [
            {
              nome: "Raiva",
              data_aplicacao: "2026-10-01",
              proxima_dose: "2027-10-01", // Em dia
            },
          ],
        },
      ];

      const alerts = getVaccineAlertsForDashboard(patients, [], refDate);
      expect(alerts).toHaveLength(2);
      expect(alerts[0].patientName).toBe("Thor");
      expect(alerts[0].isOverdue).toBe(true);
      expect(alerts[1].patientName).toBe("Mel");
      expect(alerts[1].isOverdue).toBe(false);
    });
  });
});

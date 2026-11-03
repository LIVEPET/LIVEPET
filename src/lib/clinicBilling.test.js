import { describe, expect, it } from "vitest";
import {
  PAYMENT_STATUS,
  calculateAppointmentTotal,
  computeClinicRevenue,
  findServicePrice,
  formatCurrency,
} from "./clinicBilling";

describe("clinicBilling", () => {
  describe("formatCurrency", () => {
    it("formata valores monetários em BRL", () => {
      const res = formatCurrency(150);
      expect(res).toContain("150");
      expect(res).toMatch(/R\$/);
    });

    it("trata valores nulos ou zero", () => {
      const res = formatCurrency(0);
      expect(res).toContain("0");
    });
  });

  describe("findServicePrice", () => {
    const services = [
      { name: "Consulta Geral", duration: 30, price: 150 },
      { name: "Vacinação V10", duration: 20, price: 95 },
      { name: "Banho e Tosa", price: 80 },
    ];

    it("encontra o preço exato do serviço", () => {
      expect(findServicePrice("Consulta Geral", services)).toBe(150);
      expect(findServicePrice("Vacinação V10", services)).toBe(95);
    });

    it("encontra o preço com correspondência parcial case-insensitive", () => {
      expect(findServicePrice("consulta", services)).toBe(150);
      expect(findServicePrice("v10", services)).toBe(95);
    });

    it("retorna null se o serviço não tiver preço ou não existir", () => {
      expect(findServicePrice("Cirurgia", services)).toBeNull();
      expect(findServicePrice("", services)).toBeNull();
      expect(findServicePrice("Exame", [])).toBeNull();
    });
  });

  describe("calculateAppointmentTotal", () => {
    it("calcula soma de serviço base + itens extras - desconto", () => {
      const total = calculateAppointmentTotal({
        basePrice: 150,
        extraItems: [
          { descricao: "Curativo", valor: 35 },
          { descricao: "Medicação", valor: 25 },
        ],
        discount: 20,
      });

      // 150 + 35 + 25 - 20 = 190
      expect(total).toBe(190);
    });

    it("não permite valor total negativo", () => {
      const total = calculateAppointmentTotal({
        basePrice: 50,
        extraItems: [],
        discount: 100,
      });

      expect(total).toBe(0);
    });

    it("lida com campos vazios com segurança", () => {
      const total = calculateAppointmentTotal({});
      expect(total).toBe(0);
    });
  });

  describe("computeClinicRevenue", () => {
    it("calcula a receita acumulada total de atendimentos pagos ou concluídos", () => {
      const appointments = [
        { id: "1", status: "Concluído", valor_total: 150, status_pagamento: "Pago" },
        { id: "2", status: "Concluído", valor_total: 200, status_pagamento: "Pago" },
        { id: "3", status: "Aguardando", valor_total: 80, status_pagamento: "Pendente" },
        { id: "4", status: "Cancelado", valor_total: 300, status_pagamento: "Pago" }, // Cancelado ignorado
      ];

      const revenue = computeClinicRevenue(appointments);
      expect(revenue.totalRevenue).toBe(350);
      expect(revenue.paidCount).toBe(2);
      expect(revenue.pendingCount).toBe(1);
    });
  });
});

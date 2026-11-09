import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClinicProvider } from "@/contexts/ClinicContext";
import ClinicSchedule from "./ClinicSchedule";
import ClinicDashboard from "./ClinicDashboard";
import { AppointmentBillingSection } from "./AppointmentBillingSection";
import { ClinicReceiptDialog } from "./ClinicReceiptDialog";

describe("Clinic Billing & Receipt Feature (Issue #133)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("AppointmentBillingSection", () => {
    it("renderiza campos de valor base, procedimentos extras, desconto e total", () => {
      const onChangeBasePrice = vi.fn();
      const onChangeExtraItems = vi.fn();
      const onChangeDiscount = vi.fn();
      const onChangePaymentStatus = vi.fn();
      const onChangePaymentMethod = vi.fn();

      render(
        <AppointmentBillingSection
          serviceName="Consulta Especializada"
          basePrice={180}
          onChangeBasePrice={onChangeBasePrice}
          extraItems={[{ id: "1", descricao: "Curativo", valor: 30 }]}
          onChangeExtraItems={onChangeExtraItems}
          discount={10}
          onChangeDiscount={onChangeDiscount}
          paymentStatus="Pago"
          onChangePaymentStatus={onChangePaymentStatus}
          paymentMethod="PIX"
          onChangePaymentMethod={onChangePaymentMethod}
        />,
      );

      expect(screen.getByText(/Orçamento, Procedimentos & Pagamento/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Pago/i)).toBeInTheDocument();
      expect(screen.getByText("Curativo")).toBeInTheDocument();

      // 180 + 30 - 10 = 200
      const totalAmount = screen.getByTestId("billing-total-amount");
      expect(totalAmount.textContent).toContain("200");
    });

    it("permite adicionar novo procedimento extra", () => {
      const onChangeExtraItems = vi.fn();
      render(
        <AppointmentBillingSection
          serviceName="Consulta"
          basePrice={100}
          onChangeBasePrice={vi.fn()}
          extraItems={[]}
          onChangeExtraItems={onChangeExtraItems}
          discount={0}
          onChangeDiscount={vi.fn()}
          paymentStatus="Pendente"
          onChangePaymentStatus={vi.fn()}
          paymentMethod="PIX"
          onChangePaymentMethod={vi.fn()}
        />,
      );

      const descInput = screen.getByPlaceholderText(/Descrição/i);
      const valInput = screen.getByLabelText("Valor do procedimento extra");
      const addBtn = screen.getByRole("button", { name: /Adicionar/i });

      fireEvent.change(descInput, { target: { value: "Exame de Urina" } });
      fireEvent.change(valInput, { target: { value: "45" } });
      fireEvent.click(addBtn);

      expect(onChangeExtraItems).toHaveBeenCalledWith([
        expect.objectContaining({
          descricao: "Exame de Urina",
          valor: 45,
        }),
      ]);
    });
  });

  describe("ClinicReceiptDialog", () => {
    const mockAppointment = {
      id: "apt-101",
      petName: "Pipoca",
      species: "Cão",
      breed: "Poodle",
      tutor: "Mariana Costa",
      phone: "(11) 98888-7777",
      service: "Consulta Geral",
      vet: "Dr. Roberto",
      valor_servico: 150,
      valor_total: 190,
      itens_adicionais: [{ descricao: "Anti-inflamatório", valor: 40 }],
      desconto: 0,
      status_pagamento: "Pago",
      forma_pagamento: "PIX",
      date: "2026-11-03",
    };

    const mockProfile = {
      name: "Clínica PetVida",
      crmv: "SP-12345",
      phone: "(11) 4002-8922",
    };

    it("renderiza preview timbrado do recibo e botão para download em PDF", () => {
      render(
        <ClinicReceiptDialog
          open={true}
          onOpenChange={vi.fn()}
          appointment={mockAppointment}
          profile={mockProfile}
        />,
      );

      expect(screen.getByTestId("receipt-dialog")).toBeInTheDocument();
      expect(screen.getByText("Clínica PetVida")).toBeInTheDocument();
      expect(screen.getByText("Pipoca")).toBeInTheDocument();
      expect(screen.getByText("Mariana Costa")).toBeInTheDocument();
      expect(screen.getByText(/Anti-inflamatório/)).toBeInTheDocument();
      expect(screen.getByTestId("btn-download-receipt-pdf")).toBeInTheDocument();
    });
  });

  describe("ClinicDashboard KPI de Receita Acumulada", () => {
    it("exibe o KPI com o total acumulado dos atendimentos quitados", () => {
      const storageData = {
        profile: { name: "Clínica Teste", services: [] },
        appointments: [
          {
            id: "a1",
            petName: "Thor",
            service: "Consulta",
            status: "Concluído",
            status_pagamento: "Pago",
            valor_total: 250,
            date: "2026-11-03",
          },
          {
            id: "a2",
            petName: "Luna",
            service: "Vacina",
            status: "Concluído",
            status_pagamento: "Pago",
            valor_total: 100,
            date: "2026-11-03",
          },
        ],
        patients: [],
      };

      localStorage.setItem("livepet_clinic_data", JSON.stringify(storageData));

      render(
        <MemoryRouter>
          <ClinicProvider>
            <ClinicDashboard />
          </ClinicProvider>
        </MemoryRouter>,
      );

      const kpiRevenue = screen.getByTestId("kpi-revenue");
      expect(kpiRevenue).toBeInTheDocument();
      expect(kpiRevenue.textContent).toContain("350"); // 250 + 100
      expect(screen.getByText("Receita acumulada")).toBeInTheDocument();
    });
  });
});

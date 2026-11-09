/**
 * Utilitário financeiro para orçamentos, cálculo de procedimentos,
 * status de pagamento e geração de recibos em PDF (Issue #133).
 */
import { jsPDF } from "jspdf";
import { normalizeService } from "@/lib/clinicProfile";

export const PAYMENT_STATUS = {
  PAID: "Pago",
  PENDING: "Pendente",
};

export const PAYMENT_METHODS = ["PIX", "Cartão", "Dinheiro", "Outro"];

export const formatCurrency = (value) => {
  const num = typeof value === "number" ? value : parseFloat(String(value || 0).replace(/[^\d.-]/g, ""));
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(num) ? num : 0,
  );
};

/**
 * Busca o preço de um serviço cadastrado no perfil da clínica com base no nome.
 */
export const findServicePrice = (serviceName, servicesList = []) => {
  if (!serviceName || !Array.isArray(servicesList)) return null;
  const target = String(serviceName).trim().toLowerCase();

  for (const raw of servicesList) {
    const s = normalizeService(raw);
    if (s.name && s.name.trim().toLowerCase() === target) {
      return Number.isFinite(s.price) ? s.price : null;
    }
  }

  // Tenta correspondência parcial (ex: "Consulta Geral" em "Consulta")
  for (const raw of servicesList) {
    const s = normalizeService(raw);
    if (s.name) {
      const nameNorm = s.name.trim().toLowerCase();
      if (nameNorm.includes(target) || target.includes(nameNorm)) {
        return Number.isFinite(s.price) ? s.price : null;
      }
    }
  }

  return null;
};

/**
 * Calcula o valor total do atendimento a partir do serviço base, itens extras e desconto.
 */
export const calculateAppointmentTotal = ({
  basePrice = 0,
  extraItems = [],
  discount = 0,
}) => {
  const base = Number.isFinite(Number(basePrice)) ? Number(basePrice) : 0;
  const extras = Array.isArray(extraItems)
    ? extraItems.reduce((acc, item) => {
        const val = Number.isFinite(Number(item?.valor)) ? Number(item.valor) : 0;
        return acc + val;
      }, 0)
    : 0;
  const desc = Number.isFinite(Number(discount)) ? Number(discount) : 0;

  const total = Math.max(0, base + extras - desc);
  return Number(total.toFixed(2));
};

/**
 * Calcula a receita acumulada total e contadores de pagamentos a partir dos agendamentos.
 */
export const computeClinicRevenue = (appointments = []) => {
  let totalRevenue = 0;
  let paidCount = 0;
  let pendingCount = 0;

  appointments.forEach((a) => {
    if (a.status === "Cancelado") return;

    const val = Number.isFinite(Number(a.valor_total))
      ? Number(a.valor_total)
      : Number.isFinite(Number(a.preco_servico))
        ? Number(a.preco_servico)
        : null;

    const isPaid = a.status_pagamento === PAYMENT_STATUS.PAID || (a.status === "Concluído" && a.status_pagamento !== PAYMENT_STATUS.PENDING && val !== null);

    if (isPaid && val !== null) {
      totalRevenue += val;
      paidCount += 1;
    } else if (a.status_pagamento === PAYMENT_STATUS.PENDING) {
      pendingCount += 1;
    }
  });

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    paidCount,
    pendingCount,
  };
};

/**
 * Gera um documento PDF de recibo timbrado usando jsPDF.
 */
export const exportReceiptPdf = (receiptData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const {
    receiptNumber = `REC-${Date.now().toString().slice(-6)}`,
    clinicName = "Clínica Veterinária",
    crmv = "",
    phone = "",
    email = "",
    address = "",
    petName = "",
    species = "",
    breed = "",
    tutorName = "",
    tutorPhone = "",
    vetName = "",
    serviceName = "Consulta Veterinária",
    basePrice = 0,
    extraItems = [],
    discount = 0,
    total = 0,
    paymentMethod = "PIX",
    paymentDate = new Date().toLocaleDateString("pt-BR"),
  } = receiptData;

  const primaryColor = [21, 128, 61]; // #15803d verde escuro

  // Cabeçalho da Clínica
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(clinicName || "LIVEPET CLÍNICA VETERINÁRIA", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const subHeader = [
    crmv ? `CRMV: ${crmv}` : null,
    phone ? `Tel: ${phone}` : null,
    email ? `E-mail: ${email}` : null,
  ].filter(Boolean).join("  |  ");
  doc.text(subHeader || "Atendimento Veterinário Especializado", 14, 18);

  if (address) {
    doc.text(address, 14, 23);
  }

  // Título do Recibo
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RECIBO DE ATENDIMENTO VETERINÁRIO", 14, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nº do Recibo: ${receiptNumber}  |  Emissão: ${paymentDate}`, 14, 46);

  // Linha separadora
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 50, 196, 50);

  // Dados do Paciente e Tutor (Bloco em 2 colunas)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 54, 182, 30, 2, 2, "F");

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DADOS DO PACIENTE", 18, 60);
  doc.text("DADOS DO TUTOR / RESPONSÁVEL", 108, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nome do Pet: ${petName || "—"}`, 18, 66);
  doc.text(`Espécie / Raça: ${species || "—"} · ${breed || "—"}`, 18, 72);
  doc.text(`Veterinário(a): ${vetName || "Equipe da Clínica"}`, 18, 78);

  doc.text(`Nome: ${tutorName || "—"}`, 108, 66);
  doc.text(`Contato: ${tutorPhone || "—"}`, 108, 72);
  doc.text(`Data do Atendimento: ${paymentDate}`, 108, 78);

  // Tabela de Serviços e Itens
  let currentY = 94;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("DISCRIMINAÇÃO DOS SERVIÇOS & PROCEDIMENTOS", 14, currentY);

  currentY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 7, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("ITEM / DESCRIÇÃO", 18, currentY + 4.8);
  doc.text("VALOR", 175, currentY + 4.8, { align: "right" });

  currentY += 7;

  // Item Principal (Serviço Base)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Serviço: ${serviceName}`, 18, currentY + 5);
  doc.text(formatCurrency(basePrice), 175, currentY + 5, { align: "right" });
  currentY += 8;

  // Procedimentos / Itens Extras
  if (Array.isArray(extraItems) && extraItems.length > 0) {
    extraItems.forEach((extra) => {
      if (!extra?.descricao) return;
      doc.text(extra.descricao, 18, currentY + 5);
      doc.text(formatCurrency(extra.valor || 0), 175, currentY + 5, { align: "right" });
      currentY += 7;
    });
  }

  // Desconto (se houver)
  if (discount > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text("Desconto Concedido", 18, currentY + 5);
    doc.text(`- ${formatCurrency(discount)}`, 175, currentY + 5, { align: "right" });
    currentY += 7;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY + 2, 196, currentY + 2);
  currentY += 8;

  // Bloco de Total e Pagamento
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(110, currentY, 86, 22, 2, 2, "F");
  doc.setTextColor(21, 128, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("VALOR TOTAL PAGO:", 114, currentY + 7);
  doc.setFontSize(14);
  doc.text(formatCurrency(total), 192, currentY + 8, { align: "right" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Status: PAGO via ${paymentMethod}`, 114, currentY + 16);

  // Termo de Quitação & Assinatura
  currentY += 38;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Declaramos ter recebido o valor acima discriminado referente aos serviços veterinários prestados.",
    14,
    currentY,
  );

  currentY += 24;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(65, currentY, 145, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(vetName || clinicName, 105, currentY + 4, { align: "center" });
  if (crmv) {
    doc.text(`CRMV: ${crmv}`, 105, currentY + 8, { align: "center" });
  }

  return doc;
};

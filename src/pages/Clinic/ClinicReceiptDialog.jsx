import { useState } from "react";
import { Download, FileText, Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportReceiptPdf, formatCurrency } from "@/lib/clinicBilling";

export const ClinicReceiptDialog = ({
  open,
  onOpenChange,
  appointment,
  profile,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!appointment) return null;

  const basePrice = Number(appointment.valor_servico ?? appointment.preco_servico ?? appointment.valor_total ?? 0);
  const extraItems = Array.isArray(appointment.itens_adicionais) ? appointment.itens_adicionais : [];
  const discount = Number(appointment.desconto ?? 0);
  const total = Number(appointment.valor_total ?? (basePrice + extraItems.reduce((acc, i) => acc + (Number(i.valor) || 0), 0) - discount));
  const paymentMethod = appointment.forma_pagamento || "PIX";
  const paymentDate = appointment.data_pagamento || appointment.date || new Date().toLocaleDateString("pt-BR");
  const receiptNumber = appointment.numero_recibo || `REC-${String(appointment.id).replace(/\D/g, "").slice(-4) || "1001"}`;

  const receiptData = {
    receiptNumber,
    clinicName: profile?.name || "LIVEPET CLÍNICA VETERINÁRIA",
    crmv: profile?.crmv || "",
    phone: profile?.phone || profile?.whatsapp || "",
    email: profile?.email || "",
    address: profile?.address || "",
    petName: appointment.petName,
    species: appointment.species,
    breed: appointment.breed,
    tutorName: appointment.tutor,
    tutorPhone: appointment.phone,
    vetName: appointment.vet,
    serviceName: appointment.service,
    basePrice,
    extraItems,
    discount,
    total,
    paymentMethod,
    paymentDate,
  };

  const handleDownloadPdf = () => {
    try {
      setIsExporting(true);
      const doc = exportReceiptPdf(receiptData);
      const filename = `recibo-${appointment.petName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${receiptNumber}.pdf`;
      doc.save(filename);
      toast.success("Recibo gerado em PDF com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar PDF do recibo.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" data-testid="receipt-dialog">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <FileText className="h-5 w-5 text-primary" /> Recibo de Atendimento
            </DialogTitle>
            <Badge
              variant="outline"
              data-testid="receipt-payment-badge"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs"
            >
              <CheckCircle2 className="h-3 w-3" /> PAGO
            </Badge>
          </div>
          <DialogDescription>
            Comprovante financeiro e de quitação de serviços veterinários prestados.
          </DialogDescription>
        </DialogHeader>

        {/* Pré-visualização do Recibo Timbrado */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-5 text-sm shadow-sm" data-testid="receipt-preview">
          {/* Cabeçalho da Clínica */}
          <div className="border-b border-border/70 pb-4 text-center sm:text-left sm:flex sm:justify-between sm:items-start gap-4">
            <div>
              <h4 className="font-display font-bold text-base text-primary">
                {receiptData.clinicName}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {receiptData.crmv && `CRMV: ${receiptData.crmv} · `}
                {receiptData.phone && `Tel: ${receiptData.phone}`}
              </p>
              {receiptData.address && (
                <p className="text-xs text-muted-foreground">{receiptData.address}</p>
              )}
            </div>
            <div className="text-right text-xs text-muted-foreground mt-2 sm:mt-0">
              <span className="font-semibold text-foreground block text-sm">
                Recibo #{receiptNumber}
              </span>
              <span>{paymentDate}</span>
            </div>
          </div>

          {/* Dados Paciente & Tutor */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/50">
            <div>
              <span className="block font-semibold uppercase text-[10px] text-muted-foreground">Paciente</span>
              <p className="font-medium text-foreground">{appointment.petName}</p>
              <p className="text-muted-foreground">{appointment.species} · {appointment.breed}</p>
            </div>
            <div>
              <span className="block font-semibold uppercase text-[10px] text-muted-foreground">Tutor / Contato</span>
              <p className="font-medium text-foreground">{appointment.tutor}</p>
              <p className="text-muted-foreground">{appointment.phone || "—"}</p>
            </div>
          </div>

          {/* Discriminação dos Valores */}
          <div className="space-y-2">
            <h5 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Discriminação dos Serviços
            </h5>

            <div className="divide-y divide-border/60 rounded-xl border border-border/70">
              <div className="flex justify-between p-3 text-xs">
                <span>{appointment.service} (Serviço Base)</span>
                <span className="font-semibold">{formatCurrency(basePrice)}</span>
              </div>

              {extraItems.map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 text-xs text-muted-foreground">
                  <span>+ {item.descricao}</span>
                  <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span>
                </div>
              ))}

              {discount > 0 && (
                <div className="flex justify-between p-3 text-xs text-destructive">
                  <span>- Desconto concedido</span>
                  <span className="font-medium">- {formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between p-3 text-sm font-bold bg-primary-soft/40 text-foreground rounded-b-xl">
                <span>Valor Total</span>
                <span className="text-primary text-base">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Informações de Pagamento e Quitação */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Quitado via {paymentMethod}
            </p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Valor de {formatCurrency(total)} recebido em {paymentDate}. Veterinário(a) responsável: {appointment.vet}.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="gap-1.5 rounded-full"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>

          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            data-testid="btn-download-receipt-pdf"
            className="gap-1.5 rounded-full gradient-primary text-primary-foreground"
          >
            <Download className="h-4 w-4" /> {isExporting ? "Gerando..." : "Baixar PDF do Recibo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

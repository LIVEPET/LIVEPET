import { useState } from "react";
import { CircleDollarSign, CreditCard, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  calculateAppointmentTotal,
  formatCurrency,
} from "@/lib/clinicBilling";

export const AppointmentBillingSection = ({
  serviceName,
  basePrice,
  onChangeBasePrice,
  extraItems = [],
  onChangeExtraItems,
  discount = 0,
  onChangeDiscount,
  paymentStatus = PAYMENT_STATUS.PAID,
  onChangePaymentStatus,
  paymentMethod = "PIX",
  onChangePaymentMethod,
}) => {
  const [newDesc, setNewDesc] = useState("");
  const [newVal, setNewVal] = useState("");

  const total = calculateAppointmentTotal({
    basePrice,
    extraItems,
    discount,
  });

  const handleAddExtra = () => {
    if (!newDesc.trim()) return;
    const itemVal = parseFloat(newVal) || 0;
    const next = [
      ...extraItems,
      {
        id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        descricao: newDesc.trim(),
        valor: itemVal,
      },
    ];
    onChangeExtraItems(next);
    setNewDesc("");
    setNewVal("");
  };

  const handleRemoveExtra = (index) => {
    const next = extraItems.filter((_, i) => i !== index);
    onChangeExtraItems(next);
  };

  return (
    <div
      className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-4"
      data-testid="appointment-billing-section"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          <span>Orçamento, Procedimentos & Pagamento</span>
        </div>

        <Badge
          variant="outline"
          data-testid="billing-status-badge"
          className={
            paymentStatus === PAYMENT_STATUS.PAID
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
          }
        >
          {paymentStatus === PAYMENT_STATUS.PAID ? "Status: Pago" : "Status: Pendente"}
        </Badge>
      </div>

      {/* Serviço Base */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="base-service-price" className="text-xs font-semibold">
            Valor do Serviço Base ({serviceName || "Serviço"})
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
              R$
            </span>
            <Input
              id="base-service-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="pl-9"
              value={basePrice !== undefined && basePrice !== null ? basePrice : ""}
              onChange={(e) => onChangeBasePrice(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Desconto */}
        <div className="space-y-1">
          <Label htmlFor="service-discount" className="text-xs font-semibold">
            Desconto Concedido
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
              R$
            </span>
            <Input
              id="service-discount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="pl-9"
              value={discount || ""}
              onChange={(e) => onChangeDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Procedimentos e Itens Extras */}
      <div className="space-y-2 border-t border-border/50 pt-3">
        <Label className="text-xs font-semibold text-foreground">
          Procedimentos e Itens Extras Adicionados
        </Label>

        {extraItems.length > 0 && (
          <div className="space-y-1.5" data-testid="extra-items-list">
            {extraItems.map((item, i) => (
              <div
                key={item.id || i}
                className="flex items-center justify-between rounded-xl bg-card border border-border/70 p-2 text-xs"
              >
                <span className="font-medium">{item.descricao}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">{formatCurrency(item.valor)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveExtra(i)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inclusão de Novo Item Extra */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Input
            placeholder="Descrição (ex: Medicação injetável, curativo...)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="text-xs flex-1"
          />
          <div className="relative w-full sm:w-32">
            <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-semibold">
              R$
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              aria-label="Valor do procedimento extra"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddExtra}
            className="h-9 gap-1 text-xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      </div>

      {/* Status e Forma de Pagamento */}
      <div className="grid gap-3 sm:grid-cols-2 border-t border-border/50 pt-3">
        <div className="space-y-1">
          <Label htmlFor="payment-status-select" className="text-xs font-semibold">
            Status do Pagamento
          </Label>
          <Select value={paymentStatus} onValueChange={onChangePaymentStatus}>
            <SelectTrigger id="payment-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PAYMENT_STATUS.PAID}>Pago</SelectItem>
              <SelectItem value={PAYMENT_STATUS.PENDING}>Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="payment-method-select" className="text-xs font-semibold">
            Forma de Pagamento
          </Label>
          <Select value={paymentMethod} onValueChange={onChangePaymentMethod}>
            <SelectTrigger id="payment-method-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Totalizador em Destaque */}
      <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-3 mt-2">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Total do Atendimento
        </span>
        <span
          className="text-base font-bold text-primary font-display"
          data-testid="billing-total-amount"
        >
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
};

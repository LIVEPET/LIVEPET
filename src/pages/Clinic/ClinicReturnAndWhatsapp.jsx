import { CalendarClock, MessageCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const addDaysToIsoDate = (baseIsoDate, days) => {
  const baseStr =
    typeof baseIsoDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(baseIsoDate)
      ? baseIsoDate
      : new Date().toISOString().split("T")[0];
  const date = new Date(`${baseStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().split("T")[0];
};

export const formatIsoDateBR = (isoDate) => {
  if (!isoDate || typeof isoDate !== "string") return "—";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const isReturnAppointmentItem = (appointment) => {
  if (!appointment) return false;
  if (appointment.isReturn === true) return true;
  const text = `${appointment.service || ""} ${appointment.notes || ""}`;
  return /retorno|reavalia/i.test(text);
};

export const buildWhatsAppUrl = (appointment, profile = {}) => {
  const rawPhone = String(appointment?.phone || "").replace(/\D/g, "");
  const normalizedPhone =
    rawPhone.length >= 10 && !rawPhone.startsWith("55")
      ? `55${rawPhone}`
      : rawPhone || "5511999999999";

  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv ? ` (${profile.crmv})` : "";
  const tutor = appointment?.tutor || "Tutor(a)";
  const petName = appointment?.petName || "seu pet";
  const service = appointment?.service || "Atendimento veterinário";
  const dateBR = formatIsoDateBR(appointment?.date);
  const time = appointment?.time || "horário agendado";
  const vet = appointment?.vet || "Equipe da clínica";

  const extraNote = appointment?.notes
    ? `\n- *Observações / Orientações:* ${appointment.notes}`
    : "";

  const message =
    `*${clinicName}*${clinicCrmv}\n` +
    `*Confirmação de Agendamento Clínico*\n\n` +
    `Prezado(a) *${tutor}*,\n` +
    `Confirmamos o agendamento de atendimento veterinário conforme os dados a seguir:\n\n` +
    `- *Paciente:* ${petName}\n` +
    `- *Serviço / Procedimento:* ${service}\n` +
    `- *Data:* ${dateBR}\n` +
    `- *Horário:* ${time}\n` +
    `- *Profissional responsável:* ${vet}` +
    extraNote +
    `\n\nCaso necessite reagendar ou tenha alguma dúvida, permanecemos à disposição.\n\n` +
    `Atenciosamente,\n` +
    `*${clinicName}*`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
};

export const openAppointmentWhatsApp = (appointment, profile = {}) => {
  const url = buildWhatsAppUrl(appointment, profile);
  if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  toast.success(`Abrindo WhatsApp para ${appointment?.tutor || "o tutor"}...`);
  return url;
};

export const ReturnAppointmentBadge = ({ appointment }) => {
  if (!isReturnAppointmentItem(appointment)) return null;
  return (
    <Badge
      variant="outline"
      data-testid={`badge-return-${appointment.id}`}
      className="gap-1 border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
    >
      <RotateCw className="h-3 w-3" />
      Retorno
    </Badge>
  );
};

export const WhatsAppActionButton = ({ appointment, profile, compact = false }) => (
  <Button
    type="button"
    size="sm"
    variant="outline"
    data-testid={`btn-whatsapp-${appointment.id}`}
    onClick={(e) => {
      e.stopPropagation();
      openAppointmentWhatsApp(appointment, profile);
    }}
    className={`rounded-full gap-1.5 border-emerald-600/40 text-xs font-medium text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 ${
      compact ? "h-8 px-2.5" : ""
    }`}
    title={`Enviar confirmação/orientações no WhatsApp de ${appointment.tutor}`}
  >
    <MessageCircle className="h-3.5 w-3.5" />
    WhatsApp
  </Button>
);

export const ReturnSchedulingSection = ({
  baseDate,
  enabled,
  onToggleEnabled,
  returnDate,
  onChangeReturnDate,
  returnTime,
  onChangeReturnTime,
  returnReason,
  onChangeReturnReason,
}) => {
  const handleQuickDays = (days) => {
    const nextDate = addDaysToIsoDate(baseDate, days);
    onChangeReturnDate(nextDate);
  };

  return (
    <div
      data-testid="return-scheduling-section"
      className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4"
    >
      <div className="flex items-center justify-between">
        <Label
          htmlFor="scheduleReturnToggle"
          className="flex cursor-pointer items-center gap-2 text-sm font-semibold"
        >
          <CalendarClock className="h-4 w-4 text-primary" />
          Programar Retorno / Reavaliação (Opcional)
        </Label>
        <input
          id="scheduleReturnToggle"
          data-testid="toggle-schedule-return"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
          checked={Boolean(enabled)}
          onChange={(e) => onToggleEnabled(e.target.checked)}
        />
      </div>

      {enabled && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Atalhos de prazo:</span>
            {[
              { days: 7, label: "+7 dias" },
              { days: 15, label: "+15 dias" },
              { days: 30, label: "+30 dias" },
            ].map((preset) => {
              const targetDate = addDaysToIsoDate(baseDate, preset.days);
              const isSelected = returnDate === targetDate;
              return (
                <Button
                  key={preset.days}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  data-testid={`btn-return-${preset.days}d`}
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => handleQuickDays(preset.days)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="returnDate" className="text-xs">
                Data do Retorno
              </Label>
              <Input
                id="returnDate"
                type="date"
                value={returnDate}
                onChange={(e) => onChangeReturnDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="returnTime" className="text-xs">
                Horário do Retorno
              </Label>
              <Input
                id="returnTime"
                type="time"
                value={returnTime}
                onChange={(e) => onChangeReturnTime(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="returnReason" className="text-xs">
                Motivo / Orientações do Retorno
              </Label>
              <Input
                id="returnReason"
                placeholder="Ex.: Retirada de pontos, revisão clínica..."
                value={returnReason}
                onChange={(e) => onChangeReturnReason(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

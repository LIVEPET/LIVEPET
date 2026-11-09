import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Activity,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  MapPin,
  PawPrint,
  Phone,
  Pill,
  Plus,
  Printer,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Trash2,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const getTodayBR = () => {
  const [y, m, d] = new Date().toISOString().split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

export const computeMedicationStats = (schedule = []) => {
  const list = Array.isArray(schedule) ? schedule : [];
  const total = list.length;
  const administered = list.filter((item) => item.status === "Administrado").length;
  const pending = total - administered;
  return { total, administered, pending };
};

export const generateDischargeBulletinPdf = ({
  bed,
  occupant,
  profile = {},
  dischargeNote = "",
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv || "CRMV não informado";
  const clinicAddress = profile?.address || "Endereço não cadastrado no perfil";
  const clinicPhone = profile?.phone || profile?.whatsapp || "Telefone não informado";
  const vetName = occupant?.vet || "Equipe da clínica";

  // Cabeçalho Timbrado
  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, pageWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(21, 128, 61);
  doc.text(clinicName, 15, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(80, 90, 85);
  doc.text(`Registro / CRMV: ${clinicCrmv}`, 15, 25);
  doc.text(`Endereço: ${clinicAddress}  |  Tel: ${clinicPhone}`, 15, 30);

  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(0.5);
  doc.line(15, 34, pageWidth - 15, 34);

  // Título Oficial
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 30, 25);
  doc.text("BOLETIM DE ALTA HOSPITALAR VETERINÁRIA", pageWidth / 2, 43, {
    align: "center",
  });

  // Quadro de Identificação
  doc.setFillColor(246, 250, 247);
  doc.roundedRect(15, 48, 180, 28, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 35);
  doc.text(`Paciente: ${occupant?.petName || "—"}`, 20, 55);
  doc.text(`Tutor(a): ${occupant?.tutor || "—"}`, 110, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(70, 80, 75);
  doc.text(
    `Espécie / Raça: ${occupant?.species || "—"} · ${occupant?.breed || "—"}`,
    20,
    62,
  );
  doc.text(`Leito / Setor: ${bed?.name || "—"} (${bed?.sector || "—"})`, 110, 62);
  doc.text(`Admissão: ${occupant?.admittedAt || "Hoje"}`, 20, 69);
  doc.text(`Data da Alta: ${getTodayBR()}`, 110, 69);

  let y = 85;

  // Motivo e Conduta na Internação
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61);
  doc.text("RESUMO DA INTERNAÇÃO", 15, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(35, 45, 40);
  doc.text(`Motivo da Internação: ${occupant?.reason || "—"}`, 15, y);
  y += 5;
  doc.text(`Dieta Hospitalar: ${occupant?.diet || "—"}`, 15, y);
  y += 5;
  const prescLines = doc.splitTextToSize(
    `Prescrição no Leito: ${occupant?.prescription || "—"}`,
    180,
  );
  doc.text(prescLines, 15, y);
  y += prescLines.length * 5 + 4;

  // Mapa de Aprazamento / Medicações Administradas
  const schedule = Array.isArray(occupant?.medicationSchedule)
    ? occupant.medicationSchedule
    : [];
  if (schedule.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text("MAPA DE APRAZAMENTO E MEDICAÇÕES NO LEITO", 15, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 60, 55);
    schedule.forEach((med) => {
      const statusLabel =
        med.status === "Administrado"
          ? `Administrado (${med.administeredAt || med.scheduledTime})`
          : "Pendente";
      const line = `• [${med.scheduledTime}] ${med.medication} (${med.dosage}) — ${statusLabel}`;
      doc.text(line, 18, y);
      y += 5;
    });
    y += 3;
  }

  // Evoluções Clínicas no Leito
  const evolutions = Array.isArray(occupant?.evolutions) ? occupant.evolutions : [];
  if (evolutions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text("HISTÓRICO DE EVOLUÇÕES E SINAIS VITAIS", 15, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 60, 55);
    evolutions.forEach((ev) => {
      const tempText = ev.temperature ? ` | Temp: ${ev.temperature} °C` : "";
      const evoLines = doc.splitTextToSize(
        `• [${ev.time} - ${ev.vet}${tempText}]: ${ev.note}`,
        175,
      );
      doc.text(evoLines, 18, y);
      y += evoLines.length * 4.5 + 1;
    });
    y += 3;
  }

  // Recomendações de Alta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61);
  doc.text("RECOMENDAÇÕES DE ALTA E CUIDADOS DOMICILIARES", 15, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(35, 45, 40);
  const finalNote =
    String(dischargeNote || "").trim() ||
    "Manter observação domiciliar, oferecer água fresca e alimentação conforme orientação médica, e retornar para reavaliação clínica ou em caso de sinais de alerta.";
  const noteLines = doc.splitTextToSize(finalNote, 180);
  doc.text(noteLines, 15, y);
  y += noteLines.length * 5 + 12;

  // Assinatura
  const sigY = Math.min(Math.max(y + 15, 255), 270);
  doc.setDrawColor(120, 130, 125);
  doc.line(60, sigY, 150, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 35);
  doc.text(vetName, pageWidth / 2, sigY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 110, 105);
  doc.text(
    `Médico(a) Veterinário(a) Responsável — ${clinicCrmv}`,
    pageWidth / 2,
    sigY + 10,
    { align: "center" },
  );

  const safeSlug = String(occupant?.petName || "paciente")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  doc.save(`boletim-alta-${safeSlug}.pdf`);
  return doc;
};

export const BedMedicationScheduleSection = ({
  bedId,
  occupant,
  onAddMedication,
  onToggleMedication,
  onRemoveMedication,
}) => {
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medTime, setMedTime] = useState("14:00");

  const schedule = Array.isArray(occupant?.medicationSchedule)
    ? occupant.medicationSchedule
    : [];
  const stats = computeMedicationStats(schedule);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!medName.trim()) {
      toast.error("Informe o nome do medicamento ou cuidado hospitalar.");
      return;
    }
    onAddMedication(bedId, {
      medication: medName.trim(),
      dosage: medDosage.trim() || "Conforme prescrição",
      scheduledTime: medTime || "14:00",
    });
    setMedName("");
    setMedDosage("");
    toast.success("Item adicionado ao mapa de aprazamento!");
  };

  return (
    <div
      data-testid="medication-schedule-section"
      className="space-y-3 rounded-2xl border border-border/80 bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Pill className="h-4 w-4 text-primary" /> Mapa de Aprazamento (Medicações & Cuidados)
        </p>
        <div className="flex items-center gap-2 text-xs">
          <Badge
            variant="secondary"
            data-testid="schedule-administered-badge"
            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          >
            {stats.administered} administrada(s)
          </Badge>
          <Badge
            variant="outline"
            data-testid="schedule-pending-badge"
            className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          >
            {stats.pending} pendente(s)
          </Badge>
        </div>
      </div>

      {/* Formulário para adicionar item ao aprazamento */}
      <form onSubmit={handleAdd} className="grid gap-2.5 sm:grid-cols-12">
        <div className="space-y-1 sm:col-span-5">
          <Label htmlFor="med-name" className="text-xs">
            Medicamento / Cuidado *
          </Label>
          <Input
            id="med-name"
            placeholder="Ex.: Ondansetrona / Fluidoterapia"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
          />
        </div>
        <div className="space-y-1 sm:col-span-4">
          <Label htmlFor="med-dosage" className="text-xs">
            Dose / Via
          </Label>
          <Input
            id="med-dosage"
            placeholder="Ex.: 0,5 mg/kg IV"
            value={medDosage}
            onChange={(e) => setMedDosage(e.target.value)}
          />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <Label htmlFor="med-time" className="text-xs">
            Horário
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="med-time"
              type="time"
              value={medTime}
              onChange={(e) => setMedTime(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              data-testid="btn-add-medication-schedule"
              title="Adicionar ao aprazamento"
              className="shrink-0 rounded-xl gradient-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* Lista de itens aprazados */}
      {schedule.length > 0 ? (
        <div data-testid="medication-schedule-list" className="space-y-2 pt-1">
          {schedule.map((item) => {
            const isDone = item.status === "Administrado";
            return (
              <div
                key={item.id}
                data-testid={`med-schedule-item-${item.id}`}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                    : "border-border/80 bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-500/20 text-amber-900 dark:text-amber-300"
                    }`}
                  >
                    <Clock className="h-3 w-3" /> {item.scheduledTime}
                  </span>
                  <div>
                    <p
                      className={`font-semibold ${
                        isDone ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.medication}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Dose/Via: {item.dosage}
                      {isDone && item.administeredAt
                        ? ` · Checado às ${item.administeredAt}${
                            item.administeredBy ? ` por ${item.administeredBy}` : ""
                          }`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={isDone ? "secondary" : "outline"}
                    data-testid={`btn-check-med-${item.id}`}
                    onClick={() => onToggleMedication(bedId, item.id, occupant?.vet)}
                    className={`h-7 rounded-full gap-1 px-2.5 text-xs ${
                      isDone
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                        : "border-primary/40 text-primary hover:bg-primary-soft"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isDone ? "Administrado" : "Checar dose"}
                  </Button>
                  {onRemoveMedication && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Remover item"
                      onClick={() => onRemoveMedication(bedId, item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma dose cadastrada no mapa de aprazamento deste leito. Adicione os horários acima para controle de enfermagem.
        </p>
      )}
    </div>
  );
};

export const InpatientDischargeDialog = ({
  open,
  onOpenChange,
  bed,
  occupant,
  profile = {},
  initialDischargeNote = "",
  onConfirmDischarge,
}) => {
  const [dischargeNote, setDischargeNote] = useState(initialDischargeNote);

  useEffect(() => {
    if (open) {
      setDischargeNote(
        initialDischargeNote ||
          "Paciente recebeu alta médica estável. Manter medicações domiciliares conforme receita, oferecer água fresca e alimentação leve, e retornar para reavaliação clínica.",
      );
    }
  }, [open, initialDischargeNote]);

  if (!occupant) return null;

  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv || "CRMV não informado";
  const clinicAddress = profile?.address || "Endereço não cadastrado no perfil";
  const clinicPhone = profile?.phone || profile?.whatsapp || "Telefone não informado";
  const schedule = Array.isArray(occupant.medicationSchedule) ? occupant.medicationSchedule : [];
  const evolutions = Array.isArray(occupant.evolutions) ? occupant.evolutions : [];

  const handlePrint = () => {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
    toast.success("Impressão do Boletim de Alta Hospitalar acionada!");
  };

  const handleDownloadPdf = () => {
    try {
      generateDischargeBulletinPdf({
        bed,
        occupant,
        profile,
        dischargeNote,
      });
      toast.success("Boletim de Alta Hospitalar exportado em PDF!");
    } catch {
      toast.error("Não foi possível exportar o Boletim de Alta em PDF.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Boletim de Alta Hospitalar Timbrado
          </DialogTitle>
          <DialogDescription>
            Confira o resumo clínico da internação, personalize as recomendações domiciliares de alta e imprima ou baixe o PDF oficial para o tutor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-4">
          <Label htmlFor="discharge-recommendations" className="text-xs font-semibold">
            Recomendações de Alta e Orientações Domiciliares ao Tutor
          </Label>
          <Textarea
            id="discharge-recommendations"
            rows={3}
            value={dischargeNote}
            onChange={(e) => setDischargeNote(e.target.value)}
            placeholder="Descreva os cuidados pós-alta, sinais de alerta, repouso, alimentação e data de retorno..."
          />
        </div>

        {/* Preview Visual Timbrado do Boletim de Alta Hospitalar */}
        <div
          data-testid="discharge-bulletin-preview"
          className="rounded-2xl border-2 border-primary/25 bg-white p-6 text-slate-900 shadow-sm sm:p-8"
        >
          {/* Cabeçalho Timbrado */}
          <div className="flex flex-col justify-between gap-4 border-b-2 border-emerald-700/30 pb-5 sm:flex-row sm:items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-white">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    {clinicName}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700">
                    Registro / CRMV: {clinicCrmv}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                  {clinicAddress}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-700" />
                  {clinicPhone}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" /> Boletim de Alta
              </span>
              <p className="mt-1.5 text-xs text-slate-500">
                Data da Alta: <strong className="text-slate-700">{getTodayBR()}</strong>
              </p>
            </div>
          </div>

          <div className="my-4 text-center">
            <h3 className="font-display text-base font-extrabold uppercase tracking-wide text-emerald-800 sm:text-lg">
              BOLETIM DE ALTA HOSPITALAR VETERINÁRIA
            </h3>
          </div>

          {/* Identificação do Paciente e Leito */}
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-slate-500">
                Paciente:{" "}
                <strong className="inline-flex items-center gap-1 text-slate-900">
                  <PawPrint className="h-3.5 w-3.5 text-emerald-700" /> {occupant.petName}
                </strong>{" "}
                ({occupant.species} · {occupant.breed || "—"})
              </p>
              <p className="text-slate-500">
                Tutor(a) Responsável:{" "}
                <strong className="text-slate-900">{occupant.tutor || "—"}</strong>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">
                Leito / Setor:{" "}
                <strong className="text-slate-900">
                  {bed?.name || "—"} ({bed?.sector || "—"})
                </strong>
              </p>
              <p className="text-slate-500">
                Admissão: <strong className="text-slate-900">{occupant.admittedAt || "Hoje"}</strong>{" "}
                · Vet: <strong className="text-slate-900">{occupant.vet}</strong>
              </p>
            </div>
          </div>

          {/* Resumo Clínico da Internação */}
          <div className="mt-4 space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 text-xs">
            <p className="font-bold uppercase tracking-wider text-emerald-900">
              Resumo Clínico da Internação
            </p>
            <p className="text-slate-700">
              <strong>Motivo da Admissão:</strong> {occupant.reason}
            </p>
            <p className="text-slate-700">
              <strong>Dieta no Leito:</strong> {occupant.diet}
            </p>
            <p className="text-slate-700">
              <strong>Prescrição Hospitalar:</strong> {occupant.prescription}
            </p>
          </div>

          {/* Resumo do Mapa de Aprazamento */}
          {schedule.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Medicações e Cuidados Aprazados no Leito ({schedule.length})
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {schedule.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                  >
                    <span>
                      <strong>{med.scheduledTime}</strong> · {med.medication} ({med.dosage})
                    </span>
                    <span
                      className={`font-semibold ${
                        med.status === "Administrado" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {med.status === "Administrado"
                        ? `Administrado (${med.administeredAt || med.scheduledTime})`
                        : "Pendente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evoluções Clínicas Registradas */}
          {evolutions.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Histórico de Evoluções e Sinais Vitais ({evolutions.length})
              </p>
              <div className="space-y-1.5">
                {evolutions.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>
                        {ev.time} — {ev.vet}
                      </span>
                      {ev.temperature && (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Thermometer className="h-3 w-3" /> {ev.temperature} °C
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5">{ev.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendações de Alta */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            <p className="mb-1 font-bold uppercase tracking-wider text-slate-700">
              Recomendações de Alta e Cuidados Domiciliares
            </p>
            <p className="whitespace-pre-line text-slate-800">{dischargeNote}</p>
          </div>

          {/* Bloco de Assinatura */}
          <div className="mt-8 flex justify-center border-t border-slate-200 pt-6">
            <div className="w-64 text-center">
              <div className="mx-auto mb-2 h-px w-full bg-slate-400" />
              <p className="text-xs font-bold text-slate-900">{occupant.vet}</p>
              <p className="text-[11px] text-slate-500">
                Médico(a) Veterinário(a) Responsável — {clinicCrmv}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdf}
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary-soft"
            >
              <Download className="h-4 w-4" /> Baixar PDF
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {onConfirmDischarge && (
              <Button
                type="button"
                data-testid="btn-confirm-discharge-from-bulletin"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => onConfirmDischarge(dischargeNote)}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Concluir Alta Médica
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


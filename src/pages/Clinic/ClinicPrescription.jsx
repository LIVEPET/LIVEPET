import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  Download,
  FileText,
  MapPin,
  PawPrint,
  Phone,
  Pill,
  Plus,
  Printer,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const ADMINISTRATION_ROUTES = [
  "Uso Oral",
  "Uso Tópico",
  "Uso Otológico",
  "Uso Oftálmico",
  "Injetável",
];

const ROUTE_BADGE_STYLES = {
  "Uso Oral": "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  "Uso Tópico": "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300",
  "Uso Otológico": "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  "Uso Oftálmico": "bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:text-indigo-300",
  Injetável: "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-300",
};

export const hasPrescription = (appointment) => {
  if (!appointment) return false;
  const hasItems =
    Array.isArray(appointment.prescricao_itens) && appointment.prescricao_itens.length > 0;
  const hasText = Boolean(appointment.prescricao && String(appointment.prescricao).trim());
  return hasItems || hasText;
};

export const groupPrescriptionByRoute = (items = []) => {
  const safeItems = Array.isArray(items) ? items.filter((i) => i && i.nome) : [];
  const groupsMap = new Map();

  safeItems.forEach((item) => {
    const route = item.via || "Uso Oral";
    if (!groupsMap.has(route)) {
      groupsMap.set(route, []);
    }
    groupsMap.get(route).push(item);
  });

  let counter = 1;
  const groups = [];
  groupsMap.forEach((routeItems, route) => {
    groups.push({
      route,
      items: routeItems.map((it) => ({
        ...it,
        number: counter++,
      })),
    });
  });

  return groups;
};

export const resolveVetCrmv = (vetName, profile) => {
  const team = Array.isArray(profile?.team) ? profile.team : [];
  const match = team.find(
    (member) =>
      typeof member === "object" &&
      member?.name &&
      String(member.name).trim().toLowerCase() === String(vetName ?? "").trim().toLowerCase(),
  );
  if (match?.crmv) return match.crmv;
  if (profile?.crmv) return profile.crmv;
  return "CRMV não informado";
};

export const formatDateBR = (dateStr) => {
  if (!dateStr) return new Date().toLocaleDateString("pt-BR");
  const clean = String(dateStr).split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const generatePrescriptionPdf = ({ appointment, profile }) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv ? `CRMV: ${profile.crmv}` : "CRMV Institucional";
  const clinicAddress = profile?.address || "Endereço não informado no perfil";
  const clinicPhone = profile?.phone || profile?.whatsapp || "Telefone não informado";
  const vetName = appointment?.vet || "Equipe da clínica";
  const vetCrmv = resolveVetCrmv(vetName, profile);

  // Cabeçalho Timbrado
  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, 210, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 40, 30);
  doc.text(clinicName, 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(90, 100, 95);
  doc.text(`${clinicCrmv}  |  Tel: ${clinicPhone}`, 15, 26);
  doc.text(clinicAddress, 15, 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(21, 128, 61);
  doc.text("RECEITUÁRIO VETERINÁRIO", 195, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 95);
  doc.text(`Data: ${formatDateBR(appointment?.date)}`, 195, 26, { align: "right" });

  doc.setDrawColor(210, 220, 215);
  doc.line(15, 36, 195, 36);

  // Identificação do Paciente e Tutor
  doc.setFillColor(246, 250, 247);
  doc.roundedRect(15, 41, 180, 26, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 35);
  doc.text(`Paciente: ${appointment?.petName || "—"}`, 20, 49);
  doc.text(`Tutor(a): ${appointment?.tutor || "—"}`, 110, 49);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(70, 80, 75);
  const speciesBreed = `${appointment?.species || "—"} · ${appointment?.breed || "—"}`;
  const weightText = appointment?.peso ? `${appointment.peso} kg` : "Não aferido";
  doc.text(`Espécie / Raça: ${speciesBreed}`, 20, 56);
  doc.text(`Peso: ${weightText}`, 20, 62);
  doc.text(`Telefone: ${appointment?.phone || "—"}`, 110, 56);
  doc.text(`Veterinário(a): ${vetName}`, 110, 62);

  let y = 78;

  // Itens estruturados por via de administração
  const groups = groupPrescriptionByRoute(appointment?.prescricao_itens);
  if (groups.length > 0) {
    groups.forEach((group) => {
      if (y > 245) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(21, 128, 61);
      doc.text(group.route.toUpperCase(), 15, y);
      y += 2;
      doc.setDrawColor(21, 128, 61);
      doc.line(15, y, 65, y);
      y += 6;

      group.items.forEach((item) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(25, 35, 30);
        const titleLine = `${item.number}. ${item.nome}${item.concentracao ? ` (${item.concentracao})` : ""}`;
        doc.text(titleLine, 18, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(65, 75, 70);
        const posologyLine = `Posologia: ${item.posologia || "Conforme orientação"}   |   Duração: ${item.duracao || "Uso contínuo / até retorno"}`;
        const wrapped = doc.splitTextToSize(posologyLine, 170);
        doc.text(wrapped, 23, y);
        y += wrapped.length * 5 + 4;
      });

      y += 3;
    });
  }

  // Observações / Prescrição livre
  if (appointment?.prescricao && String(appointment.prescricao).trim()) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 40, 35);
    doc.text("ORIENTAÇÕES E RECOMENDAÇÕES AO TUTOR", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(65, 75, 70);
    const notesLines = doc.splitTextToSize(String(appointment.prescricao).trim(), 175);
    doc.text(notesLines, 15, y);
    y += notesLines.length * 5 + 6;
  }

  // Assinatura no rodapé
  const sigY = Math.max(y + 20, 255);
  const finalSigY = sigY > 275 ? 270 : sigY;
  doc.setDrawColor(120, 130, 125);
  doc.line(65, finalSigY, 145, finalSigY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 35);
  doc.text(vetName, 105, finalSigY + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 110, 105);
  doc.text(`Médico(a) Veterinário(a) — ${vetCrmv}`, 105, finalSigY + 10, { align: "center" });

  const safeSlug = String(appointment?.petName || "paciente")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  doc.save(`receituario-${safeSlug}.pdf`);
  return doc;
};

export const PrescriptionBuilder = ({
  items = [],
  onChangeItems,
  notes = "",
  onChangeNotes,
  onOpenPreview,
}) => {
  const [draft, setDraft] = useState({
    nome: "",
    concentracao: "",
    via: "Uso Oral",
    posologia: "",
    duracao: "",
  });

  const handleAddMedication = () => {
    if (!draft.nome.trim()) {
      toast.error("Informe o nome do medicamento para adicionar à receita.");
      return;
    }
    if (!draft.posologia.trim()) {
      toast.error("Informe a posologia do medicamento (ex: 1 comprimido a cada 12h).");
      return;
    }

    const newItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome: draft.nome.trim(),
      concentracao: draft.concentracao.trim(),
      via: draft.via || "Uso Oral",
      posologia: draft.posologia.trim(),
      duracao: draft.duracao.trim() || "Conforme evolução clínica",
    };

    onChangeItems([...items, newItem]);
    setDraft({
      nome: "",
      concentracao: "",
      via: draft.via || "Uso Oral",
      posologia: "",
      duracao: "",
    });
    toast.success(`${newItem.nome} adicionado ao receituário.`);
  };

  const handleRemoveMedication = (id) => {
    onChangeItems(items.filter((item) => item.id !== id));
  };

  const canPreview = items.length > 0 || Boolean(notes && String(notes).trim());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Pill className="h-3.5 w-3.5" /> Construtor de Prescrição Veterinária
          </p>
          <p className="text-xs text-muted-foreground">
            Adicione medicamentos estruturados por via de administração para emitir o receituário timbrado.
          </p>
        </div>
        {canPreview && onOpenPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-primary/40 text-xs font-semibold text-primary hover:bg-primary-soft"
            onClick={onOpenPreview}
          >
            <FileText className="h-3.5 w-3.5" /> Visualizar Receituário
          </Button>
        )}
      </div>

      {/* Formulário de adição de item estruturado */}
      <div className="space-y-3 rounded-2xl border border-border/80 bg-background/80 p-3.5">
        <div className="grid gap-3 sm:grid-cols-12">
          <div className="space-y-1 sm:col-span-5">
            <Label htmlFor="rx-med-name" className="text-xs font-medium">
              Nome do Medicamento
            </Label>
            <Input
              id="rx-med-name"
              placeholder="Ex: Amoxicilina + Clavulanato"
              value={draft.nome}
              onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <Label htmlFor="rx-med-concentration" className="text-xs font-medium">
              Concentração <span className="text-[10px] text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="rx-med-concentration"
              placeholder="Ex: 250 mg"
              value={draft.concentracao}
              onChange={(e) => setDraft((d) => ({ ...d, concentracao: e.target.value }))}
            />
          </div>

          <div className="space-y-1 sm:col-span-4">
            <Label htmlFor="rx-med-route" className="text-xs font-medium">
              Via de Administração
            </Label>
            <Select
              value={draft.via}
              onValueChange={(v) => setDraft((d) => ({ ...d, via: v }))}
            >
              <SelectTrigger id="rx-med-route">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMINISTRATION_ROUTES.map((route) => (
                  <SelectItem key={route} value={route}>
                    {route}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-12">
          <div className="space-y-1 sm:col-span-6">
            <Label htmlFor="rx-med-posology" className="text-xs font-medium">
              Posologia
            </Label>
            <Input
              id="rx-med-posology"
              placeholder="Ex: 1 comprimido a cada 12h"
              value={draft.posologia}
              onChange={(e) => setDraft((d) => ({ ...d, posologia: e.target.value }))}
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <Label htmlFor="rx-med-duration" className="text-xs font-medium">
              Duração
            </Label>
            <Input
              id="rx-med-duration"
              placeholder="Ex: 7 dias"
              value={draft.duracao}
              onChange={(e) => setDraft((d) => ({ ...d, duracao: e.target.value }))}
            />
          </div>

          <div className="flex items-end sm:col-span-3">
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-1.5 rounded-xl text-xs font-semibold"
              onClick={handleAddMedication}
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar item
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Medicamentos Adicionados na Receita */}
      {items.length > 0 && (
        <div
          data-testid="prescription-items-list"
          className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-3"
        >
          <p className="text-xs font-semibold text-muted-foreground">
            Medicamentos na receita ({items.length})
          </p>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                data-testid={`prescription-item-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">
                      {idx + 1}. {item.nome}
                    </span>
                    {item.concentracao && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {item.concentracao}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${ROUTE_BADGE_STYLES[item.via] || ""}`}
                    >
                      {item.via}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    <strong>Posologia:</strong> {item.posologia} ·{" "}
                    <strong>Duração:</strong> {item.duracao}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remover ${item.nome}`}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemoveMedication(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observações gerais / Prescrição livre */}
      <div className="space-y-1.5">
        <Label htmlFor="prescricao" className="text-xs font-semibold">
          Prescrição & Orientações ao Tutor
        </Label>
        <Textarea
          id="prescricao"
          rows={2}
          placeholder="Recomendações complementares, dieta, cuidados domiciliares e orientações de retorno..."
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
        />
      </div>
    </div>
  );
};

export const PrescriptionSheetDialog = ({
  open,
  onOpenChange,
  appointment,
  profile,
}) => {
  if (!appointment) return null;

  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv || "CRMV não informado";
  const clinicAddress = profile?.address || "Endereço não cadastrado no perfil";
  const clinicPhone = profile?.phone || profile?.whatsapp || "Telefone não informado";
  const vetName = appointment.vet || "Equipe da clínica";
  const vetCrmv = resolveVetCrmv(vetName, profile);
  const groupedRoutes = groupPrescriptionByRoute(appointment.prescricao_itens);

  const handlePrint = () => {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
    toast.success("Impressão do receituário acionada!");
  };

  const handleDownloadPdf = () => {
    try {
      generatePrescriptionPdf({ appointment, profile });
      toast.success(`Receituário de ${appointment.petName} exportado em PDF!`);
    } catch {
      toast.error("Não foi possível gerar o PDF do receituário.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Receituário Veterinário Timbrado
          </DialogTitle>
          <DialogDescription>
            Pré-visualização oficial da receita para impressão ou exportação em PDF.
          </DialogDescription>
        </DialogHeader>

        {/* Folha Oficial de Receituário Timbrado */}
        <div
          data-testid="prescription-sheet-preview"
          className="rounded-2xl border-2 border-primary/25 bg-white p-6 text-slate-900 shadow-sm sm:p-8"
        >
          {/* Cabeçalho Timbrado da Clínica */}
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
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" /> Receituário Oficial
              </span>
              <p className="mt-1.5 text-xs text-slate-500">
                Emissão: <strong className="text-slate-700">{formatDateBR(appointment.date)}</strong>
              </p>
            </div>
          </div>

          {/* Quadro de Identificação do Paciente e Tutor */}
          <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs sm:grid-cols-2">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                <PawPrint className="h-3.5 w-3.5 text-emerald-700" />
                Paciente: <span className="text-sm font-bold">{appointment.petName}</span>
              </p>
              <p className="text-slate-600">
                <strong>Espécie / Raça:</strong> {appointment.species || "—"} ·{" "}
                {appointment.breed || "—"}
              </p>
              <p className="text-slate-600">
                <strong>Peso aferido:</strong>{" "}
                {appointment.peso ? `${appointment.peso} kg` : "Não informado"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                <User className="h-3.5 w-3.5 text-emerald-700" />
                Tutor(a): <span className="text-sm font-bold">{appointment.tutor}</span>
              </p>
              <p className="text-slate-600">
                <strong>Telefone:</strong> {appointment.phone || "—"}
              </p>
              <p className="text-slate-600">
                <strong>Veterinário(a):</strong> {vetName}
              </p>
            </div>
          </div>

          {/* Corpo da Prescrição Agrupado por Via de Uso */}
          <div className="mt-6 min-h-[180px] space-y-5">
            {groupedRoutes.length > 0 && (
              <div className="space-y-5">
                {groupedRoutes.map((group) => (
                  <div key={group.route} className="space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        {group.route}
                      </span>
                    </div>

                    <ol className="space-y-3 pl-1">
                      {group.items.map((item) => (
                        <li
                          key={item.id || item.number}
                          className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900">
                              {item.number}. {item.nome}
                              {item.concentracao ? (
                                <span className="ml-1.5 font-semibold text-emerald-700">
                                  ({item.concentracao})
                                </span>
                              ) : null}
                            </p>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                              Duração: {item.duracao}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-700">
                            <strong>Posologia:</strong> {item.posologia}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            {appointment.prescricao && String(appointment.prescricao).trim() && (
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Orientações e Recomendações ao Tutor
                </p>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
                  {appointment.prescricao}
                </p>
              </div>
            )}
          </div>

          {/* Espaço de Assinatura do Veterinário Responsável */}
          <div
            data-testid="prescription-signature-block"
            className="mt-10 flex flex-col items-center justify-center border-t border-dashed border-slate-200 pt-8 text-center"
          >
            <div className="w-64 border-b border-slate-400 pb-1" />
            <p className="mt-2 text-sm font-bold text-slate-900">{vetName}</p>
            <p className="text-xs text-slate-600">
              Médico(a) Veterinário(a) · {vetCrmv}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 rounded-full"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" /> Imprimir Receituário
          </Button>
          <Button
            type="button"
            className="gap-1.5 rounded-full gradient-primary text-primary-foreground shadow-soft"
            onClick={handleDownloadPdf}
          >
            <Download className="h-4 w-4" /> Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Activity,
  Download,
  FileBadge,
  FileCheck2,
  MapPin,
  PawPrint,
  Phone,
  Printer,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
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
import { Textarea } from "@/components/ui/textarea";
import { buildVitals, formatNumber } from "@/lib/clinicVitals";
import { formatDateBR, resolveVetCrmv } from "./ClinicPrescription";

export const CLINICAL_DOCUMENT_TEMPLATES = [
  {
    id: "atestado_saude",
    label: "Atestado de Saúde Veterinário",
    officialTitle: "ATESTADO DE SAÚDE VETERINÁRIO",
    slug: "atestado-saude",
    requiresTutorSignature: false,
    showVitals: true,
  },
  {
    id: "termo_consentimento",
    label: "Termo de Consentimento para Procedimento / Internação",
    officialTitle: "TERMO DE CONSENTIMENTO PARA PROCEDIMENTO / INTERNAÇÃO",
    slug: "termo-consentimento",
    requiresTutorSignature: true,
    showVitals: true,
  },
  {
    id: "declaracao_comparecimento",
    label: "Declaração de Comparecimento",
    officialTitle: "DECLARAÇÃO DE COMPARECIMENTO",
    slug: "declaracao-comparecimento",
    requiresTutorSignature: false,
    showVitals: false,
  },
];

export const extractDocumentVitals = ({ appointment, patient, appointments = [] }) => {
  if (appointment) {
    const peso = appointment.peso != null && appointment.peso !== "" ? `${appointment.peso} kg` : null;
    const temperatura =
      appointment.temperatura != null && appointment.temperatura !== ""
        ? `${appointment.temperatura} °C`
        : null;
    const fc =
      appointment.frequencia_cardiaca != null && appointment.frequencia_cardiaca !== ""
        ? `${appointment.frequencia_cardiaca} bpm`
        : null;
    const fr =
      appointment.frequencia_respiratoria != null && appointment.frequencia_respiratoria !== ""
        ? `${appointment.frequencia_respiratoria} mpm`
        : null;
    const mucosas = appointment.mucosas || null;

    if (peso || temperatura || fc || fr || mucosas) {
      return {
        peso: peso || patient?.weight || "—",
        temperatura: temperatura || "—",
        fc: fc || "—",
        fr: fr || "—",
        mucosas: mucosas || "—",
        hasAny: true,
      };
    }
  }

  if (patient) {
    const built = buildVitals(patient, appointments);
    const latest = built.latest || {};
    const hasMeasured = Boolean(
      latest.peso || latest.temperatura || latest.fc || latest.fr || latest.mucosas,
    );
    return {
      peso: latest.peso ? `${formatNumber(latest.peso.value)} kg` : patient.weight || "—",
      temperatura: latest.temperatura ? `${formatNumber(latest.temperatura.value)} °C` : "—",
      fc: latest.fc ? `${formatNumber(latest.fc.value)} bpm` : "—",
      fr: latest.fr ? `${formatNumber(latest.fr.value)} mpm` : "—",
      mucosas: latest.mucosas ? latest.mucosas.value : "—",
      hasAny: hasMeasured || Boolean(patient.weight && patient.weight !== "—"),
    };
  }

  return {
    peso: "—",
    temperatura: "—",
    fc: "—",
    fr: "—",
    mucosas: "—",
    hasAny: false,
  };
};

export const buildDefaultDocumentBody = (templateId, context = {}) => {
  const petName = context.petName || "Paciente";
  const species = context.species || "Cão";
  const breed = context.breed || "SRD";
  const tutor = context.tutor || "Tutor responsável";
  const clinicName = context.clinicName || "Clínica Veterinária LivePet";
  const dateBR = formatDateBR(context.date);
  const timeText = context.time ? ` às ${context.time}` : "";

  if (templateId === "termo_consentimento") {
    return (
      `Pelo presente instrumento, eu, ${tutor}, responsável legal pelo paciente ${petName} ` +
      `(${species} · ${breed}), autorizo a equipe médica veterinária da ${clinicName} a realizar ` +
      `os procedimentos clínicos, diagnósticos, terapêuticos, sedação/anestesia ou internação necessários ` +
      `para a estabilização e tratamento da saúde do animal. Declaro ter sido devidamente esclarecido(a) ` +
      `sobre os riscos inerentes aos procedimentos, cuidados pós-atendimento e condutas de emergência.`
    );
  }

  if (templateId === "declaracao_comparecimento") {
    return (
      `Declaramos, para os devidos fins, que o(a) Sr.(a) ${tutor} esteve presente na ${clinicName} ` +
      `na data de ${dateBR}${timeText}, acompanhando o paciente ${petName} (${species} · ${breed}) ` +
      `para realização de atendimento e avaliação médico-veterinária.`
    );
  }

  // Padrão: atestado_saude
  return (
    `Atesto, para os devidos fins, que o animal ${petName} (espécie ${species}, raça ${breed}), ` +
    `de propriedade do(a) tutor(a) ${tutor}, foi submetido a exame clínico nesta data (${dateBR}), ` +
    `apresentando parâmetros vitais estáveis, mucosas normocoradas e ausência de sinais clínicos de ` +
    `doenças infectocontagiosas ou parasitárias no momento da inspeção, encontrando-se apto sob o ponto ` +
    `de vista sanitário.`
  );
};

export const generateClinicalDocumentPdf = ({
  template,
  subject,
  vitals,
  profile,
  vetName,
  bodyText,
  extraNotes,
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv ? `CRMV: ${profile.crmv}` : "CRMV Institucional";
  const clinicAddress = profile?.address || "Endereço não informado no perfil";
  const clinicPhone = profile?.phone || profile?.whatsapp || "Telefone não informado";
  const resolvedVet = vetName || subject?.vet || "Equipe da clínica";
  const vetCrmv = resolveVetCrmv(resolvedVet, profile);

  // Faixa superior
  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, 210, 8, "F");

  // Cabeçalho Timbrado da Clínica
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(20, 40, 30);
  doc.text(clinicName, 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(90, 100, 95);
  doc.text(`${clinicCrmv}  |  Tel: ${clinicPhone}`, 15, 26);
  doc.text(clinicAddress, 15, 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 95);
  doc.text(`Emissão: ${formatDateBR(subject?.date)}`, 195, 20, { align: "right" });

  doc.setDrawColor(210, 220, 215);
  doc.line(15, 36, 195, 36);

  // Título Oficial do Documento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(21, 128, 61);
  doc.text(template.officialTitle, 105, 46, { align: "center" });

  // Quadro de Identificação Paciente / Tutor
  doc.setFillColor(246, 250, 247);
  doc.roundedRect(15, 52, 180, 26, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 35);
  doc.text(`Paciente: ${subject?.petName || "—"}`, 20, 60);
  doc.text(`Tutor(a): ${subject?.tutor || "—"}`, 110, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(70, 80, 75);
  doc.text(
    `Espécie / Raça: ${subject?.species || "—"} · ${subject?.breed || "—"}`,
    20,
    67,
  );
  doc.text(`Peso: ${vitals?.peso || "—"}`, 20, 73);
  doc.text(`Telefone: ${subject?.phone || "—"}`, 110, 67);
  doc.text(`Veterinário(a): ${resolvedVet}`, 110, 73);

  let y = 88;

  // Sinais Vitais Aferidos (quando aplicável)
  if (template.showVitals && vitals?.hasAny) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(21, 128, 61);
    doc.text("ÚLTIMOS SINAIS VITAIS AFERIDOS", 15, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 70, 65);
    doc.text(
      `Peso: ${vitals.peso}   |   Temp.: ${vitals.temperatura}   |   FC: ${vitals.fc}   |   FR: ${vitals.fr}   |   Mucosas: ${vitals.mucosas}`,
      15,
      y,
    );
    y += 10;
  }

  // Corpo do Documento
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 40, 35);
  const bodyLines = doc.splitTextToSize(String(bodyText || "").trim(), 180);
  doc.text(bodyLines, 15, y);
  y += bodyLines.length * 5.5 + 8;

  // Observações Complementares
  if (extraNotes && String(extraNotes).trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 40, 35);
    doc.text("OBSERVAÇÕES COMPLEMENTARES", 15, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(65, 75, 70);
    const noteLines = doc.splitTextToSize(String(extraNotes).trim(), 180);
    doc.text(noteLines, 15, y);
    y += noteLines.length * 5 + 8;
  }

  // Bloco de Assinaturas
  const sigY = Math.max(y + 25, 250);
  const finalSigY = sigY > 272 ? 268 : sigY;
  doc.setDrawColor(120, 130, 125);

  if (template.requiresTutorSignature) {
    // Duas assinaturas lado a lado: Veterinário e Tutor
    doc.line(20, finalSigY, 95, finalSigY);
    doc.line(115, finalSigY, 190, finalSigY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 40, 35);
    doc.text(resolvedVet, 57.5, finalSigY + 5, { align: "center" });
    doc.text(subject?.tutor || "Tutor(a) Responsável", 152.5, finalSigY + 5, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 110, 105);
    doc.text(`Médico(a) Veterinário(a) — ${vetCrmv}`, 57.5, finalSigY + 10, {
      align: "center",
    });
    doc.text("Assinatura do(a) Tutor(a) / Responsável Legal", 152.5, finalSigY + 10, {
      align: "center",
    });
  } else {
    doc.line(65, finalSigY, 145, finalSigY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 40, 35);
    doc.text(resolvedVet, 105, finalSigY + 5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 110, 105);
    doc.text(`Médico(a) Veterinário(a) — ${vetCrmv}`, 105, finalSigY + 10, {
      align: "center",
    });
  }

  const safePetSlug = String(subject?.petName || "paciente")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  doc.save(`${template.slug}-${safePetSlug}.pdf`);
  return doc;
};

export const ClinicalDocumentsDialog = ({
  open,
  onOpenChange,
  appointment = null,
  patient = null,
  appointments = [],
  profile = {},
}) => {
  const [templateId, setTemplateId] = useState("atestado_saude");
  const [vetName, setVetName] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const subject = useMemo(() => {
    if (appointment) {
      return {
        petName: appointment.petName || "—",
        species: appointment.species || "Cão",
        breed: appointment.breed || "—",
        tutor: appointment.tutor || "—",
        phone: appointment.phone || "—",
        vet: appointment.vet || "Equipe da clínica",
        date: appointment.date || new Date().toISOString().split("T")[0],
        time: appointment.time || "",
      };
    }
    if (patient) {
      return {
        petName: patient.name || "—",
        species: patient.species || "Cão",
        breed: patient.breed || "—",
        tutor: patient.tutor || "—",
        phone: patient.phone || "—",
        vet: "Equipe da clínica",
        date: new Date().toISOString().split("T")[0],
        time: "",
      };
    }
    return null;
  }, [appointment, patient]);

  const vitals = useMemo(
    () => extractDocumentVitals({ appointment, patient, appointments }),
    [appointment, patient, appointments],
  );

  const activeTemplate = useMemo(
    () =>
      CLINICAL_DOCUMENT_TEMPLATES.find((t) => t.id === templateId) ||
      CLINICAL_DOCUMENT_TEMPLATES[0],
    [templateId],
  );

  useEffect(() => {
    if (!subject) return;
    setVetName(subject.vet || "Equipe da clínica");
    setBodyText(
      buildDefaultDocumentBody(templateId, {
        ...subject,
        clinicName: profile?.name || "Clínica Veterinária LivePet",
      }),
    );
  }, [subject, templateId, profile?.name]);

  if (!subject) return null;

  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv || "CRMV não informado";
  const clinicAddress = profile?.address || "Endereço não cadastrado no perfil";
  const clinicPhone = profile?.phone || profile?.whatsapp || "Telefone não informado";
  const resolvedVet = vetName.trim() || subject.vet || "Equipe da clínica";
  const vetCrmv = resolveVetCrmv(resolvedVet, profile);

  const handleSelectTemplate = (nextId) => {
    setTemplateId(nextId);
    setBodyText(
      buildDefaultDocumentBody(nextId, {
        ...subject,
        clinicName,
      }),
    );
  };

  const handleResetDefaultText = () => {
    setBodyText(
      buildDefaultDocumentBody(templateId, {
        ...subject,
        clinicName,
      }),
    );
  };

  const handlePrint = () => {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
    toast.success(`Impressão de ${activeTemplate.label} acionada!`);
  };

  const handleDownloadPdf = () => {
    try {
      generateClinicalDocumentPdf({
        template: activeTemplate,
        subject,
        vitals,
        profile,
        vetName: resolvedVet,
        bodyText,
        extraNotes,
      });
      toast.success(`${activeTemplate.label} exportado em PDF!`);
    } catch {
      toast.error("Não foi possível exportar o documento em PDF.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <FileBadge className="h-5 w-5 text-primary" />
            Emissor de Documentos Clínicos Timbrados
          </DialogTitle>
          <DialogDescription>
            Selecione o modelo de documento, personalize as observações e exiba ou exporte a folha oficial timbrada.
          </DialogDescription>
        </DialogHeader>

        {/* Seletor dos 3 Modelos de Documentos Clínicos */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Modelo de Documento Clínico
          </Label>
          <div
            role="radiogroup"
            aria-label="Modelo de documento clínico"
            data-testid="document-template-selector"
            className="grid gap-2 sm:grid-cols-3"
          >
            {CLINICAL_DOCUMENT_TEMPLATES.map((tpl) => {
              const active = tpl.id === templateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-testid={`template-option-${tpl.id}`}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-xs font-semibold transition-all ${
                    active
                      ? "border-primary bg-primary-soft text-primary ring-2 ring-primary/25 shadow-2xs"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <FileCheck2 className="h-4 w-4 shrink-0" />
                  <span className="leading-snug">{tpl.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campos de Personalização antes da Emissão */}
        <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doc-vet-name" className="text-xs font-semibold">
                Veterinário(a) Responsável pela Emissão
              </Label>
              <Input
                id="doc-vet-name"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                placeholder="Nome do(a) veterinário(a)"
              />
            </div>
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full text-xs"
                onClick={handleResetDefaultText}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restaurar texto padrão
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-body-text" className="text-xs font-semibold">
              Texto Principal do Documento
            </Label>
            <Textarea
              id="doc-body-text"
              rows={3}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="doc-extra-notes" className="text-xs font-semibold">
              Observações Complementares <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="doc-extra-notes"
              rows={2}
              placeholder="Ex: Animal apto para transporte aéreo doméstico; jejum prévio de 8h confirmado; validade de 10 dias..."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Preview Visual da Folha Oficial Timbrada */}
        <div
          data-testid="clinical-document-preview"
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
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" /> Documento Oficial
              </span>
              <p className="mt-1.5 text-xs text-slate-500">
                Emissão: <strong className="text-slate-700">{formatDateBR(subject.date)}</strong>
              </p>
            </div>
          </div>

          {/* Título Oficial do Documento */}
          <div className="my-5 text-center">
            <h3 className="font-display text-base font-extrabold uppercase tracking-wide text-emerald-800 sm:text-lg">
              {activeTemplate.officialTitle}
            </h3>
          </div>

          {/* Quadro de Identificação do Paciente e Tutor */}
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs sm:grid-cols-2">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                <PawPrint className="h-3.5 w-3.5 text-emerald-700" />
                Paciente: <span className="text-sm font-bold">{subject.petName}</span>
              </p>
              <p className="text-slate-600">
                <strong>Espécie / Raça:</strong> {subject.species} · {subject.breed}
              </p>
              <p className="text-slate-600">
                <strong>Peso:</strong> {vitals.peso}
              </p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                <User className="h-3.5 w-3.5 text-emerald-700" />
                Tutor(a): <span className="text-sm font-bold">{subject.tutor}</span>
              </p>
              <p className="text-slate-600">
                <strong>Telefone:</strong> {subject.phone}
              </p>
              <p className="text-slate-600">
                <strong>Veterinário(a):</strong> {resolvedVet}
              </p>
            </div>
          </div>

          {/* Últimos Sinais Vitais Aferidos (quando aplicável) */}
          {activeTemplate.showVitals && vitals.hasAny && (
            <div
              data-testid="document-vitals-summary"
              className="mt-4 rounded-xl border border-emerald-700/20 bg-emerald-50/40 p-3 text-xs"
            >
              <p className="mb-1.5 flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-800">
                <Activity className="h-3.5 w-3.5" /> Últimos Sinais Vitais Aferidos
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-700">
                <span>
                  <strong>Peso:</strong> {vitals.peso}
                </span>
                <span>
                  <strong>Temperatura:</strong> {vitals.temperatura}
                </span>
                <span>
                  <strong>FC:</strong> {vitals.fc}
                </span>
                <span>
                  <strong>FR:</strong> {vitals.fr}
                </span>
                <span>
                  <strong>Mucosas:</strong> {vitals.mucosas}
                </span>
              </div>
            </div>
          )}

          {/* Texto Principal do Documento */}
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-800">
            <p className="whitespace-pre-line">{bodyText}</p>

            {extraNotes && String(extraNotes).trim() && (
              <div
                data-testid="document-extra-notes-preview"
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs"
              >
                <p className="font-bold uppercase tracking-wider text-slate-700">
                  Observações Complementares
                </p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{extraNotes}</p>
              </div>
            )}
          </div>

          {/* Bloco de Assinaturas */}
          <div
            className={`mt-10 border-t border-dashed border-slate-200 pt-8 ${
              activeTemplate.requiresTutorSignature
                ? "grid gap-8 sm:grid-cols-2"
                : "flex flex-col items-center justify-center"
            }`}
          >
            <div
              data-testid="vet-signature-block"
              className="flex flex-col items-center text-center"
            >
              <div className="w-60 border-b border-slate-400 pb-1" />
              <p className="mt-2 text-sm font-bold text-slate-900">{resolvedVet}</p>
              <p className="text-xs text-slate-600">
                Médico(a) Veterinário(a) · {vetCrmv}
              </p>
            </div>

            {activeTemplate.requiresTutorSignature && (
              <div
                data-testid="tutor-signature-block"
                className="flex flex-col items-center text-center"
              >
                <div className="w-60 border-b border-slate-400 pb-1" />
                <p className="mt-2 text-sm font-bold text-slate-900">{subject.tutor}</p>
                <p className="text-xs text-slate-600">
                  Assinatura do(a) Tutor(a) / Responsável Legal
                </p>
              </div>
            )}
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
            <Printer className="h-4 w-4" /> Imprimir
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


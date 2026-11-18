import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  MapPin,
  PawPrint,
  Phone,
  Pill,
  Printer,
  ShieldCheck,
  Stethoscope,
  Thermometer,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/contexts/ClinicContext";
import {
  computeMedicationStats,
  generateDischargeBulletinPdf,
} from "./InpatientDischargeBulletin";

/**
 * Página dedicada para emissão do Boletim de Alta Hospitalar Timbrado e encerramento da internação.
 * Substitui o antigo modal Dialog por uma visualização completa e profissional.
 */
const ClinicInpatientDischargePage = () => {
  const { bedId } = useParams();
  const navigate = useNavigate();
  const { beds = [], profile = {}, dischargePatientFromBed } = useClinic();

  const selectedBed = useMemo(
    () => beds.find((b) => String(b.id) === String(bedId)) || null,
    [beds, bedId],
  );

  const location = useLocation();
  const occupant = selectedBed?.occupant || null;

  const [dischargeNote, setDischargeNote] = useState(
    location.state?.dischargeNote ||
      (occupant
        ? `Paciente estável clinicamente, respondendo bem ao tratamento. Manter hidratação e repouso domiciliar. Retorno recomendado em 7 dias ou antes em caso de prostração ou febre.`
        : ""),
  );

  if (!selectedBed || !occupant) {
    return (
      <div className="container max-w-xl py-12 text-center">
        <p className="text-lg font-semibold">Leito ou paciente não encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/clinica/internacao">Voltar para internação</Link>
        </Button>
      </div>
    );
  }

  const clinicName = profile?.name || "Clínica Veterinária LivePet";
  const clinicCrmv = profile?.crmv || "CRMV não informado";
  const clinicAddress = profile?.address || "Endereço da Clínica";
  const clinicPhone = profile?.phone || profile?.whatsapp || "Telefone não informado";

  const medStats = computeMedicationStats(occupant.medicationSchedule);
  const evolutions = occupant.evolutions || [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateDischargeBulletinPdf({
      bed: selectedBed,
      occupant,
      profile,
      dischargeNote,
    });
    toast.success("Boletim de alta baixado com sucesso!");
  };

  const handleConfirmDischarge = () => {
    dischargePatientFromBed(selectedBed.id, dischargeNote);
    toast.success(
      `Alta médica de ${occupant.petName} concluída! A baia ${selectedBed.name} foi movida para higienização.`,
    );
    navigate("/clinica/internacao");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Retorno */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/clinica/internacao/leito/${selectedBed.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para o prontuário do leito
        </Link>

        <div className="flex items-center gap-2">
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
            variant="outline"
            onClick={handleDownloadPdf}
            className="gap-1.5 rounded-full border-primary/40 text-primary hover:bg-primary-soft"
          >
            <Download className="h-4 w-4" /> Baixar PDF
          </Button>
          <Button
            type="button"
            data-testid="btn-confirm-discharge-from-bulletin"
            onClick={handleConfirmDischarge}
            className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 rounded-full"
          >
            <CheckCircle2 className="h-4 w-4" /> Concluir Alta Médica
          </Button>
        </div>
      </div>

      {/* Editor da recomendação de alta */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-3">
          <Label htmlFor="discharge-notes" className="font-semibold text-sm">
            Recomendações de Alta e Prescrição Domiciliar
          </Label>
          <Textarea
            id="discharge-notes"
            rows={3}
            value={dischargeNote}
            onChange={(e) => setDischargeNote(e.target.value)}
            placeholder="Orientações de medicamentos contínuos, repouso, dieta e retorno..."
          />
        </CardContent>
      </Card>

      {/* Folha Timbrada do Boletim de Alta */}
      <div
        id="inpatient-discharge-print-sheet"
        data-testid="discharge-bulletin-preview"
        className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:border-none print:p-0 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
      >
        {/* Cabeçalho Oficial */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">
                {clinicName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {clinicAddress} · Tel: {clinicPhone} · {clinicCrmv}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Boletim de Alta Hospitalar
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Data: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Identificação do Paciente e Tutor */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 py-4 text-xs sm:grid-cols-4">
          <div>
            <span className="text-slate-400 block uppercase">Paciente</span>
            <strong className="text-sm text-slate-900">{occupant.petName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block uppercase">Espécie / Raça</span>
            <span className="text-slate-700 font-medium">
              {occupant.species} · {occupant.breed}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase">Tutor</span>
            <span className="text-slate-700 font-medium">{occupant.tutor}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase">Baia / Leito</span>
            <span className="text-slate-700 font-medium">
              {selectedBed.name} ({selectedBed.sector})
            </span>
          </div>
        </div>

        {/* Resumo Clínico da Admissão */}
        <div className="py-4 border-b border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-700 uppercase tracking-wider">
            Resumo da Internação
          </p>
          <p className="text-slate-800">
            <strong>Motivo:</strong> {occupant.reason}
          </p>
          <p className="text-slate-800">
            <strong>Dieta Hospitalar Ministrada:</strong> {occupant.diet}
          </p>
          <p className="text-slate-800">
            <strong>Veterinário Responsável:</strong> {occupant.vet}
          </p>
        </div>

        {/* Medicamentos Administrados durante a internação */}
        {occupant.medicationSchedule && occupant.medicationSchedule.length > 0 && (
          <div className="py-4 border-b border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-700 uppercase tracking-wider">
                Aprazamento de Medicamentos no Leito
              </p>
              <span className="text-slate-500 text-[11px]">
                {medStats.administered} de {medStats.total} doses administradas
              </span>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {occupant.medicationSchedule.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span>
                    <strong>{med.scheduledTime}</strong> — {med.medication} ({med.dosage})
                  </span>
                  <span
                    className={`font-semibold ${
                      med.status === "Administrado" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {med.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evoluções Clínicas */}
        {evolutions.length > 0 && (
          <div className="py-4 border-b border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-700 uppercase tracking-wider">
              Evoluções Registradas Durante a Estadia ({evolutions.length})
            </p>
            <div className="space-y-1.5">
              {evolutions.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-0.5"
                >
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>{ev.time} — {ev.vet}</span>
                    {ev.temperature && <span>{ev.temperature} °C</span>}
                  </div>
                  <p>{ev.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações e Cuidados Domiciliares */}
        <div className="py-4 border-b border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-700 uppercase tracking-wider">
            Recomendações e Cuidados Domiciliares
          </p>
          <p className="whitespace-pre-line text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {dischargeNote}
          </p>
        </div>

        {/* Assinatura */}
        <div className="pt-8 text-center flex justify-center">
          <div className="w-64">
            <div className="h-px bg-slate-400 mb-2 w-full" />
            <p className="text-xs font-bold text-slate-900">{occupant.vet}</p>
            <p className="text-[11px] text-slate-500">
              Médico(a) Veterinário(a) — {clinicCrmv}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicInpatientDischargePage;

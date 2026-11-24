import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  HeartPulse,
  Pill,
  Plus,
  Stethoscope,
  Thermometer,
  Trash2,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/contexts/ClinicContext";
import { computeMedicationStats } from "./InpatientDischargeBulletin";

/**
 * Página dedicada para visualização e gerenciamento do prontuário hospitalar do leito.
 * Contém o Mapa de Aprazamento, histórico de evoluções clínicas, sinais vitais e alta.
 */
const ClinicInpatientBedPage = () => {
  const { bedId } = useParams();
  const navigate = useNavigate();
  const {
    beds = [],
    addBedEvolution,
    addBedMedicationItem,
    toggleBedMedicationStatus,
    removeBedMedicationItem,
    dischargePatientFromBed,
  } = useClinic();

  // Localiza a baia informada na URL
  const selectedBed = useMemo(
    () => beds.find((b) => String(b.id) === String(bedId)) || null,
    [beds, bedId],
  );

  const occupant = selectedBed?.occupant || null;

  // Estado das recomendações de alta hospitalar
  const [dischargeNote, setDischargeNote] = useState("");

  // Estado do formulário de nova evolução clínica
  const [evolutionForm, setEvolutionForm] = useState({
    note: "",
    temperature: "",
    vet: occupant?.vet || "",
  });

  // Estado do formulário de novo item no mapa de aprazamento
  const [medForm, setMedForm] = useState({
    medication: "",
    dosage: "",
    scheduledTime: occupant?.nextMedicationTime || "16:00",
  });

  // Salva uma nova anotação de evolução clínica
  const handleSaveEvolution = (e) => {
    e.preventDefault();
    if (!evolutionForm.note.trim()) {
      toast.error("Informe a descrição da evolução clínica.");
      return;
    }

    addBedEvolution(selectedBed.id, {
      note: evolutionForm.note.trim(),
      temperature: evolutionForm.temperature.trim() || null,
      vet: evolutionForm.vet.trim() || occupant?.vet || "Veterinário",
    });

    toast.success("Evolução clínica registrada no prontuário do leito!");
    setEvolutionForm({
      note: "",
      temperature: "",
      vet: occupant?.vet || "",
    });
  };

  // Adiciona medicamento ao Mapa de Aprazamento
  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!medForm.medication.trim()) {
      toast.error("Informe o nome do medicamento.");
      return;
    }

    addBedMedicationItem(selectedBed.id, {
      medication: medForm.medication.trim(),
      dosage: medForm.dosage.trim() || "Dose padrão",
      scheduledTime: medForm.scheduledTime || "16:00",
    });

    toast.success("Medicamento agendado no mapa de aprazamento!");
    setMedForm((prev) => ({
      ...prev,
      medication: "",
      dosage: "",
    }));
  };

  if (!selectedBed || !occupant) {
    return (
      <div className="container max-w-xl py-12 text-center">
        <p className="text-lg font-semibold">
          Leito desocupado ou não encontrado.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta baia não possui nenhum paciente internado no momento.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/clinica/internacao">Voltar para mapa de leitos</Link>
        </Button>
      </div>
    );
  }

  // Estatísticas de doses administradas e pendentes
  const medStats = computeMedicationStats(occupant.medicationSchedule);
  const evolutions = occupant.evolutions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Botão de retorno superior */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/clinica/internacao"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para internação
        </Link>
      </div>

      {/* Cartão de Identificação do Paciente Internado */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/30 font-semibold">
                  {selectedBed.name} · {selectedBed.sector}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Internado em:{" "}
                  {new Date(occupant.admittedAt || Date.now()).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display mt-1">
                {occupant.petName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {occupant.species} · {occupant.breed} · Idade: {occupant.age} · Tutor: {occupant.tutor} ({occupant.phone})
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Veterinário(a)</span>
              <span className="text-sm font-semibold">{occupant.vet}</span>
            </div>
          </div>

          {/* Dados Clínicos e Dieta */}
          <div className="grid gap-3 pt-4 sm:grid-cols-3 text-sm">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-primary" /> Motivo da internação
              </p>
              <p className="font-semibold mt-1">{occupant.reason}</p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-amber-600" /> Dieta Hospitalar
              </p>
              <p className="font-semibold mt-1">{occupant.diet}</p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-sky-600" /> Próxima Medicação
              </p>
              <p className="font-semibold mt-1">{occupant.nextMedicationTime || "16:00"}</p>
            </div>
          </div>

          {/* Indicador de Doses Pendentes vs. Administradas no Turno */}
          {medStats && medStats.total > 0 && (
            <div
              data-testid={`bed-med-progress-${selectedBed.id}`}
              className="mt-3 flex items-center justify-between rounded-xl border border-primary/25 bg-primary-soft/60 px-3 py-2 text-xs"
            >
              <span className="font-semibold text-primary">
                Aprazamento: {medStats.administered}/{medStats.total} administrada(s)
              </span>
              <span className="font-bold text-amber-800 dark:text-amber-300">
                {medStats.pending} pendente(s)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 1: Mapa de Aprazamento de Medicamentos */}
      <Card data-testid="medication-schedule-section" className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Pill className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold font-display">
                  Mapa de Aprazamento de Medicamentos
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Horários programados, dosagens e controle de administração da equipe.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Badge
                data-testid="schedule-administered-badge"
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
              >
                {medStats.administered} administrada(s)
              </Badge>
              <Badge
                data-testid="schedule-pending-badge"
                variant="outline"
                className="bg-amber-500/10 text-amber-700 border-amber-500/30"
              >
                {medStats.pending} pendente(s)
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Formulário para adicionar medicamento ao aprazamento */}
          <form
            onSubmit={handleAddMedication}
            className="grid gap-3 p-4 rounded-xl bg-muted/30 border border-border/80 sm:grid-cols-4 items-end"
          >
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="med-name" className="text-xs">
                Medicamento / Cuidado *
              </Label>
              <Input
                id="med-name"
                value={medForm.medication}
                onChange={(e) =>
                  setMedForm((f) => ({ ...f, medication: e.target.value }))
                }
                placeholder="Ex.: Ondansetrona, Ringer Lactato..."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="med-dosage" className="text-xs">
                Dose / Via
              </Label>
              <Input
                id="med-dosage"
                value={medForm.dosage}
                onChange={(e) =>
                  setMedForm((f) => ({ ...f, dosage: e.target.value }))
                }
                placeholder="Ex.: 0,5 mg/kg IV"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="med-time" className="text-xs">
                Horário
              </Label>
              <div className="flex gap-2">
                <Input
                  id="med-time"
                  type="time"
                  value={medForm.scheduledTime}
                  onChange={(e) =>
                    setMedForm((f) => ({ ...f, scheduledTime: e.target.value }))
                  }
                  className="h-9 text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  data-testid="btn-add-medication-schedule"
                  className="h-9 px-3 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Lista de medicamentos aprazados */}
          <div data-testid="medication-schedule-list" className="space-y-2">
            {(!occupant.medicationSchedule || occupant.medicationSchedule.length === 0) ? (
              <p className="text-xs text-center py-6 text-muted-foreground border border-dashed rounded-xl">
                Nenhum medicamento aprazado para este leito ainda.
              </p>
            ) : (
              occupant.medicationSchedule.map((item) => {
                const isDone = item.status === "Administrado";
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-colors ${
                      isDone
                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                        : "bg-background border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="icon"
                        aria-label="Checar dose"
                        title="Checar dose"
                        variant={isDone ? "default" : "outline"}
                        className={`h-7 w-7 rounded-full shrink-0 ${
                          isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                        }`}
                        onClick={() =>
                          toggleBedMedicationStatus(selectedBed.id, item.id)
                        }
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <div>
                        <p className="font-semibold">{item.medication}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.dosage} · Horário: <strong>{item.scheduledTime}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isDone
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 border-amber-500/30"
                        }
                      >
                        {isDone ? "Administrado" : "Pendente"}
                      </Badge>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          removeBedMedicationItem(selectedBed.id, item.id)
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seção 2: Evoluções Clínicas & Sinais Vitais */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold font-display">
                Evolução Clínica & Sinais Vitais
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Registre anotações diárias do estado geral do paciente, temperatura e conduta.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Formulário de nova evolução */}
          <form onSubmit={handleSaveEvolution} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev-temp" className="text-xs">
                  Temperatura (°C)
                </Label>
                <Input
                  id="ev-temp"
                  placeholder="Ex.: 38.5"
                  value={evolutionForm.temperature}
                  onChange={(e) =>
                    setEvolutionForm((f) => ({
                      ...f,
                      temperature: e.target.value,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ev-vet" className="text-xs">
                  Veterinário Responsável
                </Label>
                <Input
                  id="ev-vet"
                  placeholder="Ex.: Dr. Ricardo"
                  value={evolutionForm.vet}
                  onChange={(e) =>
                    setEvolutionForm((f) => ({ ...f, vet: e.target.value }))
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-notes">
                Observações da Evolução Clínica *
              </Label>
              <Textarea
                id="ev-notes"
                rows={3}
                placeholder="Ex.: Paciente alerta, hidratado, urina e fezes presentes sem alterações..."
                value={evolutionForm.note}
                onChange={(e) =>
                  setEvolutionForm((f) => ({ ...f, note: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="gradient-primary text-primary-foreground gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Salvar Evolução
              </Button>
            </div>
          </form>

          {/* Linha do tempo das evoluções anteriores */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Histórico de Evoluções ({evolutions.length})
            </h3>

            {evolutions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Nenhuma evolução clínica registrada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {evolutions.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1 text-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {ev.time} — {ev.vet}
                      </span>
                      {ev.temperature && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                          <Thermometer className="h-3.5 w-3.5" /> {ev.temperature} °C
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {ev.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Recomendações e Conclusão de Alta Médica */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold font-display">
                Alta Médica & Boletim Hospitalar
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Orientações pós-internação, emissão de documento timbrado e liberação do leito.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-1.5 rounded-2xl border border-border/80 bg-muted/20 p-4">
            <Label htmlFor="evo-dischargeNote" className="text-xs font-semibold">
              Recomendações de Alta Hospitalar{" "}
              <span className="font-normal text-muted-foreground">
                (registradas no prontuário e no Boletim de Alta)
              </span>
            </Label>
            <Textarea
              id="evo-dischargeNote"
              rows={2}
              placeholder="Ex.: Manter dipirona oral por 3 dias, dieta gastrointestinal e retorno em 7 dias..."
              value={dischargeNote}
              onChange={(e) => setDischargeNote(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
            <Button asChild variant="outline">
              <Link to="/clinica/internacao">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                data-testid="btn-open-discharge-bulletin"
                className="w-full sm:w-auto rounded-full gap-1.5 border-primary/40 text-primary hover:bg-primary-soft"
                onClick={() =>
                  navigate(`/clinica/internacao/alta/${selectedBed.id}`, {
                    state: { dischargeNote },
                  })
                }
              >
                <FileCheck2 className="h-4 w-4" />
                Boletim de Alta Hospitalar
              </Button>
              <Button
                type="button"
                data-testid="btn-discharge-patient"
                className="w-full sm:w-auto rounded-full bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
                onClick={() => {
                  dischargePatientFromBed(selectedBed.id, dischargeNote);
                  toast.success(
                    `Alta médica concedida a ${occupant.petName}! Baia em higienização.`,
                  );
                  navigate("/clinica/internacao");
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Dar Alta Médica
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicInpatientBedPage;

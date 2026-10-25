import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck2,
  FlaskConical,
  Microscope,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { belongsToPatient, formatDate } from "@/lib/clinicVitals";

export const QUICK_EXAM_OPTIONS = [
  "Hemograma Completo",
  "Perfil Renal",
  "Perfil Hepático",
  "Raio-X",
  "Ultrassonografia",
  "Teste Rápido",
  "Coproparasitológico",
];

export const EXAM_STATUS_OPTIONS = [
  "Solicitado",
  "Em análise",
  "Concluído / Laudo",
];

export const EXAM_STATUS_STYLES = {
  Solicitado:
    "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300",
  "Em análise":
    "bg-sky-500/15 text-sky-800 border-sky-500/30 dark:text-sky-300",
  "Concluído / Laudo":
    "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300",
};

export const normalizeExamItem = (raw, index = 0) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return {
      id: `exam-${index}-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      nome: trimmed,
      status: "Solicitado",
      resultado: "",
    };
  }
  if (typeof raw === "object" && raw.nome) {
    return {
      id:
        raw.id ||
        `exam-${index}-${String(raw.nome).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      nome: String(raw.nome).trim(),
      status: raw.status || (raw.resultado ? "Concluído / Laudo" : "Solicitado"),
      resultado: raw.resultado ? String(raw.resultado) : "",
    };
  }
  return null;
};

export const buildPatientExams = (patient, appointments = []) => {
  if (!patient) return [];
  const list = [];

  (Array.isArray(appointments) ? appointments : []).forEach((app) => {
    if (!app || !belongsToPatient(patient, app)) return;
    const rawExams = Array.isArray(app.exames_complementares)
      ? app.exames_complementares
      : [];
    rawExams.forEach((raw, idx) => {
      const norm = normalizeExamItem(raw, idx);
      if (norm) {
        list.push({
          ...norm,
          appointmentId: app.id,
          date: app.date || "",
          vet: app.vet || "Equipe da clínica",
          service: app.service || "Consulta",
        });
      }
    });
  });

  return list;
};

export const ComplementaryExamsSelector = ({ exams = [], onChangeExams }) => {
  const [customExam, setCustomExam] = useState("");

  const normalizedExams = (Array.isArray(exams) ? exams : [])
    .map((e, i) => normalizeExamItem(e, i))
    .filter(Boolean);

  const isExamSelected = (examName) =>
    normalizedExams.some(
      (item) => item.nome.toLowerCase() === examName.toLowerCase(),
    );

  const handleToggleQuickExam = (examName) => {
    const exists = isExamSelected(examName);
    if (exists) {
      onChangeExams(
        normalizedExams.filter(
          (item) => item.nome.toLowerCase() !== examName.toLowerCase(),
        ),
      );
    } else {
      const newEntry = {
        id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome: examName,
        status: "Solicitado",
        resultado: "",
      };
      onChangeExams([...normalizedExams, newEntry]);
    }
  };

  const handleAddCustomExam = () => {
    const name = customExam.trim();
    if (!name) {
      toast.error("Digite o nome do exame complementar personalizado.");
      return;
    }
    if (isExamSelected(name)) {
      toast.error("Este exame já foi selecionado neste atendimento.");
      return;
    }
    const newEntry = {
      id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome: name,
      status: "Solicitado",
      resultado: "",
    };
    onChangeExams([...normalizedExams, newEntry]);
    setCustomExam("");
    toast.success(`Exame "${name}" adicionado à solicitação.`);
  };

  const handleRemoveExam = (id) => {
    onChangeExams(normalizedExams.filter((item) => item.id !== id));
  };

  return (
    <div
      data-testid="complementary-exams-section"
      className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <FlaskConical className="h-4 w-4 text-primary" /> Exames Complementares
          </p>
          <p className="text-xs text-muted-foreground">
            Selecione rapidamente os exames laboratoriais e de imagem solicitados na consulta.
          </p>
        </div>
        {normalizedExams.length > 0 && (
          <Badge variant="secondary" className="rounded-full text-xs font-bold">
            {normalizedExams.length} selecionado(s)
          </Badge>
        )}
      </div>

      {/* Botões / Chips de seleção rápida */}
      <div
        role="group"
        aria-label="Seleção rápida de exames complementares"
        className="flex flex-wrap gap-2"
      >
        {QUICK_EXAM_OPTIONS.map((examName) => {
          const active = isExamSelected(examName);
          return (
            <button
              key={examName}
              type="button"
              aria-pressed={active}
              onClick={() => handleToggleQuickExam(examName)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                  : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary-soft/60"
              }`}
            >
              {active ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {examName}
            </button>
          );
        })}
      </div>

      {/* Campo para adicionar exame personalizado */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="custom-exam-input" className="text-xs font-medium">
            Outro exame complementar (personalizado)
          </Label>
          <Input
            id="custom-exam-input"
            placeholder="Ex: Ecocardiograma, Cultura fúngica, Citologia..."
            value={customExam}
            onChange={(e) => setCustomExam(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomExam();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="gap-1.5 rounded-xl text-xs font-semibold sm:h-10"
          onClick={handleAddCustomExam}
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar exame
        </Button>
      </div>

      {/* Lista de exames selecionados */}
      {normalizedExams.length > 0 && (
        <div
          data-testid="selected-exams-list"
          className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3"
        >
          <p className="text-xs font-semibold text-muted-foreground">
            Exames solicitados neste atendimento
          </p>
          <div className="flex flex-wrap gap-2">
            {normalizedExams.map((item) => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-1.5 text-xs shadow-2xs"
              >
                <span className="font-semibold text-foreground">{item.nome}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${EXAM_STATUS_STYLES[item.status] || ""}`}
                >
                  {item.status}
                </Badge>
                <button
                  type="button"
                  aria-label={`Remover exame ${item.nome}`}
                  onClick={() => handleRemoveExam(item.id)}
                  className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const PatientExamsSection = ({
  patient,
  appointments = [],
  onUpdateExam,
}) => {
  const exams = buildPatientExams(patient, appointments);
  const [editingKey, setEditingKey] = useState(null);
  const [draftStatus, setDraftStatus] = useState("Concluído / Laudo");
  const [draftResult, setDraftResult] = useState("");

  const handleStartEdit = (exam) => {
    const key = `${exam.appointmentId}:${exam.id}`;
    setEditingKey(key);
    setDraftStatus(
      exam.status === "Solicitado" ? "Concluído / Laudo" : exam.status,
    );
    setDraftResult(exam.resultado || "");
  };

  const handleSaveReport = (exam) => {
    if (!onUpdateExam) return;
    const finalStatus = draftResult.trim()
      ? draftStatus === "Solicitado"
        ? "Concluído / Laudo"
        : draftStatus
      : draftStatus;

    onUpdateExam(exam.appointmentId, exam.id, {
      status: finalStatus,
      resultado: draftResult.trim(),
    });
    setEditingKey(null);
    toast.success(`Laudo/status do exame "${exam.nome}" atualizado no prontuário!`);
  };

  return (
    <div
      data-testid="patient-exams-section"
      className="rounded-2xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Microscope className="h-4 w-4 text-primary" /> Exames Complementares & Laudos
        </p>
        <Badge variant="outline" className="text-xs">
          {exams.length} {exams.length === 1 ? "exame" : "exames"}
        </Badge>
      </div>

      {exams.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum exame complementar solicitado para este paciente ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const itemKey = `${exam.appointmentId}:${exam.id}`;
            const isEditing = editingKey === itemKey;
            const dateFormatted = formatDate(exam.date, "full") || exam.date || "Hoje";

            return (
              <div
                key={itemKey}
                data-testid={`patient-exam-card-${exam.nome}`}
                className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{exam.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {dateFormatted} · {exam.vet}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`gap-1 border text-xs font-semibold ${
                        EXAM_STATUS_STYLES[exam.status] || EXAM_STATUS_STYLES.Solicitado
                      }`}
                    >
                      {exam.status === "Concluído / Laudo" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {exam.status}
                    </Badge>

                    {!isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 rounded-full px-2.5 text-xs"
                        onClick={() => handleStartEdit(exam)}
                      >
                        <Edit3 className="h-3 w-3" />
                        {exam.resultado ? "Editar laudo" : "Registrar laudo"}
                      </Button>
                    )}
                  </div>
                </div>

                {exam.resultado && !isEditing && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
                    <p className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                      <FileCheck2 className="h-3.5 w-3.5" /> Resultado / Observação do Laudo:
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-muted-foreground">
                      {exam.resultado}
                    </p>
                  </div>
                )}

                {isEditing && (
                  <div className="space-y-3 rounded-xl border border-border bg-background p-3 pt-2.5">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`exam-status-${exam.id}`}
                        className="text-xs font-semibold"
                      >
                        Status do Exame
                      </Label>
                      <Select value={draftStatus} onValueChange={setDraftStatus}>
                        <SelectTrigger id={`exam-status-${exam.id}`} className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_STATUS_OPTIONS.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor={`exam-result-${exam.id}`}
                        className="text-xs font-semibold"
                      >
                        Resultado / Observação do Exame
                      </Label>
                      <Textarea
                        id={`exam-result-${exam.id}`}
                        rows={2}
                        placeholder="Descreva os principais achados do laudo laboratorial ou de imagem..."
                        value={draftResult}
                        onChange={(e) => setDraftResult(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-full text-xs"
                        onClick={() => setEditingKey(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 rounded-full text-xs gradient-primary text-primary-foreground"
                        onClick={() => handleSaveReport(exam)}
                      >
                        Salvar laudo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


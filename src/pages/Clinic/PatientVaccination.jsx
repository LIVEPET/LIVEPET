import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Syringe,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  VACCINE_STATUS,
  buildPatientVaccinationHistory,
  getTodayIso,
} from "@/lib/vaccineSchedule";

const SUGGESTED_VACCINES = [
  "V8 / V10 Polivalente Canina",
  "Antirrábica",
  "Giárdia",
  "Gripe Canina (Tosse dos Canis)",
  "Quádrupla / Quíntupla Felina (V4/V5)",
  "Leishmaniose",
];

export const PatientVaccinationSection = ({
  patient,
  appointments = [],
  onAddVaccine,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    lote: "",
    data_aplicacao: getTodayIso(),
    proxima_dose: "",
    veterinario: "",
  });

  const history = useMemo(
    () => buildPatientVaccinationHistory(patient, appointments),
    [patient, appointments],
  );

  const { doses, summary } = history;

  const handleOpenModal = () => {
    setForm({
      nome: "",
      lote: "",
      data_aplicacao: getTodayIso(),
      proxima_dose: "",
      veterinario: "",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome da vacina.");
      return;
    }

    if (onAddVaccine) {
      onAddVaccine(patient.id, {
        nome: form.nome.trim(),
        lote: form.lote.trim() || "—",
        data_aplicacao: form.data_aplicacao || getTodayIso(),
        proxima_dose: form.proxima_dose || null,
        veterinario: form.veterinario.trim() || "Histórico Pregresso",
      });
    }

    toast.success(`Vacina ${form.nome.trim()} registrada com sucesso!`);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4" data-testid="patient-vaccination-section">
      {/* Resumo da Carteira & Ação */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-4 bg-muted/20">
        <div>
          <div className="flex items-center gap-2">
            <Syringe className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Carteira de Vacinação</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {doses.length === 0
              ? "Nenhuma dose registrada"
              : `${doses.length} ${doses.length === 1 ? "dose registrada" : "doses registradas"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {summary.status === VACCINE_STATUS.OVERDUE && (
            <Badge
              variant="outline"
              data-testid="vaccine-summary-badge"
              className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 gap-1 text-xs"
            >
              <ShieldAlert className="h-3 w-3" /> Reforço atrasado
            </Badge>
          )}
          {summary.status === VACCINE_STATUS.DUE_SOON && (
            <Badge
              variant="outline"
              data-testid="vaccine-summary-badge"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-xs"
            >
              <Clock className="h-3 w-3" /> Reforço próximo
            </Badge>
          )}
          {summary.status === VACCINE_STATUS.UP_TO_DATE && (
            <Badge
              variant="outline"
              data-testid="vaccine-summary-badge"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs"
            >
              <ShieldCheck className="h-3 w-3" /> Em dia
            </Badge>
          )}
          {summary.status === VACCINE_STATUS.NO_RECORD && (
            <Badge
              variant="outline"
              data-testid="vaccine-summary-badge"
              className="bg-muted text-muted-foreground text-xs"
            >
              Sem registro
            </Badge>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleOpenModal}
            data-testid="btn-add-vaccine"
            className="h-8 gap-1 rounded-full text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar vacina
          </Button>
        </div>
      </div>

      {/* Alerta em destaque se houver atraso ou vencimento próximo */}
      {summary.alertMessage && (
        <div
          data-testid="vaccine-alert-banner"
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium ${
            summary.status === VACCINE_STATUS.OVERDUE
              ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-400"
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{summary.label}</p>
            <p className="text-xs opacity-90">{summary.alertMessage}</p>
          </div>
        </div>
      )}

      {/* Lista de Vacinas / Doses */}
      {doses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <Syringe className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-semibold">Nenhuma vacina registrada</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Cadastre doses anteriores aplicadas em outras clínicas ou conclua atendimentos de vacinação.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenModal}
            className="mt-3 gap-1 rounded-full text-xs"
          >
            <Plus className="h-3 w-3" /> Adicionar primeira vacina
          </Button>
        </div>
      ) : (
        <div className="space-y-3" data-testid="patient-vaccine-list">
          {doses.map((dose) => (
            <Card
              key={dose.id}
              data-testid={`vaccine-card-${dose.id}`}
              className="border border-border/80 shadow-none bg-card/60 transition-colors hover:border-primary/40"
            >
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-semibold text-sm leading-tight text-foreground">
                      {dose.nome}
                    </h5>
                    <span className="text-[11px] text-muted-foreground">
                      {dose.tipo === "atendimento" ? "Atendimento Clínico" : "Registro Pregresso"}
                      {" · "}
                      {dose.veterinario}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    data-testid="dose-status-badge"
                    className={`shrink-0 text-[11px] font-medium border ${dose.status.badgeClass}`}
                  >
                    {dose.status.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-border/50 text-muted-foreground">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide font-medium text-muted-foreground/80">
                      Lote
                    </span>
                    <span className="font-medium text-foreground">{dose.lote}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase tracking-wide font-medium text-muted-foreground/80">
                      Data da Aplicação
                    </span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {dose.data_aplicacao}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5 mt-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Próxima Dose / Reforço:
                    </span>
                    <span className="text-[11px] font-semibold text-foreground">
                      {dose.proxima_dose || "Dose única"}
                      {dose.status.detail ? ` (${dose.status.detail})` : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Registro de Vacina Pregressa */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Syringe className="h-5 w-5 text-primary" /> Registrar Vacina / Dose Pregressa
            </DialogTitle>
            <DialogDescription>
              Adicione imunizações aplicadas anteriormente no pet {patient?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vac-nome">Nome da vacina *</Label>
              <Input
                id="vac-nome"
                placeholder="Ex: V10, Antirrábica, Giárdia..."
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                list="suggested-vaccines"
                required
              />
              <datalist id="suggested-vaccines">
                {SUGGESTED_VACCINES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vac-lote">Lote</Label>
                <Input
                  id="vac-lote"
                  placeholder="Ex: LOTE-8942"
                  value={form.lote}
                  onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vac-vet">Veterinário / Clínica</Label>
                <Input
                  id="vac-vet"
                  placeholder="Ex: Clínica Externa / Dr. Silva"
                  value={form.veterinario}
                  onChange={(e) => setForm((f) => ({ ...f, veterinario: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vac-data">Data da aplicação *</Label>
                <Input
                  id="vac-data"
                  type="date"
                  value={form.data_aplicacao}
                  onChange={(e) => setForm((f) => ({ ...f, data_aplicacao: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vac-proxima">Próxima dose / Reforço</Label>
                <Input
                  id="vac-proxima"
                  type="date"
                  value={form.proxima_dose}
                  onChange={(e) => setForm((f) => ({ ...f, proxima_dose: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" data-testid="submit-vaccine-btn">
                Salvar Vacina
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BedDouble,
  CheckCircle2,
  ClipboardList,
  Clock,
  PawPrint,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BED_SECTORS, bedStatusStyles } from "@/data/clinicDemo";
import { useClinic } from "@/contexts/ClinicContext";
import { computeMedicationStats } from "./InpatientDischargeBulletin";

const ClinicInpatient = () => {
  const navigate = useNavigate();
  const {
    beds = [],
    releaseBedFromCleaning,
    setBedCleaning,
  } = useClinic();

  const [sectorFilter, setSectorFilter] = useState("Todos");

  const counts = useMemo(() => {
    const total = beds.length;
    const free = beds.filter((b) => b.status === "Livre").length;
    const occupied = beds.filter((b) => b.status === "Ocupada").length;
    const cleaning = beds.filter((b) => b.status === "Em Higienização").length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, free, occupied, cleaning, occupancyRate };
  }, [beds]);

  const visibleBeds = useMemo(
    () =>
      beds.filter((b) => sectorFilter === "Todos" || b.sector === sectorFilter),
    [beds, sectorFilter],
  );

  const handleReleaseCleaning = (bed) => {
    releaseBedFromCleaning(bed.id);
    toast.success(`${bed.name} liberada e pronta para novo paciente!`);
  };

  const handleBedCardClick = (bed) => {
    if (bed.status === "Livre") {
      navigate(`/clinica/internacao/admitir/${bed.id}`);
    } else if (bed.status === "Ocupada") {
      navigate(`/clinica/internacao/leito/${bed.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">
            Internação & Mapa de Baias
          </Badge>
          <h1 className="font-display text-3xl font-bold">
            Mapa de Leitos Veterinários
          </h1>
          <p className="text-muted-foreground">
            Controle visual em tempo real do Canil, Gatil e Isolamento/UTI.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm">
          <div className="min-w-[140px] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Taxa de ocupação</span>
              <span className="font-bold text-foreground">{counts.occupancyRate}%</span>
            </div>
            <Progress value={counts.occupancyRate} className="h-2" />
          </div>
          <Badge variant="secondary" className="rounded-full text-xs">
            {counts.occupied}/{counts.total} leitos
          </Badge>
        </div>
      </div>

      {/* Contadores Visuais no Topo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          data-testid="counter-free-beds"
          className="border-emerald-500/30 bg-card shadow-card"
        >
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{counts.free}</p>
              <p className="text-sm font-semibold">Baias Livres</p>
              <p className="text-xs text-muted-foreground">Prontas para admissão imediata</p>
            </div>
          </CardContent>
        </Card>

        <Card
          data-testid="counter-occupied-beds"
          className="border-rose-500/30 bg-card shadow-card"
        >
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-400">
              <HeartPulse className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{counts.occupied}</p>
              <p className="text-sm font-semibold">Baias Ocupadas</p>
              <p className="text-xs text-muted-foreground">Pacientes em monitoramento ativo</p>
            </div>
          </CardContent>
        </Card>

        <Card
          data-testid="counter-cleaning-beds"
          className="border-amber-500/30 bg-card shadow-card"
        >
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/20 text-amber-800 dark:text-amber-300">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{counts.cleaning}</p>
              <p className="text-sm font-semibold">Em Higienização</p>
              <p className="text-xs text-muted-foreground">Desinfecção pós-alta ou manutenção</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro por Setor */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={sectorFilter} onValueChange={setSectorFilter}>
          <TabsList className="flex-wrap">
            {BED_SECTORS.map((sec) => (
              <TabsTrigger
                key={sec}
                value={sec}
                onClick={() => setSectorFilter(sec)}
                className="text-xs sm:text-sm"
              >
                {sec}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Livre (clique para internar)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Ocupada (clique para evolução/alta)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Em Higienização
          </span>
        </div>
      </div>

      {/* Grade de Leitos / Baias */}
      <div
        data-testid="beds-grid"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {visibleBeds.map((bed) => {
          const style = bedStatusStyles[bed.status] || bedStatusStyles.Livre;
          const occ = bed.occupant;
          const medStats = occ ? computeMedicationStats(occ.medicationSchedule) : null;

          return (
            <Card
              key={bed.id}
              data-testid={`bed-card-${bed.id}`}
              onClick={() => handleBedCardClick(bed)}
              className={`flex flex-col justify-between transition-all duration-200 ${
                bed.status !== "Em Higienização" ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-card" : ""
              } ${style.cardBorder}`}
            >
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                      {bed.code}
                    </span>
                    <CardTitle className="font-display text-base">{bed.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={`gap-1.5 border ${style.badge}`}>
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    {bed.status}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Setor: <span className="text-foreground">{bed.sector}</span>
                </p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between space-y-4 pt-0">
                {bed.status === "Ocupada" && occ ? (
                  <>
                    <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="flex items-center gap-1.5 font-display text-base font-bold text-foreground">
                            <PawPrint className="h-4 w-4 text-primary" />
                            {occ.petName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {occ.species} · {occ.breed || "—"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {occ.species}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Stethoscope className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="font-medium text-foreground">Vet:</span> {occ.vet}
                        </p>
                        <p className="flex items-start gap-1.5 text-muted-foreground">
                          <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                          <span>
                            <strong className="text-foreground">Motivo:</strong> {occ.reason}
                          </span>
                        </p>
                        <p className="flex items-start gap-1.5 text-muted-foreground">
                          <Utensils className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>
                            <strong className="text-foreground">Dieta:</strong> {occ.diet}
                          </span>
                        </p>
                        {occ.prescription && (
                          <p className="flex items-start gap-1.5 text-muted-foreground">
                            <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="line-clamp-2">
                              <strong className="text-foreground">Prescrição:</strong> {occ.prescription}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Alerta de horário da próxima medicação */}
                      <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-900 dark:text-amber-300">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          Próxima medicação
                        </span>
                        <span className="font-bold">{occ.nextMedicationTime || "—"}</span>
                      </div>

                      {/* Indicador de Doses Pendentes vs. Administradas no Turno */}
                      {medStats && medStats.total > 0 && (
                        <div
                          data-testid={`bed-med-progress-${bed.id}`}
                          className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary-soft/60 px-2.5 py-1.5 text-[11px]"
                        >
                          <span className="font-semibold text-primary">
                            Aprazamento: {medStats.administered}/{medStats.total} administrada(s)
                          </span>
                          <span className="font-bold text-amber-800 dark:text-amber-300">
                            {medStats.pending} pendente(s)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clinica/internacao/leito/${bed.id}`);
                        }}
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        Evolução / Alta Médica
                      </Button>
                    </div>
                  </>
                ) : bed.status === "Livre" ? (
                  <>
                    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.03] p-5 text-center">
                      <BedDouble className="mb-2 h-7 w-7 text-emerald-600/80" />
                      <p className="text-sm font-semibold text-foreground">Baia disponível</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Clique para internar um paciente neste leito
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full rounded-full gap-1.5 text-xs gradient-primary text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clinica/internacao/admitir/${bed.id}`);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Admitir paciente
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        title="Enviar para higienização"
                        className="rounded-full px-2.5 text-xs text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBedCleaning(bed.id);
                          toast(`${bed.name} marcada Em Higienização.`);
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-amber-500/40 bg-amber-400/10 p-5 text-center">
                      <Sparkles className="mb-2 h-7 w-7 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                        Em Higienização / Desinfecção
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Aguardando conclusão da limpeza pós-alta para liberação.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full rounded-full border-amber-500/50 gap-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/15 dark:text-amber-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReleaseCleaning(bed);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Liberar baia
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
};

export default ClinicInpatient;

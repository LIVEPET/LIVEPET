import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  ClipboardList,
  Clock,
  HeartPulse,
  PawPrint,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
  Thermometer,
  User,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BED_SECTORS, bedStatusStyles } from "@/data/clinicDemo";
import { useClinic } from "@/contexts/ClinicContext";

const DEFAULT_SPECIES = ["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"];
const DEFAULT_VET = "Equipe da clínica";

const emptyAdmissionForm = {
  patientId: "",
  petName: "",
  species: "Cão",
  breed: "",
  tutor: "",
  vet: "",
  reason: "",
  prescription: "",
  diet: "",
  nextMedicationTime: "14:00",
};

const emptyEvolutionForm = {
  note: "",
  temperature: "",
  vet: "",
  prescription: "",
  diet: "",
  nextMedicationTime: "",
  dischargeNote: "",
};

const toName = (item) => (typeof item === "string" ? item : item?.name);
const uniqueNames = (items) => [...new Set((items || []).map(toName).filter(Boolean))];

const ClinicInpatient = () => {
  const {
    beds = [],
    patients = [],
    profile,
    admitPatientToBed,
    addBedEvolution,
    dischargePatientFromBed,
    releaseBedFromCleaning,
    setBedCleaning,
  } = useClinic();

  const [sectorFilter, setSectorFilter] = useState("Todos");
  const [selectedBedId, setSelectedBedId] = useState(null);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState(emptyAdmissionForm);
  const [admitError, setAdmitError] = useState("");
  const [evolutionForm, setEvolutionForm] = useState(emptyEvolutionForm);

  const team = useMemo(() => uniqueNames(profile?.team), [profile?.team]);

  const selectedBed = useMemo(
    () => beds.find((b) => b.id === selectedBedId) || null,
    [beds, selectedBedId],
  );

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

  const handleOpenAdmit = (bed) => {
    setSelectedBedId(bed.id);
    setAdmitError("");
    setAdmitForm({
      ...emptyAdmissionForm,
      species: bed.sector === "Gatil" ? "Gato" : "Cão",
      vet: team[0] || DEFAULT_VET,
    });
    setAdmitOpen(true);
  };

  const handleSelectExistingPatient = (patientId) => {
    const found = patients.find((p) => String(p.id) === String(patientId));
    if (!found) {
      setAdmitForm((f) => ({ ...f, patientId: "" }));
      return;
    }
    setAdmitForm((f) => ({
      ...f,
      patientId: String(found.id),
      petName: found.name || f.petName,
      species: found.species || f.species,
      breed: found.breed || f.breed,
      tutor: found.tutor || f.tutor,
    }));
  };

  const handleConfirmAdmission = (e) => {
    e.preventDefault();
    if (!selectedBed) return;
    if (!admitForm.petName.trim()) {
      setAdmitError("Informe o nome do paciente para admitir na baia.");
      return;
    }
    if (!admitForm.reason.trim()) {
      setAdmitError("Informe o motivo da internação.");
      return;
    }

    admitPatientToBed(selectedBed.id, {
      petName: admitForm.petName.trim(),
      species: admitForm.species || "Cão",
      breed: admitForm.breed.trim() || "—",
      tutor: admitForm.tutor.trim() || "Tutor cadastrado",
      vet: admitForm.vet.trim() || team[0] || DEFAULT_VET,
      reason: admitForm.reason.trim(),
      prescription: admitForm.prescription.trim() || "Fluidoterapia e monitoramento",
      diet: admitForm.diet.trim() || "Dieta hospitalar fracionada",
      nextMedicationTime: admitForm.nextMedicationTime || "14:00",
    });

    setAdmitOpen(false);
    toast.success(`${admitForm.petName} admitido(a) em ${selectedBed.name}!`);
  };

  const handleOpenManage = (bed) => {
    setSelectedBedId(bed.id);
    setEvolutionForm({
      note: "",
      temperature: "",
      vet: bed.occupant?.vet || team[0] || DEFAULT_VET,
      prescription: bed.occupant?.prescription || "",
      diet: bed.occupant?.diet || "",
      nextMedicationTime: bed.occupant?.nextMedicationTime || "",
      dischargeNote: "",
    });
    setManageOpen(true);
  };

  const handleSaveEvolution = (e) => {
    e.preventDefault();
    if (!selectedBed || !selectedBed.occupant) return;
    if (!evolutionForm.note.trim()) {
      toast.error("Descreva a evolução clínica do paciente.");
      return;
    }

    addBedEvolution(selectedBed.id, {
      note: evolutionForm.note,
      temperature: evolutionForm.temperature,
      vet: evolutionForm.vet || selectedBed.occupant.vet,
      prescription: evolutionForm.prescription,
      diet: evolutionForm.diet,
      nextMedicationTime: evolutionForm.nextMedicationTime,
    });

    setEvolutionForm((f) => ({ ...f, note: "", temperature: "" }));
    toast.success(`Evolução clínica registrada para ${selectedBed.occupant.petName}.`);
  };

  const handleDischarge = () => {
    if (!selectedBed || !selectedBed.occupant) return;
    const petName = selectedBed.occupant.petName;
    const bedName = selectedBed.name;
    dischargePatientFromBed(selectedBed.id, evolutionForm.dischargeNote);
    setManageOpen(false);
    toast.success(`Alta médica registrada para ${petName}!`, {
      description: `${bedName} agora está Em Higienização.`,
    });
  };

  const handleReleaseCleaning = (bed) => {
    releaseBedFromCleaning(bed.id);
    toast.success(`${bed.name} liberada e pronta para novo paciente!`);
  };

  const handleBedCardClick = (bed) => {
    if (bed.status === "Livre") {
      handleOpenAdmit(bed);
    } else if (bed.status === "Ocupada") {
      handleOpenManage(bed);
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
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenManage(bed);
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
                          handleOpenAdmit(bed);
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

      {/* Modal 1: Admitir Paciente em Baia Livre */}
      <Dialog open={admitOpen} onOpenChange={setAdmitOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {selectedBed && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Internar Paciente — {selectedBed.name} ({selectedBed.sector})
                </DialogTitle>
                <DialogDescription>
                  Registre os dados clínicos da admissão hospitalar, dieta e medicação.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleConfirmAdmission} className="space-y-4">
                {patients.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="admit-patient-select">Selecionar paciente cadastrado (opcional)</Label>
                    <Select
                      value={admitForm.patientId}
                      onValueChange={handleSelectExistingPatient}
                    >
                      <SelectTrigger id="admit-patient-select">
                        <SelectValue placeholder="Escolher da lista da clínica..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} ({p.species} · Tutor: {p.tutor})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="admit-petName">Nome do Pet *</Label>
                    <Input
                      id="admit-petName"
                      placeholder="Ex.: Thor"
                      value={admitForm.petName}
                      onChange={(e) =>
                        setAdmitForm((f) => ({ ...f, petName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admit-species">Espécie</Label>
                    <Select
                      value={admitForm.species}
                      onValueChange={(v) => setAdmitForm((f) => ({ ...f, species: v }))}
                    >
                      <SelectTrigger id="admit-species">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_SPECIES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admit-breed">Raça</Label>
                    <Input
                      id="admit-breed"
                      placeholder="Ex.: Golden Retriever"
                      value={admitForm.breed}
                      onChange={(e) =>
                        setAdmitForm((f) => ({ ...f, breed: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admit-tutor">Tutor</Label>
                    <Input
                      id="admit-tutor"
                      placeholder="Nome do responsável"
                      value={admitForm.tutor}
                      onChange={(e) =>
                        setAdmitForm((f) => ({ ...f, tutor: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admit-vet">Veterinário Responsável</Label>
                    <Input
                      id="admit-vet"
                      placeholder="Ex.: Dra. Sofia"
                      value={admitForm.vet}
                      onChange={(e) =>
                        setAdmitForm((f) => ({ ...f, vet: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admit-nextMed">Horário da Próxima Medicação</Label>
                    <Input
                      id="admit-nextMed"
                      type="time"
                      value={admitForm.nextMedicationTime}
                      onChange={(e) =>
                        setAdmitForm((f) => ({
                          ...f,
                          nextMedicationTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admit-reason">Motivo da Internação *</Label>
                  <Input
                    id="admit-reason"
                    placeholder="Ex.: Gastroenterite hemorrágica, observação pós-operatória..."
                    value={admitForm.reason}
                    onChange={(e) =>
                      setAdmitForm((f) => ({ ...f, reason: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admit-diet">Dieta Hospitalar</Label>
                  <Input
                    id="admit-diet"
                    placeholder="Ex.: Ração pastosa gastrointestinal a cada 6h"
                    value={admitForm.diet}
                    onChange={(e) =>
                      setAdmitForm((f) => ({ ...f, diet: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admit-prescription">Prescrição Hospitalar</Label>
                  <Textarea
                    id="admit-prescription"
                    rows={2}
                    placeholder="Ex.: Ringer Lactato 30 ml/h IV + Ondansetrona 0,5 mg/kg..."
                    value={admitForm.prescription}
                    onChange={(e) =>
                      setAdmitForm((f) => ({ ...f, prescription: e.target.value }))
                    }
                  />
                </div>

                {admitError && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {admitError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setAdmitOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary text-primary-foreground">
                    Confirmar Internação
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Gerenciar Baia Ocupada (Evolução Clínica e Alta Médica) */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          {selectedBed && selectedBed.occupant && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <DialogTitle className="font-display text-2xl">
                      Prontuário de Internação — {selectedBed.name}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedBed.occupant.petName} ({selectedBed.occupant.species} ·{" "}
                      {selectedBed.occupant.breed}) · Tutor: {selectedBed.occupant.tutor}
                    </DialogDescription>
                  </div>
                  <Badge className="border-rose-500/30 bg-rose-500/15 text-rose-700">
                    Ocupada · {selectedBed.sector}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Resumo da Internação */}
                <div className="grid gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Motivo da internação</p>
                    <p className="text-sm font-semibold">{selectedBed.occupant.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Veterinário responsável</p>
                    <p className="text-sm font-semibold">{selectedBed.occupant.vet}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dieta prescrita</p>
                    <p className="text-sm font-medium">{selectedBed.occupant.diet}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Próxima medicação</p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {selectedBed.occupant.nextMedicationTime}
                    </p>
                  </div>
                </div>

                {/* Formulário de Nova Evolução */}
                <form
                  onSubmit={handleSaveEvolution}
                  className="space-y-3 rounded-2xl border border-border/80 bg-card p-4"
                >
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Activity className="h-4 w-4 text-primary" /> Registrar Evolução Hospitalar
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="evo-temp" className="text-xs">
                        Temperatura (°C)
                      </Label>
                      <Input
                        id="evo-temp"
                        type="number"
                        step="0.1"
                        placeholder="Ex.: 38.5"
                        value={evolutionForm.temperature}
                        onChange={(e) =>
                          setEvolutionForm((f) => ({ ...f, temperature: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="evo-nextMed" className="text-xs">
                        Próx. Medicação
                      </Label>
                      <Input
                        id="evo-nextMed"
                        type="time"
                        value={evolutionForm.nextMedicationTime}
                        onChange={(e) =>
                          setEvolutionForm((f) => ({
                            ...f,
                            nextMedicationTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="evo-vet" className="text-xs">
                        Plantonista
                      </Label>
                      <Input
                        id="evo-vet"
                        value={evolutionForm.vet}
                        onChange={(e) =>
                          setEvolutionForm((f) => ({ ...f, vet: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="evo-diet" className="text-xs">
                        Atualizar Dieta
                      </Label>
                      <Input
                        id="evo-diet"
                        value={evolutionForm.diet}
                        onChange={(e) =>
                          setEvolutionForm((f) => ({ ...f, diet: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="evo-presc" className="text-xs">
                        Atualizar Prescrição
                      </Label>
                      <Input
                        id="evo-presc"
                        value={evolutionForm.prescription}
                        onChange={(e) =>
                          setEvolutionForm((f) => ({ ...f, prescription: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="evo-note" className="text-xs">
                      Observações da Evolução Clínica *
                    </Label>
                    <Textarea
                      id="evo-note"
                      rows={2}
                      placeholder="Relate parâmetros vitais, aceitação de dieta, administração de fármacos e resposta clínica..."
                      value={evolutionForm.note}
                      onChange={(e) =>
                        setEvolutionForm((f) => ({ ...f, note: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="rounded-full">
                      Salvar Evolução
                    </Button>
                  </div>
                </form>

                {/* Histórico de Evoluções */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Histórico de Evoluções no Leito ({(selectedBed.occupant.evolutions || []).length})
                  </p>
                  {(selectedBed.occupant.evolutions || []).length > 0 ? (
                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                      {selectedBed.occupant.evolutions.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold text-foreground">
                            <span>
                              {ev.time} — {ev.vet}
                            </span>
                            {ev.temperature && (
                              <span className="inline-flex items-center gap-1 text-primary">
                                <Thermometer className="h-3 w-3" /> {ev.temperature} °C
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-muted-foreground">{ev.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma evolução registrada ainda neste turno.
                    </p>
                  )}
                </div>

                {/* Rodapé com botão de Alta Médica */}
                <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setManageOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    data-testid="btn-discharge-patient"
                    className="w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                    onClick={handleDischarge}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Dar Alta Médica
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicInpatient;

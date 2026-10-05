import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Stethoscope,
  Syringe,
  Pill,
  HeartPulse,
  Scissors,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Plus,
  Loader2,
  PawPrint,
  Clock,
  History,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { getStoredUser, petsService } from "@/services/api";
import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";

const typeMeta = {
  vacina: {
    label: "Vacina",
    icon: Syringe,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  consulta: {
    label: "Consulta",
    icon: Stethoscope,
    color: "text-sky-600",
    bg: "bg-sky-100 dark:bg-sky-950/40",
  },
  medicacao: {
    label: "Medicação",
    icon: Pill,
    color: "text-violet-600",
    bg: "bg-violet-100 dark:bg-violet-950/40",
  },
  exame: {
    label: "Exame",
    icon: HeartPulse,
    color: "text-rose-600",
    bg: "bg-rose-100 dark:bg-rose-950/40",
  },
  procedimento: {
    label: "Procedimento",
    icon: Scissors,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-950/40",
  },
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const getWeekStart = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
};

const formatAge = (birthDateStr) => {
  if (!birthDateStr) return "Idade não informada";
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (diffMonths < 1) return "Menos de 1 mês";
    if (diffMonths < 12)
      return `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    if (remainingMonths === 0)
      return `${years} ${years === 1 ? "ano" : "anos"}`;
    return `${years}a ${remainingMonths}m`;
  } catch {
    return "Idade não informada";
  }
};

const PET_COLORS = [
  "from-blue-600 to-sky-700",
  "from-emerald-600 to-teal-700",
  "from-violet-600 to-purple-700",
  "from-amber-600 to-orange-700",
  "from-rose-600 to-pink-700",
];

const MedicalHistory = () => {
  const [searchParams] = useSearchParams();
  const urlPetId = searchParams.get("petId") || searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  // Dialog para adicionar registro médico
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetPetId, setTargetPetId] = useState("");
  const [recordType, setRecordType] = useState("Consulta");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  // Carrega pets reais do tutor e seus históricos
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const user = getStoredUser();
        const data = await petsService.list();
        if (!isMounted) return;

        if (Array.isArray(data) && data.length > 0) {
          const adaptedPets = data.map((p, index) => ({
            id: p.id,
            name: p.nome,
            species: p.especie,
            breed: p.raca || "SRD",
            age: formatAge(p.data_nascimento),
            tutor: user?.nome || "Tutor LivePet",
            microchip: p.token_publico
              ? `LP-${p.token_publico.slice(0, 8).toUpperCase()}`
              : `LP-${p.id}`,
            img: getPetPhoto(p.foto_url),
            color: PET_COLORS[index % PET_COLORS.length],
          }));

          // Consolida eventos clínicos a partir de vacinas e prontuários médicos
          const compiledEvents = [];

          data.forEach((p) => {
            // 1. Vacinas aplicadas
            (p.vaccines || []).forEach((v) => {
              if (v.data_aplicacao) {
                compiledEvents.push({
                  id: `v-app-${v.id}`,
                  petId: p.id,
                  date: v.data_aplicacao,
                  time: "09:00",
                  type: "vacina",
                  title: `Vacina: ${v.nome}`,
                  vet: v.veterinario || "Clínica Veterinária",
                  notes: v.lote
                    ? `Dose aplicada. Lote ${v.lote}`
                    : "Dose aplicada com sucesso.",
                  status: "Concluído",
                });
              }

              // 2. Reforço agendado da vacina
              if (v.proxima_dose) {
                compiledEvents.push({
                  id: `v-due-${v.id}`,
                  petId: p.id,
                  date: v.proxima_dose,
                  time: "10:00",
                  type: "vacina",
                  title: `Reforço: ${v.nome}`,
                  vet: v.veterinario || "Clínica Veterinária",
                  notes: "Dose de reforço agendada pelo veterinário.",
                  status: "Agendado",
                });
              }
            });

            // 3. Prontuários médicos
            (p.medical_records || []).forEach((m) => {
              const tipoStr = m.tipo?.toLowerCase() || "";
              let tipoCategoria = "consulta";
              if (tipoStr.includes("exame")) tipoCategoria = "exame";
              else if (tipoStr.includes("medic")) tipoCategoria = "medicacao";
              else if (tipoStr.includes("proced") || tipoStr.includes("cirurg"))
                tipoCategoria = "procedimento";
              else if (tipoStr.includes("vacina")) tipoCategoria = "vacina";

              const dataStr = m.data_registro
                ? m.data_registro.split("T")[0]
                : new Date().toISOString().slice(0, 10);

              compiledEvents.push({
                id: `mr-${m.id}`,
                petId: p.id,
                date: dataStr,
                time: "14:30",
                type: tipoCategoria,
                title: m.tipo || "Registro Médico",
                vet: "Clínica Veterinária Parceira",
                notes:
                  m.descricao ||
                  (m.peso_registrado
                    ? `Peso registrado: ${m.peso_registrado} kg`
                    : "Atendimento clínico realizado"),
                status: "Concluído",
              });
            });
          });

          setPets(adaptedPets);
          setEvents(compiledEvents);

          // Seleciona o pet requisitado por query param ou todos por padrão
          if (urlPetId) {
            const match = adaptedPets.find(
              (p) => String(p.id) === String(urlPetId),
            );
            setSelectedPets(match ? [match.id] : [adaptedPets[0].id]);
            setTargetPetId(String(match ? match.id : adaptedPets[0].id));
          } else {
            setSelectedPets(adaptedPets.map((p) => p.id));
            setTargetPetId(String(adaptedPets[0].id));
          }
        } else {
          setPets([]);
          setEvents([]);
        }
      } catch (err) {
        console.error("Erro ao carregar histórico veterinário:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [urlPetId]);

  const togglePet = (id) =>
    setSelectedPets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const visiblePets = pets.filter((p) => selectedPets.includes(p.id));

  const eventsByPetDay = useMemo(() => {
    const map = {};
    visiblePets.forEach((p) => {
      map[p.id] = {};
      weekDays.forEach((d) => {
        const key = d.toISOString().slice(0, 10);
        map[p.id][key] = events
          .filter((e) => e.petId === p.id && e.date === key)
          .sort((a, b) => a.time.localeCompare(b.time));
      });
    });
    return map;
  }, [visiblePets, weekDays, events]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const shiftWeek = (delta) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  };

  const formatRange = () => {
    const fmt = (d) =>
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return `${fmt(weekStart)} — ${fmt(weekEnd)}`;
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!targetPetId || !description.trim()) {
      toast.error("Preencha a descrição do atendimento.");
      return;
    }

    try {
      setSaving(true);
      const petIdNum = Number(targetPetId);
      const res = await petsService.addMedicalRecord(petIdNum, {
        tipo: recordType,
        descricao: description.trim(),
        peso_registrado: weight ? Number(weight.replace(",", ".")) : null,
      });

      const today = new Date().toISOString().slice(0, 10);
      let tipoCategoria = "consulta";
      const t = recordType.toLowerCase();
      if (t.includes("exame")) tipoCategoria = "exame";
      else if (t.includes("medic")) tipoCategoria = "medicacao";
      else if (t.includes("proced") || t.includes("cirurg"))
        tipoCategoria = "procedimento";

      const newEv = {
        id: `mr-${res.id || Date.now()}`,
        petId: petIdNum,
        date: today,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: tipoCategoria,
        title: recordType,
        vet: "Clínica Veterinária Parceira",
        notes: description.trim(),
        status: "Concluído",
      };

      setEvents((prev) => [newEv, ...prev]);
      toast.success("Registro clínico adicionado com sucesso!", {
        description: `Vinculado ao pet no banco de dados Neon.`,
      });

      setDescription("");
      setWeight("");
      setDialogOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error("Erro ao registrar no prontuário", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const downloadCarteirinha = (pet) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header band
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, w, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Carteirinha Médica Digital", margin, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("LivePet • Histórico veterinário completo", margin, 26);
    doc.setFontSize(9);
    doc.text(
      `Emitida em ${new Date().toLocaleDateString("pt-BR")}`,
      margin,
      33,
    );

    // Pet info card
    let y = 50;
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(pet.name, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    y += 7;
    doc.text(
      `Espécie: ${pet.species}    Raça: ${pet.breed}    Idade: ${pet.age}`,
      margin,
      y,
    );
    y += 6;
    doc.text(`Tutor: ${pet.tutor}`, margin, y);
    y += 6;
    doc.text(`Identificador/Token: ${pet.microchip}`, margin, y);

    // Divider
    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, w - margin, y);

    // Events
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Histórico veterinário", margin, y);
    y += 8;

    const petEvents = events
      .filter((e) => e.petId === pet.id)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    doc.setFontSize(10);
    if (petEvents.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.text("Nenhum atendimento ou vacina registrada até o momento.", margin, y);
      y += 8;
    } else {
      petEvents.forEach((e) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const meta = typeMeta[e.type] || typeMeta.consulta;
        const dateStr = new Date(e.date + "T00:00:00").toLocaleDateString(
          "pt-BR",
        );
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`${dateStr} • ${e.time}  —  ${meta.label}`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.text(e.title, margin, y);
        y += 5;
        doc.setTextColor(110, 110, 110);
        const notes = doc.splitTextToSize(
          `${e.vet} — ${e.notes}`,
          w - margin * 2,
        );
        doc.text(notes, margin, y);
        y += notes.length * 4.5 + 4;
        doc.setTextColor(40, 40, 40);
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Documento gerado eletronicamente — LivePet Oficial", margin, 290);

    doc.save(`carteirinha-${pet.name.toLowerCase()}.pdf`);
    toast.success(`Carteirinha de ${pet.name} baixada com sucesso!`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Carregando histórico médico dos pets...
        </p>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="container max-w-2xl py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PawPrint className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Nenhum pet cadastrado ainda
        </h2>
        <p className="mt-2 text-muted-foreground">
          Cadastre seu primeiro pet para acompanhar consultas, vacinas e o
          prontuário clínico em tempo real.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="rounded-full gradient-primary">
            <Link to="/pets/novo">
              <Plus className="mr-2 h-4 w-4" /> Cadastrar Pet
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sub-navegação da Categoria Saúde */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="container flex items-center gap-2 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
            Saúde:
          </span>
          <Link
            to="/saude"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Syringe className="h-3.5 w-3.5" />
            Saúde & Vacinas
          </Link>
          <Link
            to="/historico-medico"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-xs font-medium text-primary-foreground shadow-sm"
          >
            <History className="h-3.5 w-3.5" />
            Histórico Médico
          </Link>
        </div>
      </div>

      <main className="container py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/pets"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-smooth hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Meus pets
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Histórico Veterinário Semanal
            </h1>
            <p className="mt-1 text-muted-foreground">
              Visualize consultas, vacinas e procedimentos dos seus pets em uma
              linha do tempo semanal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link to="/saude">
                <Syringe className="mr-1.5 h-3.5 w-3.5" />
                Carteira de Vacinas
              </Link>
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              className="rounded-full gradient-primary text-primary-foreground shadow-soft"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Novo Atendimento
            </Button>
          </div>
        </div>

        {/* Pet selector */}
        <Card className="mb-6 p-5">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Selecione os pets que deseja
              visualizar
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() =>
                setSelectedPets(
                  selectedPets.length === pets.length
                    ? [pets[0]?.id]
                    : pets.map((p) => p.id),
                )
              }
            >
              {selectedPets.length === pets.length
                ? "Deselecionar todos"
                : "Selecionar todos"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {pets.map((pet) => {
              const active = selectedPets.includes(pet.id);
              return (
                <button
                  key={pet.id}
                  onClick={() => togglePet(pet.id)}
                  className={`group relative flex items-center gap-3 rounded-2xl border-2 px-3 py-2 pr-4 transition-all ${
                    active
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div
                    className={`h-10 w-10 overflow-hidden rounded-full ring-2 ${active ? "ring-primary" : "ring-transparent"}`}
                  >
                    <img
                      src={pet.img}
                      alt={pet.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold leading-tight">
                      {pet.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pet.breed}
                    </div>
                  </div>
                  {active && (
                    <CheckCircle2 className="ml-1 h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Week navigator */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => shiftWeek(-1)}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatRange()}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => shiftWeek(1)}
              aria-label="Próxima semana"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(getWeekStart(new Date()))}
            >
              Hoje
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {Object.keys(typeMeta).map((t) => {
              const Icon = typeMeta[t].icon;
              return (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${typeMeta[t].bg} ${typeMeta[t].color}`}
                >
                  <Icon className="h-3 w-3" /> {typeMeta[t].label}
                </span>
              );
            })}
          </div>
        </div>

        {visiblePets.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Selecione ao menos um pet acima para visualizar o histórico médico
            da semana.
          </Card>
        ) : (
          <div className="space-y-6">
            {visiblePets.map((pet) => (
              <Card key={pet.id} className="overflow-hidden">
                {/* Pet row header */}
                <div
                  className={`flex items-center justify-between gap-4 bg-gradient-to-r ${pet.color} p-4 text-white`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/60">
                      <img
                        src={pet.img}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-lg font-bold leading-tight">
                        {pet.name}
                      </div>
                      <div className="text-xs opacity-90">
                        {pet.species} • {pet.breed} • {pet.age}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 text-white hover:bg-white/30"
                    >
                      <Link to={`/cartao?id=${pet.id}`}>Ver Cartão</Link>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadCarteirinha(pet)}
                      className="gap-2 bg-white/95 text-foreground hover:bg-white"
                    >
                      <Download className="h-4 w-4" /> Carteirinha PDF
                    </Button>
                  </div>
                </div>

                {/* Weekly timeline */}
                <div className="grid grid-cols-7 divide-x divide-border">
                  {weekDays.map((day) => {
                    const key = day.toISOString().slice(0, 10);
                    const dayEvents = eventsByPetDay[pet.id]?.[key] ?? [];
                    const isToday = key === todayKey;
                    return (
                      <div
                        key={key}
                        className={`min-h-[180px] p-3 ${isToday ? "bg-primary/5" : ""}`}
                      >
                        <div className="mb-2 flex items-baseline justify-between">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {weekdayLabels[day.getDay()]}
                          </span>
                          <span
                            className={`text-sm font-bold ${isToday ? "text-primary" : "text-foreground"}`}
                          >
                            {day.getDate().toString().padStart(2, "0")}
                          </span>
                        </div>

                        {dayEvents.length === 0 ? (
                          <div className="flex h-[130px] items-center justify-center">
                            <span className="text-[11px] text-muted-foreground/40">
                              —
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dayEvents.map((e) => {
                              const meta = typeMeta[e.type] || typeMeta.consulta;
                              const Icon = meta.icon;
                              return (
                                <div
                                  key={e.id}
                                  className="group rounded-lg border border-border bg-card p-2 text-xs shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                                >
                                  <div className="flex items-center gap-1.5 font-medium">
                                    <span
                                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${meta.bg}`}
                                    >
                                      <Icon
                                        className={`h-2.5 w-2.5 ${meta.color}`}
                                      />
                                    </span>
                                    <span className="truncate">{e.title}</span>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{e.time}</span>
                                    <Badge
                                      variant="outline"
                                      className="px-1 py-0 text-[9px]"
                                    >
                                      {e.status}
                                    </Badge>
                                  </div>
                                  {e.notes && (
                                    <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                                      {e.notes}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* DIALOG DE NOVO REGISTRO CLÍNICO VINCULADO AO BANCO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Novo Registro no Prontuário
            </DialogTitle>
            <DialogDescription>
              Adicione uma consulta, exame ou procedimento veterinário ao
              banco de dados do animal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRecord} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="rec-pet">Pet *</Label>
              <Select
                value={targetPetId}
                onValueChange={(val) => setTargetPetId(val)}
              >
                <SelectTrigger id="rec-pet">
                  <SelectValue placeholder="Selecione o pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.species} · {p.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rec-tipo">Tipo de Atendimento *</Label>
                <Select
                  value={recordType}
                  onValueChange={(val) => setRecordType(val)}
                >
                  <SelectTrigger id="rec-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consulta de Rotina">
                      Consulta de Rotina
                    </SelectItem>
                    <SelectItem value="Exame de Sangue">
                      Exame de Sangue
                    </SelectItem>
                    <SelectItem value="Medicação Prescrita">
                      Medicação Prescrita
                    </SelectItem>
                    <SelectItem value="Procedimento Cirúrgico">
                      Procedimento Cirúrgico
                    </SelectItem>
                    <SelectItem value="Limpeza de Tártaro">
                      Limpeza de Tártaro
                    </SelectItem>
                    <SelectItem value="Alergia Identificada">
                      Alergia Identificada
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rec-peso">Peso Aferido (kg)</Label>
                <Input
                  id="rec-peso"
                  placeholder="Ex: 12.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-desc">Descrição / Laudo Clínico *</Label>
              <Textarea
                id="rec-desc"
                rows={3}
                placeholder="Detalhes da consulta, prescrições, cuidados ou orientações..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gradient-primary text-primary-foreground"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Salvar no Histórico
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalHistory;

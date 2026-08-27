import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import petThor from "@/assets/pet-thor.jpg";
import petMia from "@/assets/pet-mia.jpg";
import petBento from "@/assets/pet-bento.jpg";
import petLuna from "@/assets/pet-luna.jpg";

type EventType = "vacina" | "consulta" | "medicacao" | "exame" | "procedimento";

type MedicalEvent = {
  id: string;
  petId: string;
  date: string; // ISO yyyy-mm-dd
  time: string;
  type: EventType;
  title: string;
  vet: string;
  notes: string;
};

type PetMini = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  img: string;
  color: string;
  tutor: string;
  microchip: string;
};

const PETS: PetMini[] = [
  { id: "thor", name: "Thor", species: "Cachorro", breed: "Golden Retriever", age: "3 meses", img: petThor, color: "from-amber-400 to-orange-500", tutor: "João Silva", microchip: "982 000 123 456 789" },
  { id: "mia", name: "Mia", species: "Gato", breed: "SRD", age: "1 ano", img: petMia, color: "from-rose-400 to-pink-500", tutor: "João Silva", microchip: "982 000 234 567 890" },
  { id: "bento", name: "Bento", species: "Cachorro", breed: "Labrador", age: "2 anos", img: petBento, color: "from-emerald-400 to-teal-500", tutor: "João Silva", microchip: "982 000 345 678 901" },
  { id: "luna", name: "Luna", species: "Gato", breed: "Persa", age: "4 meses", img: petLuna, color: "from-violet-400 to-indigo-500", tutor: "João Silva", microchip: "982 000 456 789 012" },
];

// Build a week's worth of events relative to today
const offsetDate = (dayOffset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
};

const EVENTS: MedicalEvent[] = [
  { id: "e1", petId: "thor", date: offsetDate(-3), time: "09:30", type: "vacina", title: "V10 — 2ª dose", vet: "Dra. Helena Costa", notes: "Aplicada sem reações. Reforço em 30 dias." },
  { id: "e2", petId: "thor", date: offsetDate(-1), time: "14:00", type: "consulta", title: "Avaliação clínica geral", vet: "Dra. Helena Costa", notes: "Peso 8.4kg, mucosas normocoradas, hidratado." },
  { id: "e3", petId: "thor", date: offsetDate(2), time: "10:00", type: "medicacao", title: "Vermífugo Drontal Plus", vet: "Dra. Helena Costa", notes: "1 comprimido VO, dose única." },
  { id: "e4", petId: "mia", date: offsetDate(-2), time: "11:15", type: "exame", title: "Hemograma + FIV/FELV", vet: "Dr. Marcos Lima", notes: "Resultados dentro da normalidade. Negativo para FIV/FELV." },
  { id: "e5", petId: "mia", date: offsetDate(0), time: "16:30", type: "procedimento", title: "Limpeza de tártaro", vet: "Dr. Marcos Lima", notes: "Procedimento de rotina, sob sedação leve. Recuperação ok." },
  { id: "e6", petId: "mia", date: offsetDate(3), time: "09:00", type: "consulta", title: "Retorno pós-procedimento", vet: "Dr. Marcos Lima", notes: "Verificar cicatrização gengival." },
  { id: "e7", petId: "bento", date: offsetDate(-4), time: "08:00", type: "exame", title: "Radiografia de quadril", vet: "Dra. Ana Reis", notes: "Sem alterações displásicas. Articulação preservada." },
  { id: "e8", petId: "bento", date: offsetDate(1), time: "15:45", type: "vacina", title: "Giardia", vet: "Dra. Ana Reis", notes: "Reforço anual aplicado." },
  { id: "e9", petId: "bento", date: offsetDate(3), time: "10:30", type: "medicacao", title: "Antipulgas Bravecto", vet: "Dra. Ana Reis", notes: "Dose conforme peso (32kg). Próxima em 12 semanas." },
  { id: "e10", petId: "luna", date: offsetDate(-1), time: "13:20", type: "vacina", title: "Tríplice felina (2ª dose)", vet: "Dr. Paulo Nunes", notes: "Aplicada subcutânea. Filhote tolerou bem." },
  { id: "e11", petId: "luna", date: offsetDate(2), time: "11:00", type: "consulta", title: "Acompanhamento de crescimento", vet: "Dr. Paulo Nunes", notes: "Peso 1.6kg, desenvolvimento adequado." },
];

const typeMeta: Record<EventType, { label: string; icon: typeof Syringe; color: string; bg: string }> = {
  vacina: { label: "Vacina", icon: Syringe, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  consulta: { label: "Consulta", icon: Stethoscope, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-950/40" },
  medicacao: { label: "Medicação", icon: Pill, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-950/40" },
  exame: { label: "Exame", icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-950/40" },
  procedimento: { label: "Procedimento", icon: Scissors, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/40" },
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const getWeekStart = (d: Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
};

const MedicalHistory = () => {
  const [selectedPets, setSelectedPets] = useState<string[]>(["thor", "mia"]);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  const togglePet = (id: string) =>
    setSelectedPets((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

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

  const visiblePets = PETS.filter((p) => selectedPets.includes(p.id));

  const eventsByPetDay = useMemo(() => {
    const map: Record<string, Record<string, MedicalEvent[]>> = {};
    visiblePets.forEach((p) => {
      map[p.id] = {};
      weekDays.forEach((d) => {
        const key = d.toISOString().slice(0, 10);
        map[p.id][key] = EVENTS.filter((e) => e.petId === p.id && e.date === key).sort((a, b) => a.time.localeCompare(b.time));
      });
    });
    return map;
  }, [visiblePets, weekDays]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  };

  const formatRange = () => {
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return `${fmt(weekStart)} — ${fmt(weekEnd)}`;
  };

  const downloadCarteirinha = (pet: PetMini) => {
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
    doc.text("PetLove • Histórico veterinário completo", margin, 26);
    doc.setFontSize(9);
    doc.text(`Emitida em ${new Date().toLocaleDateString("pt-BR")}`, margin, 33);

    // Pet info card
    let y = 50;
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(pet.name, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    y += 7;
    doc.text(`Espécie: ${pet.species}    Raça: ${pet.breed}    Idade: ${pet.age}`, margin, y);
    y += 6;
    doc.text(`Tutor: ${pet.tutor}`, margin, y);
    y += 6;
    doc.text(`Microchip: ${pet.microchip}`, margin, y);

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

    const petEvents = EVENTS.filter((e) => e.petId === pet.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    doc.setFontSize(10);
    petEvents.forEach((e) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const meta = typeMeta[e.type];
      const dateStr = new Date(e.date + "T00:00:00").toLocaleDateString("pt-BR");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`${dateStr} • ${e.time}  —  ${meta.label}`, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.text(e.title, margin, y);
      y += 5;
      doc.setTextColor(110, 110, 110);
      const notes = doc.splitTextToSize(`${e.vet} — ${e.notes}`, w - margin * 2);
      doc.text(notes, margin, y);
      y += notes.length * 4.5 + 4;
      doc.setTextColor(40, 40, 40);
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Documento gerado eletronicamente — PetLove", margin, 290);

    doc.save(`carteirinha-${pet.name.toLowerCase()}.pdf`);
    toast.success(`Carteirinha de ${pet.name} baixada com sucesso!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link to="/pets" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-smooth hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Meus pets
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Histórico Veterinário Semanal</h1>
            <p className="mt-1 text-muted-foreground">Visualize consultas, vacinas e procedimentos dos seus pets em uma linha do tempo semanal.</p>
          </div>
        </div>

        {/* Pet selector */}
        <Card className="mb-6 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardList className="h-4 w-4" /> Selecione os pets que deseja visualizar
          </div>
          <div className="flex flex-wrap gap-3">
            {PETS.map((pet) => {
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
                  <div className={`h-10 w-10 overflow-hidden rounded-full ring-2 ${active ? "ring-primary" : "ring-transparent"}`}>
                    <img src={pet.img} alt={pet.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold leading-tight">{pet.name}</div>
                    <div className="text-xs text-muted-foreground">{pet.breed}</div>
                  </div>
                  {active && <CheckCircle2 className="ml-1 h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Week navigator */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftWeek(-1)} aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatRange()}
            </div>
            <Button variant="outline" size="icon" onClick={() => shiftWeek(1)} aria-label="Próxima semana">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(getWeekStart(new Date()))}>
              Hoje
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {(Object.keys(typeMeta) as EventType[]).map((t) => {
              const Icon = typeMeta[t].icon;
              return (
                <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${typeMeta[t].bg} ${typeMeta[t].color}`}>
                  <Icon className="h-3 w-3" /> {typeMeta[t].label}
                </span>
              );
            })}
          </div>
        </div>

        {visiblePets.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Selecione ao menos um pet para visualizar o histórico médico da semana.
          </Card>
        ) : (
          <div className="space-y-6">
            {visiblePets.map((pet) => (
              <Card key={pet.id} className="overflow-hidden">
                {/* Pet row header */}
                <div className={`flex items-center justify-between gap-4 bg-gradient-to-r ${pet.color} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/60">
                      <img src={pet.img} alt={pet.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <div className="text-lg font-bold leading-tight">{pet.name}</div>
                      <div className="text-xs opacity-90">{pet.species} • {pet.breed} • {pet.age}</div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadCarteirinha(pet)}
                    className="gap-2 bg-white/95 text-foreground hover:bg-white"
                  >
                    <Download className="h-4 w-4" /> Carteirinha PDF
                  </Button>
                </div>

                {/* Weekly timeline */}
                <div className="grid grid-cols-7 divide-x divide-border">
                  {weekDays.map((day) => {
                    const key = day.toISOString().slice(0, 10);
                    const dayEvents = eventsByPetDay[pet.id]?.[key] ?? [];
                    const isToday = key === todayKey;
                    return (
                      <div key={key} className={`min-h-[180px] p-3 ${isToday ? "bg-primary/5" : ""}`}>
                        <div className="mb-2 flex items-baseline justify-between">
                          <span className={`text-[11px] font-semibold uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                            {weekdayLabels[day.getDay()]}
                          </span>
                          <span className={`text-sm font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                            {day.getDate().toString().padStart(2, "0")}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {dayEvents.length === 0 ? (
                            <div className="rounded-md border border-dashed border-border/60 px-2 py-3 text-center text-[10px] text-muted-foreground/60">
                              —
                            </div>
                          ) : (
                            dayEvents.map((e) => {
                              const meta = typeMeta[e.type];
                              const Icon = meta.icon;
                              return (
                                <div key={e.id} className={`group rounded-lg border border-border/60 p-2 transition-all hover:shadow-soft ${meta.bg}`}>
                                  <div className={`flex items-center gap-1 text-[10px] font-semibold ${meta.color}`}>
                                    <Icon className="h-3 w-3" />
                                    {e.time}
                                  </div>
                                  <div className="mt-1 text-xs font-semibold leading-tight text-foreground">{e.title}</div>
                                  <div className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{e.vet}</div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick summary */}
        {visiblePets.length > 0 && (
          <Card className="mt-6 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <ClipboardList className="h-3 w-3" />
                {visiblePets.reduce((acc, p) => acc + Object.values(eventsByPetDay[p.id] || {}).flat().length, 0)} eventos na semana
              </Badge>
              <span className="text-sm text-muted-foreground">
                Baixe a carteirinha em PDF para levar ao veterinário ou compartilhar com cuidadores.
              </span>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MedicalHistory;

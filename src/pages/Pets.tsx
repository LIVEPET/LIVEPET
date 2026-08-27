import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Stethoscope,
  Star,
  Award,
  Sparkles,
  Filter,
  Cat,
  Dog,
  PawPrint,
  X,
  Syringe,
  Calendar as CalendarIcon,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  FileText,
  Bell,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Logo from "@/components/Logo";
// Fotos autênticas de pets — Unsplash
const petThor = "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80";
const petMia = "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80";
const petBento = "https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=800&q=80";
const petLuna = "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&w=800&q=80";
const petAmora = "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=80";
const petSimba = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80";
const petZeca = "https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=800&q=80";
const petNina = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80";

type VaccineRecord = {
  name: string;
  // ISO date — when the next dose is due (or last when status === 'aplicada' and no next)
  dueDate: string;
  // Last application date (optional)
  lastDate?: string;
  // Lot/batch number for the virtual card
  lot?: string;
  vet?: string;
};

type Pet = {
  id: string;
  name: string;
  age: string;
  ageGroup: "Filhote" | "Adulto" | "Idoso";
  species: "Cachorro" | "Gato";
  size: "Pequeno" | "Médio" | "Grande";
  city: string;
  img: string;
  description: string;
  pedigree: boolean;
  vetCertified: boolean;
  rating: number;
  reviews: number;
  medicalNote: string;
  personality: string[];
  vaccines: VaccineRecord[];
};

// Helper to build dates relative to today for realistic demo data
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const PETS: Pet[] = [
  {
    id: "thor",
    name: "Thor",
    age: "3 meses",
    ageGroup: "Filhote",
    species: "Cachorro",
    size: "Médio",
    city: "São Paulo, SP",
    img: petThor,
    description: "Curioso e cheio de energia, adora brincar de buscar e está aprendendo comandos básicos.",
    pedigree: true,
    vetCertified: true,
    rating: 4.9,
    reviews: 28,
    medicalNote: "Vacinação em dia, vermifugado. Saúde excelente segundo Dra. Helena Costa (CRMV-SP 12.345).",
    personality: ["Brincalhão", "Curioso", "Energético"],
    vaccines: [
      { name: "V10 (2ª dose)", dueDate: daysFromNow(-5), lastDate: daysFromNow(-35), lot: "BR-2025-A12", vet: "Dra. Helena Costa" },
      { name: "Antirrábica", dueDate: daysFromNow(12), lot: "BR-2025-R03", vet: "Dra. Helena Costa" },
    ],
  },
  {
    id: "mia",
    name: "Mia",
    age: "1 ano",
    ageGroup: "Adulto",
    species: "Gato",
    size: "Pequeno",
    city: "Rio de Janeiro, RJ",
    img: petMia,
    description: "Dócil e companheira, ama colo e ronrona o dia todo. Já é castrada e usa caixa de areia.",
    pedigree: false,
    vetCertified: true,
    rating: 4.7,
    reviews: 19,
    medicalNote: "Castrada, FIV/FELV negativos. Acompanhamento por Dr. Marcos Lima (CRMV-RJ 8.921).",
    personality: ["Dócil", "Carinhosa"],
    vaccines: [
      { name: "Tríplice felina (reforço)", dueDate: daysFromNow(40), lastDate: daysFromNow(-325), lot: "FEL-2024-T17", vet: "Dr. Marcos Lima" },
      { name: "Antirrábica", dueDate: daysFromNow(-25), lastDate: daysFromNow(-390), lot: "FEL-2024-R08", vet: "Dr. Marcos Lima" },
    ],
  },
  {
    id: "bento",
    name: "Bento",
    age: "2 anos",
    ageGroup: "Adulto",
    species: "Cachorro",
    size: "Grande",
    city: "Belo Horizonte, MG",
    img: petBento,
    description: "Brincalhão e sociável, se dá bem com crianças e outros cães. Adora correr no parque.",
    pedigree: true,
    vetCertified: true,
    rating: 5.0,
    reviews: 41,
    medicalNote: "Quadril e coração avaliados, sem alterações. Laudo emitido por Dra. Ana Reis (CRMV-MG 5.110).",
    personality: ["Sociável", "Família", "Ativo"],
    vaccines: [
      { name: "V10 (reforço anual)", dueDate: daysFromNow(60), lastDate: daysFromNow(-305), lot: "BR-2024-A88", vet: "Dra. Ana Reis" },
      { name: "Antirrábica", dueDate: daysFromNow(58), lastDate: daysFromNow(-307), lot: "BR-2024-R12", vet: "Dra. Ana Reis" },
      { name: "Giardia", dueDate: daysFromNow(8), lot: "BR-2025-G02", vet: "Dra. Ana Reis" },
    ],
  },
  {
    id: "luna",
    name: "Luna",
    age: "4 meses",
    ageGroup: "Filhote",
    species: "Gato",
    size: "Pequeno",
    city: "Curitiba, PR",
    img: petLuna,
    description: "Carinhosa e tranquila, adora dormir em colos macios e perseguir bolinhas de papel.",
    pedigree: false,
    vetCertified: false,
    rating: 4.5,
    reviews: 12,
    medicalNote: "Primeira dose de vacina aplicada. Avaliação clínica geral sem alterações.",
    personality: ["Tranquila", "Tímida"],
    vaccines: [
      { name: "Tríplice felina (2ª dose)", dueDate: daysFromNow(-2), lastDate: daysFromNow(-32), lot: "FEL-2025-T04", vet: "Dr. Paulo Nunes" },
      { name: "Antirrábica", dueDate: daysFromNow(45), lot: "FEL-2025-R01", vet: "Dr. Paulo Nunes" },
    ],
  },
  {
    id: "amora",
    name: "Amora",
    age: "5 anos",
    ageGroup: "Adulto",
    species: "Cachorro",
    size: "Pequeno",
    city: "Porto Alegre, RS",
    img: petAmora,
    description: "Calma e companheira, ideal para apartamento. Já é treinada para passeios na coleira.",
    pedigree: true,
    vetCertified: true,
    rating: 4.8,
    reviews: 33,
    medicalNote: "Check-up completo recente. Tratamento periodontal realizado por Dr. Felipe Souza.",
    personality: ["Calma", "Apartamento"],
    vaccines: [
      { name: "V10 (reforço)", dueDate: daysFromNow(20), lastDate: daysFromNow(-345), lot: "BR-2024-A55", vet: "Dr. Felipe Souza" },
      { name: "Antirrábica", dueDate: daysFromNow(22), lastDate: daysFromNow(-343), lot: "BR-2024-R67", vet: "Dr. Felipe Souza" },
    ],
  },
  {
    id: "simba",
    name: "Simba",
    age: "8 anos",
    ageGroup: "Idoso",
    species: "Gato",
    size: "Médio",
    city: "Salvador, BA",
    img: petSimba,
    description: "Sereno e observador, perfeito para quem busca um companheiro tranquilo para o sofá.",
    pedigree: false,
    vetCertified: true,
    rating: 4.6,
    reviews: 22,
    medicalNote: "Função renal monitorada, dieta especial recomendada. Acompanhada pela Dra. Júlia Mota.",
    personality: ["Sereno", "Observador"],
    vaccines: [
      { name: "Tríplice felina", dueDate: daysFromNow(-60), lastDate: daysFromNow(-425), lot: "FEL-2023-T22", vet: "Dra. Júlia Mota" },
      { name: "Antirrábica", dueDate: daysFromNow(15), lastDate: daysFromNow(-350), lot: "FEL-2024-R44", vet: "Dra. Júlia Mota" },
    ],
  },
  {
    id: "zeca",
    name: "Zeca",
    age: "6 meses",
    ageGroup: "Filhote",
    species: "Cachorro",
    size: "Grande",
    city: "Florianópolis, SC",
    img: petZeca,
    description: "Aventureiro e cheio de personalidade, adora água e está em fase de socialização.",
    pedigree: true,
    vetCertified: true,
    rating: 4.9,
    reviews: 17,
    medicalNote: "Displasia descartada por raio-X. Vacinação V10 e antirrábica em dia.",
    personality: ["Aventureiro", "Inteligente"],
    vaccines: [
      { name: "V10 (3ª dose)", dueDate: daysFromNow(5), lastDate: daysFromNow(-25), lot: "BR-2025-A30", vet: "Dr. Lucas Vieira" },
      { name: "Antirrábica", dueDate: daysFromNow(35), lot: "BR-2025-R19", vet: "Dr. Lucas Vieira" },
    ],
  },
  {
    id: "nina",
    name: "Nina",
    age: "3 anos",
    ageGroup: "Adulto",
    species: "Gato",
    size: "Pequeno",
    city: "Recife, PE",
    img: petNina,
    description: "Independente e elegante, gosta de sua rotina. Castrada e perfeita para tutores calmos.",
    pedigree: false,
    vetCertified: false,
    rating: 4.4,
    reviews: 9,
    medicalNote: "Castração e vacinas em dia. Sem histórico de doenças.",
    personality: ["Independente", "Elegante"],
    vaccines: [
      { name: "Tríplice felina (reforço)", dueDate: daysFromNow(90), lastDate: daysFromNow(-275), lot: "FEL-2024-T55", vet: "Dra. Carla Dias" },
      { name: "Antirrábica", dueDate: daysFromNow(85), lastDate: daysFromNow(-280), lot: "FEL-2024-R71", vet: "Dra. Carla Dias" },
    ],
  },
];

// ============================================================
// Vaccine status / priority helpers
// ============================================================

type VaxStatus = "overdue" | "due-soon" | "upcoming" | "ok";
type VaxPriority = "Crítica" | "Alta" | "Média" | "Baixa";

const getDaysUntil = (iso: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};

const getVaxStatus = (v: VaccineRecord): { status: VaxStatus; priority: VaxPriority; days: number } => {
  const days = getDaysUntil(v.dueDate);
  if (days < -30) return { status: "overdue", priority: "Crítica", days };
  if (days < 0) return { status: "overdue", priority: "Alta", days };
  if (days <= 14) return { status: "due-soon", priority: "Alta", days };
  if (days <= 45) return { status: "upcoming", priority: "Média", days };
  return { status: "ok", priority: "Baixa", days };
};

const formatDateBR = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_STYLES: Record<VaxStatus, { label: string; chip: string; icon: React.ComponentType<{ className?: string }>; ring: string }> = {
  overdue: {
    label: "Atrasada",
    chip: "bg-destructive/15 text-destructive border-destructive/30",
    icon: AlertTriangle,
    ring: "ring-destructive/40",
  },
  "due-soon": {
    label: "Próxima",
    chip: "bg-accent-warm/15 text-accent-warm border-accent-warm/30",
    icon: BellRing,
    ring: "ring-accent-warm/40",
  },
  upcoming: {
    label: "A planejar",
    chip: "bg-accent-yellow/20 text-foreground border-accent-yellow/40",
    icon: Clock,
    ring: "ring-accent-yellow/40",
  },
  ok: {
    label: "Em dia",
    chip: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
    ring: "ring-primary/30",
  },
};

const PRIORITY_STYLES: Record<VaxPriority, string> = {
  Crítica: "bg-destructive text-destructive-foreground",
  Alta: "bg-accent-warm text-accent-warm-foreground",
  Média: "bg-accent-yellow text-foreground",
  Baixa: "bg-primary/10 text-primary",
};

type SpeciesFilter = "Todos" | Pet["species"];
type AgeFilter = "Todos" | Pet["ageGroup"];
type SizeFilter = "Todos" | Pet["size"];

// Default interval (in days) until the next dose, based on vaccine name
const getNextIntervalDays = (vaccineName: string): number => {
  const n = vaccineName.toLowerCase();
  // Booster series for puppies/kittens (V8/V10/V4 doses) → ~21 days
  if (/(\d+ª|1ª|2ª|3ª|4ª)\s*dose/.test(n) || /reforço/.test(n)) return 21;
  // Annual vaccines
  if (n.includes("antirrábica") || n.includes("antirrabica")) return 365;
  if (n.includes("v10") || n.includes("v8") || n.includes("v4") || n.includes("v5")) return 365;
  if (n.includes("giárdia") || n.includes("giardia") || n.includes("gripe") || n.includes("tosse")) return 365;
  if (n.includes("leishmaniose")) return 365;
  // Default: 1 year
  return 365;
};

const Pets = () => {
  const [pets, setPets] = useState<Pet[]>(PETS);
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState<SpeciesFilter>("Todos");
  const [ageGroup, setAgeGroup] = useState<AgeFilter>("Todos");
  const [size, setSize] = useState<SizeFilter>("Todos");
  const [pedigreeOnly, setPedigreeOnly] = useState(false);
  const [vetOnly, setVetOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bursts, setBursts] = useState<Record<string, number>>({});
  const [vaxDialog, setVaxDialog] = useState<{ petId: string; mode: "next" | "card" } | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Always derive the dialog pet from current state so updates reflect live
  const dialogPet = useMemo(
    () => (vaxDialog ? pets.find((p) => p.id === vaxDialog.petId) ?? null : null),
    [vaxDialog, pets],
  );

  const handleApplyVaccine = (petId: string, vaccineName: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setPets((prev) =>
      prev.map((p) => {
        if (p.id !== petId) return p;
        return {
          ...p,
          vaccines: p.vaccines.map((v) => {
            if (v.name !== vaccineName) return v;
            const interval = getNextIntervalDays(v.name);
            const next = new Date();
            next.setDate(next.getDate() + interval);
            return {
              ...v,
              lastDate: today,
              dueDate: next.toISOString().slice(0, 10),
            };
          }),
        };
      }),
    );
    toast.success(`${vaccineName} marcada como aplicada`, {
      description: `Próxima dose agendada automaticamente em ${getNextIntervalDays(vaccineName)} dias.`,
    });
  };

  const filtered = useMemo(() => {
    return pets.filter((p) => {
      if (species !== "Todos" && p.species !== species) return false;
      if (ageGroup !== "Todos" && p.ageGroup !== ageGroup) return false;
      if (size !== "Todos" && p.size !== size) return false;
      if (pedigreeOnly && !p.pedigree) return false;
      if (vetOnly && !p.vetCertified) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.city.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !p.personality.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [pets, query, species, ageGroup, size, pedigreeOnly, vetOnly]);

  // Compute global alerts across all pets
  const allAlerts = useMemo(() => {
    const items: { pet: Pet; vaccine: VaccineRecord; status: VaxStatus; priority: VaxPriority; days: number }[] = [];
    pets.forEach((p) => {
      p.vaccines.forEach((v) => {
        const s = getVaxStatus(v);
        if (s.status === "overdue" || s.status === "due-soon") {
          items.push({ pet: p, vaccine: v, ...s });
        }
      });
    });
    const order: VaxPriority[] = ["Crítica", "Alta", "Média", "Baixa"];
    items.sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority) || a.days - b.days);
    return items;
  }, [pets]);

  const overdueCount = allAlerts.filter((a) => a.status === "overdue").length;
  const dueSoonCount = allAlerts.filter((a) => a.status === "due-soon").length;

  const totalCount = pets.length;
  const activeFilters = [
    species !== "Todos" && species,
    ageGroup !== "Todos" && ageGroup,
    size !== "Todos" && size,
    pedigreeOnly && "Pedigree",
    vetOnly && "Vet",
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    setSpecies("Todos");
    setAgeGroup("Todos");
    setSize("Todos");
    setPedigreeOnly(false);
    setVetOnly(false);
    setQuery("");
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setBursts((b) => ({ ...b, [id]: (b[id] ?? 0) + 1 }));
      }
      return next;
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-secondary via-background to-primary-soft">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />
      <div className="blob h-[480px] w-[480px] -left-32 -top-24 bg-primary/25 animate-blob" />
      <div className="blob h-[420px] w-[420px] -right-24 top-1/3 bg-accent-warm/20 animate-blob" />
      <div className="blob h-[360px] w-[360px] left-1/2 bottom-0 bg-accent-yellow/20 animate-blob" />

      {/* Floating paws background */}
      <PawPrint className="pointer-events-none absolute left-[8%] top-[18%] h-8 w-8 text-primary/15 animate-float-y" />
      <PawPrint className="pointer-events-none absolute right-[12%] top-[28%] h-10 w-10 text-accent-warm/20 animate-float-y" style={{ animationDelay: "1.2s" }} />
      <PawPrint className="pointer-events-none absolute left-[14%] bottom-[22%] h-6 w-6 text-primary/15 animate-float-y" style={{ animationDelay: "2.4s" }} />




      <main className="container relative z-10 py-12">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center animate-pop-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-2 text-xs font-semibold text-primary shadow-soft">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            {totalCount} pets esperando por um lar
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl">
            Encontre seu novo{" "}
            <span className="relative inline-block italic">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary-glow to-accent-warm bg-clip-text text-transparent animate-gradient">
                melhor amigo
              </span>
              <PawPrint className="absolute -right-7 -top-3 h-6 w-6 text-accent-warm animate-wiggle" />
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Explore pets com avaliação veterinária, ficha completa e muito amor para dar.
          </p>
        </div>

        {/* Vaccine alerts banner */}
        {(overdueCount > 0 || dueSoonCount > 0) && (
          <button
            type="button"
            onClick={() => setAlertsOpen(true)}
            className={`group relative mx-auto mt-8 flex w-full max-w-3xl items-center gap-4 overflow-hidden rounded-3xl border-2 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow animate-pop-in sm:p-5 ${
              overdueCount > 0
                ? "border-destructive/30 bg-destructive/5"
                : "border-accent-warm/30 bg-accent-warm/5"
            }`}
          >
            <span
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-soft ${
                overdueCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-accent-warm text-accent-warm-foreground"
              }`}
            >
              <Bell className="h-5 w-5 animate-wiggle" />
              <span
                className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-soft ${
                  overdueCount > 0 ? "bg-card text-destructive" : "bg-card text-accent-warm"
                }`}
              >
                {overdueCount + dueSoonCount}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold text-foreground sm:text-lg">
                {overdueCount > 0 ? "Vacinas em atraso detectadas" : "Vacinas próximas do vencimento"}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {overdueCount > 0 && (
                  <span className="font-semibold text-destructive">{overdueCount} atrasada{overdueCount > 1 ? "s" : ""}</span>
                )}
                {overdueCount > 0 && dueSoonCount > 0 && " · "}
                {dueSoonCount > 0 && (
                  <span className="font-semibold text-accent-warm">{dueSoonCount} próxima{dueSoonCount > 1 ? "s" : ""}</span>
                )}
                {" — toque para ver detalhes e prioridade"}
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-soft transition-transform group-hover:translate-x-1 sm:inline-flex">
              Ver alertas →
            </span>
          </button>
        )}

        {/* Search */}
        <div className="mx-auto mt-8 max-w-2xl animate-pop-in" style={{ animationDelay: "0.1s" }}>
          <div className="group relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent-warm/20 to-accent-yellow/20 opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100" />
            <Search className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque por nome, cidade ou personalidade..."
              className="relative h-14 rounded-full border-border bg-card/90 pl-14 pr-14 text-base shadow-soft backdrop-blur transition-smooth focus-visible:border-primary focus-visible:ring-primary/30"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute right-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          className="relative mx-auto mt-10 max-w-5xl animate-pop-in"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Decorative glow */}
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-primary/30 via-accent-warm/20 to-accent-yellow/30 opacity-60 blur-2xl" />

          <div className="relative rounded-[1.75rem] border border-border/60 bg-card/90 p-6 shadow-card backdrop-blur-xl sm:p-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                  <Filter className="h-5 w-5" />
                  <span className="absolute inset-0 rounded-2xl animate-pulse-ring border-2 border-primary/40" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-foreground">Refine sua busca</p>
                  <p className="text-xs text-muted-foreground">
                    Escolha as características do seu novo amigo
                  </p>
                </div>
              </div>

              {(activeFilters.length > 0 || query) && (
                <button
                  onClick={clearFilters}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  Limpar tudo
                </button>
              )}
            </div>

            {/* Active chips bar */}
            {activeFilters.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary-soft/50 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Ativos:</span>
                {activeFilters.map((f, i) => (
                  <span
                    key={f}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="animate-chip-pop inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-soft"
                  >
                    <Sparkles className="h-3 w-3 text-accent-warm" />
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Espécie - Tile grid */}
            <FilterSection
              icon={<PawPrint className="h-4 w-4" />}
              title="Espécie"
              subtitle="Que tipo de companheiro?"
            >
              <div className="grid grid-cols-3 gap-2.5">
                <TileFilter active={species === "Todos"} onClick={() => setSpecies("Todos")} icon={<PawPrint className="h-5 w-5" />} label="Todos" />
                <TileFilter active={species === "Cachorro"} onClick={() => setSpecies("Cachorro")} icon={<Dog className="h-5 w-5" />} label="Cachorro" />
                <TileFilter active={species === "Gato"} onClick={() => setSpecies("Gato")} icon={<Cat className="h-5 w-5" />} label="Gato" />
              </div>
            </FilterSection>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Idade + Porte side by side */}
            <div className="grid gap-6 md:grid-cols-2">
              <FilterSection
                icon={<Sparkles className="h-4 w-4" />}
                title="Idade"
                subtitle="Fase de vida"
              >
                <div className="grid grid-cols-4 gap-2">
                  {(["Todos", "Filhote", "Adulto", "Idoso"] as const).map((a) => (
                    <PillFilter key={a} active={ageGroup === a} onClick={() => setAgeGroup(a)}>
                      {a}
                    </PillFilter>
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                icon={<Award className="h-4 w-4" />}
                title="Porte"
                subtitle="Tamanho ideal"
              >
                <div className="grid grid-cols-4 gap-2">
                  {(["Todos", "Pequeno", "Médio", "Grande"] as const).map((s) => (
                    <PillFilter key={s} active={size === s} onClick={() => setSize(s)}>
                      {s}
                    </PillFilter>
                  ))}
                </div>
              </FilterSection>
            </div>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Certificações - Toggle cards */}
            <FilterSection
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Certificações"
              subtitle="Selo de confiança"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ToggleCard
                  active={pedigreeOnly}
                  onClick={() => setPedigreeOnly((v) => !v)}
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Pedigree"
                  desc="Linhagem certificada"
                />
                <ToggleCard
                  active={vetOnly}
                  onClick={() => setVetOnly((v) => !v)}
                  icon={<Stethoscope className="h-5 w-5" />}
                  title="Avaliação Vet"
                  desc="Aprovado por veterinário"
                />
              </div>
            </FilterSection>

            {/* Live count */}
            <div className="mt-7 flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-secondary/40 px-4 py-3">
              <PawPrint className="h-4 w-4 text-primary animate-wiggle-slow" />
              <p className="text-sm text-muted-foreground">
                <span
                  key={filtered.length}
                  className="animate-count-up inline-block min-w-[1.5rem] text-center font-display text-lg font-bold text-primary"
                >
                  {filtered.length}
                </span>{" "}
                pet{filtered.length === 1 ? "" : "s"} correspondem aos seus filtros
              </p>
            </div>
          </div>
        </div>

        {/* Results header */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{filtered.length}</span>{" "}
            pet{filtered.length === 1 ? "" : "s"} encontrado{filtered.length === 1 ? "" : "s"}
          </p>
          {favorites.size > 0 && (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 fill-accent-warm text-accent-warm" />
              <span className="font-semibold text-foreground">{favorites.size}</span> favorito
              {favorites.size > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Pets grid */}
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, idx) => (
            <PetCard
              key={p.id}
              pet={p}
              index={idx}
              isFavorite={favorites.has(p.id)}
              burstCount={bursts[p.id] ?? 0}
              onToggleFavorite={() => toggleFavorite(p.id)}
              onOpenNext={() => setVaxDialog({ petId: p.id, mode: "next" })}
              onOpenCard={() => setVaxDialog({ petId: p.id, mode: "card" })}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center backdrop-blur animate-pop-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <PawPrint className="h-8 w-8 text-primary animate-wiggle" />
            </div>
            <p className="font-display text-xl font-bold text-foreground">Nenhum pet encontrado</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente ajustar os filtros ou limpar a busca para ver mais opções.
            </p>
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="mt-5 rounded-full"
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </main>

      {/* Per-pet vaccine dialog (shared for "next" + "card" modes) */}
      <VaccineDialog
        pet={dialogPet}
        mode={vaxDialog?.mode ?? "next"}
        onClose={() => setVaxDialog(null)}
        onApplyVaccine={handleApplyVaccine}
      />

      {/* Global alerts dialog */}
      <AlertsDialog
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={allAlerts}
        onOpenPet={(p) => {
          setAlertsOpen(false);
          setVaxDialog({ petId: p.id, mode: "next" });
        }}
      />
    </div>
  );
};

const PetCard = ({
  pet,
  index,
  isFavorite,
  burstCount,
  onToggleFavorite,
  onOpenNext,
  onOpenCard,
}: {
  pet: Pet;
  index: number;
  isFavorite: boolean;
  burstCount: number;
  onToggleFavorite: () => void;
  onOpenNext: () => void;
  onOpenCard: () => void;
}) => {
  const [hearts, setHearts] = useState<{ id: number; tx: number }[]>([]);
  const lastBurst = useRef(0);

  useEffect(() => {
    if (burstCount > lastBurst.current) {
      lastBurst.current = burstCount;
      const id = Date.now();
      const tx = (Math.random() - 0.5) * 40;
      setHearts((h) => [...h, { id, tx }]);
      setTimeout(() => {
        setHearts((h) => h.filter((x) => x.id !== id));
      }, 900);
    }
  }, [burstCount]);

  // Compute the most urgent vaccine status for the badge on the image
  const urgent = useMemo(() => {
    const ranked = pet.vaccines
      .map((v) => ({ v, ...getVaxStatus(v) }))
      .sort((a, b) => {
        const order: VaxStatus[] = ["overdue", "due-soon", "upcoming", "ok"];
        return order.indexOf(a.status) - order.indexOf(b.status) || a.days - b.days;
      });
    return ranked[0];
  }, [pet.vaccines]);

  const UrgentIcon = urgent ? STATUS_STYLES[urgent.status].icon : null;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-glow animate-pop-in"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-soft to-secondary">
        <img
          src={pet.img}
          alt={`${pet.name}, ${pet.species.toLowerCase()} para adoção em ${pet.city}`}
          loading="lazy"
          width={768}
          height={768}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Top gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top badges */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            {pet.pedigree && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
                <ShieldCheck className="h-3 w-3" /> Pedigree
              </span>
            )}
            {pet.vetCertified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary shadow-soft backdrop-blur">
                <Stethoscope className="h-3 w-3" /> Vet
              </span>
            )}
          </div>

          {/* Favorite button with heart bursts */}
          <div className="relative">
            <button
              onClick={onToggleFavorite}
              aria-label={isFavorite ? `Desfavoritar ${pet.name}` : `Favoritar ${pet.name}`}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-all duration-300 hover:scale-110 ${
                isFavorite
                  ? "bg-accent-warm text-accent-warm-foreground shadow-warm"
                  : "bg-card/95 text-accent-warm hover:bg-accent-warm hover:text-accent-warm-foreground"
              }`}
            >
              <Heart
                className={`h-4 w-4 transition-all ${isFavorite ? "fill-current scale-110" : ""}`}
              />
            </button>
            {/* Flying hearts */}
            {hearts.map((h) => (
              <Heart
                key={h.id}
                className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 fill-accent-warm text-accent-warm"
                style={{
                  // @ts-expect-error custom var
                  "--tx": `${h.tx}px`,
                  animation: "heart-fly 0.9s ease-out forwards",
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom species + vaccine status badges */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-3 py-1 text-[11px] font-semibold text-foreground shadow-soft backdrop-blur">
            {pet.species === "Cachorro" ? <Dog className="h-3 w-3" /> : <Cat className="h-3 w-3" />}
            {pet.species} · {pet.size}
          </span>
          {urgent && UrgentIcon && (
            <button
              type="button"
              onClick={onOpenNext}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur shadow-soft transition-transform hover:scale-105 ${STATUS_STYLES[urgent.status].chip} ${
                urgent.status === "overdue" ? "animate-pulse-ring" : ""
              }`}
              aria-label="Ver próximas vacinas"
            >
              <UrgentIcon className="h-3 w-3" />
              {urgent.status === "overdue"
                ? `Atrasada ${Math.abs(urgent.days)}d`
                : urgent.status === "due-soon"
                ? `Vacina em ${urgent.days}d`
                : urgent.status === "upcoming"
                ? `Próxima ${urgent.days}d`
                : "Vacinas em dia"}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-foreground">{pet.name}</h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {pet.age}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {pet.city}
        </p>

        {/* Personality tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pet.personality.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-primary/20 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{pet.description}</p>

        {/* Medical eval */}
        <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/50 p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
              <Award className="h-3.5 w-3.5 text-primary" />
              Avaliação médica
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-xs font-bold text-foreground shadow-soft">
              <Star className="h-3 w-3 fill-accent-yellow text-accent-yellow" />
              {pet.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">({pet.reviews})</span>
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {pet.medicalNote}
          </p>
        </div>

        {/* Vaccine action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenNext}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-accent-warm/30 bg-accent-warm/10 px-2 py-2 text-[11px] font-bold text-accent-warm transition-all hover:-translate-y-0.5 hover:bg-accent-warm hover:text-accent-warm-foreground hover:shadow-warm"
          >
            <BellRing className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" />
            Próximas vacinas
          </button>
          <button
            type="button"
            onClick={onOpenCard}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2 py-2 text-[11px] font-bold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
          >
            <Syringe className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" />
            Cartão virtual
          </button>
        </div>

        <Button
          size="sm"
          className="shine mt-3 w-full rounded-full gradient-primary text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
        >
          <PawPrint className="h-4 w-4" />
          Quero conhecer
        </Button>
      </div>
    </article>
  );
};

// ============================================================
// Vaccine dialogs
// ============================================================

const VaccineDialog = ({
  pet,
  mode,
  onClose,
  onApplyVaccine,
}: {
  pet: Pet | null;
  mode: "next" | "card";
  onClose: () => void;
  onApplyVaccine: (petId: string, vaccineName: string) => void;
}) => {
  const open = !!pet;

  const sorted = useMemo(() => {
    if (!pet) return [];
    return [...pet.vaccines]
      .map((v) => ({ v, ...getVaxStatus(v) }))
      .sort((a, b) => {
        const order: VaxStatus[] = ["overdue", "due-soon", "upcoming", "ok"];
        return order.indexOf(a.status) - order.indexOf(b.status) || a.days - b.days;
      });
  }, [pet]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        {pet && (
          <>
            {/* Header banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-accent-warm p-6 text-primary-foreground">
              <PawPrint className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-white/10" />
              <PawPrint className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 text-white/10" />
              <div className="relative flex items-center gap-4">
                <img
                  src={pet.img}
                  alt={pet.name}
                  className="h-16 w-16 rounded-2xl border-2 border-white/40 object-cover shadow-lg"
                />
                <div className="min-w-0">
                  <DialogHeader className="space-y-0 text-left">
                    <DialogTitle className="font-display text-2xl font-bold text-primary-foreground">
                      {mode === "card" ? "Cartão de Vacina Virtual" : "Próximas Vacinas"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-primary-foreground/80">
                      {pet.name} · {pet.species} · {pet.age}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
              {sorted.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Nenhuma vacina registrada.
                </p>
              )}

              {sorted.map(({ v, status, priority, days }) => {
                const styles = STATUS_STYLES[status];
                const Icon = styles.icon;
                return (
                  <div
                    key={v.name}
                    className={`relative rounded-2xl border-2 bg-background p-4 ring-1 transition-all hover:-translate-y-0.5 hover:shadow-soft ${styles.ring}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.chip}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-base font-bold text-foreground">
                            {v.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            {status === "overdue"
                              ? `Venceu em ${formatDateBR(v.dueDate)} (${Math.abs(days)}d atrás)`
                              : `Vence em ${formatDateBR(v.dueDate)} (em ${days}d)`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-soft ${PRIORITY_STYLES[priority]}`}
                      >
                        {priority}
                      </span>
                    </div>

                    {mode === "card" && (
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-secondary/40 p-3 text-[11px]">
                        {v.lastDate && (
                          <div>
                            <p className="font-semibold text-muted-foreground">Última dose</p>
                            <p className="font-bold text-foreground">{formatDateBR(v.lastDate)}</p>
                          </div>
                        )}
                        {v.lot && (
                          <div>
                            <p className="font-semibold text-muted-foreground">Lote</p>
                            <p className="font-bold text-foreground">{v.lot}</p>
                          </div>
                        )}
                        {v.vet && (
                          <div className="col-span-2">
                            <p className="font-semibold text-muted-foreground">Veterinário</p>
                            <p className="font-bold text-foreground">{v.vet}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {mode === "next" && status !== "ok" && (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/70 bg-secondary/30 px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">
                          {v.lastDate
                            ? `Última: ${formatDateBR(v.lastDate)}`
                            : "Sem registro anterior"}
                        </p>
                        <Button
                          size="sm"
                          className="h-8 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:scale-105 hover:bg-primary/90"
                          onClick={() => onApplyVaccine(pet.id, v.name)}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" strokeWidth={3} />
                          Marcar como aplicada
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-secondary/40 px-6 py-4">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {mode === "card" ? "Documento oficial verificado" : "Alertas calculados em tempo real"}
              </p>
              <Button size="sm" className="rounded-full" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AlertsDialog = ({
  open,
  onClose,
  alerts,
  onOpenPet,
}: {
  open: boolean;
  onClose: () => void;
  alerts: { pet: Pet; vaccine: VaccineRecord; status: VaxStatus; priority: VaxPriority; days: number }[];
  onOpenPet: (p: Pet) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <div className="relative overflow-hidden bg-gradient-to-br from-destructive via-accent-warm to-accent-yellow p-6 text-primary-foreground">
          <Bell className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-white/15 animate-wiggle-slow" />
          <DialogHeader className="space-y-0 text-left">
            <DialogTitle className="font-display text-2xl font-bold text-primary-foreground">
              Central de Alertas de Vacinação
            </DialogTitle>
            <DialogDescription className="text-sm text-primary-foreground/85">
              {alerts.length} alerta{alerts.length === 1 ? "" : "s"} ordenado{alerts.length === 1 ? "" : "s"} por prioridade
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-6">
          {alerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-2 font-display text-lg font-bold text-foreground">Tudo em dia!</p>
              <p className="text-sm text-muted-foreground">Nenhum alerta de vacinação no momento.</p>
            </div>
          )}

          {alerts.map(({ pet, vaccine, status, priority, days }, i) => {
            const styles = STATUS_STYLES[status];
            const Icon = styles.icon;
            return (
              <button
                key={`${pet.id}-${vaccine.name}`}
                type="button"
                onClick={() => onOpenPet(pet)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={`group flex w-full items-start gap-3 rounded-2xl border-2 bg-background p-3 text-left ring-1 transition-all hover:-translate-y-0.5 hover:shadow-soft animate-pop-in ${styles.ring}`}
              >
                <img
                  src={pet.img}
                  alt={pet.name}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-soft"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold text-foreground">
                      {pet.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-soft ${PRIORITY_STYLES[priority]}`}
                    >
                      {priority}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles.chip}`}>
                      <Icon className="h-3 w-3" />
                      {styles.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{vaccine.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {status === "overdue"
                      ? `Atrasada há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`
                      : `Vence em ${days} dia${days === 1 ? "" : "s"}`}
                    {" · "}
                    {formatDateBR(vaccine.dueDate)}
                  </p>
                </div>
                <span className="self-center text-xs font-bold text-muted-foreground transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-secondary/40 px-6 py-4">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Prioridades: Crítica &gt; Alta &gt; Média &gt; Baixa
          </p>
          <Button size="sm" className="rounded-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FilterSection = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const TileFilter = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`filter-tile ${active ? "filter-tile-active" : ""}`}
  >
    <span className="filter-icon-wrap">{icon}</span>
    <span className="text-xs font-semibold">{label}</span>
    {active && (
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-warm text-[10px] font-bold text-white shadow-warm animate-bounce-in">
        ✓
      </span>
    )}
  </button>
);

const PillFilter = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`relative rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-300 ${
      active
        ? "gradient-warm text-primary-foreground shadow-warm -translate-y-0.5"
        : "border border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-accent-warm/40 hover:text-accent-warm"
    }`}
  >
    {children}
  </button>
);

const ToggleCard = ({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
      active
        ? "border-transparent shadow-glow -translate-y-0.5"
        : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
    }`}
    style={active ? { background: "var(--gradient-primary)" } : undefined}
  >
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
        active ? "bg-white/20 text-primary-foreground" : "bg-primary-soft text-primary group-hover:scale-110"
      }`}
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-bold ${active ? "text-primary-foreground" : "text-foreground"}`}>
        {title}
      </p>
      <p className={`text-[11px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {desc}
      </p>
    </div>
    <span
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
        active ? "bg-white/30" : "bg-muted"
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow-soft transition-all duration-300 ${
          active ? "left-[22px]" : "left-0.5"
        }`}
      />
    </span>
  </button>
);

export default Pets;

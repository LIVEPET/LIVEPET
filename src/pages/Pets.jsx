import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
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
  Plus,
  Loader2,
  ClipboardList,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import PetsCategoryHub from "@/components/PetsCategoryHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { petsService } from "@/services/api";
import { compressImage } from "@/lib/image";
import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";

const PETS = [];

// ============================================================
// Vaccine status / priority helpers
// ============================================================

const getDaysUntil = (iso) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};

const getVaxStatus = (v) => {
  const days = getDaysUntil(v.dueDate);
  if (days < -30) return { status: "overdue", priority: "Crítica", days };
  if (days < 0) return { status: "overdue", priority: "Alta", days };
  if (days <= 14) return { status: "due-soon", priority: "Alta", days };
  if (days <= 45) return { status: "upcoming", priority: "Média", days };
  return { status: "ok", priority: "Baixa", days };
};

const formatDateBR = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const STATUS_STYLES = {
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

const PRIORITY_STYLES = {
  Crítica: "bg-destructive text-destructive-foreground",
  Alta: "bg-accent-warm text-accent-warm-foreground",
  Média: "bg-accent-yellow text-foreground",
  Baixa: "bg-primary/10 text-primary",
};

// Default interval (in days) until the next dose, based on vaccine name
const getNextIntervalDays = (vaccineName) => {
  const n = vaccineName.toLowerCase();
  // Booster series for puppies/kittens (V8/V10/V4 doses) → ~21 days
  if (/(\d+ª|1ª|2ª|3ª|4ª)\s*dose/.test(n) || /reforço/.test(n)) return 21;
  // Annual vaccines
  if (n.includes("antirrábica") || n.includes("antirrabica")) return 365;
  if (
    n.includes("v10") ||
    n.includes("v8") ||
    n.includes("v4") ||
    n.includes("v5")
  )
    return 365;
  if (
    n.includes("giárdia") ||
    n.includes("giardia") ||
    n.includes("gripe") ||
    n.includes("tosse")
  )
    return 365;
  if (n.includes("leishmaniose")) return 365;
  // Default: 1 year
  return 365;
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

const getAgeGroup = (birthDateStr) => {
  if (!birthDateStr) return "Adulto";
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    if (years < 1) return "Filhote";
    if (years >= 8) return "Sênior";
    return "Adulto";
  } catch {
    return "Adulto";
  }
};

const Pets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("Todos");
  const [breed, setBreed] = useState("Todas");
  const [size, setSize] = useState("Todos");
  const [pedigreeOnly, setPedigreeOnly] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [bursts, setBursts] = useState({});
  const [vaxDialog, setVaxDialog] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Opções dinâmicas de filtro extraídas exclusivamente dos pets que o usuário realmente possui
  const availableSpecies = useMemo(() => {
    return Array.from(new Set(pets.map((p) => p.species).filter(Boolean))).sort();
  }, [pets]);

  const availableBreeds = useMemo(() => {
    return Array.from(new Set(pets.map((p) => p.breed).filter(Boolean))).sort();
  }, [pets]);

  const availableSizes = useMemo(() => {
    return Array.from(new Set(pets.map((p) => p.size).filter(Boolean))).sort();
  }, [pets]);

  const hasPedigreePets = useMemo(() => {
    return pets.some((p) => p.pedigree);
  }, [pets]);

  useEffect(() => {
    let isMounted = true;
    const fetchPets = async () => {
      try {
        setLoading(true);
        const data = await petsService.list();
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const mapped = data.map((p) => {
            return {
              id: p.id,
              name: p.nome,
              species: p.especie || "Cachorro",
              breed: p.raca || "SRD",
              size: p.porte || "Médio",
              gender: p.sexo || "Não informado",
              age: formatAge(p.data_nascimento),
              ageGroup: getAgeGroup(p.data_nascimento),
              city: "Goiânia, GO",
              description: `${p.especie} registrado e protegido na plataforma LivePet.`,
              personality: ["Dócil", "Amigável", "Sociável"],
              rating: 5.0,
              reviews: 1,
              medicalNote:
                p.medical_records?.[0]?.descricao ||
                "Acompanhamento preventivo em dia.",
              image: getPetPhoto(p.foto_url),
              img: getPetPhoto(p.foto_url),
              pedigree: Boolean(p.lineage || p.raca),
              vetCertified: true,
              vaccines: (p.vaccines || []).map((v) => ({
                name: v.nome,
                lastDate: v.data_aplicacao,
                dueDate: v.proxima_dose || v.data_aplicacao,
              })),
            };
          });
          setPets(mapped);
        }
      } catch (err) {
        console.error("Erro ao carregar pets:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Always derive the dialog pet from current state so updates reflect live
  const dialogPet = useMemo(
    () =>
      vaxDialog ? (pets.find((p) => p.id === vaxDialog.petId) ?? null) : null,
    [vaxDialog, pets],
  );

  const handleApplyVaccine = async (petId, vaccineName) => {
    const today = new Date().toISOString().slice(0, 10);
    const interval = getNextIntervalDays(vaccineName);
    const next = new Date();
    next.setDate(next.getDate() + interval);
    const dueDate = next.toISOString().slice(0, 10);

    // Atualiza estado local imediatamente
    setPets((prev) =>
      prev.map((p) => {
        if (p.id !== petId) return p;
        return {
          ...p,
          vaccines: p.vaccines.map((v) => {
            if (v.name !== vaccineName) return v;
            return {
              ...v,
              lastDate: today,
              dueDate,
            };
          }),
        };
      }),
    );

    // Persiste no banco de dados via endpoint FastAPI
    try {
      await petsService.addVaccine(petId, {
        nome: vaccineName,
        data_aplicacao: today,
        proxima_dose: dueDate,
        veterinario: "Clínica Veterinária Parceira",
      });
      toast.success(`${vaccineName} registrada com sucesso na carteira do pet!`, {
        description: `Próxima dose agendada para ${dueDate}.`,
      });
    } catch (err) {
      toast.error(`Erro ao salvar vacina no servidor`, {
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    }
  };

  const handleUpdatePhoto = async (petId, file) => {
    if (!file) return;
    const toastId = toast.loading("Comprimindo e salvando nova foto...");
    try {
      let compressed = await compressImage(file, 600, 600, 0.75);
      if (!compressed) {
        compressed = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      }
      if (!compressed) {
        toast.dismiss(toastId);
        toast.error("Não foi possível processar a imagem.");
        return;
      }
      await petsService.update(petId, { foto_url: compressed });
      setPets((prev) =>
        prev.map((p) =>
          p.id === petId ? { ...p, image: compressed, img: compressed } : p,
        ),
      );
      toast.dismiss(toastId);
      toast.success("Foto do pet atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar foto:", err);
      toast.dismiss(toastId);
      toast.error("Não foi possível atualizar a foto.");
    }
  };

  const filtered = useMemo(() => {
    return pets.filter((p) => {
      if (species !== "Todos" && p.species !== species) return false;
      if (breed !== "Todas" && p.breed !== breed) return false;
      if (size !== "Todos" && p.size !== size) return false;
      if (pedigreeOnly && !p.pedigree) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchBreed = p.breed?.toLowerCase().includes(q);
        const matchSpecies = p.species?.toLowerCase().includes(q);
        const matchCity = p.city?.toLowerCase().includes(q);
        if (!matchName && !matchBreed && !matchSpecies && !matchCity) return false;
      }
      return true;
    });
  }, [pets, query, species, breed, size, pedigreeOnly]);

  // Compute global alerts across all pets
  const allAlerts = useMemo(() => {
    const items = [];
    pets.forEach((p) => {
      p.vaccines.forEach((v) => {
        const s = getVaxStatus(v);
        if (s.status === "overdue" || s.status === "due-soon") {
          items.push({ pet: p, vaccine: v, ...s });
        }
      });
    });
    const order = ["Crítica", "Alta", "Média", "Baixa"];
    items.sort(
      (a, b) =>
        order.indexOf(a.priority) - order.indexOf(b.priority) ||
        a.days - b.days,
    );
    return items;
  }, [pets]);

  const overdueCount = allAlerts.filter((a) => a.status === "overdue").length;
  const dueSoonCount = allAlerts.filter((a) => a.status === "due-soon").length;

  const totalCount = pets.length;
  const activeFilters = [
    species !== "Todos" && species,
    breed !== "Todas" && breed,
    size !== "Todos" && size,
    pedigreeOnly && "Pedigree",
  ].filter(Boolean);

  const clearFilters = () => {
    setSpecies("Todos");
    setBreed("Todas");
    setSize("Todos");
    setPedigreeOnly(false);
    setQuery("");
  };

  const toggleFavorite = (id) => {
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
      <PawPrint
        className="pointer-events-none absolute right-[12%] top-[28%] h-10 w-10 text-accent-warm/20 animate-float-y"
        style={{ animationDelay: "1.2s" }}
      />
      <PawPrint
        className="pointer-events-none absolute left-[14%] bottom-[22%] h-6 w-6 text-primary/15 animate-float-y"
        style={{ animationDelay: "2.4s" }}
      />

      <main className="container relative z-10 py-12">
        {/* Hub Navigation Padronizado: Pets / Pedigree / Tarefas / Cartão */}
        <PetsCategoryHub petsCount={totalCount} />

        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center animate-pop-in">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-2 text-xs font-semibold text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              {totalCount} {totalCount === 1 ? "pet cadastrado" : "pets cadastrados"}
            </span>
            <Button
              asChild
              size="sm"
              className="rounded-full gradient-primary text-primary-foreground shadow-soft"
            >
              <Link to="/pets/novo">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Cadastrar Pet
              </Link>
            </Button>
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl">
            Meus Animais e{" "}
            <span className="relative inline-block italic">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary-glow to-accent-warm bg-clip-text text-transparent animate-gradient">
                Acompanhamento
              </span>
              <PawPrint className="absolute -right-7 -top-3 h-6 w-6 text-accent-warm animate-wiggle" />
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Acompanhe o cartão digital com QR Code, carteira de saúde, reforços e histórico veterinário de cada animal.
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
                overdueCount > 0
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-accent-warm text-accent-warm-foreground"
              }`}
            >
              <Bell className="h-5 w-5 animate-wiggle" />
              <span
                className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-soft ${
                  overdueCount > 0
                    ? "bg-card text-destructive"
                    : "bg-card text-accent-warm"
                }`}
              >
                {overdueCount + dueSoonCount}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold text-foreground sm:text-lg">
                {overdueCount > 0
                  ? "Vacinas em atraso detectadas"
                  : "Vacinas próximas do vencimento"}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {overdueCount > 0 && (
                  <span className="font-semibold text-destructive">
                    {overdueCount} atrasada{overdueCount > 1 ? "s" : ""}
                  </span>
                )}
                {overdueCount > 0 && dueSoonCount > 0 && " · "}
                {dueSoonCount > 0 && (
                  <span className="font-semibold text-accent-warm">
                    {dueSoonCount} próxima{dueSoonCount > 1 ? "s" : ""}
                  </span>
                )}
                {" — toque para ver detalhes e prioridade"}
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-soft transition-transform group-hover:translate-x-1 sm:inline-flex">
              Ver alertas →
            </span>
          </button>
        )}

        {/* Dynamic Compact Filters - Only rendered if user has pets */}
        {pets.length > 0 && (
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-border/70 bg-card/80 p-3 shadow-soft backdrop-blur animate-pop-in">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome, raça..."
                  className="h-10 rounded-xl pl-9 pr-8 text-sm bg-background/60"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro Dinâmico de Espécie (apenas espécies reais existentes) */}
              {availableSpecies.length > 1 && (
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger className="h-10 w-[140px] rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todas espécies</SelectItem>
                    {availableSpecies.map((sp) => (
                      <SelectItem key={sp} value={sp}>
                        {sp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Filtro Dinâmico de Raça (apenas se houver mais de uma raça) */}
              {availableBreeds.length > 1 && (
                <Select value={breed} onValueChange={setBreed}>
                  <SelectTrigger className="h-10 w-[140px] rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Raça" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas raças</SelectItem>
                    {availableBreeds.map((br) => (
                      <SelectItem key={br} value={br}>
                        {br}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Filtro Dinâmico de Porte (se houver variação de portes) */}
              {availableSizes.length > 1 && (
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="h-10 w-[120px] rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Porte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos portes</SelectItem>
                    {availableSizes.map((sz) => (
                      <SelectItem key={sz} value={sz}>
                        {sz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Toggle Pedigree (apenas se houver animais com pedigree) */}
              {hasPedigreePets && (
                <button
                  type="button"
                  onClick={() => setPedigreeOnly((v) => !v)}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-smooth ${
                    pedigreeOnly
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Pedigree
                </button>
              )}

              {/* Limpar filtros ativos */}
              {(activeFilters.length > 0 || query) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 gap-1 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" /> Limpar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
              {filtered.length}
            </span>{" "}
            pet{filtered.length === 1 ? "" : "s"} encontrado
            {filtered.length === 1 ? "" : "s"}
          </p>
          {favorites.size > 0 && (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 fill-accent-warm text-accent-warm" />
              <span className="font-semibold text-foreground">
                {favorites.size}
              </span>{" "}
              favorito
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
              onUpdatePhoto={handleUpdatePhoto}
            />
          ))}
        </div>

        {loading && (
          <div className="my-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Carregando seus pets cadastrados...
            </p>
          </div>
        )}

        {!loading && pets.length === 0 && (
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center backdrop-blur animate-pop-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <PawPrint className="h-8 w-8 text-primary animate-wiggle" />
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              Nenhum pet cadastrado ainda
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre seu animal para gerar o cartão de identificação, carteira de vacinas e alertas médicos.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-5 rounded-full gradient-primary text-primary-foreground shadow-soft"
            >
              <Link to="/pets/novo">
                <Plus className="mr-1.5 h-4 w-4" /> Cadastrar Meu Primeiro Pet
              </Link>
            </Button>
          </div>
        )}

        {!loading && pets.length > 0 && filtered.length === 0 && (
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center backdrop-blur animate-pop-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <PawPrint className="h-8 w-8 text-primary animate-wiggle" />
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              Nenhum pet encontrado
            </p>
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
  onUpdatePhoto,
}) => {
  const [hearts, setHearts] = useState([]);
  const lastBurst = useRef(0);
  const fileInputRef = useRef(null);

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
        const order = ["overdue", "due-soon", "upcoming", "ok"];
        return (
          order.indexOf(a.status) - order.indexOf(b.status) || a.days - b.days
        );
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

          {/* Action buttons (Camera + Favorite) */}
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUpdatePhoto(pet.id, file);
                  e.target.value = "";
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Trocar foto do pet"
              aria-label={`Trocar foto de ${pet.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-foreground shadow-soft backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-primary-foreground"
            >
              <Camera className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={onToggleFavorite}
                aria-label={
                  isFavorite
                    ? `Desfavoritar ${pet.name}`
                    : `Favoritar ${pet.name}`
                }
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
      </div>

        {/* Bottom species + vaccine status badges */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-3 py-1 text-[11px] font-semibold text-foreground shadow-soft backdrop-blur">
            {pet.species === "Cachorro" ? (
              <Dog className="h-3 w-3" />
            ) : (
              <Cat className="h-3 w-3" />
            )}
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
          <h3 className="font-display text-xl font-bold text-foreground">
            {pet.name}
          </h3>
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

        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {pet.description}
        </p>

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
              <span className="font-normal text-muted-foreground">
                ({pet.reviews})
              </span>
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {pet.medicalNote}
          </p>
        </div>

        {/* Acoes correlacionadas do Pet */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs"
          >
            <Link to={`/cartao?id=${pet.id}`}>Cartão Digital</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-accent-warm/30 bg-accent-warm/10 text-accent-warm hover:bg-accent-warm hover:text-accent-warm-foreground text-xs"
          >
            <Link to={`/saude?petId=${pet.id}`}>Carteira Saúde</Link>
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenNext}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2 text-[11px] font-bold text-muted-foreground transition-all hover:border-accent-warm/50 hover:text-accent-warm"
          >
            <BellRing className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" />
            Próximas vacinas
          </button>
          <button
            type="button"
            onClick={onOpenCard}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2 text-[11px] font-bold text-muted-foreground transition-all hover:border-primary/50 hover:text-primary"
          >
            <Syringe className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" />
            Cartão virtual
          </button>
        </div>

        <Button
          asChild
          size="sm"
          className="shine mt-3 w-full rounded-full gradient-primary text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
        >
          <Link to={`/historico-medico?petId=${pet.id}`}>
            <ClipboardList className="mr-1.5 h-4 w-4" />
            Ver Histórico Completo
          </Link>
        </Button>
      </div>
    </article>
  );
};

// ============================================================
// Vaccine dialogs
// ============================================================

const VaccineDialog = ({ pet, mode, onClose, onApplyVaccine }) => {
  const open = !!pet;

  const sorted = useMemo(() => {
    if (!pet) return [];
    return [...pet.vaccines]
      .map((v) => ({ v, ...getVaxStatus(v) }))
      .sort((a, b) => {
        const order = ["overdue", "due-soon", "upcoming", "ok"];
        return (
          order.indexOf(a.status) - order.indexOf(b.status) || a.days - b.days
        );
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
                      {mode === "card"
                        ? "Cartão de Vacina Virtual"
                        : "Próximas Vacinas"}
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
                            <p className="font-semibold text-muted-foreground">
                              Última dose
                            </p>
                            <p className="font-bold text-foreground">
                              {formatDateBR(v.lastDate)}
                            </p>
                          </div>
                        )}
                        {v.lot && (
                          <div>
                            <p className="font-semibold text-muted-foreground">
                              Lote
                            </p>
                            <p className="font-bold text-foreground">{v.lot}</p>
                          </div>
                        )}
                        {v.vet && (
                          <div className="col-span-2">
                            <p className="font-semibold text-muted-foreground">
                              Veterinário
                            </p>
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
                {mode === "card"
                  ? "Documento oficial verificado"
                  : "Alertas calculados em tempo real"}
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

const AlertsDialog = ({ open, onClose, alerts, onOpenPet }) => {
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
              {alerts.length} alerta{alerts.length === 1 ? "" : "s"} ordenado
              {alerts.length === 1 ? "" : "s"} por prioridade
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-6">
          {alerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-2 font-display text-lg font-bold text-foreground">
                Tudo em dia!
              </p>
              <p className="text-sm text-muted-foreground">
                Nenhum alerta de vacinação no momento.
              </p>
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
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles.chip}`}
                    >
                      <Icon className="h-3 w-3" />
                      {styles.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {vaccine.name}
                  </p>
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

const FilterSection = ({ icon, title, subtitle, children }) => (
  <div>
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
    {children}
  </div>
);

const TileFilter = ({ active, onClick, icon, label }) => (
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

const PillFilter = ({ active, onClick, children }) => (
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

const ToggleCard = ({ active, onClick, icon, title, desc }) => (
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
        active
          ? "bg-white/20 text-primary-foreground"
          : "bg-primary-soft text-primary group-hover:scale-110"
      }`}
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p
        className={`text-sm font-bold ${active ? "text-primary-foreground" : "text-foreground"}`}
      >
        {title}
      </p>
      <p
        className={`text-[11px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
      >
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

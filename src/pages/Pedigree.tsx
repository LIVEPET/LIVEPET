import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Award,
  ArrowLeft,
  ShieldCheck,
  Crown,
  Search,
  Star,
  Sparkles,
  HeartPulse,
  Calendar,
  Dna,
  FileCheck2,
  Filter,
  Heart,
  CheckCircle2,
  Download,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, User as UserIcon, Palette, GitBranch, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";

type PedigreeDog = {
  id: string;
  name: string;
  breed: string;
  group: "Trabalho" | "Pastor" | "Toy" | "Esportivo" | "Companhia";
  size: "Pequeno" | "Médio" | "Grande";
  age: string;
  ageYears: number;
  gender: "Macho" | "Fêmea";
  registry: string;
  entity: "CBKC" | "FCI" | "AKC";
  rating: number;
  reviews: number;
  champion: boolean;
  img: string;
  owner: string;
  city: string;
  birth: string;
  color: string;
  vetNote: string;
  parents: { father: string; mother: string };
};

const DOGS: PedigreeDog[] = [
  {
    id: "LP-2847",
    name: "Thor do Vale Imperial",
    breed: "Golden Retriever",
    group: "Esportivo",
    size: "Grande",
    age: "3 anos",
    ageYears: 3,
    gender: "Macho",
    registry: "CBKC 12.847",
    entity: "CBKC",
    rating: 4.9,
    reviews: 128,
    champion: true,
    img: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?auto=format&fit=crop&w=800&q=80",
    owner: "Família Andrade",
    city: "São Paulo, SP",
    birth: "12/03/2022",
    color: "Dourado claro",
    vetNote: "Cardio e displasia OFA Excellent. Vacinação V10 em dia.",
    parents: { father: "Apollo do Vale", mother: "Zara dos Lagos" },
  },
  {
    id: "LP-3120",
    name: "Bella Aurora",
    breed: "Border Collie",
    group: "Pastor",
    size: "Médio",
    age: "2 anos",
    ageYears: 2,
    gender: "Fêmea",
    registry: "CBKC 13.120",
    entity: "CBKC",
    rating: 5.0,
    reviews: 84,
    champion: true,
    img: "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?auto=format&fit=crop&w=800&q=80",
    owner: "Canil Aurora",
    city: "Curitiba, PR",
    birth: "08/06/2023",
    color: "Preto e branco",
    vetNote: "CEA/PRA negativos. Quadril A/A. Atleta de agility.",
    parents: { father: "Rex Imperial", mother: "Luna do Sul" },
  },
  {
    id: "LP-4501",
    name: "Apollo Imperial",
    breed: "Pastor Alemão",
    group: "Pastor",
    size: "Grande",
    age: "4 anos",
    ageYears: 4,
    gender: "Macho",
    registry: "FCI 45.011",
    entity: "FCI",
    rating: 4.8,
    reviews: 211,
    champion: true,
    img: "https://images.unsplash.com/photo-1568572933382-74d440642117?auto=format&fit=crop&w=800&q=80",
    owner: "Canil Imperial",
    city: "Belo Horizonte, MG",
    birth: "22/01/2021",
    color: "Capa preta",
    vetNote: "IPO3 certificado. Displasia HD-A, ED-0. Linhagem alemã.",
    parents: { father: "Falk vom Wallerstein", mother: "Heidi vom Holtkämper" },
  },
  {
    id: "LP-5210",
    name: "Mia Belle",
    breed: "Poodle Toy",
    group: "Toy",
    size: "Pequeno",
    age: "1 ano",
    ageYears: 1,
    gender: "Fêmea",
    registry: "CBKC 15.210",
    entity: "CBKC",
    rating: 4.7,
    reviews: 56,
    champion: true,
    img: "https://images.unsplash.com/photo-1616190264687-b7ebf4ed3e9f?auto=format&fit=crop&w=800&q=80",
    owner: "Família Costa",
    city: "Rio de Janeiro, RJ",
    birth: "15/09/2024",
    color: "Branco",
    vetNote: "Patela grau 0. Vacinação completa. Castrada.",
    parents: { father: "Mickey Snow", mother: "Lola Pearl" },
  },
  {
    id: "LP-6022",
    name: "Zeus do Norte",
    breed: "Husky Siberiano",
    group: "Trabalho",
    size: "Grande",
    age: "5 anos",
    ageYears: 5,
    gender: "Macho",
    registry: "AKC 60.022",
    entity: "AKC",
    rating: 4.9,
    reviews: 173,
    champion: true,
    img: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&w=800&q=80",
    owner: "Canil Polar",
    city: "Florianópolis, SC",
    birth: "30/11/2020",
    color: "Cinza e branco",
    vetNote: "Olhos azuis, exame oftalmo OK. Quadril Excellent.",
    parents: { father: "Storm of Alaska", mother: "Nala White Wolf" },
  },
  {
    id: "LP-7134",
    name: "Luna Estrela",
    breed: "Shih Tzu",
    group: "Companhia",
    size: "Pequeno",
    age: "2 anos",
    ageYears: 2,
    gender: "Fêmea",
    registry: "CBKC 17.134",
    entity: "CBKC",
    rating: 4.6,
    reviews: 92,
    champion: true,
    img: "https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?auto=format&fit=crop&w=800&q=80",
    owner: "Família Lima",
    city: "Porto Alegre, RS",
    birth: "05/04/2023",
    color: "Dourado e branco",
    vetNote: "Pelagem de exposição. Sem alterações cardíacas.",
    parents: { father: "Lord Brown", mother: "Princess Daisy" },
  },
  {
    id: "LP-8045",
    name: "Maximus do Atlas",
    breed: "Rottweiler",
    group: "Trabalho",
    size: "Grande",
    age: "4 anos",
    ageYears: 4,
    gender: "Macho",
    registry: "FCI 80.045",
    entity: "FCI",
    rating: 4.9,
    reviews: 198,
    champion: true,
    img: "https://images.unsplash.com/photo-1567752881298-894bb81f9379?auto=format&fit=crop&w=800&q=80",
    owner: "Canil Atlas",
    city: "Brasília, DF",
    birth: "18/02/2021",
    color: "Preto e fogo",
    vetNote: "ZTP aprovado. Cardio normal. Quadril HD-A.",
    parents: { father: "Brutus von Hause", mother: "Greta vom Stein" },
  },
  {
    id: "LP-9210",
    name: "Duquesa Real",
    breed: "Labrador Retriever",
    group: "Esportivo",
    size: "Grande",
    age: "3 anos",
    ageYears: 3,
    gender: "Fêmea",
    registry: "CBKC 92.010",
    entity: "CBKC",
    rating: 4.8,
    reviews: 142,
    champion: true,
    img: "https://images.unsplash.com/photo-1605897472359-85e4b94d685d?auto=format&fit=crop&w=800&q=80",
    owner: "Canil Real",
    city: "Salvador, BA",
    birth: "10/07/2022",
    color: "Chocolate",
    vetNote: "PRA negativo. Cotovelos ED-0. Excelente temperamento.",
    parents: { father: "Hunter of Devon", mother: "Cocoa Princess" },
  },
  {
    id: "LP-1056",
    name: "Romeo Bellini",
    breed: "Bulldog Francês",
    group: "Companhia",
    size: "Pequeno",
    age: "2 anos",
    ageYears: 2,
    gender: "Macho",
    registry: "FCI 10.056",
    entity: "FCI",
    rating: 4.7,
    reviews: 110,
    champion: true,
    img: "https://images.unsplash.com/photo-1620189507187-1babc1106e9b?auto=format&fit=crop&w=800&q=80",
    owner: "Canil Bellini",
    city: "São Paulo, SP",
    birth: "03/05/2023",
    color: "Fawn pied",
    vetNote: "Vias aéreas livres. Coluna sem alterações. Coração OK.",
    parents: { father: "Don Vito", mother: "Sofia Stella" },
  },
  {
    id: "LP-2298",
    name: "Athena Star",
    breed: "Dálmata",
    group: "Companhia",
    size: "Médio",
    age: "3 anos",
    ageYears: 3,
    gender: "Fêmea",
    registry: "AKC 22.980",
    entity: "AKC",
    rating: 4.8,
    reviews: 87,
    champion: true,
    img: "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?auto=format&fit=crop&w=800&q=80",
    owner: "Canil Star",
    city: "Recife, PE",
    birth: "25/10/2022",
    color: "Branco com pintas pretas",
    vetNote: "BAER bilateral positivo (audição perfeita). Quadril A.",
    parents: { father: "Pongo Royal", mother: "Perdita Bright" },
  },
];

const SIZES = ["Todos", "Pequeno", "Médio", "Grande"] as const;
const GROUPS = ["Todos", "Trabalho", "Pastor", "Toy", "Esportivo", "Companhia"] as const;
const ENTITIES = ["Todos", "CBKC", "FCI", "AKC"] as const;

const Pedigree = () => {
  const [search, setSearch] = useState("");
  const [size, setSize] = useState<(typeof SIZES)[number]>("Todos");
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Todos");
  const [entity, setEntity] = useState<(typeof ENTITIES)[number]>("Todos");
  const [championOnly, setChampionOnly] = useState(false);
  const [selected, setSelected] = useState<PedigreeDog>(DOGS[0]);
  const [detailDog, setDetailDog] = useState<PedigreeDog | null>(null);

  const openDetail = (dog: PedigreeDog) => setDetailDog(dog);
  const closeDetail = () => setDetailDog(null);
  const focusCertificate = (dog: PedigreeDog) => {
    setSelected(dog);
    closeDetail();
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };
  const focusFamilyTree = (dog: PedigreeDog) => {
    setSelected(dog);
    closeDetail();
    requestAnimationFrame(() => {
      document.getElementById("family-tree")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const filtered = useMemo(() => {
    return DOGS.filter((d) => {
      if (size !== "Todos" && d.size !== size) return false;
      if (group !== "Todos" && d.group !== group) return false;
      if (entity !== "Todos" && d.entity !== entity) return false;
      if (championOnly && !d.champion) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.breed.toLowerCase().includes(q) ||
          d.registry.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, size, group, entity, championOnly]);

  const certificateUrl = `https://livepet.app/pedigree/${selected.id}`;

  return (
    <div className="min-h-screen bg-background">



      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-foreground py-14 text-primary-foreground">
        <div className="blob h-[360px] w-[360px] -left-20 top-0 bg-primary/40 animate-blob" />
        <div className="blob h-[300px] w-[300px] -right-10 bottom-0 bg-warm/30" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-warm/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-warm ring-1 ring-warm/40">
            <Crown className="h-3.5 w-3.5" />
            Pedigree Digital LivePet
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
            Cadastre, valide e compartilhe o{" "}
            <span className="italic text-warm">pedigree oficial</span> do seu cão.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/75">
            Certificado digital com QR Code, árvore genealógica, avaliações e laudos
            veterinários — verificado junto a CBKC, FCI e AKC.
          </p>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Filters */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden border-border/60 p-0 shadow-card">
              <div className="flex items-center gap-2 border-b border-border/60 bg-primary-soft/40 px-5 py-4">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  Filtros animados
                </h3>
              </div>
              <div className="space-y-6 p-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Buscar
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nome, raça, registro..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <FilterChips
                  label="Porte"
                  options={SIZES}
                  value={size}
                  onChange={(v) => setSize(v as typeof size)}
                />
                <FilterChips
                  label="Grupo"
                  options={GROUPS}
                  value={group}
                  onChange={(v) => setGroup(v as typeof group)}
                />
                <FilterChips
                  label="Entidade"
                  options={ENTITIES}
                  value={entity}
                  onChange={(v) => setEntity(v as typeof entity)}
                />

                <button
                  onClick={() => setChampionOnly((c) => !c)}
                  className={`group flex w-full items-center justify-between rounded-xl border-2 p-3 transition-all ${
                    championOnly
                      ? "border-warm bg-warm/10"
                      : "border-border bg-card hover:border-warm/50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Crown
                      className={`h-4 w-4 transition-all ${
                        championOnly ? "text-warm" : "text-muted-foreground"
                      } ${championOnly ? "rotate-12 scale-110" : ""}`}
                    />
                    Apenas campeões
                  </span>
                  <span
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      championOnly ? "bg-warm" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-all ${
                        championOnly ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>

                <div className="rounded-xl bg-primary-soft/50 p-3 text-center">
                  <p className="font-display text-2xl font-bold text-primary">
                    {filtered.length}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    cães encontrados
                  </p>
                </div>
              </div>
            </Card>
          </aside>

          {/* Right side — Tabs */}
          <div>
            <Tabs defaultValue="catalogo" className="space-y-6">
              <TabsList className="rounded-full bg-muted p-1">
                <TabsTrigger value="catalogo" className="rounded-full px-5">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Catálogo Pedigree
                </TabsTrigger>
                <TabsTrigger value="cadastro" className="rounded-full px-5">
                  <FileCheck2 className="mr-2 h-3.5 w-3.5" />
                  Cadastrar pedigree
                </TabsTrigger>
              </TabsList>

              {/* CATALOG */}
              <TabsContent value="catalogo" className="space-y-8">
                {/* Selected dog certificate */}
                <DigitalCertificate dog={selected} certificateUrl={certificateUrl} />

                {/* Grid */}
                <div>
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        <Sparkles className="h-3 w-3" />
                        Catálogo
                      </span>
                      <h2 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
                        Cães com pedigree disponível
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Toque em um card para abrir o certificado digital completo.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-soft">
                      <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                      <span className="font-display text-sm font-bold text-foreground">
                        {filtered.length}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {filtered.length === 1 ? "resultado" : "resultados"}
                      </span>
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <Card className="p-10 text-center text-muted-foreground">
                      Nenhum cão encontrado com esses filtros.
                    </Card>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {filtered.map((dog, i) => {
                        const isSelected = selected.id === dog.id;
                        return (
                        <button
                          key={dog.id}
                          onClick={() => openDetail(dog)}
                          aria-pressed={isSelected}
                          aria-label={`Abrir detalhes de ${dog.name}`}
                          className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-card text-left shadow-card opacity-0 [animation:fade-in_0.6s_ease-out_forwards] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glow ${
                            isSelected
                              ? "border-warm ring-2 ring-warm/40"
                              : "border-border/60 hover:border-warm/50"
                          }`}
                          style={{ animationDelay: `${i * 70}ms` }}
                        >
                          {/* Image */}
                          <div className="relative aspect-[5/4] overflow-hidden">
                            <img
                              src={dog.img}
                              alt={`${dog.name} — ${dog.breed}`}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

                            {/* Top badges */}
                            <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                              <div className="flex flex-col gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary backdrop-blur">
                                  <ShieldCheck className="h-3 w-3" />
                                  {dog.entity}
                                </span>
                                {dog.champion && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-warm to-warm/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-warm-foreground shadow-warm">
                                    <Crown className="h-3 w-3" />
                                    Campeão
                                  </span>
                                )}
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold text-primary-foreground backdrop-blur">
                                <Star className="h-3 w-3 fill-warm text-warm" />
                                {dog.rating.toFixed(1)}
                              </span>
                            </div>

                            {/* Bottom info over image */}
                            <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
                              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-warm">
                                #{dog.id}
                              </p>
                              <h3 className="mt-0.5 font-display text-xl font-bold leading-tight sm:text-2xl">
                                {dog.name}
                              </h3>
                              <p className="mt-0.5 text-[11px] text-primary-foreground/85">
                                {dog.breed}
                              </p>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="flex flex-1 flex-col gap-3 p-4">
                            {/* meta chips */}
                            <div className="flex flex-wrap gap-1.5">
                              <MetaChip>{dog.age}</MetaChip>
                              <MetaChip>{dog.gender}</MetaChip>
                              <MetaChip>{dog.size}</MetaChip>
                              <MetaChip>{dog.city}</MetaChip>
                            </div>

                            {/* parents */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="rounded-lg border border-primary/15 bg-primary-soft/40 px-2.5 py-1.5">
                                <p className="font-black uppercase tracking-wider text-primary/70">Pai</p>
                                <p className="truncate font-semibold text-foreground">{dog.parents.father}</p>
                              </div>
                              <div className="rounded-lg border border-warm/20 bg-warm/10 px-2.5 py-1.5">
                                <p className="font-black uppercase tracking-wider text-warm">Mãe</p>
                                <p className="truncate font-semibold text-foreground">{dog.parents.mother}</p>
                              </div>
                            </div>

                            {/* vet note */}
                            <div className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-[11px] text-foreground">
                              <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              <p className="line-clamp-2 leading-snug">{dog.vetNote}</p>
                            </div>

                            {/* footer */}
                            <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                              <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                                {dog.registry}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary transition-transform duration-300 group-hover:translate-x-1">
                                Ver certificado
                                <Sparkles className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </TabsContent>

              {/* REGISTRATION */}
              <TabsContent value="cadastro">
                <RegistrationForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <DogDetailModal
        dog={detailDog}
        onClose={closeDetail}
        onViewCertificate={focusCertificate}
        onViewTree={focusFamilyTree}
      />
    </div>
  );
};

/* ---------- Subcomponents ---------- */

const MetaChip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-foreground">
    {children}
  </span>
);

const DogDetailModal = ({
  dog,
  onClose,
  onViewCertificate,
  onViewTree,
}: {
  dog: PedigreeDog | null;
  onClose: () => void;
  onViewCertificate: (d: PedigreeDog) => void;
  onViewTree: (d: PedigreeDog) => void;
}) => {
  return (
    <Dialog open={!!dog} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden border-border/60 p-0 sm:rounded-3xl">
        {dog && (
          <>
            <DialogTitle className="sr-only">{dog.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes completos do pedigree de {dog.name}, {dog.breed}.
            </DialogDescription>

            <div className="grid md:grid-cols-[1.05fr_1fr]">
              {/* Image side */}
              <div className="relative h-64 overflow-hidden md:h-auto md:min-h-[460px]">
                <img
                  src={dog.img}
                  alt={`${dog.name} — ${dog.breed}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

                <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary backdrop-blur">
                      <ShieldCheck className="h-3 w-3" />
                      {dog.entity} verificado
                    </span>
                    {dog.champion && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-warm to-warm/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-warm-foreground shadow-warm">
                        <Crown className="h-3 w-3" />
                        Campeão
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] font-bold text-primary-foreground backdrop-blur">
                    <Star className="h-3 w-3 fill-warm text-warm" />
                    {dog.rating.toFixed(1)}
                    <span className="font-normal opacity-80">({dog.reviews})</span>
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-warm">
                    #{dog.id}
                  </p>
                  <h3 className="mt-0.5 font-display text-2xl font-bold leading-tight sm:text-3xl">
                    {dog.name}
                  </h3>
                  <p className="mt-1 text-xs text-primary-foreground/85">
                    {dog.breed} · {dog.group}
                  </p>
                </div>
              </div>

              {/* Info side */}
              <div className="flex max-h-[80vh] flex-col overflow-y-auto p-5 sm:p-6">
                {/* meta chips */}
                <div className="flex flex-wrap gap-1.5">
                  <MetaChip>{dog.age}</MetaChip>
                  <MetaChip>{dog.gender}</MetaChip>
                  <MetaChip>Porte {dog.size}</MetaChip>
                </div>

                {/* identity grid */}
                <dl className="mt-5 grid grid-cols-2 gap-2">
                  <DetailCell icon={FileText} label="Registro">
                    <span className="font-mono">{dog.registry}</span>
                  </DetailCell>
                  <DetailCell icon={Calendar} label="Nascimento">{dog.birth}</DetailCell>
                  <DetailCell icon={Palette} label="Pelagem">{dog.color}</DetailCell>
                  <DetailCell icon={MapPin} label="Cidade">{dog.city}</DetailCell>
                  <DetailCell icon={UserIcon} label="Tutor / canil" wide>
                    {dog.owner}
                  </DetailCell>
                </dl>

                {/* Parents */}
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  Linhagem
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-primary/15 bg-primary-soft/40 px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary/70">
                      Pai
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {dog.parents.father}
                    </p>
                  </div>
                  <div className="rounded-xl border border-warm/20 bg-warm/10 px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-warm">
                      Mãe
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {dog.parents.mother}
                    </p>
                  </div>
                </div>

                {/* Vet note */}
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-[12px] text-foreground">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="leading-snug">{dog.vetNote}</p>
                </div>

                {/* CTAs */}
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Button
                    onClick={() => onViewCertificate(dog)}
                    className="rounded-full gradient-primary text-primary-foreground shadow-glow"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Ver certificado
                  </Button>
                  <Button
                    onClick={() => onViewTree(dog)}
                    variant="outline"
                    className="rounded-full border-warm/60 text-warm hover:bg-warm/10 hover:text-warm"
                  >
                    <GitBranch className="h-4 w-4" />
                    Árvore genealógica
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DetailCell = ({
  icon: Icon,
  label,
  children,
  wide,
}: {
  icon: typeof Calendar;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div className={`rounded-xl border border-border bg-card px-3 py-2 ${wide ? "col-span-2" : ""}`}>
    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3 text-primary" />
      {label}
    </div>
    <p className="mt-0.5 text-[13px] font-semibold text-foreground">{children}</p>
  </div>
);




const FilterChips = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-2">
    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`relative overflow-hidden rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
              active
                ? "bg-primary text-primary-foreground shadow-glow scale-105"
                : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary hover:scale-105"
            }`}
          >
            {active && (
              <span className="absolute inset-0 -translate-x-full animate-[shine_1s_ease-out] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            )}
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

const DigitalCertificate = ({
  dog,
  certificateUrl,
}: {
  dog: PedigreeDog;
  certificateUrl: string;
}) => {
  // Likes state — keyed by dog id so it resets per-pet
  const baseLikes = 1200 + (dog.reviews ?? 0) * 7;
  const baseVetLikes = 24 + Math.floor((dog.rating ?? 4.5) * 8);
  const [liked, setLiked] = useState(false);
  const [vetLiked, setVetLiked] = useState(false);
  const [burst, setBurst] = useState(0);

  // reset when dog changes
  useEffect(() => {
    setLiked(false);
    setVetLiked(false);
    setBurst(0);
  }, [dog.id]);

  const likeCount = baseLikes + (liked ? 1 : 0);
  const vetLikeCount = baseVetLikes + (vetLiked ? 1 : 0);

  return (
    <Card className="relative overflow-hidden border-2 border-warm/30 bg-card p-0 shadow-glow">
      {/* decorative top stripe */}
      <div className="h-2 bg-gradient-to-r from-primary via-warm to-primary" />

      <div className="relative grid gap-0 p-6 md:grid-cols-[1fr_280px] md:p-8">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-dashed border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <Award className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Certificado de Pedigree
                </p>
                <p className="font-display text-base font-bold text-foreground">
                  LivePet · {dog.entity} Verificado
                </p>
              </div>
            </div>
            <span className="rounded-full bg-warm/15 px-3 py-1 font-mono text-xs font-bold text-warm">
              #{dog.id}
            </span>
          </div>

          {/* Pet Info */}
          <div className="flex items-start gap-4">
            <img
              src={dog.img}
              alt={dog.name}
              className="h-24 w-24 rounded-2xl object-cover ring-4 ring-warm/20"
            />
            <div className="flex-1">
              <h2 className="font-display text-3xl font-bold text-foreground">
                {dog.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {dog.breed} · {dog.gender} · {dog.color}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-warm text-warm" />
                  {dog.rating}
                  <span className="font-normal text-muted-foreground">
                    ({dog.reviews} avaliações)
                  </span>
                </span>
                {dog.champion && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warm px-2 py-0.5 text-[10px] font-bold uppercase text-warm-foreground">
                    <Crown className="h-3 w-3" />
                    Campeão
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Likes bar */}
          <div className="flex flex-wrap items-stretch gap-3">
            {/* General likes */}
            <button
              onClick={() => {
                setLiked((l) => !l);
                if (!liked) setBurst((b) => b + 1);
              }}
              className={`group relative flex flex-1 items-center gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3 transition-all duration-300 ${
                liked
                  ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30"
                  : "border-border bg-card hover:border-rose-300 hover:bg-rose-50/50"
              }`}
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50">
                <Heart
                  className={`h-5 w-5 transition-all duration-300 ${
                    liked
                      ? "scale-110 fill-rose-500 text-rose-500"
                      : "text-rose-500 group-hover:scale-110"
                  }`}
                  strokeWidth={2.2}
                />
                {/* floating hearts burst */}
                {liked && burst > 0 && (
                  <span key={burst} className="pointer-events-none absolute inset-0">
                    {[...Array(5)].map((_, i) => (
                      <Heart
                        key={i}
                        className="absolute left-1/2 top-1/2 h-3 w-3 fill-rose-400 text-rose-400"
                        style={{
                          animation: `heart-fly 0.9s ease-out forwards`,
                          animationDelay: `${i * 60}ms`,
                          // @ts-ignore custom prop for keyframes
                          ["--tx" as any]: `${(i - 2) * 14}px`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </span>
              <div className="text-left">
                <p className="font-display text-lg font-bold leading-none text-foreground">
                  {likeCount.toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Curtidas
                </p>
              </div>
            </button>

            {/* Vet likes */}
            <button
              onClick={() => setVetLiked((v) => !v)}
              className={`group relative flex flex-1 items-center gap-3 overflow-hidden rounded-2xl border-2 px-4 py-3 transition-all duration-300 ${
                vetLiked
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-card hover:border-primary/50 hover:bg-primary-soft/40"
              }`}
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <HeartPulse
                  className={`h-5 w-5 transition-all duration-300 ${
                    vetLiked ? "scale-110 text-primary" : "text-primary group-hover:scale-110"
                  }`}
                  strokeWidth={2.2}
                />
                {vetLiked && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ThumbsUp className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <p className="font-display text-lg font-bold leading-none text-foreground">
                    {vetLikeCount}
                  </p>
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Vets verificados
                </p>
              </div>
            </button>
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <InfoCell icon={Calendar} label="Nascimento" value={dog.birth} />
            <InfoCell icon={ShieldCheck} label="Registro" value={dog.registry} />
            <InfoCell icon={Dna} label="Pai" value={dog.parents.father} />
            <InfoCell icon={Dna} label="Mãe" value={dog.parents.mother} />
          </div>

          {/* Vet note */}
          <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <HeartPulse className="h-3.5 w-3.5" />
              Avaliação Veterinária
            </div>
            <p className="text-sm text-foreground">{dog.vetNote}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full gradient-primary text-primary-foreground">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <Button size="sm" variant="outline" className="rounded-full">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>

        {/* QR side */}
        <div className="relative flex flex-col items-center justify-center gap-4 border-t-2 border-dashed border-border pt-6 md:border-l-2 md:border-t-0 md:pl-8 md:pt-0">
          <div className="relative rounded-2xl border-2 border-border bg-card p-4 shadow-soft">
            <span className="absolute -right-3 -top-3 z-10 flex h-14 w-14 rotate-12 items-center justify-center rounded-full border-[3px] border-warm bg-card shadow-warm">
              <div className="text-center leading-tight">
                <ShieldCheck className="mx-auto h-3.5 w-3.5 text-warm" strokeWidth={2.5} />
                <p className="mt-0.5 font-display text-[7px] font-bold uppercase tracking-wider text-warm">
                  Verificado
                </p>
              </div>
            </span>
            <QRCodeSVG
              value={certificateUrl}
              size={160}
              level="H"
              bgColor="transparent"
              fgColor="hsl(152 76% 14%)"
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Escaneie para validar
            </p>
            <p className="mt-1 font-mono text-[10px] text-primary break-all">
              livepet.app/p/{dog.id}
            </p>
          </div>
        </div>
      </div>

      {/* Animated Family Tree — full width */}
      <FamilyTree dog={dog} />
    </Card>
  );
};

type TreeNode = {
  id: string;
  name: string;
  role: string;
  gen: 0 | 1 | 2;
  side: "self" | "paternal" | "maternal";
  gender: "M" | "F";
  x: number;
  y: number;
  img: string;
  registry?: string;
  champion?: boolean;
  titles?: string[];
  self?: boolean;
};

const FamilyTree = ({ dog }: { dog: PedigreeDog }) => {
  const [active, setActive] = useState<string>("self");
  const [lineageView, setLineageView] = useState<"all" | "paternal" | "maternal">("all");

  type Node = {
    id: string;
    name: string;
    role: string;
    gen: 0 | 1 | 2;
    side: "self" | "paternal" | "maternal";
    gender: "M" | "F";
    img: string;
    registry?: string;
    champion?: boolean;
    titles?: string[];
  };

  const self: Node = {
    id: "self",
    name: dog.name,
    role: dog.breed,
    gen: 0,
    side: "self",
    gender: dog.gender === "Macho" ? "M" : "F",
    img: dog.img,
    registry: dog.registry,
    champion: dog.champion,
    titles: ["Pet atual"],
  };
  const father: Node = {
    id: "f", name: dog.parents.father, role: "Pai", gen: 1, side: "paternal", gender: "M",
    img: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=300&q=80",
    registry: "CBKC 09.412", champion: true, titles: ["Campeão Brasileiro", "BIS 2022"],
  };
  const mother: Node = {
    id: "m", name: dog.parents.mother, role: "Mãe", gen: 1, side: "maternal", gender: "F",
    img: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=300&q=80",
    registry: "CBKC 09.118", champion: true, titles: ["Campeã Sul-Americana"],
  };
  const pGrandpa: Node = {
    id: "pp", name: "Rex Imperial", role: "Avô paterno", gen: 2, side: "paternal", gender: "M",
    img: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=300&q=80",
    registry: "FCI 04.221", champion: true, titles: ["Grand Champion"],
  };
  const pGrandma: Node = {
    id: "pm", name: "Bella Aurora", role: "Avó paterna", gen: 2, side: "paternal", gender: "F",
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=300&q=80",
    registry: "CBKC 04.118", titles: ["Linhagem importada"],
  };
  const mGrandpa: Node = {
    id: "mp", name: "Don Vito", role: "Avô materno", gen: 2, side: "maternal", gender: "M",
    img: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
    registry: "AKC 04.502", champion: true, titles: ["AKC Champion"],
  };
  const mGrandma: Node = {
    id: "mm", name: "Sofia Stella", role: "Avó materna", gen: 2, side: "maternal", gender: "F",
    img: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=300&q=80",
    registry: "FCI 04.901", titles: ["Reprodutora premiada"],
  };

  const nodes = [self, father, mother, pGrandpa, pGrandma, mGrandpa, mGrandma];
  const findNode = (id: string) => nodes.find((n) => n.id === id)!;

  const ancestorsOf: Record<string, string[]> = {
    self: ["self", "f", "m", "pp", "pm", "mp", "mm"],
    f: ["f", "pp", "pm"],
    m: ["m", "mp", "mm"],
    pp: ["pp"], pm: ["pm"], mp: ["mp"], mm: ["mm"],
  };
  const highlight = new Set(ancestorsOf[active] ?? ["self"]);
  const focused = findNode(active);

  const inLineage = (n: Node) =>
    lineageView === "all" || n.side === "self" || n.side === lineageView;

  const sideStyles = {
    primary: {
      bar: "bg-primary",
      ring: "ring-primary/60",
      ringActive: "ring-primary/40",
      borderActive: "border-primary",
      hoverBorder: "hover:border-primary/60",
      chipBg: "bg-primary/15",
      chipText: "text-primary",
      genderBg: "bg-primary",
      genderText: "text-primary-foreground",
      gradient: "from-primary/70 to-primary/20",
      line: "bg-primary/60",
    },
    warm: {
      bar: "bg-warm",
      ring: "ring-warm/60",
      ringActive: "ring-warm/40",
      borderActive: "border-warm",
      hoverBorder: "hover:border-warm/60",
      chipBg: "bg-warm/15",
      chipText: "text-warm",
      genderBg: "bg-warm",
      genderText: "text-warm-foreground",
      gradient: "from-warm/70 to-warm/20",
      line: "bg-warm/60",
    },
  } as const;

  const sideKey = (side: Node["side"]): "primary" | "warm" =>
    side === "maternal" ? "warm" : "primary";

  const NodeCard = ({ n, size = "md" }: { n: Node; size?: "sm" | "md" | "lg" }) => {
    const visible = inLineage(n);
    const isHighlighted = highlight.has(n.id);
    const isActive = active === n.id;
    const s = sideStyles[sideKey(n.side)];
    const avatar =
      size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24"
      : size === "md" ? "h-14 w-14 sm:h-16 sm:w-16"
      : "h-11 w-11 sm:h-12 sm:w-12";

    return (
      <button
        type="button"
        onClick={() => setActive(n.id)}
        aria-label={`${n.role}: ${n.name}`}
        className={`group relative flex w-full items-center gap-3 rounded-2xl border bg-card p-2.5 text-left shadow-soft transition-all duration-300 ${
          !visible
            ? "opacity-20 grayscale pointer-events-none"
            : isHighlighted
              ? "opacity-100"
              : "opacity-50 grayscale"
        } ${
          isActive
            ? `${s.borderActive} shadow-glow ring-2 ${s.ringActive}`
            : `border-border hover:-translate-y-0.5 ${s.hoverBorder} hover:shadow-card`
        }`}
      >
        <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${s.bar}`} aria-hidden="true" />
        <div className="relative shrink-0">
          {n.champion && (
            <span className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-accent-yellow p-0.5 shadow-warm">
              <Crown className="h-2.5 w-2.5 text-foreground" strokeWidth={2.5} />
            </span>
          )}
          <div
            className={`relative ${avatar} overflow-hidden rounded-full ring-2 ${s.ring} ring-offset-2 ring-offset-card`}
          >
            <img src={n.img} alt={n.name} loading="lazy" className="h-full w-full object-cover" />
          </div>
          <span
            className={`absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black shadow-soft ${s.genderBg} ${s.genderText}`}
          >
            {n.gender === "M" ? "♂" : "♀"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`rounded-md ${s.chipBg} px-1.5 py-0.5 text-[9px] font-black tracking-wider ${s.chipText}`}>
              G{n.gen + 1}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {n.role}
            </span>
          </div>
          <p className="mt-0.5 font-display text-[13px] font-bold leading-tight text-foreground truncate">
            {n.name}
          </p>
          {n.registry && (
            <p className="font-mono text-[10px] text-muted-foreground/80 truncate">{n.registry}</p>
          )}
        </div>
      </button>
    );
  };

  const Connector = ({ side, variant }: { side: "paternal" | "maternal"; variant: "single" | "bracket" }) => {
    const s = sideStyles[side === "maternal" ? "warm" : "primary"];
    const isLineageActive = lineageView === "all" || lineageView === side;
    return (
      <div
        className={`relative hidden sm:flex shrink-0 w-6 md:w-10 items-center transition-opacity ${
          isLineageActive ? "opacity-100" : "opacity-20"
        }`}
        aria-hidden="true"
      >
        {variant === "single" ? (
          <span className={`h-px w-full bg-gradient-to-r ${s.gradient}`} />
        ) : (
          <>
            <span className={`absolute left-0 top-1/2 h-px w-1/2 ${s.line}`} />
            <span className={`absolute left-1/2 top-[15%] bottom-[15%] w-px ${s.line}`} />
            <span className={`absolute left-1/2 top-[15%] h-px w-1/2 ${s.line}`} />
            <span className={`absolute left-1/2 bottom-[15%] h-px w-1/2 ${s.line}`} />
          </>
        )}
      </div>
    );
  };

  return (
    <div id="family-tree" className="relative overflow-hidden border-t-2 border-dashed border-border bg-gradient-to-b from-card via-card to-primary-soft/30 p-6 md:p-10 scroll-mt-24">
      {/* decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-warm/15 blur-3xl" />
      </div>

      {/* header */}
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            <Dna className="h-3 w-3" />
            Linhagem oficial
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Árvore genealógica
          </h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Toque em qualquer ancestral para focar a linhagem.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 shadow-soft backdrop-blur">
          {(
            [
              { id: "paternal", label: "Paterna", color: "bg-primary text-primary-foreground" },
              { id: "all", label: "Tudo", color: "bg-foreground text-background" },
              { id: "maternal", label: "Materna", color: "bg-warm text-warm-foreground" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setLineageView(opt.id);
                setActive("self");
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                lineageView === opt.id ? `${opt.color} shadow-soft` : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <section
        aria-label="Legenda da árvore genealógica"
        className="relative mb-6 overflow-hidden rounded-2xl border border-border/70 bg-background/70 shadow-soft backdrop-blur"
      >
        <div className="grid grid-cols-1 divide-y divide-border/70 md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Gerações */}
          <div className="p-4 sm:p-5">
            <header className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/10 text-foreground">
                <Dna className="h-3 w-3" />
              </span>
              <h4 className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground">
                Gerações
              </h4>
              <span className="ml-auto text-[10px] font-semibold text-muted-foreground">
                profundidade da linhagem
              </span>
            </header>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <LegendRow label="G1" title="Pet atual" desc="o próprio animal" tone="foreground" />
              <LegendRow label="G2" title="Pais" desc="pai e mãe" tone="primary" />
              <LegendRow label="G3" title="Avós" desc="4 ascendentes" tone="warm" />
            </ul>
          </div>

          {/* Linhagens */}
          <div className="p-4 sm:p-5">
            <header className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/10 text-foreground">
                <Heart className="h-3 w-3" />
              </span>
              <h4 className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground">
                Linhagens
              </h4>
              <span className="ml-auto text-[10px] font-semibold text-muted-foreground">
                origem dos ancestrais
              </span>
            </header>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <LegendRow label="P" title="Paterna" desc="lado do pai" tone="primary" dot />
              <LegendRow label="M" title="Materna" desc="lado da mãe" tone="warm" dot />
            </ul>
          </div>
        </div>
      </section>


      {/* Bracket tree */}
      <div className="relative">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.1fr_auto_1.3fr] lg:gap-2 lg:items-stretch">
          {/* Column 1 — Pet */}
          <div className="flex flex-col justify-center">
            <ColumnLabel label="Geração I · Pet" tone="foreground" />
            <NodeCard n={self} size="lg" />
          </div>

          <Connector side="paternal" variant="single" />

          {/* Column 2 — Pais (paternal top, maternal bottom) */}
          <div className="flex flex-col gap-3">
            <ColumnLabel label="Geração II · Pais" tone="primary" />
            <div className="flex-1">
              <NodeCard n={father} />
            </div>
            <div className="flex-1">
              <NodeCard n={mother} />
            </div>
          </div>

          <div className="hidden flex-col gap-3 sm:flex">
            <span className="h-7" aria-hidden />
            <Connector side="paternal" variant="bracket" />
            <Connector side="maternal" variant="bracket" />
          </div>

          {/* Column 3 — Avós */}
          <div className="flex flex-col gap-3">
            <ColumnLabel label="Geração III · Avós" tone="warm" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <NodeCard n={pGrandpa} size="sm" />
              <NodeCard n={pGrandma} size="sm" />
              <NodeCard n={mGrandpa} size="sm" />
              <NodeCard n={mGrandma} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Focused detail bar */}
      <div className="relative mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-soft backdrop-blur sm:flex-row">
        <div className="flex items-center gap-3">
          <div
            className={`relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-card ${
              focused.side === "maternal" ? "ring-warm" : "ring-primary"
            }`}
          >
            <img src={focused.img} alt={focused.name} className="h-full w-full object-cover" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Em foco</p>
            <p className="font-display text-sm font-bold text-foreground">{focused.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {focused.role} · {focused.registry ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {focused.titles?.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary"
            >
              <Award className="h-2.5 w-2.5" />
              {t}
            </span>
          ))}
          {active !== "self" && (
            <button
              type="button"
              onClick={() => setActive("self")}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Sparkles className="h-2.5 w-2.5" />
              Resetar
            </button>
          )}
        </div>
      </div>

      {/* footer legend */}
      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Crown className="h-3 w-3 text-accent-yellow" />
          Campeão verificado
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-primary" />
          CBKC / FCI / AKC
        </span>
      </div>
    </div>
  );
};

const ColumnLabel = ({ label, tone }: { label: string; tone: "primary" | "warm" | "foreground" }) => (
  <p
    className={`mb-2 text-center text-[9px] font-black uppercase tracking-[0.22em] ${
      tone === "primary" ? "text-primary" : tone === "warm" ? "text-warm" : "text-foreground"
    }`}
  >
    {label}
  </p>
);

const LEGEND_TONES = {
  primary: {
    wrap: "border-primary/30 bg-primary/10",
    chip: "bg-primary/20 text-primary",
    dot: "bg-primary",
    text: "text-primary",
  },
  warm: {
    wrap: "border-warm/30 bg-warm/10",
    chip: "bg-warm/20 text-warm",
    dot: "bg-warm",
    text: "text-warm",
  },
  foreground: {
    wrap: "border-foreground/20 bg-foreground/5",
    chip: "bg-foreground/15 text-foreground",
    dot: "bg-foreground",
    text: "text-foreground",
  },
} as const;

const LegendRow = ({
  label,
  title,
  desc,
  tone,
  dot,
}: {
  label: string;
  title: string;
  desc: string;
  tone: "primary" | "warm" | "foreground";
  dot?: boolean;
}) => {
  const t = LEGEND_TONES[tone];
  return (
    <li
      className={`flex items-center gap-2.5 rounded-xl border ${t.wrap} px-2.5 py-2 transition-colors`}
    >
      <span
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.chip}`}
      >
        {dot ? <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} /> : (
          <span className="text-[11px] font-black tracking-wider">{label}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-black uppercase tracking-wider leading-none ${t.text}`}>
          {title}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
          {desc}
        </p>
      </div>
    </li>
  );
};


const InfoCell = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl border border-border bg-card px-3 py-2.5">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </div>
    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
  </div>
);

const RegistrationForm = () => {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Card className="border-2 border-primary/30 bg-primary-soft/30 p-10 text-center shadow-glow">
        <div className="mx-auto flex h-16 w-16 animate-stamp items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 font-display text-2xl font-bold text-foreground">
          Cadastro recebido!
        </h3>
        <p className="mt-2 text-muted-foreground">
          Vamos validar a documentação junto à entidade cinófila e seu pedigree digital
          ficará pronto em até 48h.
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
          className="mt-6 rounded-full"
        >
          Cadastrar outro pet
        </Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/60 p-0 shadow-card">
      <div className="border-b border-border/60 bg-foreground p-6 text-primary-foreground">
        <h2 className="font-display text-2xl font-bold">Cadastro de Pedigree Digital</h2>
        <p className="mt-1 text-sm text-primary-foreground/70">
          Preencha os dados abaixo. Verificamos junto à CBKC, FCI ou AKC.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="grid gap-5 p-6 sm:grid-cols-2"
      >
        <Field label="Nome do cão" placeholder="Ex.: Thor do Vale Imperial" />
        <Field label="Raça" placeholder="Ex.: Golden Retriever" />
        <Field label="Data de nascimento" type="date" />
        <Field label="Cor / pelagem" placeholder="Ex.: Dourado claro" />
        <Field label="Nome do pai" placeholder="Pai registrado" />
        <Field label="Nome da mãe" placeholder="Mãe registrada" />
        <Field label="Número de registro" placeholder="Ex.: CBKC 12.847" />
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Entidade
          </Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option>CBKC</option>
            <option>FCI</option>
            <option>AKC</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Laudo veterinário
          </Label>
          <textarea
            placeholder="Cole aqui as principais observações do laudo (cardio, displasia, vacinas)..."
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-xl border-2 border-dashed border-border p-4 text-center sm:col-span-2">
          <FileCheck2 className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            Anexar certificado original (PDF/JPG)
          </p>
          <p className="text-xs text-muted-foreground">
            Aceitamos pedigree físico digitalizado para validação
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="rounded-full gradient-primary text-primary-foreground shadow-glow sm:col-span-2"
        >
          <Crown className="h-5 w-5" />
          Solicitar pedigree digital
        </Button>
      </form>
    </Card>
  );
};

const Field = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-2">
    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <Input {...props} />
  </div>
);

export default Pedigree;

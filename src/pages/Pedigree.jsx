import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Award,
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
  Plus,
  Loader2,
  MapPin,
  User as UserIcon,
  Palette,
  GitBranch,
  FileText,
  Check,
  X,
  Clock,
  Send,
  RefreshCw,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { petsService, lineageService } from "@/services/api";
import { toast } from "sonner";
import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";

const SIZES = ["Todos", "Pequeno", "Médio", "Grande"];
const GROUPS = ["Todos", "Trabalho", "Pastor", "Toy", "Esportivo", "Companhia"];
const ENTITIES = ["Todos", "CBKC", "FCI", "AKC"];

const formatDateBR = (iso) => {
  if (!iso) return "Não informada";
  const str = String(iso).trim();
  if (str === "Não informada") return "Não informada";
  try {
    const clean = str.split("T")[0];
    if (clean.includes("-")) {
      const [y, m, d] = clean.split("-");
      if (y && m && d) return `${d}/${m}/${y}`;
    }
    const dt = new Date(str);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString("pt-BR");
    }
    return str;
  } catch {
    return str;
  }
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

const Pedigree = () => {
  const [searchParams] = useSearchParams();
  const urlPetId = searchParams.get("petId") || searchParams.get("id");

  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [size, setSize] = useState("Todos");
  const [group, setGroup] = useState("Todos");
  const [entity, setEntity] = useState("Todos");
  const [championOnly, setChampionOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailDog, setDetailDog] = useState(null);
  const [currentTab, setCurrentTab] = useState("catalogo");

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchDogs = async () => {
    try {
      setLoading(true);
      const data = await petsService.list();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((p) => {
          const regNum = p.token_publico
            ? `CBKC-${p.token_publico.slice(0, 8).toUpperCase()}`
            : `CBKC-${p.id}`;
          const lin = p.lineage || {};

          const fatherName =
            lin.pai_nome ||
            (lin.pai_pet_id ? "Pai Vinculado LivePet" : "");
          const motherName =
            lin.mae_nome ||
            (lin.mae_pet_id ? "Mãe Vinculada LivePet" : "");

          return {
            id: p.id,
            name: p.nome,
            breed: p.raca || "SRD",
            registry: lin.registro || regNum,
            entity: lin.registro?.startsWith("FCI")
              ? "FCI"
              : lin.registro?.startsWith("AKC")
              ? "AKC"
              : "CBKC",
            size: p.porte || "Médio",
            group: "Companhia",
            champion: Boolean(lin.pai_titulos || lin.mae_titulos),
            sex: p.sexo || "Macho",
            gender: p.sexo || "Macho",
            age: formatAge(p.data_nascimento),
            microchip: p.token_publico
              ? p.token_publico.slice(0, 12).toUpperCase()
              : String(p.id),
            color: p.cor || "Padrão",
            birth: formatDateBR(p.data_nascimento),
            rawBirth: p.data_nascimento || "",
            kennel: "Canil Oficial LivePet",
            breeder: "Tutor Responsável",
            owner: "Tutor Oficial",
            city: "Goiânia, GO",
            qr: `https://livepet.app/cartao?token=${p.token_publico || p.id}`,
            img: getPetPhoto(p.foto_url),
            rating: 5.0,
            reviews: 1,
            vetNote: "Laudo veterinário e vacinação preventiva em dia.",
            rawPet: p,
            lineage: lin,
            isVerified: lin.status_verificacao === "aprovado",
            isPending: lin.status_verificacao === "pendente",
            verificationStatus: lin.status_verificacao || "declaratorio",
            parents: {
              father: fatherName,
              mother: motherName,
            },
            health: {
              hip: "Laudo Normal (A)",
              elbows: "Grau 0 (Normal)",
              eyes: "Livre de anomalias",
              dna: "Perfil arquivado",
              vaccines:
                (p.vaccines || []).length > 0 ? "Em dia" : "A atualizar",
            },
            titles: ["Registro LivePet Oficial"],
            ratings: {
              structure: 4.8,
              movement: 4.9,
              temperament: 5.0,
              head: 4.7,
              coat: 4.8,
            },
          };
        });
        setDogs(mapped);
        setSelected((prev) => {
          if (urlPetId) {
            const match = mapped.find((d) => String(d.id) === String(urlPetId));
            if (match) return match;
          }
          if (prev) {
            const stillExists = mapped.find((d) => d.id === prev.id);
            if (stillExists) return stillExists;
          }
          return mapped[0];
        });
      } else {
        setDogs([]);
        setSelected(null);
      }
    } catch (err) {
      console.error("Erro ao carregar pedigree:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const [received, sent] = await Promise.all([
        lineageService.getReceivedRequests(),
        lineageService.getSentRequests(),
      ]);
      setReceivedRequests(Array.isArray(received) ? received : []);
      setSentRequests(Array.isArray(sent) ? sent : []);
    } catch (err) {
      console.warn("Não foi possível carregar solicitações:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchDogs();
    loadRequests();
  }, [urlPetId]);

  const handleApproveRequest = async (requestId) => {
    const toastId = toast.loading("Aprovando vínculo de linhagem...");
    try {
      await lineageService.approveRequest(requestId);
      toast.dismiss(toastId);
      toast.success("Vínculo de linhagem aprovado com sucesso!", {
        description: "A árvore genealógica do pet foi atualizada e verificada.",
      });
      await Promise.all([loadRequests(), fetchDogs()]);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Erro ao aprovar solicitação", {
        description: err.message || String(err),
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    const toastId = toast.loading("Processando recusa...");
    try {
      await lineageService.rejectRequest(requestId);
      toast.dismiss(toastId);
      toast.info("Solicitação de linhagem recusada.");
      await Promise.all([loadRequests(), fetchDogs()]);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Erro ao recusar solicitação", {
        description: err.message || String(err),
      });
    }
  };

  const openDetail = (dog) => setDetailDog(dog);
  const closeDetail = () => setDetailDog(null);
  const focusCertificate = (dog) => {
    setSelected(dog);
    closeDetail();
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  };
  const focusFamilyTree = (dog) => {
    setSelected(dog);
    closeDetail();
    requestAnimationFrame(() => {
      document
        .getElementById("family-tree")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const filtered = useMemo(() => {
    return dogs.filter((d) => {
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
  }, [dogs, search, size, group, entity, championOnly]);

  const certificateUrl = selected ? `https://livepet.app/pedigree/${selected.id}` : '';

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
            <span className="italic text-warm">pedigree oficial</span> do seu
            cão.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/75">
            Certificado digital com QR Code, árvore genealógica, avaliações e
            laudos veterinários — verificado junto a CBKC, FCI e AKC.
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
                  onChange={(v) => setSize(v)}
                />

                <FilterChips
                  label="Grupo"
                  options={GROUPS}
                  value={group}
                  onChange={(v) => setGroup(v)}
                />

                <FilterChips
                  label="Entidade"
                  options={ENTITIES}
                  value={entity}
                  onChange={(v) => setEntity(v)}
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
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList className="rounded-full bg-muted p-1">
                  <TabsTrigger value="catalogo" className="rounded-full px-5">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Catálogo Pedigree
                  </TabsTrigger>
                  <TabsTrigger value="cadastro" className="rounded-full px-5">
                    <FileCheck2 className="mr-2 h-3.5 w-3.5" />
                    Cadastrar / Editar
                  </TabsTrigger>
                  <TabsTrigger
                    value="solicitacoes"
                    className="relative rounded-full px-5"
                  >
                    <GitBranch className="mr-2 h-3.5 w-3.5" />
                    Solicitações
                    {receivedRequests.filter((r) => r.status === "pendente").length > 0 && (
                      <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warm text-[10px] font-black text-warm-foreground animate-pulse">
                        {
                          receivedRequests.filter((r) => r.status === "pendente")
                            .length
                        }
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Notification banner for pending requests */}
              {receivedRequests.filter((r) => r.status === "pendente").length > 0 && currentTab !== "solicitacoes" && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-warm/40 bg-warm/10 p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warm/20 text-warm">
                      <GitBranch className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {receivedRequests.filter((r) => r.status === "pendente").length} autorização(ões) de linhagem pendente(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Outro tutor solicitou vínculo com seu pet na árvore genealógica.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setCurrentTab("solicitacoes")}
                    className="rounded-full bg-warm text-warm-foreground shadow-sm hover:bg-warm/90"
                  >
                    Revisar agora
                  </Button>
                </div>
              )}

              {/* CATALOG */}
              <TabsContent value="catalogo" className="space-y-8">
                {/* Pet Selector Bar */}
                {dogs.length > 0 && (
                  <div className="rounded-3xl border border-border/80 bg-card p-4 shadow-soft">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Selecione o Pet para Pedigree
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {dogs.length} {dogs.length === 1 ? "pet cadastrado" : "pets cadastrados"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                      {dogs.map((dog) => {
                        const isCurrent = selected?.id === dog.id;
                        return (
                          <button
                            key={dog.id}
                            type="button"
                            onClick={() => setSelected(dog)}
                            className={`group relative flex shrink-0 items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-left transition-all duration-300 ${
                              isCurrent
                                ? "border-primary bg-primary/10 shadow-glow"
                                : "border-border/70 bg-card hover:border-primary/50 hover:bg-muted/40"
                            }`}
                          >
                            <img
                              src={dog.img}
                              alt={dog.name}
                              className={`h-10 w-10 rounded-xl object-cover ring-2 transition-all ${
                                isCurrent ? "ring-primary scale-105" : "ring-border/60"
                              }`}
                            />
                            <div className="min-w-0 pr-1">
                              <p
                                className={`font-display text-xs font-bold leading-tight truncate ${
                                  isCurrent ? "text-primary" : "text-foreground"
                                }`}
                              >
                                {dog.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {dog.breed} · {dog.gender}
                              </p>
                            </div>
                            {isCurrent && (
                              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected dog certificate */}
                {selected && (
                  <DigitalCertificate
                    dog={selected}
                    certificateUrl={certificateUrl}
                  />
                )}

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
                        Toque em um card para abrir o certificado digital
                        completo.
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

                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Carregando registros genealógicos do banco de dados...
                      </p>
                    </div>
                  ) : dogs.length === 0 ? (
                    <Card className="p-10 text-center text-muted-foreground">
                      <p className="font-semibold text-foreground">
                        Nenhum pet cadastrado ainda
                      </p>
                      <p className="mt-1 text-sm">
                        Cadastre seu pet para emitir o certificado digital de
                        pedigree oficial com QR Code.
                      </p>
                      <div className="mt-4 flex justify-center">
                        <Button
                          asChild
                          size="sm"
                          className="rounded-full gradient-primary text-primary-foreground"
                        >
                          <Link to="/pets/novo">
                            <Plus className="mr-1.5 h-4 w-4" /> Cadastrar Pet
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ) : filtered.length === 0 ? (
                    <Card className="p-10 text-center text-muted-foreground">
                      Nenhum cão encontrado com esses filtros.
                    </Card>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {filtered.map((dog, i) => {
                        const isSelected = selected?.id === dog.id;
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
                                  <Calendar className="h-3 w-3 text-warm" />
                                  {dog.birth !== "Não informada" ? dog.birth : dog.age}
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
                                  <p className="font-black uppercase tracking-wider text-primary/70">
                                    Pai
                                  </p>
                                  <p className="truncate font-semibold text-foreground">
                                    {dog.parents?.father || "—"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-warm/20 bg-warm/10 px-2.5 py-1.5">
                                  <p className="font-black uppercase tracking-wider text-warm">
                                    Mãe
                                  </p>
                                  <p className="truncate font-semibold text-foreground">
                                    {dog.parents?.mother || "—"}
                                  </p>
                                </div>
                              </div>

                              {/* vet note */}
                              <div className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-[11px] text-foreground">
                                <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <p className="line-clamp-2 leading-snug">
                                  {dog.vetNote}
                                </p>
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
                <RegistrationForm
                  pets={dogs}
                  selectedPet={selected}
                  onSaved={fetchDogs}
                />
              </TabsContent>

              {/* REQUESTS */}
              <TabsContent value="solicitacoes">
                <RequestsManager
                  receivedRequests={receivedRequests}
                  sentRequests={sentRequests}
                  loading={loadingRequests}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onRefresh={loadRequests}
                />
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

const MetaChip = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-foreground">
    {children}
  </span>
);

const DogDetailModal = ({ dog, onClose, onViewCertificate, onViewTree }) => {
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-primary-foreground backdrop-blur">
                    <Calendar className="h-3 w-3 text-warm" />
                    {dog.birth !== "Não informada" ? dog.birth : dog.age}
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
                  <MetaChip>{dog.age || "2 anos"}</MetaChip>
                  <MetaChip>{dog.gender || "Macho"}</MetaChip>
                  <MetaChip>Porte {dog.size || "Médio"}</MetaChip>
                </div>

                {/* identity grid */}
                <dl className="mt-5 grid grid-cols-2 gap-2">
                  <DetailCell icon={FileText} label="Registro">
                    <span className="font-mono">{dog.registry}</span>
                  </DetailCell>
                  <DetailCell icon={Calendar} label="Nascimento">
                    {dog.birth}
                  </DetailCell>
                  <DetailCell icon={Palette} label="Pelagem">
                    {dog.color}
                  </DetailCell>
                  <DetailCell icon={MapPin} label="Cidade">
                    {dog.city}
                  </DetailCell>
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
                      {dog.parents?.father || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-warm/20 bg-warm/10 px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-warm">
                      Mãe
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {dog.parents?.mother || "—"}
                    </p>
                  </div>
                </div>

                {/* Vet note */}
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-[12px] text-foreground">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="leading-snug">
                    {dog.vetNote || "Acompanhamento veterinário e vacinas em dia."}
                  </p>
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

const DetailCell = ({ icon: Icon, label, children, wide }) => (
  <div
    className={`rounded-xl border border-border bg-card px-3 py-2 ${wide ? "col-span-2" : ""}`}
  >
    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3 text-primary" />
      {label}
    </div>
    <p className="mt-0.5 text-[13px] font-semibold text-foreground">
      {children}
    </p>
  </div>
);

const FilterChips = ({ label, options, value, onChange }) => (
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

const DigitalCertificate = ({ dog, certificateUrl }) => {
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
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {dog.entity || "CBKC"} Oficial
                </span>
                {dog.champion && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warm px-2 py-0.5 text-[10px] font-bold uppercase text-warm-foreground shadow-warm">
                    <Crown className="h-3 w-3" />
                    Campeão
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Nascimento: {dog.birth}
                </span>
              </div>
            </div>
          </div>

          {/* Pet Highlights strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Porte</p>
              <p className="mt-0.5 font-display text-base font-bold text-foreground">{dog.size || "Médio"}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sexo</p>
              <p className="mt-0.5 font-display text-base font-bold text-foreground">{dog.gender || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Microchip / Token</p>
              <p className="mt-0.5 font-mono text-xs font-bold text-foreground truncate">{dog.microchip || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Idade Estimada</p>
              <p className="mt-0.5 font-display text-base font-bold text-foreground">{dog.age || "—"}</p>
            </div>
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <InfoCell icon={Calendar} label="Nascimento" value={dog.birth} />
            <InfoCell
              icon={ShieldCheck}
              label="Registro"
              value={dog.registry || "—"}
            />
            <InfoCell icon={Dna} label="Pai" value={dog.parents?.father || "—"} />
            <InfoCell icon={Dna} label="Mãe" value={dog.parents?.mother || "—"} />
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
            <Button
              size="sm"
              className="rounded-full gradient-primary text-primary-foreground"
            >
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
                <ShieldCheck
                  className="mx-auto h-3.5 w-3.5 text-warm"
                  strokeWidth={2.5}
                />
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

const FamilyTree = ({ dog }) => {
  const [active, setActive] = useState("self");
  const [lineageView, setLineageView] = useState("all");

  const lin = dog.lineage || {};
  const defaultPhoto = BLANK_PET_IMAGE;

  const self = {
    id: "self",
    name: dog.name,
    role: dog.breed,
    gen: 0,
    side: "self",
    gender: dog.gender === "Macho" ? "M" : "F",
    img: dog.img,
    registry: dog.registry,
    champion: dog.champion,
    titles: dog.titles || ["Pet atual"],
  };
  const father = {
    id: "f",
    name:
      lin.pai_nome ||
      (lin.pai_pet_id ? "Pai Vinculado LivePet" : ""),
    role: "Pai",
    gen: 1,
    side: "paternal",
    gender: "M",
    img: defaultPhoto,
    registry: lin.pai_registro || "—",
    champion: Boolean(lin.pai_titulos),
    titles: lin.pai_titulos
      ? lin.pai_titulos.split(",").map((t) => t.trim())
      : lin.pai_nome
      ? ["Pai registrado"]
      : [],
  };
  const mother = {
    id: "m",
    name:
      lin.mae_nome ||
      (lin.mae_pet_id ? "Mãe Vinculada LivePet" : ""),
    role: "Mãe",
    gen: 1,
    side: "maternal",
    gender: "F",
    img: defaultPhoto,
    registry: lin.mae_registro || "—",
    champion: Boolean(lin.mae_titulos),
    titles: lin.mae_titulos
      ? lin.mae_titulos.split(",").map((t) => t.trim())
      : lin.mae_nome
      ? ["Mãe registrada"]
      : [],
  };
  const pGrandpa = {
    id: "pp",
    name: lin.avo_pat_m_nome || "",
    role: "Avô paterno",
    gen: 2,
    side: "paternal",
    gender: "M",
    img: defaultPhoto,
    registry: lin.avo_pat_m_registro || "—",
    champion: false,
    titles: lin.avo_pat_m_nome ? ["Ancestral paterno"] : [],
  };
  const pGrandma = {
    id: "pm",
    name: lin.avo_pat_f_nome || "",
    role: "Avó paterna",
    gen: 2,
    side: "paternal",
    gender: "F",
    img: defaultPhoto,
    registry: lin.avo_pat_f_registro || "—",
    champion: false,
    titles: lin.avo_pat_f_nome ? ["Ancestral paterna"] : [],
  };
  const mGrandpa = {
    id: "mp",
    name: lin.avo_mat_m_nome || "",
    role: "Avô materno",
    gen: 2,
    side: "maternal",
    gender: "M",
    img: defaultPhoto,
    registry: lin.avo_mat_m_registro || "—",
    champion: false,
    titles: lin.avo_mat_m_nome ? ["Ancestral materno"] : [],
  };
  const mGrandma = {
    id: "mm",
    name: lin.avo_mat_f_nome || "",
    role: "Avó materna",
    gen: 2,
    side: "maternal",
    gender: "F",
    img: defaultPhoto,
    registry: lin.avo_mat_f_registro || "—",
    champion: false,
    titles: lin.avo_mat_f_nome ? ["Ancestral materna"] : [],
  };

  const nodes = [self, father, mother, pGrandpa, pGrandma, mGrandpa, mGrandma];
  const findNode = (id) => nodes.find((n) => n.id === id);

  const ancestorsOf = {
    self: ["self", "f", "m", "pp", "pm", "mp", "mm"],
    f: ["f", "pp", "pm"],
    m: ["m", "mp", "mm"],
    pp: ["pp"],
    pm: ["pm"],
    mp: ["mp"],
    mm: ["mm"],
  };
  const highlight = new Set(ancestorsOf[active] ?? ["self"]);
  const focused = findNode(active);

  const inLineage = (n) =>
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
  };

  const sideKey = (side) => (side === "maternal" ? "warm" : "primary");

  const NodeCard = ({ n, size = "md" }) => {
    const visible = inLineage(n);
    const isHighlighted = highlight.has(n.id);
    const isActive = active === n.id;
    const s = sideStyles[sideKey(n.side)];
    const avatar =
      size === "lg"
        ? "h-20 w-20 sm:h-24 sm:w-24"
        : size === "md"
          ? "h-14 w-14 sm:h-16 sm:w-16"
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
        <span
          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${s.bar}`}
          aria-hidden="true"
        />
        <div className="relative shrink-0">
          {n.champion && (
            <span className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-accent-yellow p-0.5 shadow-warm">
              <Crown
                className="h-2.5 w-2.5 text-foreground"
                strokeWidth={2.5}
              />
            </span>
          )}
          <div
            className={`relative ${avatar} overflow-hidden rounded-full ring-2 ${s.ring} ring-offset-2 ring-offset-card`}
          >
            <img
              src={n.img}
              alt={n.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <span
            className={`absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black shadow-soft ${s.genderBg} ${s.genderText}`}
          >
            {n.gender === "M" ? "♂" : "♀"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-md ${s.chipBg} px-1.5 py-0.5 text-[9px] font-black tracking-wider ${s.chipText}`}
            >
              G{n.gen + 1}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {n.role}
            </span>
          </div>
          <p className="mt-0.5 font-display text-[13px] font-bold leading-tight text-foreground truncate">
            {n.name || "—"}
          </p>
          {n.registry && (
            <p className="font-mono text-[10px] text-muted-foreground/80 truncate">
              {n.registry}
            </p>
          )}
        </div>
      </button>
    );
  };

  const Connector = ({ side, variant }) => {
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
            <span
              className={`absolute left-1/2 top-[15%] bottom-[15%] w-px ${s.line}`}
            />
            <span
              className={`absolute left-1/2 top-[15%] h-px w-1/2 ${s.line}`}
            />
            <span
              className={`absolute left-1/2 bottom-[15%] h-px w-1/2 ${s.line}`}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      id="family-tree"
      className="relative overflow-hidden border-t-2 border-dashed border-border bg-gradient-to-b from-card via-card to-primary-soft/30 p-6 md:p-10 scroll-mt-24"
    >
      {/* decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-warm/15 blur-3xl" />
      </div>

      {/* header */}
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              <Dna className="h-3 w-3" />
              Linhagem oficial
            </span>
            {dog.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                🛡️ Verificado Oficial LivePet
              </span>
            ) : dog.isPending ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 ring-1 ring-amber-500/30">
                <Clock className="h-3.5 w-3.5" />
                ⏳ Vínculo Sob Autorização
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 ring-1 ring-blue-500/30">
                <FileText className="h-3.5 w-3.5" />
                📝 Registro Declaratório
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Árvore genealógica
          </h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Toque em qualquer ancestral para focar a linhagem.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 shadow-soft backdrop-blur">
          {[
            {
              id: "paternal",
              label: "Paterna",
              color: "bg-primary text-primary-foreground",
            },
            {
              id: "all",
              label: "Tudo",
              color: "bg-foreground text-background",
            },
            {
              id: "maternal",
              label: "Materna",
              color: "bg-warm text-warm-foreground",
            },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setLineageView(opt.id);
                setActive("self");
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                lineageView === opt.id
                  ? `${opt.color} shadow-soft`
                  : "text-muted-foreground hover:text-foreground"
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
              <LegendRow
                label="G1"
                title="Pet atual"
                desc="o próprio animal"
                tone="foreground"
              />
              <LegendRow
                label="G2"
                title="Pais"
                desc="pai e mãe"
                tone="primary"
              />
              <LegendRow
                label="G3"
                title="Avós"
                desc="4 ascendentes"
                tone="warm"
              />
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
              <LegendRow
                label="P"
                title="Paterna"
                desc="lado do pai"
                tone="primary"
                dot
              />
              <LegendRow
                label="M"
                title="Materna"
                desc="lado da mãe"
                tone="warm"
                dot
              />
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
            <img
              src={focused.img}
              alt={focused.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Em foco
            </p>
            <p className="font-display text-sm font-bold text-foreground">
              {focused.name || "Não informado"}
            </p>
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

const ColumnLabel = ({ label, tone }) => (
  <p
    className={`mb-2 text-center text-[9px] font-black uppercase tracking-[0.22em] ${
      tone === "primary"
        ? "text-primary"
        : tone === "warm"
          ? "text-warm"
          : "text-foreground"
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
};

const LegendRow = ({ label, title, desc, tone, dot }) => {
  const t = LEGEND_TONES[tone];
  return (
    <li
      className={`flex items-center gap-2.5 rounded-xl border ${t.wrap} px-2.5 py-2 transition-colors`}
    >
      <span
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.chip}`}
      >
        {dot ? (
          <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
        ) : (
          <span className="text-[11px] font-black tracking-wider">{label}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[11px] font-black uppercase tracking-wider leading-none ${t.text}`}
        >
          {title}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
          {desc}
        </p>
      </div>
    </li>
  );
};

const InfoCell = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-border bg-card px-3 py-2.5">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </div>
    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
  </div>
);

const RegistrationForm = ({ pets = [], selectedPet, onSaved }) => {
  const [targetPetId, setTargetPetId] = useState(
    selectedPet ? String(selectedPet.id) : pets[0] ? String(pets[0].id) : ""
  );
  const [loadingLineage, setLoadingLineage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form fields
  const [registro, setRegistro] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [paiNome, setPaiNome] = useState("");
  const [paiRegistro, setPaiRegistro] = useState("");
  const [paiTitulos, setPaiTitulos] = useState("");
  const [paiPetId, setPaiPetId] = useState(null);

  const [maeNome, setMaeNome] = useState("");
  const [maeRegistro, setMaeRegistro] = useState("");
  const [maeTitulos, setMaeTitulos] = useState("");
  const [maePetId, setMaePetId] = useState(null);

  const [avoPatMNome, setAvoPatMNome] = useState("");
  const [avoPatMRegistro, setAvoPatMRegistro] = useState("");
  const [avoPatFNome, setAvoPatFNome] = useState("");
  const [avoPatFRegistro, setAvoPatFRegistro] = useState("");

  const [avoMatMNome, setAvoMatMNome] = useState("");
  const [avoMatMRegistro, setAvoMatMRegistro] = useState("");
  const [avoMatFNome, setAvoMatFNome] = useState("");
  const [avoMatFRegistro, setAvoMatFRegistro] = useState("");

  const [currentLineage, setCurrentLineage] = useState(null);

  // Paternity search state
  const [paiMode, setPaiMode] = useState("manual"); // 'manual' | 'token'
  const [paiTokenInput, setPaiTokenInput] = useState("");
  const [searchingPai, setSearchingPai] = useState(false);
  const [foundPai, setFoundPai] = useState(null);
  const [paiSearchError, setPaiSearchError] = useState("");
  const [paiRequestStatus, setPaiRequestStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  // Maternity search state
  const [maeMode, setMaeMode] = useState("manual"); // 'manual' | 'token'
  const [maeTokenInput, setMaeTokenInput] = useState("");
  const [searchingMae, setSearchingMae] = useState(false);
  const [foundMae, setFoundMae] = useState(null);
  const [maeSearchError, setMaeSearchError] = useState("");
  const [maeRequestStatus, setMaeRequestStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  // Update targetPetId if selectedPet changes
  useEffect(() => {
    if (selectedPet) {
      setTargetPetId(String(selectedPet.id));
    }
  }, [selectedPet]);

  // Load lineage from DB whenever targetPetId changes
  useEffect(() => {
    if (!targetPetId) return;
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingLineage(true);
        const lin = await lineageService.getLineage(targetPetId);
        if (!isMounted) return;
        setCurrentLineage(lin);
        setRegistro(lin?.registro || "");
        setPaiNome(lin?.pai_nome || "");
        setPaiRegistro(lin?.pai_registro || "");
        setPaiTitulos(lin?.pai_titulos || "");
        setPaiPetId(lin?.pai_pet_id || null);

        setMaeNome(lin?.mae_nome || "");
        setMaeRegistro(lin?.mae_registro || "");
        setMaeTitulos(lin?.mae_titulos || "");
        setMaePetId(lin?.mae_pet_id || null);

        setAvoPatMNome(lin?.avo_pat_m_nome || "");
        setAvoPatMRegistro(lin?.avo_pat_m_registro || "");
        setAvoPatFNome(lin?.avo_pat_f_nome || "");
        setAvoPatFRegistro(lin?.avo_pat_f_registro || "");

        setAvoMatMNome(lin?.avo_mat_m_nome || "");
        setAvoMatMRegistro(lin?.avo_mat_m_registro || "");
        setAvoMatFNome(lin?.avo_mat_f_nome || "");
        setAvoMatFRegistro(lin?.avo_mat_f_registro || "");

        // Reset search boxes
        setFoundPai(null);
        setPaiSearchError("");
        setPaiRequestStatus(null);
        setFoundMae(null);
        setMaeSearchError("");
        setMaeRequestStatus(null);
      } catch (err) {
        console.warn("Linhagem não carregada para pet:", err);
      } finally {
        if (isMounted) setLoadingLineage(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [targetPetId]);

  const activePet = pets.find((p) => String(p.id) === String(targetPetId));

  useEffect(() => {
    if (activePet) {
      setDataNascimento(activePet.rawBirth || "");
    }
  }, [activePet]);

  const handleSearchPai = async () => {
    if (!paiTokenInput.trim()) return;
    try {
      setSearchingPai(true);
      setPaiSearchError("");
      const res = await lineageService.searchByToken(paiTokenInput.trim());
      setFoundPai(res);
      setPaiRequestStatus(null);
    } catch (err) {
      setPaiSearchError(err.message || "Pet não encontrado com este token.");
      setFoundPai(null);
    } finally {
      setSearchingPai(false);
    }
  };

  const handleRequestPai = async () => {
    if (!targetPetId || !foundPai) return;
    try {
      setPaiRequestStatus("sending");
      await lineageService.createRequest({
        filhote_pet_id: parseInt(targetPetId, 10),
        ascendente_pet_id: foundPai.id,
        tipo_vinculo: "pai",
        mensagem: `Solicitação de vínculo de paternidade para o filhote ${activePet?.name || "do tutor"}.`,
      });
      setPaiRequestStatus("sent");
      toast.success("Solicitação de autorização enviada com sucesso!", {
        description: `O tutor de ${foundPai.nome} recebeu o pedido. O pedigree será vinculado assim que for aprovado na aba Solicitações.`,
      });
    } catch (err) {
      toast.error("Erro ao solicitar autorização", {
        description: err.message || String(err),
      });
      setPaiRequestStatus("error");
    }
  };

  const handleSearchMae = async () => {
    if (!maeTokenInput.trim()) return;
    try {
      setSearchingMae(true);
      setMaeSearchError("");
      const res = await lineageService.searchByToken(maeTokenInput.trim());
      setFoundMae(res);
      setMaeRequestStatus(null);
    } catch (err) {
      setMaeSearchError(err.message || "Pet não encontrado com este token.");
      setFoundMae(null);
    } finally {
      setSearchingMae(false);
    }
  };

  const handleRequestMae = async () => {
    if (!targetPetId || !foundMae) return;
    try {
      setMaeRequestStatus("sending");
      await lineageService.createRequest({
        filhote_pet_id: parseInt(targetPetId, 10),
        ascendente_pet_id: foundMae.id,
        tipo_vinculo: "mae",
        mensagem: `Solicitação de vínculo de maternidade para o filhote ${activePet?.name || "do tutor"}.`,
      });
      setMaeRequestStatus("sent");
      toast.success("Solicitação de autorização enviada com sucesso!", {
        description: `O tutor de ${foundMae.nome} recebeu o pedido. O pedigree será vinculado assim que for aprovado na aba Solicitações.`,
      });
    } catch (err) {
      toast.error("Erro ao solicitar autorização", {
        description: err.message || String(err),
      });
      setMaeRequestStatus("error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPetId) return;
    try {
      setSaving(true);
      await lineageService.updateLineage(targetPetId, {
        registro: registro.trim() || null,
        pai_nome: paiNome.trim() || null,
        pai_registro: paiRegistro.trim() || null,
        pai_titulos: paiTitulos.trim() || null,
        pai_pet_id: paiPetId || currentLineage?.pai_pet_id || null,
        mae_nome: maeNome.trim() || null,
        mae_registro: maeRegistro.trim() || null,
        mae_titulos: maeTitulos.trim() || null,
        mae_pet_id: maePetId || currentLineage?.mae_pet_id || null,
        avo_pat_m_nome: avoPatMNome.trim() || null,
        avo_pat_m_registro: avoPatMRegistro.trim() || null,
        avo_pat_f_nome: avoPatFNome.trim() || null,
        avo_pat_f_registro: avoPatFRegistro.trim() || null,
        avo_mat_m_nome: avoMatMNome.trim() || null,
        avo_mat_m_registro: avoMatMRegistro.trim() || null,
        avo_mat_f_nome: avoMatFNome.trim() || null,
        avo_mat_f_registro: avoMatFRegistro.trim() || null,
      });

      if (dataNascimento !== (activePet?.rawBirth || "")) {
        try {
          await petsService.update(targetPetId, {
            data_nascimento: dataNascimento || null,
          });
        } catch (birthErr) {
          console.warn("Erro ao atualizar data de nascimento:", birthErr);
        }
      }

      setSaveSuccess(true);
      toast.success("Dados do pedigree salvos com sucesso!");
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      toast.error("Erro ao salvar pedigree", {
        description: err.message || String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/60 p-0 shadow-card">
      {/* Header */}
      <div className="border-b border-border/60 bg-foreground p-6 text-primary-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warm/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-warm">
              <Dna className="h-3 w-3" />
              Linhagem & Pedigree
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold">
              Cadastro e Gestão de Pedigree
            </h2>
            <p className="mt-1 text-xs text-primary-foreground/75 sm:text-sm">
              Vincule pais oficiais por token ou registre ancestrais manualmente para compor a árvore genealógica.
            </p>
          </div>

          {/* Pet Selector */}
          {pets.length > 0 && (
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">
                Selecione o Pet
              </Label>
              <select
                value={targetPetId}
                onChange={(e) => setTargetPetId(e.target.value)}
                className="h-10 rounded-xl border border-primary-foreground/20 bg-background/10 px-3 text-sm font-semibold text-primary-foreground backdrop-blur focus:bg-foreground focus:outline-none"
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id} className="text-foreground">
                    {p.name} ({p.breed})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Pet Banner */}
        {activePet && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary-foreground/10 p-3.5 backdrop-blur">
            <div className="flex items-center gap-3">
              <img
                src={activePet.img}
                alt={activePet.name}
                className="h-11 w-11 rounded-xl object-cover ring-2 ring-warm/40"
              />
              <div>
                <p className="font-display text-sm font-bold text-primary-foreground">
                  {activePet.name}
                </p>
                <p className="text-[11px] text-primary-foreground/70">
                  {activePet.breed} · Token: {activePet.microchip}
                </p>
              </div>
            </div>

            {/* Verification Status */}
            <div>
              {currentLineage?.status_verificacao === "aprovado" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/40">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verificado Oficial LivePet
                </span>
              ) : currentLineage?.status_verificacao === "pendente" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-amber-500/40">
                  <Clock className="h-3.5 w-3.5" />
                  Aguardando Autorização
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/20 px-3 py-1 text-[11px] font-bold text-primary-soft ring-1 ring-primary-soft/40">
                  <FileText className="h-3.5 w-3.5" />
                  Registro Declaratório
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="border-b border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm font-bold text-emerald-600">
          <CheckCircle2 className="inline-block mr-2 h-4 w-4" />
          Pedigree salvo com sucesso no banco de dados! A árvore genealógica já foi atualizada.
        </div>
      )}

      {loadingLineage ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando dados genealógicos...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 p-6">
          {/* Section: Official Pet Registry */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
              <Award className="h-4 w-4 text-primary" />
              Identificação Cinófila do Pet
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Número de Registro Oficial (CBKC / FCI / AKC)"
                placeholder="Ex.: CBKC 14.892 ou FCI 99.412"
                value={registro}
                onChange={(e) => setRegistro(e.target.value)}
              />
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Data de Nascimento
                </Label>
                <Input
                  type="date"
                  value={dataNascimento}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Token Público de Validação
                </Label>
                <Input
                  disabled
                  value={activePet ? activePet.registry : ""}
                  className="bg-muted font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Father (Pai) */}
          <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary-soft/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  ♂
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    Padreador (Pai)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Linhagem paterna oficial de 1ª geração
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-full border border-border bg-card p-1 text-[11px] font-bold shadow-soft">
                <button
                  type="button"
                  onClick={() => setPaiMode("manual")}
                  className={`rounded-full px-3 py-1 transition-all ${
                    paiMode === "manual"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setPaiMode("token")}
                  className={`rounded-full px-3 py-1 transition-all ${
                    paiMode === "token"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buscar no LivePet (Token)
                </button>
              </div>
            </div>

            {paiMode === "token" ? (
              <div className="space-y-3 rounded-xl border border-primary/30 bg-card p-4">
                <p className="text-xs text-muted-foreground">
                  Se o pai é de outro tutor e já possui cadastro no LivePet, informe o código do cartão ou token público para enviar uma solicitação de autorização.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex.: CBKC-A1B2C3D4 ou token completo"
                    value={paiTokenInput}
                    onChange={(e) => setPaiTokenInput(e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleSearchPai}
                    disabled={searchingPai || !paiTokenInput.trim()}
                    className="rounded-full gradient-primary text-primary-foreground"
                  >
                    {searchingPai ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>

                {paiSearchError && (
                  <p className="text-xs font-semibold text-destructive">
                    {paiSearchError}
                  </p>
                )}

                {foundPai && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-soft/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                        {foundPai.foto_url ? (
                          <img
                            src={foundPai.foto_url}
                            alt={foundPai.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-primary">
                            🐾
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {foundPai.nome} ({foundPai.raca || "SRD"})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Tutor: {foundPai.tutor?.nome || "Responsável"}
                          {foundPai.tutor?.nome_canil
                            ? ` · Canil: ${foundPai.tutor.nome_canil}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {paiRequestStatus === "sent" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                          Solicitação Enviada!
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRequestPai}
                          disabled={paiRequestStatus === "sending"}
                          className="rounded-full gradient-primary text-primary-foreground shadow-sm"
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                          Solicitar Autorização
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Nome do Pai"
                  placeholder="Ex.: Thor do Vale Imperial"
                  value={paiNome}
                  onChange={(e) => setPaiNome(e.target.value)}
                />
                <Field
                  label="Registro do Pai (CBKC/FCI)"
                  placeholder="Ex.: CBKC 09.412"
                  value={paiRegistro}
                  onChange={(e) => setPaiRegistro(e.target.value)}
                />
                <Field
                  label="Títulos e Premiações"
                  placeholder="Ex.: Campeão Brasileiro, BIS"
                  value={paiTitulos}
                  onChange={(e) => setPaiTitulos(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Section: Mother (Mãe) */}
          <div className="space-y-4 rounded-2xl border border-warm/30 bg-warm/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm text-xs font-bold text-warm-foreground">
                  ♀
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    Matriz (Mãe)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Linhagem materna oficial de 1ª geração
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-full border border-border bg-card p-1 text-[11px] font-bold shadow-soft">
                <button
                  type="button"
                  onClick={() => setMaeMode("manual")}
                  className={`rounded-full px-3 py-1 transition-all ${
                    maeMode === "manual"
                      ? "bg-warm text-warm-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setMaeMode("token")}
                  className={`rounded-full px-3 py-1 transition-all ${
                    maeMode === "token"
                      ? "bg-warm text-warm-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buscar no LivePet (Token)
                </button>
              </div>
            </div>

            {maeMode === "token" ? (
              <div className="space-y-3 rounded-xl border border-warm/30 bg-card p-4">
                <p className="text-xs text-muted-foreground">
                  Se a mãe é de outro tutor e já possui cadastro no LivePet, informe o código do cartão ou token público para enviar uma solicitação de autorização.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex.: CBKC-A1B2C3D4 ou token completo"
                    value={maeTokenInput}
                    onChange={(e) => setMaeTokenInput(e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleSearchMae}
                    disabled={searchingMae || !maeTokenInput.trim()}
                    className="rounded-full bg-warm text-warm-foreground hover:bg-warm/90"
                  >
                    {searchingMae ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>

                {maeSearchError && (
                  <p className="text-xs font-semibold text-destructive">
                    {maeSearchError}
                  </p>
                )}

                {foundMae && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warm/20 bg-warm/15 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                        {foundMae.foto_url ? (
                          <img
                            src={foundMae.foto_url}
                            alt={foundMae.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-warm">
                            🐾
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {foundMae.nome} ({foundMae.raca || "SRD"})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Tutor: {foundMae.tutor?.nome || "Responsável"}
                          {foundMae.tutor?.nome_canil
                            ? ` · Canil: ${foundMae.tutor.nome_canil}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {maeRequestStatus === "sent" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                          Solicitação Enviada!
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRequestMae}
                          disabled={maeRequestStatus === "sending"}
                          className="rounded-full bg-warm text-warm-foreground shadow-sm hover:bg-warm/90"
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                          Solicitar Autorização
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Nome da Mãe"
                  placeholder="Ex.: Luna da Mata Encantada"
                  value={maeNome}
                  onChange={(e) => setMaeNome(e.target.value)}
                />
                <Field
                  label="Registro da Mãe (CBKC/FCI)"
                  placeholder="Ex.: CBKC 09.118"
                  value={maeRegistro}
                  onChange={(e) => setMaeRegistro(e.target.value)}
                />
                <Field
                  label="Títulos e Premiações"
                  placeholder="Ex.: Campeã Sul-Americana"
                  value={maeTitulos}
                  onChange={(e) => setMaeTitulos(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Section: Grandparents (Geração III) */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
              <Dna className="h-4 w-4 text-warm" />
              Geração III · Avós (Opcional)
            </h3>
            <p className="text-xs text-muted-foreground">
              Preencha os nomes e registros dos avós paternos e maternos se constarem no certificado original.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Avô Paterno */}
              <div className="space-y-3 rounded-xl border border-primary/20 bg-card p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  👴 Avô Paterno (Pai do Pai)
                </span>
                <Field
                  label="Nome"
                  placeholder="Nome do avô paterno"
                  value={avoPatMNome}
                  onChange={(e) => setAvoPatMNome(e.target.value)}
                />
                <Field
                  label="Registro Oficial"
                  placeholder="Ex.: FCI 04.221"
                  value={avoPatMRegistro}
                  onChange={(e) => setAvoPatMRegistro(e.target.value)}
                />
              </div>

              {/* Avó Paterna */}
              <div className="space-y-3 rounded-xl border border-primary/20 bg-card p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  👵 Avó Paterna (Mãe do Pai)
                </span>
                <Field
                  label="Nome"
                  placeholder="Nome da avó paterna"
                  value={avoPatFNome}
                  onChange={(e) => setAvoPatFNome(e.target.value)}
                />
                <Field
                  label="Registro Oficial"
                  placeholder="Ex.: CBKC 04.118"
                  value={avoPatFRegistro}
                  onChange={(e) => setAvoPatFRegistro(e.target.value)}
                />
              </div>

              {/* Avô Materno */}
              <div className="space-y-3 rounded-xl border border-warm/25 bg-card p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warm">
                  👴 Avô Materno (Pai da Mãe)
                </span>
                <Field
                  label="Nome"
                  placeholder="Nome do avô materno"
                  value={avoMatMNome}
                  onChange={(e) => setAvoMatMNome(e.target.value)}
                />
                <Field
                  label="Registro Oficial"
                  placeholder="Ex.: AKC 04.502"
                  value={avoMatMRegistro}
                  onChange={(e) => setAvoMatMRegistro(e.target.value)}
                />
              </div>

              {/* Avó Materna */}
              <div className="space-y-3 rounded-xl border border-warm/25 bg-card p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warm">
                  👵 Avó Materna (Mãe da Mãe)
                </span>
                <Field
                  label="Nome"
                  placeholder="Nome da avó materna"
                  value={avoMatFNome}
                  onChange={(e) => setAvoMatFNome(e.target.value)}
                />
                <Field
                  label="Registro Oficial"
                  placeholder="Ex.: FCI 04.901"
                  value={avoMatFRegistro}
                  onChange={(e) => setAvoMatFRegistro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="rounded-full gradient-primary text-primary-foreground shadow-glow px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando dados...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  Salvar Dados do Pedigree
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

const RequestsManager = ({
  receivedRequests = [],
  sentRequests = [],
  loading = false,
  onApprove,
  onReject,
  onRefresh,
}) => {
  const pendingReceived = receivedRequests.filter((r) => r.status === "pendente");
  const historyReceived = receivedRequests.filter((r) => r.status !== "pendente");

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            Autorizações e Vínculos de Linhagem
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Gerencie as confirmações de paternidade e maternidade de pets entre tutores no LivePet.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Received Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warm/15 text-warm">
            <Clock className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">
            Solicitações Recebidas ({pendingReceived.length} pendentes)
          </h3>
        </div>

        {pendingReceived.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/60" />
            <p className="mt-2 font-semibold text-foreground">
              Nenhuma solicitação pendente no momento
            </p>
            <p className="text-xs">
              Quando outro tutor registrar um filhote e indicar seu pet como pai ou mãe via token, a autorização aparecerá aqui para você aprovar ou recusar.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingReceived.map((req) => {
              const filhoteNome = req.filhote_nome || req.filhote_pet?.nome || "Filhote";
              const filhoteRaca = req.filhote_raca || req.filhote_pet?.raca || "SRD";
              const filhoteFoto = req.filhote_foto_url || req.filhote_pet?.foto_url || BLANK_PET_IMAGE;
              const ascendenteNome = req.ascendente_nome || req.ascendente_pet?.nome || "Pet Ascendente";
              const solicitanteNome = req.solicitante_nome || req.solicitante?.nome || "Tutor Responsável";

              return (
                <Card
                  key={req.id}
                  className="overflow-hidden border-2 border-warm/40 bg-card p-5 shadow-card"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                        <img
                          src={filhoteFoto}
                          alt={filhoteNome}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-warm/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-warm">
                            Vínculo de {req.tipo_vinculo.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(req.criado_em).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-foreground">
                          Tutor {solicitanteNome} solicita vincular{" "}
                          <span className="text-primary font-bold">
                            {ascendenteNome}
                          </span>{" "}
                          como {req.tipo_vinculo} do filhote{" "}
                          <span className="font-bold underline">
                            {filhoteNome}
                          </span>{" "}
                          ({filhoteRaca}).
                        </p>
                        {req.mensagem && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            &ldquo;{req.mensagem}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center">
                      <Button
                        size="sm"
                        onClick={() => onApprove(req.id)}
                        className="rounded-full gradient-primary text-primary-foreground shadow-sm"
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Aprovar Vínculo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(req.id)}
                        className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* History */}
        {historyReceived.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Histórico de solicitações recebidas
            </h4>
            <div className="grid gap-2">
              {historyReceived.map((req) => {
                const filhoteNome = req.filhote_nome || req.filhote_pet?.nome || "Filhote";
                const ascendenteNome = req.ascendente_nome || req.ascendente_pet?.nome || "Pet Ascendente";
                const solicitanteNome = req.solicitante_nome || req.solicitante?.nome || "Tutor";

                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">
                        {ascendenteNome}
                      </span>{" "}
                      como {req.tipo_vinculo} de{" "}
                      <span className="font-semibold">{filhoteNome}</span>{" "}
                      (Tutor {solicitanteNome})
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "aprovado"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {req.status === "aprovado" ? "✓ Aprovado" : "Recusado"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sent Section */}
      <div className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Send className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">
            Solicitações Enviadas por Você ({sentRequests.length})
          </h3>
        </div>

        {sentRequests.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Você ainda não enviou solicitações de autorização de linhagem para outros tutores.
          </p>
        ) : (
          <div className="grid gap-3">
            {sentRequests.map((req) => {
              const filhoteNome = req.filhote_nome || req.filhote_pet?.nome || "Filhote";
              const filhoteRaca = req.filhote_raca || req.filhote_pet?.raca || "SRD";
              const ascendenteNome = req.ascendente_nome || req.ascendente_pet?.nome || "Pet";
              const solicitadoNome = req.solicitado_nome || req.solicitado?.nome || "Tutor Responsável";

              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">
                      Filhote: {filhoteNome} ({filhoteRaca})
                    </p>
                    <p className="text-muted-foreground">
                      Vínculo de {req.tipo_vinculo.toUpperCase()} solicitado para o pet{" "}
                      <span className="font-semibold text-foreground">
                        {ascendenteNome}
                      </span>{" "}
                      (Tutor {solicitadoNome})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "aprovado"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : req.status === "pendente"
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {req.status === "aprovado"
                        ? "✓ Aprovado"
                        : req.status === "pendente"
                        ? "⏳ Aguardando Tutor"
                        : "Recusado"}
                    </span>
                    {req.status === "pendente" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onReject(req.id)}
                        className="text-destructive h-7 text-xs px-2 hover:bg-destructive/10"
                        title="Cancelar solicitação enviada"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, ...props }) => (
  <div className="space-y-2">
    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <Input {...props} />
  </div>
);

export default Pedigree;

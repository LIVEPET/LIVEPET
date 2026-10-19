import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Check,
  Copy,
  Gift,
  HeartPulse,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  Syringe,
  Ticket,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { clinicService } from "@/services/api";

// Parceiros comerciais com benefícios e cupons
const staticPartners = [
  {
    id: "petz",
    name: "Petz",
    city: "Goiânia & Nacional",
    category: "Petshop",
    Icon: Store,
    contract: "LP-PETZ-2026",
    rating: 4.9,
    accent: "from-blue-600/25 to-sky-500/10",
    initials: "PZ",
    description:
      "Maior rede de petshops do Brasil com rações super premium, farmácia veterinária e entrega expressa.",
    perks: [
      "Frete grátis em compras acima de R$ 99",
      "Farmácia veterinária completa",
      "Pontos em dobro no clube de benefícios",
    ],
    coupons: [
      {
        code: "LIVEPET15",
        discount: "15% OFF",
        description:
          "Válido em rações, medicamentos e acessórios em todo o site e app.",
        minSpend: "R$ 150",
        rules: "Não cumulativo com outras promoções ativas.",
      },
      {
        code: "LIVEPRIME",
        discount: "R$ 30 OFF",
        description: "Desconto direto na primeira compra pelo app oficial.",
        minSpend: "R$ 120",
        rules: "Válido para novos usuários cadastrados.",
      },
    ],
  },
  {
    id: "cobasi",
    name: "Cobasi",
    city: "Goiânia, GO",
    category: "Petshop",
    Icon: Store,
    contract: "LP-COB-2026",
    rating: 4.8,
    accent: "from-amber-600/25 to-orange-500/10",
    initials: "CB",
    description:
      "Tudo para o seu pet e casa com atendimento especializado e marcas exclusivas.",
    perks: [
      "Desconto direto na assinatura de rações",
      "Retirada em loja em até 1 hora",
      "Variedade de brinquedos e petiscos naturais",
    ],
    coupons: [
      {
        code: "COBASILIVE10",
        discount: "10% OFF",
        description: "Desconto em qualquer categoria do catálogo online.",
        minSpend: "R$ 100",
        rules: "Válido para compras com cupom no carrinho.",
      },
    ],
  },
  {
    id: "spa-bichos",
    name: "Spa dos Bichos — Estética & Bem-Estar",
    city: "Goiânia, GO",
    category: "Estética",
    Icon: Scissors,
    contract: "LP-SPA-2026",
    rating: 4.9,
    accent: "from-purple-600/25 to-pink-500/10",
    initials: "SB",
    description:
      "Banho terapêutico com ozonioterapia, tosa higiênica e padrão da raça, hidratação profunda e cromoterapia.",
    perks: [
      "Secagem silenciosa e toalhas esterilizadas individuais",
      "Produtos hipoalergênicos e veganos",
      "Espaço sem gaiolas, com área de relaxamento",
    ],
    coupons: [
      {
        code: "BANHOVIP",
        discount: "Hidratação Grátis no Banho",
        description:
          "Ao agendar um banho completo, ganhe uma hidratação reconstrutora.",
        minSpend: "Pacote de banho",
        rules: "Válido de terça a quinta-feira com agendamento prévio.",
      },
    ],
  },
  {
    id: "centro-vacina",
    name: "Centro de Imunização Preventiva PetCare",
    city: "Goiânia, GO",
    category: "Vacinação",
    Icon: Syringe,
    contract: "LP-VAC-2026",
    rating: 4.9,
    accent: "from-rose-600/25 to-red-500/10",
    initials: "PC",
    description:
      "Vacinas importadas mantidas sob controle rigoroso de temperatura e registro instantâneo no LivePet.",
    perks: [
      "Vacinas importadas com garantia de refrigeração",
      "Integração imediata com o histórico de vacinas do LivePet",
      "Atendimento domiciliar disponível",
    ],
    coupons: [
      {
        code: "IMUNIZAR15",
        discount: "15% OFF",
        description:
          "Desconto em doses de V10, Antirrábica, Gripe ou Giárdiase.",
        minSpend: "R$ 80",
        rules: "Apresente o Cartão Animal LivePet no momento da aplicação.",
      },
    ],
  },
];

const categories = [
  { key: "Todos", label: "Todos", Icon: Sparkles },
  { key: "Clínica", label: "Clínicas Parceiras", Icon: Stethoscope },
  { key: "Petshop", label: "Petshops", Icon: Store },
  { key: "Estética", label: "Estética", Icon: Scissors },
  { key: "Vacinação", label: "Vacinação", Icon: Syringe },
];

export default function Partnerships() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [activePartner, setActivePartner] = useState(null);
  const [activeClinic, setActiveClinic] = useState(null);

  // Clínicas reais carregadas da API do banco de dados Neon
  const [dbClinics, setDbClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchClinics = async () => {
      try {
        setLoadingClinics(true);
        const data = await clinicService.listPublicClinics();
        if (isMounted && Array.isArray(data)) {
          setDbClinics(data);
        }
      } catch {
        if (isMounted) setDbClinics([]);
      } finally {
        if (isMounted) setLoadingClinics(false);
      }
    };
    fetchClinics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Formata número de WhatsApp e link oficial
  const getWhatsAppLink = (phoneOrWa, clinicName) => {
    if (!phoneOrWa) return null;
    const digits = phoneOrWa.replace(/\D/g, "");
    if (!digits) return null;
    const cleanNumber = digits.length <= 11 ? `55${digits}` : digits;
    const message = encodeURIComponent(
      `Olá! Encontrei o perfil da clínica ${clinicName || ""} no LivePet e gostaria de agendar uma consulta para meu pet.`
    );
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  // Mapeia clínicas do banco de dados para a estrutura de cards sincronizados
  const mappedDbClinics = useMemo(() => {
    return dbClinics.map((c) => ({
      id: `clinic-db-${c.id}`,
      realId: c.id,
      name: c.nome,
      city: c.endereco ? c.endereco.split("-")[1]?.trim() || c.endereco : "Brasil",
      address: c.endereco || "Atendimento sob agendamento",
      crmv: c.crmv || "CRMV Regular",
      cnpj: c.cnpj,
      phone: c.telefone || c.whatsapp || "",
      whatsapp: c.whatsapp || c.telefone || "",
      photoUrl: c.foto_url,
      category: "Clínica",
      Icon: Stethoscope,
      contract: `VET-${String(c.id).padStart(4, "0")}`,
      rating: 5.0,
      accent: "from-emerald-600/25 to-teal-500/10",
      initials: c.nome
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "CV",
      description:
        c.sobre ||
        "Clínica veterinária parceira credenciada na plataforma LivePet para consultas, exames e cuidados clínicos.",
      perks: [
        "Prontuário integrado em tempo real com seu LivePet",
        "Atendimento com profissionais com CRMV verificado",
        "Acesso direto para agendamento rápido via WhatsApp",
      ],
      isRealClinic: true,
      services: [
        { name: "Consulta Geral & Avaliação", price: "Sob consulta" },
        { name: "Vacinação & Imunização Preventiva", price: "Sob consulta" },
        { name: "Exames Laboratoriais e Imagem", price: "Sob consulta" },
        { name: "Cirurgias & Procedimentos Especiais", price: "Sob consulta" },
      ],
    }));
  }, [dbClinics]);

  // Lista unificada
  const allPartners = useMemo(() => {
    return [...mappedDbClinics, ...staticPartners];
  }, [mappedDbClinics]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPartners.filter((p) => {
      const matchesCat = category === "Todos" || p.category === category;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.contract.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.crmv && p.crmv.toLowerCase().includes(q))
      );
    });
  }, [allPartners, query, category]);

  const totalCoupons = staticPartners.reduce(
    (sum, p) => sum + (p.coupons ? p.coupons.length : 0),
    0
  );

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    toast({
      title: "Cupom copiado",
      description: `Use o código ${code} no checkout do parceiro.`,
    });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("Todos");
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden gradient-soft py-12 lg:py-16">
          <div className="blob -left-20 top-10 h-[320px] w-[320px] bg-primary/20" />
          <div className="container relative">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Rede Credenciada & Benefícios
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Encontre clínicas e parceiros{" "}
                <span className="italic text-primary">verificados</span>
              </h1>
              <p className="mt-3 text-muted-foreground text-base sm:text-lg">
                Consulte clínicas veterinárias parceiras em tempo real, chame direto no WhatsApp ou aproveite cupons de desconto exclusivos para a saúde do seu pet.
              </p>

              {/* Stats rápidas */}
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/70 p-2 shadow-card backdrop-blur sm:gap-1">
                <Stat value={allPartners.length} label="parceiros cadastrados" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <Stat value={mappedDbClinics.length} label="clínicas com WhatsApp" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <Stat value={totalCoupons} label="cupons ativos" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <Stat value="100%" label="sincronizados" />
              </div>
            </div>
          </div>
        </section>

        {/* Filtros em chips + busca */}
        <section className="sticky top-16 z-30 border-y border-border/60 bg-background/85 backdrop-blur-lg lg:top-20">
          <div className="container space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(({ key, label, Icon }) => {
                const isActive = category === key;
                const count =
                  key === "Todos"
                    ? allPartners.length
                    : allPartners.filter((p) => p.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-smooth ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                        : "border-border bg-card text-foreground hover:border-primary/50 hover:text-primary"
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="partner-search"
                  placeholder="Buscar por clínica, veterinário, serviço ou cidade..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-9"
                />

                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Limpar busca"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <strong className="text-foreground">{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "parceiro" : "parceiros"}
                {(query || category !== "Todos") && (
                  <button
                    onClick={clearFilters}
                    className="ml-2 text-primary font-medium hover:underline"
                  >
                    limpar filtros
                  </button>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Informações de facilidade */}
        <section className="container pt-8">
          <div className="grid gap-3 rounded-3xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3 sm:p-5">
            <Step
              n={1}
              title="Localize a clínica ideal"
              desc="Pesquise por especialidade, localização ou confira clínicas parceiras."
            />
            <Step
              n={2}
              title="Contato ágil no WhatsApp"
              desc="Converse diretamente com a equipe técnica da clínica com um clique."
            />
            <Step
              n={3}
              title="Prontuário 100% integrado"
              desc="Atendimentos realizados sincronizam vacinas e consultas no LivePet."
            />
          </div>
        </section>

        {/* Grid de clínicas e parceiros */}
        <section className="py-10">
          <div className="container">
            {loadingClinics && (
              <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-soft/30 p-3 text-xs text-primary animate-pulse">
                <Sparkles className="h-4 w-4" />
                <span>Sincronizando clínicas parceiras em tempo real com o banco de dados...</span>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
                <p className="text-muted-foreground text-lg">
                  Nenhum parceiro ou clínica encontrado{query && <> para "{query}"</>}.
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4 rounded-full"
                >
                  Limpar filtros de busca
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => {
                  const isClinic = p.isRealClinic;
                  const waUrl = getWhatsAppLink(p.whatsapp || p.phone, p.name);

                  return (
                    <article
                      key={p.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition-bounce hover:-translate-y-1 hover:shadow-glow"
                    >
                      {/* Banner do card com foto sincronizada */}
                      <div className={`relative h-28 bg-gradient-to-br ${p.accent}`}>
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur shadow-sm">
                          <p.Icon className="h-3.5 w-3.5 text-primary" /> {p.category}
                        </span>

                        {/* Avatar ou Logo da clínica sincronizado */}
                        <div className="absolute -bottom-8 left-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary text-xl font-bold text-primary-foreground shadow-soft">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{p.initials}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-4 p-6 pt-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-xl font-bold text-foreground">
                              {p.name}
                            </h3>
                            {isClinic && (
                              <span
                                title="Clínica parceira cadastrada e verificada no LivePet"
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                              >
                                <Check className="h-3 w-3" strokeWidth={3} /> Verificada
                              </span>
                            )}
                          </div>

                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {p.crmv && (
                              <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                                {p.crmv}
                              </span>
                            )}
                            {p.address && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{p.address}</span>
                              </span>
                            )}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {p.description}
                        </p>

                        {/* Benefícios destacados */}
                        <ul className="space-y-1.5">
                          {p.perks.slice(0, 3).map((perk, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-foreground/90"
                            >
                              <Check
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                                strokeWidth={3}
                              />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Ações inferiores */}
                        <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-4">
                          {isClinic ? (
                            <div className="flex items-center gap-2">
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1"
                                >
                                  <Button
                                    className="w-full gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft transition-smooth font-medium"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    Chamar no WhatsApp
                                  </Button>
                                </a>
                              ) : (
                                <Button
                                  disabled
                                  variant="outline"
                                  className="flex-1 rounded-full text-xs"
                                >
                                  Contato sob consulta
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                onClick={() => setActiveClinic(p)}
                                className="rounded-full shrink-0"
                              >
                                Ver Detalhes
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm">
                                <Ticket className="h-4 w-4" /> {p.coupons.length}{" "}
                                {p.coupons.length === 1 ? "cupom" : "cupons"}
                              </span>
                              <Button
                                onClick={() => setActivePartner(p)}
                                className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
                              >
                                <Gift className="h-4 w-4" /> Ver Cupons
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Reassurance */}
        <section className="border-t border-border/60 bg-muted/30 py-12">
          <div className="container grid gap-6 md:grid-cols-3">
            <Reassure
              icon={ShieldCheck}
              title="Atendimento Direto & Seguro"
              desc="Sem intermediários nem taxas extras. Você conversa e agenda diretamente com o profissional de confiança."
            />
            <Reassure
              icon={BadgePercent}
              title="Vínculo com Prontuário"
              desc="Ao ser atendido por clínicas parceiras, todas as vacinas e prescrições sincronizam no histórico do seu animal."
            />
            <Reassure
              icon={HeartPulse}
              title="Clínicas com CRMV Válido"
              desc="Priorizamos clínicas registradas para garantir a máxima segurança e excelência nos cuidados veterinários."
            />
          </div>
        </section>
      </main>

      {/* Modal de Detalhes da Clínica Parceira */}
      <Dialog open={!!activeClinic} onOpenChange={(o) => !o && setActiveClinic(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {activeClinic && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary text-lg font-bold text-primary-foreground">
                    {activeClinic.photoUrl ? (
                      <img
                        src={activeClinic.photoUrl}
                        alt={activeClinic.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{activeClinic.initials}</span>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="font-display text-2xl">
                      {activeClinic.name}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-foreground">{activeClinic.crmv}</span>
                      <span>·</span>
                      <span>{activeClinic.address}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Sobre a clínica */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Sobre a Clínica
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-muted/40 p-3 rounded-2xl border border-border/60">
                    {activeClinic.description}
                  </p>
                </div>

                {/* Serviços e procedimentos */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Serviços & Procedimentos
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeClinic.services.map((srv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card text-xs"
                      >
                        <span className="font-medium text-foreground">{srv.name}</span>
                        <span className="text-muted-foreground font-mono">{srv.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informações de contato direto */}
                <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Canais de Atendimento
                  </h4>
                  <div className="space-y-1.5 text-xs text-foreground">
                    {activeClinic.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span>{activeClinic.address}</span>
                      </div>
                    )}
                    {activeClinic.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <span>{activeClinic.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveClinic(null)}
                  className="rounded-full w-full sm:w-auto"
                >
                  Fechar
                </Button>

                {getWhatsAppLink(activeClinic.whatsapp || activeClinic.phone, activeClinic.name) && (
                  <a
                    href={getWhatsAppLink(activeClinic.whatsapp || activeClinic.phone, activeClinic.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex-1"
                  >
                    <Button className="w-full gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <MessageCircle className="h-4 w-4" />
                      Conversar no WhatsApp
                    </Button>
                  </a>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cupons de Parceiros Estáticos */}
      <Dialog open={!!activePartner} onOpenChange={(o) => !o && setActivePartner(null)}>
        <DialogContent className="max-w-lg">
          {activePartner && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {activePartner.name}
                </DialogTitle>
                <DialogDescription>
                  Contrato <code className="font-mono">{activePartner.contract}</code> · {activePartner.category}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                {activePartner.coupons.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/40 p-4"
                  >
                    <div>
                      <p className="font-display text-lg font-bold text-foreground">
                        {c.discount}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(c.code)}
                      className="rounded-full border-primary/40 bg-background font-mono text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> {c.code}
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setActivePartner(null)}
                  className="rounded-full"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="px-3 py-1 text-center">
      <span className="font-display text-lg font-bold text-foreground sm:text-xl">
        {value}
      </span>
      <span className="ml-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card/60 p-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Reassure({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

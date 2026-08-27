import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgePercent,
  Check,
  Copy,
  Gift,
  HeartPulse,
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

type Coupon = {
  code: string;
  discount: string;
  forWhat: string;
  howTo: string;
};

type Category = "Petshop" | "Clínica" | "Estética" | "Vacinação";

type Partner = {
  id: string;
  name: string;
  category: Category;
  initials: string;
  contract: string;
  city: string;
  rating: number;
  description: string;
  perks: string[];
  coupons: Coupon[];
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const partners: Partner[] = [
  {
    id: "petlar",
    name: "PetLar Megastore",
    category: "Petshop",
    initials: "PL",
    contract: "PT-2025-0014",
    city: "São Paulo, SP",
    rating: 4.9,
    description:
      "Rede de petshops com rações premium, brinquedos e acessórios. Entrega no mesmo dia em capitais.",
    perks: ["Frete grátis acima de R$ 99", "Programa de pontos PetLar", "Banho mensal com desconto"],
    coupons: [
      {
        code: "PETLAR15",
        discount: "15% OFF",
        forWhat: "Primeira compra de ração ou acessórios no site PetLar.",
        howTo: "Aplique o código no carrinho ao finalizar a compra. Válido 1x por tutor.",
      },
      {
        code: "BANHOPL",
        discount: "Banho + tosa por R$ 49",
        forWhat: "Banho e tosa higiênica em qualquer unidade física.",
        howTo: "Apresente o cupom no balcão ou agende pelo app PetLar com o código.",
      },
    ],
    accent: "from-primary/20 via-primary/5 to-transparent",
    Icon: Store,
  },
  {
    id: "vetcare",
    name: "VetCare Clínicas",
    category: "Clínica",
    initials: "VC",
    contract: "VC-2025-0089",
    city: "Rio de Janeiro, RJ",
    rating: 4.8,
    description:
      "Clínicas veterinárias com atendimento 24h, exames laboratoriais e cirurgias de pequeno porte.",
    perks: ["Consulta de retorno gratuita", "Telemedicina inclusa", "Plano anual com parcelamento"],
    coupons: [
      {
        code: "VETCARE20",
        discount: "20% OFF na consulta",
        forWhat: "Primeira consulta clínica geral em qualquer unidade VetCare.",
        howTo: "Agende pelo app, escolha 'Tenho cupom' e informe o código antes de confirmar.",
      },
      {
        code: "CHECKUP99",
        discount: "Check-up por R$ 99",
        forWhat: "Pacote de check-up anual: exame clínico + hemograma + urina.",
        howTo: "Solicite no balcão da unidade. Necessário pet cadastrado no app.",
      },
    ],
    accent: "from-warm/25 via-warm/5 to-transparent",
    Icon: Stethoscope,
  },
  {
    id: "pelopet",
    name: "Pelo Pet Estética",
    category: "Estética",
    initials: "PP",
    contract: "PP-2025-0042",
    city: "Belo Horizonte, MG",
    rating: 4.7,
    description:
      "Centro de estética animal especializado em raças de pelo longo, com produtos hipoalergênicos.",
    perks: ["Leva e traz grátis no bairro", "Tosa higiênica cortesia", "Hidratação premium inclusa"],
    coupons: [
      {
        code: "PELOPET10",
        discount: "10% OFF",
        forWhat: "Qualquer serviço de banho, tosa ou hidratação.",
        howTo: "Mostre o cupom no momento do agendamento ou na recepção.",
      },
    ],
    accent: "from-accent/30 via-accent/5 to-transparent",
    Icon: Scissors,
  },
  {
    id: "vacinabem",
    name: "VacinaBem",
    category: "Vacinação",
    initials: "VB",
    contract: "VB-2025-0007",
    city: "Atendimento nacional",
    rating: 5.0,
    description:
      "Aplicação de vacinas em domicílio com agendamento pelo app. Carteira digital sincronizada com seu pet.",
    perks: ["Vacinação em casa", "Lembretes automáticos", "Carteira digital integrada"],
    coupons: [
      {
        code: "VACINA25",
        discount: "25% OFF V10/V8",
        forWhat: "Vacinas múltiplas para cães e gatos aplicadas em domicílio.",
        howTo: "Selecione o pet no app, escolha a vacina e aplique o cupom no checkout.",
      },
      {
        code: "ANTIRABICA0",
        discount: "Antirrábica grátis",
        forWhat: "Aplicação de antirrábica anual em pets cadastrados há +6 meses.",
        howTo: "Disponível para assinantes Premium. Resgate na aba 'Meus cupons'.",
      },
    ],
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    Icon: Syringe,
  },
];

const categories: { key: Category | "Todos"; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "Todos", label: "Todos", Icon: Sparkles },
  { key: "Petshop", label: "Petshops", Icon: Store },
  { key: "Clínica", label: "Clínicas", Icon: Stethoscope },
  { key: "Estética", label: "Estética", Icon: Scissors },
  { key: "Vacinação", label: "Vacinação", Icon: Syringe },
];

const Partnerships = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "Todos">("Todos");
  const [active, setActive] = useState<Partner | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter((p) => {
      const matchesCat = category === "Todos" || p.category === category;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.contract.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const totalCoupons = partners.reduce((sum, p) => sum + p.coupons.length, 0);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    toast({ title: "Cupom copiado", description: `Use o código ${code} no checkout do parceiro.` });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("Todos");
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero — compacto e direto */}
        <section className="relative overflow-hidden gradient-soft py-12 lg:py-16">
          <div className="blob -left-20 top-10 h-[320px] w-[320px] bg-primary/20" />
          <div className="container relative">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Parcerias oficiais
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Economize com parceiros <span className="italic text-primary">verificados</span>
              </h1>
              <p className="mt-3 text-muted-foreground">
                Escolha uma categoria, copie o cupom e use no parceiro. Sem cadastro extra, sem cobrança.
              </p>

              {/* Stats rápidas */}
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/70 p-2 shadow-card backdrop-blur sm:gap-1">
                <Stat value={partners.length} label="parceiros" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <Stat value={totalCoupons} label="cupons ativos" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <Stat value="100%" label="verificados" />
              </div>
            </div>
          </div>
        </section>

        {/* Filtros — categorias em chips + busca */}
        <section className="sticky top-16 z-30 border-y border-border/60 bg-background/85 backdrop-blur-lg lg:top-20">
          <div className="container space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(({ key, label, Icon }) => {
                const isActive = category === key;
                const count =
                  key === "Todos" ? partners.length : partners.filter((p) => p.category === key).length;
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
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
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
                  placeholder="Buscar por nome, cidade ou contrato"
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
                Mostrando <strong className="text-foreground">{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "parceiro" : "parceiros"}
                {(query || category !== "Todos") && (
                  <button onClick={clearFilters} className="ml-2 text-primary hover:underline">
                    limpar filtros
                  </button>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Como funciona — 3 passos curtos */}
        <section className="container pt-10">
          <div className="grid gap-3 rounded-3xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3 sm:p-5">
            <Step n={1} title="Escolha o parceiro" desc="Filtre por categoria e clique em Ver cupons." />
            <Step n={2} title="Copie o código" desc="Um clique copia o cupom para a área de transferência." />
            <Step n={3} title="Use no parceiro" desc="Aplique o código no checkout ou no balcão." />
          </div>
        </section>

        {/* Grid de parceiros */}
        <section className="py-10">
          <div className="container">
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
                <p className="text-muted-foreground">
                  Nenhum parceiro encontrado{query && <> para "{query}"</>}.
                </p>
                <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-full">
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => {
                  const topCoupon = p.coupons[0];
                  return (
                    <article
                      key={p.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition-bounce hover:-translate-y-1 hover:shadow-glow"
                    >
                      <div className={`relative h-24 bg-gradient-to-br ${p.accent}`}>
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
                          <p.Icon className="h-3.5 w-3.5" /> {p.category}
                        </span>
                        <div className="absolute -bottom-8 left-6 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-card bg-primary text-xl font-bold text-primary-foreground shadow-soft">
                          {p.initials}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-4 p-6 pt-10">
                        <div>
                          <h3 className="font-display text-xl font-bold text-foreground">{p.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {p.city} · ★ {p.rating.toFixed(1)} · Contrato{" "}
                            <code className="font-mono">{p.contract}</code>
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>

                        {/* Destaque do melhor cupom */}
                        {topCoupon && (
                          <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                  Melhor oferta
                                </p>
                                <p className="truncate font-display text-lg font-bold text-foreground">
                                  {topCoupon.discount}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyCode(topCoupon.code)}
                                className="shrink-0 rounded-full border-primary/40 bg-background font-mono text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                              >
                                <Copy className="h-3.5 w-3.5" /> {topCoupon.code}
                              </Button>
                            </div>
                          </div>
                        )}

                        <ul className="space-y-1.5">
                          {p.perks.slice(0, 3).map((perk) => (
                            <li key={perk} className="flex items-start gap-2 text-sm text-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm">
                            <Ticket className="h-4 w-4" /> {p.coupons.length}{" "}
                            {p.coupons.length === 1 ? "cupom" : "cupons"}
                          </span>
                          <Button
                            onClick={() => setActive(p)}
                            className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
                          >
                            <Gift className="h-4 w-4" /> Ver cupons
                          </Button>
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
              title="Pagamento direto ao parceiro"
              desc="Não cobramos taxa nenhuma sobre os cupons. Você paga o parceiro pelo canal dele, com a economia já aplicada."
            />
            <Reassure
              icon={BadgePercent}
              title="Cupons sem letra miúda"
              desc="Cada cupom mostra exatamente para que serve, como usar e por quanto tempo é válido."
            />
            <Reassure
              icon={HeartPulse}
              title="Garantia de atendimento"
              desc="Se algo não for cumprido pelo parceiro, abra um chamado e nosso time resolve em até 48h."
            />
          </div>
        </section>
      </main>



      {/* Coupon dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{active.name}</DialogTitle>
                <DialogDescription>
                  Contrato <code className="font-mono">{active.contract}</code> · {active.category}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {active.coupons.map((c) => (
                  <div
                    key={c.code}
                    className="rounded-2xl border border-border bg-card p-4 transition-smooth hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-warm">
                          {c.discount}
                        </p>
                        <code className="mt-1 inline-block rounded-md bg-muted px-2 py-1 font-mono text-sm font-bold text-foreground">
                          {c.code}
                        </code>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => copyCode(c.code)}>
                        <Copy className="h-4 w-4" /> Copiar
                      </Button>
                    </div>

                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Para que serve
                        </dt>
                        <dd className="text-foreground">{c.forWhat}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Como conseguir
                        </dt>
                        <dd className="text-muted-foreground">{c.howTo}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Você não paga nada agora. O cupom é aplicado no checkout do parceiro.
                </p>
                <Button asChild className="rounded-full gradient-primary text-primary-foreground">
                  <Link to="/login">Resgatar na minha conta</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Stat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="flex items-center gap-2 px-3 py-1">
    <span className="font-display text-xl font-bold text-foreground">{value}</span>
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
  </div>
);

const Step = ({ n, title, desc }: { n: number; title: string; desc: string }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {n}
    </span>
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const Reassure = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
      <Icon className="h-5 w-5" />
    </span>
    <h3 className="mt-3 font-display text-lg font-bold text-foreground">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
  </div>
);

export default Partnerships;

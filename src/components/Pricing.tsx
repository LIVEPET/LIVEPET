import { useState } from "react";
import {
  Check,
  Sparkles,
  Crown,
  Heart,
  ShieldCheck,
  Stethoscope,
  Dna,
  HeartHandshake,
  Bell,
  MapPin,
  Users,
  CloudUpload,
  Headphones,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ctaPet from "@/assets/cta-pet.jpg";
import petLuna from "@/assets/pet-luna.jpg";
import petThor from "@/assets/pet-thor.jpg";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight: boolean;
  image: string;
  badge: string;
  tagline: string;
  perks: { icon: typeof Heart; title: string; text: string }[];
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "0",
    period: "para sempre",
    description: "Para começar a organizar a rotina do seu pet.",
    features: [
      "1 pet cadastrado",
      "Lembretes de vacina",
      "Carteira digital básica",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    highlight: false,
    image: petLuna,
    badge: "Gratuito",
    tagline: "O essencial para começar com o pé direito.",
    perks: [
      { icon: Heart, title: "1 pet cadastrado", text: "Crie o perfil completo do seu melhor amigo." },
      { icon: Bell, title: "Lembretes básicos", text: "Notificações de vacina e vermífugo." },
      { icon: ShieldCheck, title: "Carteira digital", text: "Guarde documentos essenciais no celular." },
      { icon: Headphones, title: "Suporte por e-mail", text: "Respondemos em até 48h úteis." },
    ],
  },
  {
    name: "Premium",
    price: "19",
    period: "/mês",
    description: "Tudo que você precisa pra cuidar com tranquilidade.",
    features: [
      "Até 5 pets cadastrados",
      "Lembretes inteligentes ilimitados",
      "Validação de pedigree oficial",
      "Agenda com vets parceiros",
      "Rastreamento em tempo real",
      "Suporte prioritário 24h",
    ],
    cta: "Assinar Premium",
    highlight: true,
    image: ctaPet,
    badge: "Mais popular",
    tagline: "O plano que 8 em cada 10 tutores escolhem para cuidar com tudo no lugar.",
    perks: [
      { icon: Heart, title: "Até 5 pets", text: "Cadastre toda a família peluda em uma só conta." },
      { icon: Bell, title: "Lembretes inteligentes", text: "IA sugere a melhor data e horário para cada cuidado." },
      { icon: Crown, title: "Pedigree validado", text: "Árvore genealógica oficial em até 24h." },
      { icon: Stethoscope, title: "Agenda com vets parceiros", text: "Marque consultas com até 30% de desconto." },
      { icon: MapPin, title: "Rastreamento em tempo real", text: "Saiba onde seu pet está, mesmo no passeio." },
      { icon: HeartHandshake, title: "Parcerias premium", text: "Cupons exclusivos com vets, petshops e estética." },
      { icon: Dna, title: "Compatibilidade genética", text: "Análise para acasalamentos seguros." },
      { icon: Headphones, title: "Suporte 24h", text: "Atendimento prioritário por chat e telefone." },
    ],
  },
  {
    name: "Família",
    price: "39",
    period: "/mês",
    description: "Para famílias com vários pets e múltiplos tutores.",
    features: [
      "Pets ilimitados",
      "Até 5 tutores na conta",
      "Pedigree verificado + árvore genealógica",
      "Histórico veterinário completo",
      "Backup em nuvem",
      "Atendimento dedicado",
    ],
    cta: "Conhecer Família",
    highlight: false,
    image: petThor,
    badge: "Para canis & criadores",
    tagline: "Gestão completa para quem tem vários pets ou divide os cuidados.",
    perks: [
      { icon: Heart, title: "Pets ilimitados", text: "Cadastre quantos animais quiser, sem limite." },
      { icon: Users, title: "Até 5 tutores", text: "Toda a família acessa e atualiza juntos." },
      { icon: Crown, title: "Pedigree + 4 gerações", text: "Árvore genealógica completa e exportável." },
      { icon: Stethoscope, title: "Histórico veterinário", text: "Linha do tempo médica de cada pet." },
      { icon: CloudUpload, title: "Backup em nuvem", text: "Tudo seguro, com criptografia de ponta." },
      { icon: HeartHandshake, title: "Parcerias prioritárias", text: "Acesso antecipado a novos cupons e parceiros." },
      { icon: Zap, title: "API & exportação", text: "Integre com sistemas de canil e clínicas." },
      { icon: Headphones, title: "Gerente dedicado", text: "Um humano sempre disponível pra você." },
    ],
  },
];

const trustItems = [
  { icon: ShieldCheck, text: "Cancele quando quiser" },
  { icon: Sparkles, text: "7 dias grátis no Premium" },
  { icon: Star, text: "Avaliação 4.9/5 por +30k tutores" },
];

const Pricing = () => {
  const [openPlan, setOpenPlan] = useState<Plan | null>(null);

  return (
    <section id="plans" className="relative overflow-hidden gradient-soft py-24">
      <div className="blob h-[400px] w-[400px] -left-20 top-40 bg-primary/20" />
      <div className="container relative">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-warm">Planos</span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl">
            Escolha o que <span className="italic text-primary">combina</span> com você
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cancele quando quiser. Sem fidelidade, sem pegadinhas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-[2rem] border p-8 transition-bounce hover:-translate-y-2 ${
                p.highlight
                  ? "gradient-primary border-transparent text-primary-foreground shadow-glow md:-translate-y-4 md:scale-105"
                  : "border-border/60 bg-card shadow-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-warm px-4 py-1 text-xs font-bold uppercase tracking-wider text-warm-foreground shadow-warm">
                  <Sparkles className="h-3 w-3" />
                  Mais popular
                </span>
              )}

              <h3 className={`font-display text-2xl font-bold ${p.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                {p.name}
              </h3>
              <p className={`mt-2 text-sm ${p.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {p.description}
              </p>

              <div className="mt-6 flex items-end gap-1">
                <span className={`text-sm font-semibold ${p.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>R$</span>
                <span className={`font-display text-5xl font-bold ${p.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                  {p.price}
                </span>
                <span className={`mb-2 text-sm ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {p.period}
                </span>
              </div>

              <ul className="my-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${p.highlight ? "bg-primary-foreground/20" : "bg-primary-soft"}`}>
                      <Check className={`h-3 w-3 ${p.highlight ? "text-primary-foreground" : "text-primary"}`} strokeWidth={3} />
                    </span>
                    <span className={p.highlight ? "text-primary-foreground/95" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                onClick={() => setOpenPlan(p)}
                className={`mt-auto rounded-full font-semibold ${
                  p.highlight
                    ? "bg-warm text-warm-foreground shadow-warm hover:bg-warm/90"
                    : "gradient-primary text-primary-foreground hover:shadow-soft"
                }`}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Plan details dialog */}
      <Dialog open={!!openPlan} onOpenChange={(o) => !o && setOpenPlan(null)}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
          {openPlan && (
            <div className="overflow-hidden">
              {/* Hero */}
              <div className="relative h-56 w-full overflow-hidden sm:h-64">
                <img
                  src={openPlan.image}
                  alt={`Plano ${openPlan.name}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute left-6 top-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warm px-3 py-1 text-xs font-bold uppercase tracking-wider text-warm-foreground shadow-warm">
                    <Crown className="h-3 w-3" /> {openPlan.badge}
                  </span>
                </div>
                <div className="absolute bottom-5 left-6 right-6">
                  <DialogHeader className="text-left">
                    <DialogTitle className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                      Plano {openPlan.name}
                    </DialogTitle>
                    <DialogDescription className="max-w-2xl text-base text-muted-foreground">
                      {openPlan.tagline}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              <div className="px-6 pb-8 pt-6 sm:px-8">
                {/* Price + CTA */}
                <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-end gap-1">
                    <span className="text-sm font-semibold text-muted-foreground">R$</span>
                    <span className="font-display text-5xl font-bold text-foreground">{openPlan.price}</span>
                    <span className="mb-2 text-sm text-muted-foreground">{openPlan.period}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {openPlan.highlight && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                        <Sparkles className="h-3 w-3" /> 7 dias grátis
                      </span>
                    )}
                    <Button
                      size="lg"
                      className="rounded-full bg-warm font-semibold text-warm-foreground shadow-warm hover:bg-warm/90"
                    >
                      {openPlan.cta}
                    </Button>
                  </div>
                </div>

                {/* Perks grid */}
                <h4 className="mt-8 font-display text-xl font-bold text-foreground">
                  O que está incluso
                </h4>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {openPlan.perks.map((perk) => {
                    const Icon = perk.icon;
                    return (
                      <div
                        key={perk.title}
                        className="group flex gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-bounce hover:-translate-y-0.5 hover:shadow-card"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-bounce group-hover:scale-110 group-hover:bg-warm group-hover:text-warm-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{perk.title}</p>
                          <p className="text-sm text-muted-foreground">{perk.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Trust bar */}
                <div className="mt-8 grid gap-3 rounded-2xl bg-primary-soft/60 p-5 sm:grid-cols-3">
                  {trustItems.map((t) => {
                    const Icon = t.icon;
                    return (
                      <div key={t.text} className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Icon className="h-4 w-4 text-primary" />
                        {t.text}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Pagamento seguro · Cancele a qualquer momento · Sem fidelidade
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Pricing;

import { Heart, ShieldCheck, Sparkles, Users, PawPrint, Award } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Confiança em primeiro lugar",
    desc: "Cada pet passa por avaliação veterinária e validação de pedigree antes de chegar até você.",
  },
  {
    icon: Heart,
    title: "Adoção responsável",
    desc: "Conectamos famílias certas aos pets certos com acompanhamento humano em todo o processo.",
  },
  {
    icon: Sparkles,
    title: "Tecnologia que cuida",
    desc: "Pedigree digital com QR Code, árvore genealógica interativa e ficha médica completa.",
  },
];

const stats = [
  { value: "+12k", label: "Pets cadastrados" },
  { value: "+850", label: "Veterinários parceiros" },
  { value: "98%", label: "Satisfação dos tutores" },
  { value: "24h", label: "Suporte humano" },
];

const About = () => {
  return (
    <section id="about" className="relative overflow-hidden py-24">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-50" />
      <div className="blob h-[420px] w-[420px] -left-24 top-10 bg-primary/20 animate-blob" />
      <div className="blob h-[360px] w-[360px] -right-20 bottom-10 bg-accent-warm/20 animate-blob" />
      <PawPrint className="pointer-events-none absolute left-[6%] top-[20%] h-8 w-8 text-primary/15 animate-float-y" />
      <PawPrint
        className="pointer-events-none absolute right-[10%] top-[30%] h-10 w-10 text-accent-warm/20 animate-float-y"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-2 text-xs font-semibold text-primary shadow-soft">
            <Users className="h-3.5 w-3.5" />
            Quem somos
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl">
            Uma plataforma feita por quem{" "}
            <span className="relative inline-block italic">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary-glow to-accent-warm bg-clip-text text-transparent animate-gradient">
                ama pets de verdade
              </span>
              <Heart className="absolute -right-7 -top-2 h-6 w-6 fill-accent-warm text-accent-warm animate-wiggle-slow" />
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Nascemos da ideia de que cada animal merece uma família que conheça sua história, sua
            saúde e sua linhagem. Unimos veterinários, criadores responsáveis e famílias em um só
            lugar — com tecnologia, transparência e muito carinho.
          </p>
        </div>

        {/* Story + Pillars */}
        <div className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-5">
          {/* Story card */}
          <div className="relative lg:col-span-2">
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/30 via-accent-warm/20 to-accent-yellow/30 opacity-60 blur-2xl" />
            <div className="relative h-full rounded-[1.75rem] border border-border/60 bg-card/90 p-7 shadow-card backdrop-blur-xl">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                <PawPrint className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">Nossa história</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Começamos pequenos, com a missão de combater o registro fraudulento de pedigrees e
                facilitar adoções responsáveis no Brasil.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Hoje somos uma comunidade que conecta tutores, veterinários e criadores em torno de
                um único propósito:{" "}
                <strong className="text-foreground">vidas felizes, lares felizes</strong>.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary-soft/50 p-3">
                <Award className="h-5 w-5 shrink-0 text-primary" />
                <p className="text-xs font-medium text-foreground">
                  Selo de transparência reconhecido por entidades veterinárias parceiras.
                </p>
              </div>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid gap-4 lg:col-span-3">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                style={{ animationDelay: `${i * 100}ms` }}
                className="group relative flex items-start gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow animate-pop-in"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <p.icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-foreground">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-3 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-card backdrop-blur sm:grid-cols-4 sm:gap-4 sm:p-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-secondary/40 p-4 text-center transition-all hover:-translate-y-1 hover:bg-primary-soft"
            >
              <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;

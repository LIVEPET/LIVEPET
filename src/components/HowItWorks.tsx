import { useState } from "react";
import { ShieldCheck, QrCode, Syringe, GitBranch, Heart, Users } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Validação de pedigree",
    description: "Certificados verificados com selo oficial e histórico de linhagem confiável.",
    anim: "animate-wiggle-slow",
  },
  {
    icon: QrCode,
    title: "Cartão Animal com QR Code",
    description: "Identificação digital instantânea com todos os dados essenciais do seu pet.",
    anim: "animate-float-y",
  },
  {
    icon: Syringe,
    title: "Carteira de vacinas",
    description: "Histórico completo, lembretes automáticos e alertas inteligentes.",
    anim: "animate-heartbeat",
  },
  {
    icon: GitBranch,
    title: "Árvore genealógica",
    description: "Visualize a linhagem paterna e materna em até 3 gerações de forma interativa.",
    anim: "animate-float-y",
  },
  {
    icon: Heart,
    title: "Match e adoção responsável",
    description: "Encontre o pet ideal com base em perfil, rotina e compatibilidade.",
    anim: "animate-heartbeat",
  },
  {
    icon: Users,
    title: "Rede de cuidados",
    description: "Tutores, veterinários e cuidadores conectados em torno do bem-estar do animal.",
    anim: "animate-wiggle-slow",
  },
];

const HowItWorks = () => {
  const [active, setActive] = useState(0);

  return (
    <section id="how" className="container relative py-24 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-1.5 text-xs font-semibold text-primary">
          Tudo o que você precisa
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
          Funcionalidades <span className="italic text-primary">essenciais</span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Passe o mouse ou toque em cada card para conhecer.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          const isActive = active === i;
          return (
            <button
              key={f.title}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={`group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition-bounce focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "border-primary/40 shadow-glow -translate-y-1"
                  : "border-border/60 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
              }`}
            >
              <div
                className={`pointer-events-none absolute inset-0 opacity-0 transition-smooth ${
                  isActive ? "opacity-100" : "group-hover:opacity-100"
                }`}
                style={{
                  background:
                    "radial-gradient(120% 80% at 0% 0%, hsl(var(--primary) / 0.10), transparent 60%)",
                }}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-bounce ${
                    isActive
                      ? "gradient-primary shadow-glow scale-110"
                      : "bg-primary/10 group-hover:gradient-primary group-hover:scale-110"
                  }`}
                >
                  {/* halo pulsante quando ativo */}
                  {isActive && (
                    <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/40 blur-xl animate-pulse" />
                  )}
                  <Icon
                    className={`h-6 w-6 transition-smooth ${
                      isActive
                        ? `text-primary-foreground ${f.anim}`
                        : "text-primary group-hover:text-primary-foreground"
                    }`}
                    strokeWidth={2.2}
                  />

                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </div>
              <div
                className={`mt-4 h-0.5 w-full origin-left rounded-full bg-gradient-to-r from-primary via-warm to-primary transition-bounce ${
                  isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;


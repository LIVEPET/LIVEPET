import { ShieldCheck, Wallet, Home, Bell, Calendar } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Saúde",
    description: "Vacinas, consultas e exames em dia com lembretes automáticos.",
    accent: "primary",
  },
  {
    icon: Bell,
    title: "Lembretes",
    description: "Alertas inteligentes para doses, vermífugos e retornos.",
    accent: "warm",
  },
  {
    icon: Wallet,
    title: "Documentos",
    description: "Carteira digital do pet sempre à mão no celular.",
    accent: "yellow",
  },
  {
    icon: Calendar,
    title: "Agenda",
    description: "Marque consultas direto com clínicas parceiras.",
    accent: "primary",
  },
  {
    icon: Home,
    title: "Adoção",
    description: "Encontre um novo lar com segurança e transparência.",
    accent: "warm",
  },
];

const accentStyles: Record<string, { bg: string; fg: string; ring: string }> = {
  primary: { bg: "bg-primary-soft", fg: "text-primary", ring: "group-hover:border-primary/40" },
  warm: { bg: "bg-warm/15", fg: "text-warm", ring: "group-hover:border-warm/40" },
  yellow: { bg: "bg-yellow/20", fg: "text-yellow", ring: "group-hover:border-yellow/40" },
};

const Features = () => {
  return (
    <section id="features" className="container relative py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
          Tudo num <span className="italic text-primary">só lugar</span>
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {features.map((f) => {
          const a = accentStyles[f.accent];
          return (
            <div
              key={f.title}
              className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center shadow-card transition-bounce hover:-translate-y-1 hover:shadow-soft ${a.ring}`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} transition-bounce group-hover:scale-110`}
              >
                <f.icon className={`h-5 w-5 ${a.fg}`} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Features;

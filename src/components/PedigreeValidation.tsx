import { Link } from "react-router-dom";
import { ShieldCheck, Crown, Award, Sparkles, Lock, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: ShieldCheck, label: "Verificação oficial junto a CBKC e Kennel Clubs" },
  { icon: Award, label: "Selo digital de autenticidade no perfil do pet" },
  { icon: Sparkles, label: "Árvore genealógica completa em até 4 gerações" },
];

const PedigreeValidation = () => {
  return (
    <section
      id="pedigree"
      className="relative overflow-hidden bg-foreground py-24 text-primary-foreground"
    >
      {/* decorative blobs */}
      <div className="blob h-[420px] w-[420px] -left-20 top-0 bg-primary/40 animate-blob" />
      <div className="blob h-[360px] w-[360px] -right-20 bottom-0 bg-warm/30" />

      {/* dotted pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary-foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="container relative grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div className="flex flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-warm/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-warm ring-1 ring-warm/40">
            <Crown className="h-3.5 w-3.5" />
            Recurso Premium
          </span>

          <h2 className="font-display text-4xl font-bold leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
            Validação de{" "}
            <span className="relative inline-block">
              <span className="relative z-10 italic text-warm">pedigree</span>
              <span className="absolute inset-x-0 bottom-1 -z-0 h-3 animate-shimmer rounded-full bg-warm/20" />
            </span>{" "}
            oficial.
          </h2>

          <p className="max-w-xl text-lg text-primary-foreground/75">
            Garanta a procedência do seu pet com verificação junto às principais entidades
            cinófilas. Documentação digital, árvore genealógica e selo de autenticidade —
            tudo num só lugar.
          </p>

          <ul className="space-y-4 pt-2">
            {benefits.map((b) => (
              <li key={b.label} className="flex items-start gap-3 text-base">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warm">
                  <Check className="h-4 w-4 text-warm-foreground" strokeWidth={3} />
                </span>
                <span className="text-primary-foreground/90">{b.label}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="group rounded-full bg-warm px-7 py-6 text-base font-bold text-warm-foreground shadow-warm transition-bounce hover:scale-105 hover:bg-warm"
            >
              <Link to="/pedigree">
                Validar meu pedigree
                <ArrowRight className="ml-2 h-5 w-5 transition-smooth group-hover:translate-x-1" />
              </Link>
            </Button>
            <a
              href="#plans"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/80 transition-smooth hover:text-warm"
            >
              <Lock className="h-4 w-4" />
              Disponível nos planos pagos
            </a>
          </div>
        </div>

        {/* Right visual: certificate card */}
        <div className="relative">
          {/* glow ring */}
          <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm/30 animate-pulse-ring" />

          <div className="relative mx-auto max-w-md rotate-[-2deg] rounded-[2rem] border-2 border-warm/30 bg-card p-7 text-foreground shadow-glow transition-bounce hover:rotate-0">
            {/* certificate header */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                  <Award className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Certificado oficial
                  </p>
                  <p className="font-display text-sm font-bold text-foreground">
                    LivePet · Pedigree
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-warm/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warm">
                #LP-2847
              </span>
            </div>

            {/* pet info */}
            <div className="mt-5 flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=200&q=80"
                alt="Thor — Golden Retriever"
                width={72}
                height={72}
                loading="lazy"
                className="h-18 w-18 rounded-2xl object-cover ring-4 ring-warm/20"
              />
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground">Thor</h3>
                <p className="text-xs text-muted-foreground">Golden Retriever · Macho</p>
                <p className="mt-1 text-[11px] font-semibold text-primary">CBKC · Reg. 12.847</p>
              </div>
            </div>

            {/* genealogy tree */}
            <div className="mt-6 rounded-2xl bg-primary-soft/60 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-primary">
                Árvore genealógica
              </p>
              <div className="space-y-2 text-xs">
                {[
                  { gen: "Pai", name: "Apollo do Vale", animDelay: "0s" },
                  { gen: "Mãe", name: "Zara dos Lagos", animDelay: "0.15s" },
                  { gen: "Avô paterno", name: "Rex Imperial", animDelay: "0.3s" },
                  { gen: "Avó materna", name: "Bella Aurora", animDelay: "0.45s" },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg bg-card px-3 py-2 opacity-0 [animation:fade-up_0.5s_ease-out_forwards]"
                    style={{ animationDelay: p.animDelay }}
                  >
                    <span className="font-medium text-muted-foreground">{p.gen}</span>
                    <span className="font-bold text-foreground">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* verified stamp */}
            <div className="absolute -right-4 -top-4 flex h-24 w-24 animate-stamp items-center justify-center rounded-full border-4 border-warm bg-card shadow-warm">
              <div className="text-center leading-tight">
                <ShieldCheck className="mx-auto h-5 w-5 text-warm" strokeWidth={2.5} />
                <p className="mt-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-warm">
                  Verificado
                </p>
              </div>
            </div>
          </div>

          {/* floating mini badge */}
          <div
            className="absolute -bottom-4 left-4 hidden animate-float items-center gap-2 rounded-full bg-card px-4 py-2 text-foreground shadow-card sm:flex"
            style={{ animationDelay: "0.8s" }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft">
              <Sparkles className="h-3 w-3 text-primary" />
            </span>
            <span className="text-xs font-bold">Aprovado em 48h</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PedigreeValidation;

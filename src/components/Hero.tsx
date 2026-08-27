import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Star, Heart, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroPets from "@/assets/hero-pets.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden gradient-mesh">
      <div className="blob h-[420px] w-[420px] -left-20 top-10 bg-warm/40" />
      <div className="blob h-[500px] w-[500px] -right-32 -top-20 bg-primary/30 animate-blob" />
      <div className="blob h-[300px] w-[300px] left-1/3 bottom-0 bg-yellow/20" />

      <div className="container relative grid gap-12 py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-28">
        <div className="flex flex-col gap-7 animate-fade-up">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-xs font-semibold text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-warm" />
            Validação de pedigree oficial
          </span>

          <h1 className="font-display text-4xl font-bold leading-[0.95] text-foreground text-balance sm:text-5xl lg:text-6xl">
            Cuidar do seu pet,{" "}
            <span className="italic text-primary">com amor</span> e organização.
          </h1>

          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            <span className="font-semibold text-foreground">Tudo o que você precisa:</span>{" "}
            validação de pedigree, Cartão Animal com QR Code, carteira de vacinas,
            árvore genealógica, match e adoção responsável, além da rede de cuidados do seu pet.
          </p>

          {/* CTA group — destaque máximo */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="relative">
              {/* glow pulse atrás do CTA */}
              <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-warm/50 blur-2xl animate-pulse" />
              <Button
                asChild
                size="lg"
                className="group h-14 rounded-full bg-warm px-8 text-base font-bold text-warm-foreground shadow-warm ring-2 ring-warm/30 ring-offset-2 ring-offset-background transition-bounce hover:scale-[1.04] hover:bg-warm/90 sm:h-16 sm:px-10 sm:text-lg"
              >
                <Link to="/login">
                  <PawPrint className="mr-2 h-5 w-5 animate-wiggle-slow" />
                  Começar grátis
                  <ArrowRight className="ml-2 h-5 w-5 transition-smooth group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <a
              href="#features"
              className="text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Ver recursos →
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-0.5 text-warm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              4.9 — +30 mil tutores
            </span>
          </div>
        </div>

        {/* Ilustração — pet ao invés de foto */}
        <div className="relative mx-auto w-full max-w-md animate-fade-up lg:max-w-lg" style={{ animationDelay: "120ms" }}>
          {/* halo gradiente */}
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-warm/30 via-yellow/20 to-primary/20 blur-3xl" />

          {/* circle backdrop */}
          <div className="relative aspect-square">
            {/* hearts and paws decor */}
            <Heart
              className="absolute -left-2 top-10 z-10 h-6 w-6 fill-warm/80 text-warm/80 animate-float-y"
              style={{ animationDelay: "0.2s" }}
            />
            <PawPrint
              className="absolute -right-2 top-6 z-10 h-5 w-5 text-primary/70 animate-float-y"
              style={{ animationDelay: "0.6s" }}
            />
            <Sparkles
              className="absolute right-2 bottom-12 z-10 h-5 w-5 text-accent-yellow animate-twinkle"
            />
            <Heart
              className="absolute left-2 bottom-8 z-10 h-4 w-4 fill-primary/60 text-primary/60 animate-float-y"
              style={{ animationDelay: "1.1s" }}
            />

            {/* foto Unsplash em moldura circular */}
            <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] shadow-glow ring-4 ring-card/70">
              <img
                src={heroPets}
                alt="Cão e gato felizes juntos"
                width={1200}
                height={1200}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-warm/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

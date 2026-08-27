import { useEffect, useState, useCallback } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const testimonials = [
  {
    quote:
      "Nunca mais esqueci uma vacina da Mel. O app me avisa com antecedência e ainda salva tudo certinho. Mudou a forma como cuido dela no dia a dia.",
    name: "Camila Reis",
    pet: "Tutora da Mel",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
  },
  {
    quote:
      "A carteira digital salvou minha vida na viagem. Mostrei tudo do Tom no aeroporto direto pelo celular, sem papelada nenhuma.",
    name: "Rodrigo Almeida",
    pet: "Tutor do Tom",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
  },
  {
    quote:
      "Validei o pedigree do meu Golden em minutos. Toda a árvore genealógica disponível, sem precisar correr atrás de papel velho.",
    name: "Beatriz Santos",
    pet: "Tutora da Luna",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
  },
  {
    quote:
      "O Match foi sucesso! Encontrei um parceiro saudável e validado para a minha cachorrinha. Processo seguro e super transparente.",
    name: "Lucas Pereira",
    pet: "Tutor da Bella",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=256&q=80",
  },
  {
    quote:
      "As parcerias com petshops me deram descontos reais. Já economizei mais do que paguei no plano em um mês só.",
    name: "Mariana Costa",
    pet: "Tutora do Thor",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
  },
];

const Testimonials = () => {
  const [autoplay] = useState(() =>
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", containScroll: false, dragFree: false },
    [autoplay],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <section className="relative overflow-hidden py-16">
      <div className="blob h-[320px] w-[320px] -left-20 top-10 bg-warm/20" />
      <div className="blob h-[360px] w-[360px] -right-24 bottom-0 bg-primary/20" />

      <div className="container relative">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-1.5 text-xs font-semibold text-primary">
            <Star className="h-3.5 w-3.5 fill-warm text-warm" />
            4.9 de 5 — +30 mil tutores
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
            Tutores que <span className="italic text-primary">amaram</span>
          </h2>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent sm:w-24" />

          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Depoimento anterior"
            className="absolute -left-1 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-card backdrop-blur transition-bounce hover:scale-110 hover:border-primary/40 hover:text-primary sm:left-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Próximo depoimento"
            className="absolute -right-1 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-card backdrop-blur transition-bounce hover:scale-110 hover:border-primary/40 hover:text-primary sm:right-2"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="overflow-hidden py-6" ref={emblaRef}>
            <div className="flex items-stretch">
              {testimonials.map((t, i) => {
                const isActive = i === selected;
                return (
                  <div
                    key={t.name}
                    className="min-w-0 shrink-0 grow-0 basis-[85%] px-2 sm:basis-[60%] md:basis-[45%] lg:basis-[36%]"
                  >
                    <div
                      onClick={() => emblaApi?.scrollTo(i)}
                      className={`group relative mx-auto h-full max-w-sm cursor-pointer overflow-hidden rounded-3xl border bg-card/80 p-7 backdrop-blur-md transition-all duration-500 ease-out ${
                        isActive
                          ? "border-primary/40 translate-y-0 scale-100 opacity-100 shadow-glow"
                          : "border-border/50 translate-y-3 scale-[0.92] opacity-50 blur-[1px] shadow-card hover:opacity-80 hover:blur-0"
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                          background:
                            "radial-gradient(120% 80% at 0% 0%, hsl(var(--primary) / 0.10), transparent 60%), radial-gradient(120% 80% at 100% 100%, hsl(var(--warm) / 0.12), transparent 60%)",
                        }}
                      />

                      <Quote
                        className={`absolute right-5 top-5 h-10 w-10 transition-all duration-500 ${
                          isActive ? "text-primary/25 rotate-180" : "text-primary/10 rotate-180"
                        }`}
                        strokeWidth={1.5}
                      />

                      <div className="relative flex items-center gap-3">
                        <div
                          className={`rounded-full p-[2px] transition-all duration-500 ${
                            isActive ? "gradient-primary" : "bg-border"
                          }`}
                        >
                          <img
                            src={t.avatar}
                            alt={t.name}
                            width={48}
                            height={48}
                            loading="lazy"
                            className="h-12 w-12 rounded-full border-2 border-card object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.pet}</p>
                        </div>
                      </div>

                      <p className="relative mt-5 text-sm leading-relaxed text-foreground">
                        “{t.quote}”
                      </p>

                      <div className="relative mt-5 flex items-center justify-between">
                        <div className="flex gap-0.5 text-warm">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Cliente verificado
                        </span>
                      </div>

                      <div
                        className={`absolute inset-x-0 bottom-0 h-1 origin-left rounded-b-3xl bg-gradient-to-r from-primary via-warm to-primary transition-transform duration-500 ${
                          isActive ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5">
            {snaps.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir para depoimento ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === selected ? "w-8 gradient-primary" : "w-1.5 bg-border hover:bg-warm/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

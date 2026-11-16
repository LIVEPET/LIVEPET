
import { useCallback, useEffect, useState } from "react";
import { Quote, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import EmptyState from "@/components/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { testimonialsService } from "@/services/api";

const getInitials = (name) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [autoplay] = useState(() =>
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      containScroll: false,
      dragFree: false,
    },
    [autoplay]
  );

  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState([]);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await testimonialsService.list();

      if (!Array.isArray(data)) {
        throw new Error("A API retornou um formato de depoimentos inválido.");
      }

      const validTestimonials = data.map((item) => {
        if (
          item?.id === undefined ||
          item?.id === null ||
          typeof item.nome_tutor !== "string" ||
          !item.nome_tutor.trim() ||
          typeof item.texto !== "string" ||
          !item.texto.trim()
        ) {
          throw new Error("A API retornou um depoimento com dados inválidos.");
        }

        return {
          id: item.id,
          nome_tutor: item.nome_tutor.trim(),
          texto: item.texto.trim(),
        };
      });

      setTestimonials(validTestimonials);
      setSelected(0);
    } catch (err) {
      console.error("Erro ao carregar depoimentos:", err);
      setTestimonials([]);
      setError(
        "Não foi possível carregar os depoimentos. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.reInit();
    setSnaps(emblaApi.scrollSnapList());
    onSelect();

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect, testimonials]);

  const hasMultipleSlides = snaps.length > 1;

  const slideBasis =
    testimonials.length === 1
      ? "basis-full"
      : testimonials.length === 2
        ? "basis-[85%] sm:basis-[60%] md:basis-1/2"
        : "basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[36%]";

  return (
    <section className="relative overflow-hidden py-16">
      <div className="blob h-[320px] w-[320px] -left-20 top-10 bg-warm/20" />
      <div className="blob h-[360px] w-[360px] -right-24 bottom-0 bg-primary/20" />

      <div className="container relative">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
            Histórias de quem confia na{" "}
            <span className="italic text-primary">LivePet</span>
          </h2>
        </div>

        {loading && (
          <div
            className="flex gap-4 overflow-hidden py-6"
            aria-label="Carregando depoimentos"
            aria-busy="true"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="min-w-0 shrink-0 basis-[85%] rounded-3xl border border-border/50 bg-card/80 p-7 sm:basis-[60%] md:basis-[45%] lg:basis-[36%]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            className="mx-auto max-w-xl rounded-2xl border border-border bg-card/80 px-6 py-10 text-center"
            role="alert"
          >
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={loadTestimonials}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && testimonials.length === 0 && (
          <EmptyState
            title="Nenhum depoimento ainda"
            description="Ainda não temos depoimentos. Cadastre seu pet e conte como foi."
            compact
            className="mx-auto max-w-2xl"
          />
        )}

        {!loading && !error && testimonials.length > 0 && (
          <div className="relative">
            {hasMultipleSlides && (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent sm:w-24" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent sm:w-24" />

                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  aria-label="Depoimento anterior"
                  className="absolute -left-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-card backdrop-blur transition-bounce hover:scale-110 hover:border-primary/40 hover:text-primary sm:left-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  aria-label="Próximo depoimento"
                  className="absolute -right-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-card backdrop-blur transition-bounce hover:scale-110 hover:border-primary/40 hover:text-primary sm:right-2"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="overflow-hidden py-6" ref={emblaRef}>
              <div className="flex items-stretch">
                {testimonials.map((testimonial, index) => {
                  const isActive = index === selected;

                  return (
                    <div
                      key={testimonial.id}
                      className={`min-w-0 shrink-0 grow-0 px-2 ${slideBasis}`}
                    >
                      <article
                        className={`group relative mx-auto h-full max-w-sm overflow-hidden rounded-3xl border bg-card/80 p-7 backdrop-blur-md transition-all duration-500 ease-out ${
                          isActive
                            ? "translate-y-0 scale-100 border-primary/40 opacity-100 shadow-glow"
                            : "translate-y-3 scale-[0.92] border-border/50 opacity-50 blur-[1px] shadow-card"
                        }`}
                      >
                        <Quote
                          aria-hidden="true"
                          className={`absolute right-5 top-5 h-10 w-10 rotate-180 transition-all duration-500 ${
                            isActive ? "text-primary/25" : "text-primary/10"
                          }`}
                          strokeWidth={1.5}
                        />

                        <div className="relative flex items-center gap-3">
                          <div
                            className={`rounded-full p-[2px] transition-all duration-500 ${
                              isActive ? "gradient-primary" : "bg-border"
                            }`}
                          >
                            <Avatar className="h-12 w-12 border-2 border-card">
                              <AvatarFallback
                                aria-label={`Iniciais de ${testimonial.nome_tutor}`}
                                className="bg-primary/10 font-semibold text-primary"
                              >
                                {getInitials(testimonial.nome_tutor)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <p className="text-sm font-bold text-foreground">
                            {testimonial.nome_tutor}
                          </p>
                        </div>

                        <blockquote className="relative mt-5 text-sm leading-relaxed text-foreground">
                          “{testimonial.texto}”
                        </blockquote>

                        <div
                          className={`absolute inset-x-0 bottom-0 h-1 origin-left rounded-b-3xl bg-gradient-to-r from-primary via-warm to-primary transition-transform duration-500 ${
                            isActive ? "scale-x-100" : "scale-x-0"
                          }`}
                        />
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>

            {hasMultipleSlides && (
              <div className="mt-6 flex items-center justify-center gap-1.5">
                {snaps.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`Ir para depoimento ${index + 1}`}
                    aria-current={index === selected ? "true" : undefined}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === selected
                        ? "w-8 gradient-primary"
                        : "w-1.5 bg-border hover:bg-warm/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;

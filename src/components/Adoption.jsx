import { Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const pets = [];

const Adoption = () => {
  return (
    <section id="adoption" className="container py-24">
      <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-warm">
            Adoção responsável
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl">
            Pets esperando por um{" "}
            <span className="italic text-primary">novo lar</span>
          </h2>
        </div>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-primary/30 px-6 text-primary hover:bg-primary-soft hover:text-primary"
        >
          <Link to="/vitrine-pet?tipo=adocao">Explorar pets para adoção</Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pets.map((p) => (
          <div
            key={p.name}
            className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition-bounce hover:-translate-y-2 hover:shadow-soft"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={p.img}
                alt={`${p.name}, pet para adoção em ${p.city}`}
                width={512}
                height={512}
                loading="lazy"
                className="h-full w-full object-cover transition-bounce group-hover:scale-110"
              />

              <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-bold text-foreground backdrop-blur">
                {p.tag}
              </span>
              <button
                aria-label={`Favoritar ${p.name}`}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-warm backdrop-blur transition-bounce hover:scale-110 hover:bg-warm hover:text-warm-foreground"
              >
                <Heart className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-bold text-foreground">
                  {p.name}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {p.age}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {p.city}
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 w-full rounded-full gradient-primary text-primary-foreground hover:shadow-soft"
              >
                <Link to="/pets">Quero conhecer</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Adoption;

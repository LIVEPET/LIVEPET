import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Search, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestions = [
  { label: "Meus Pets", to: "/pets" },
  { label: "MatchPet", to: "/matchpet" },
  { label: "Pedigree", to: "/pedigree" },
  { label: "Histórico Veterinário", to: "/historico-medico" },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary-soft/30 to-background px-4 py-20">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-warm/10 blur-3xl" />

      <div className="relative mx-auto max-w-xl text-center animate-fade-up">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft text-primary shadow-soft">
          <PawPrint className="h-10 w-10" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Erro 404</p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Página não encontrada
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          O caminho <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{location.pathname}</code> não existe ou foi movido.
          Que tal voltar para um lugar familiar?
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button asChild className="rounded-full gradient-primary text-primary-foreground shadow-soft transition-smooth hover:shadow-glow">
            <Link to="/">
              <Home className="h-4 w-4" /> Ir para o início
            </Link>
          </Button>
        </div>

        <div className="mt-10">
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Search className="h-3.5 w-3.5" /> Sugestões para você
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;

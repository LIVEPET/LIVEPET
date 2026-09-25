import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTABanner = () => {
  return (
    <section className="container py-12">
      <div className="relative overflow-hidden rounded-3xl gradient-primary px-8 py-10 shadow-glow md:px-16 md:py-14">
        <div className="relative z-10 flex flex-col items-start gap-4 md:items-center md:text-center">
          <h3 className="font-display text-2xl font-bold leading-tight text-primary-foreground text-balance md:text-3xl">
            Cuide melhor do seu pet hoje.
          </h3>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Sem cartão. Cadastre pets e teste grátis.
          </p>
          <Button
            asChild
            size="lg"
            className="group mt-2 rounded-full bg-warm px-6 py-5 text-base font-bold text-warm-foreground shadow-warm transition-bounce hover:scale-105 hover:bg-warm"
          >
            <Link to="/login">
              Criar conta grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-smooth group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;

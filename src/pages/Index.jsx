import { useEffect, useState } from "react";
import { statsService } from "@/services/api";

import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";

const Index = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const data = await statsService.get();

        const fields = ["tutores", "pets", "vacinas", "clinicas"];

        const isValid =
          data &&
          typeof data === "object" &&
          fields.every(
            (field) =>
              Number.isSafeInteger(data[field]) && data[field] >= 0,
          );

        if (!isValid) {
          throw new Error("Resposta inválida da API de estatísticas.");
        }

        if (active) {
          setStats(data);
        }
      } catch {
        if (active) {
          setStats(null);
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-background [&>section]:scroll-mt-24">
      <Hero stats={stats} loading={loading} error={error} />

      <div className="space-y-24 sm:space-y-28 lg:space-y-32">
        <Stats stats={stats} loading={loading} error={error} />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTABanner />
      </div>
    </div>
  );
};

export default Index;
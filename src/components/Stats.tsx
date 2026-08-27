import { PawPrint, Syringe, Smile, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  {
    value: 30,
    suffix: "k+",
    label: "Pets cadastrados",
    icon: PawPrint,
    accent: "from-primary/20 to-primary/5",
    iconClass: "text-primary",
    anim: "group-hover:rotate-12",
  },
  {
    value: 120,
    suffix: "k",
    label: "Vacinas registradas",
    icon: Syringe,
    accent: "from-warm/25 to-warm/5",
    iconClass: "text-warm",
    anim: "group-hover:-rotate-12",
  },
  {
    value: 98,
    suffix: "%",
    label: "Tutores satisfeitos",
    icon: Smile,
    accent: "from-yellow/30 to-yellow/5",
    iconClass: "text-accent-yellow",
    anim: "group-hover:scale-110",
  },
  {
    value: 7,
    suffix: "k+",
    label: "Adoções felizes",
    icon: Heart,
    accent: "from-primary/20 to-warm/10",
    iconClass: "text-primary",
    anim: "group-hover:scale-125 group-hover:fill-primary",
  },
];

const useCountUp = (target: number, start: boolean, duration = 1400) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
};

const Stats = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="container relative -mt-10 pb-12">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/90 p-6 shadow-card backdrop-blur-sm sm:p-8"
      >
        {/* glow decor */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-warm/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const n = useCountUp(s.value, visible);
            return (
              <div
                key={s.label}
                className="group relative flex flex-col items-center gap-3 rounded-2xl p-4 transition-bounce hover:-translate-y-1 hover:bg-background/60"
                style={{
                  animation: visible ? `fade-up 0.6s ease-out ${i * 100}ms both` : undefined,
                }}
              >
                <div
                  className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.accent} ring-1 ring-border/50 transition-bounce`}
                >
                  <Icon className={`h-7 w-7 ${s.iconClass} transition-bounce ${s.anim}`} />
                  <span className="pointer-events-none absolute inset-0 rounded-2xl bg-current opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20" />
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-extrabold leading-none text-foreground tabular-nums sm:text-4xl">
                    {n}
                    <span className="text-primary">{s.suffix}</span>
                  </p>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm sm:normal-case sm:tracking-normal">
                    {s.label}
                  </p>
                </div>
                {/* divider entre cards no desktop */}
                {i < stats.length - 1 && (
                  <span className="pointer-events-none absolute right-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-border to-transparent lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;

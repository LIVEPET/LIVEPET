import { ShieldCheck, Lock, Headphones, Clock } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Seguro e confiável" },
  { icon: Lock, label: "Seus dados protegidos" },
  { icon: Headphones, label: "Suporte especializado" },
  { icon: Clock, label: "Disponível 24h" },
];

const TrustBar = () => {
  return (
    <section className="border-t border-border/60 bg-background py-8">
      <div className="container">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((i) => (
            <div key={i.label} className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <i.icon className="h-4 w-4 text-primary" />
              {i.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;

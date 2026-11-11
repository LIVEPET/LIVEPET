import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Como cadastro meu pet?",
    a: "Basta acessar a área de cadastro no painel p>
  },
  {
    q: "Quem pode ver os dados do meu pet?",
    a: "Os dados do seu pet são privados e vinculado>
  },
  {
    q: "Como funciona o agendamento de consultas?",
    a: "Você pode escolher o profissional disponível>
  },
  {
    q: "Consigo acompanhar o histórico médico do pet>
    a: "Sim, todas as consultas, exames realizados, >
  },
  {
    q: "O sistema envia lembretes de vacinação?",
    a: "Sim, a plataforma gera notificações automáti>
  }
];
const FAQ = () => {
  return (
    <section className="container relative py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
          Dúvidas <span className="italic text-primary">comuns</span>
        </h2>
      </div>

      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="overflow-hidden rounded-xl border border-border/60 bg-card px-5 shadow-card data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="py-4 text-left text-sm font-bold text-foreground hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;

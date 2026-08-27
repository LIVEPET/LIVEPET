import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "O Live Pet é gratuito?",
    a: "Sim. O plano Free cadastra 1 pet com lembretes básicos para sempre.",
  },
  {
    q: "Como funciona a validação de pedigree?",
    a: "Disponível nos planos pagos. Envie o documento e validamos em até 48h com selo digital.",
  },
  {
    q: "Quantos pets posso cadastrar?",
    a: "Free: 1. Premium: 5. Família: ilimitados.",
  },
  {
    q: "Como funcionam os lembretes?",
    a: "O app avisa com antecedência por push, e-mail e WhatsApp.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sem fidelidade. Cancele no app e use até o fim do ciclo pago.",
  },
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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Como cadastro meu pet?", 
    a: "Basta acessar a área de cadastro no painel principal, preencher o nome, espécie, raça e idade do seu pet para criar o perfil dele na plataforma rapidamente." },
  { q: "Quem pode ver os dados do meu pet?", 
    a: "Os dados do seu pet são privados e vinculados à sua conta. Apenas você e os profissionais autorizados na clínica possuem acesso às informações cadastradas." }, 
  { q: "Como funciona o agendamento de consultas?", 
    a: "Você pode escolher o profissional disponível, selecionar o melhor dia e horário na agenda e confirmar a consulta diretamente pelo painel do usuário." }, 
  { q: "Consigo acompanhar o histórico médico do pet?", 
    a: "Sim, todas as consultas, exames realizados, vacinas aplicadas e receitas ficam registrados na linha do tempo do perfil do seu pet." }, 
  { q: "O sistema envia lembretes de vacinação?", 
    a: "Sim, a plataforma gera notificações automáticas para alertar sobre as próximas doses de vacinas e retornos de consultas cadastrados." }
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

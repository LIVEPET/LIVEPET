import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Mail, Heart } from "lucide-react";
import Logo from "./Logo";

const productLinks = [
  { label: "Meus Pets", to: "/pets" },
  { label: "Pedigree", to: "/pedigree" },
  { label: "MatchPet", to: "/matchpet" },
  { label: "Cartão Pet", to: "/cartao" },
];

const communityLinks = [
  { label: "Adoção", to: "/#adoption" },
  { label: "Parcerias", to: "/parcerias" },
  { label: "Histórico Veterinário", to: "/historico-medico" },
];

const supportLinks = [
  { label: "Central de Ajuda", to: "/#faq" },
  { label: "Contato", to: "mailto:contato@livepet.app", external: true },
  { label: "Privacidade", to: "/#" },
];

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-border/60 bg-gradient-to-b from-secondary/30 to-secondary/60">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cuidar nunca foi tão fácil. Toda a saúde do seu pet, organizada com carinho.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {[
                { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
                { Icon: Mail, href: "mailto:contato@livepet.app", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Produto" links={productLinks} />
          <FooterCol title="Comunidade" links={communityLinks} />
          <FooterCol title="Suporte" links={supportLinks} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Live Pet. Todos os direitos reservados.</p>
          <p className="inline-flex items-center gap-1.5">
            Feito com <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> para o seu pet.
          </p>
        </div>
      </div>
    </footer>
  );
};

const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string; external?: boolean }[];
}) => (
  <div>
    <p className="mb-4 text-sm font-bold text-foreground">{title}</p>
    <ul className="space-y-2.5 text-sm text-muted-foreground">
      {links.map((l) =>
        l.external ? (
          <li key={l.label}>
            <a href={l.to} className="transition-smooth hover:text-primary">
              {l.label}
            </a>
          </li>
        ) : (
          <li key={l.label}>
            <Link to={l.to} className="transition-smooth hover:text-primary">
              {l.label}
            </Link>
          </li>
        ),
      )}
    </ul>
  </div>
);

export default Footer;

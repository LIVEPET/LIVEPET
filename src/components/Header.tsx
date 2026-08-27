import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Plus } from "lucide-react";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";


const navItems = [
  { label: "Início", to: "/" },
  { label: "Pets", to: "/pets" },
  { label: "Pedigree", to: "/pedigree" },
  { label: "MatchPet", to: "/matchpet" },
  { label: "Histórico", to: "/historico-medico" },
  { label: "Cartão", to: "/cartao" },
  { label: "Parcerias", to: "/parcerias" },
];

const Header = () => {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-border/60 bg-background/85 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-background/60 backdrop-blur-lg"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo className="shrink-0" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative rounded-full px-3.5 py-2 text-sm font-medium transition-smooth ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
                <span
                  className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            asChild
            size="sm"
            className="hidden rounded-full gradient-primary px-4 text-primary-foreground shadow-soft transition-bounce hover:scale-[1.03] hover:shadow-glow md:inline-flex"
          >
            <Link to="/pets/novo">
              <Plus className="h-4 w-4" />
              Adicionar pet
            </Link>
          </Button>
          <NotificationBell />
          <UserMenu />

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 pt-6">
                <Logo />
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to}
                        className={`rounded-xl px-4 py-3 text-base font-medium transition-smooth ${
                          isActive(item.to)
                            ? "bg-primary-soft text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="flex flex-col gap-2 px-4">
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="w-full rounded-full border-primary/30 text-primary hover:bg-primary-soft hover:text-primary">
                      <Link to="/login">Entrar</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="w-full rounded-full gradient-primary text-primary-foreground shadow-soft transition-smooth hover:shadow-glow">
                      <Link to="/login">Criar conta</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;

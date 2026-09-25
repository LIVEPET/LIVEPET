import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, LayoutDashboard, LogOut, Menu, PawPrint, Stethoscope, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clinicProfile } from "@/data/clinicDemo";

const links = [
  { to: "/clinica", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/clinica/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/clinica/pacientes", label: "Pacientes", icon: PawPrint },
  { to: "/clinica/perfil", label: "Perfil da clínica", icon: Building2 },
];

const NavItems = ({ onNavigate }) => (
  <nav className="flex flex-col gap-1">
    {links.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
            isActive
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-muted-foreground hover:bg-primary-soft hover:text-primary"
          }`
        }
      >
        <Icon className="h-4 w-4" />
        {label}
      </NavLink>
    ))}
  </nav>
);

const ClinicLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar desktop */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card px-5 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-tight">LivePet</p>
            <p className="text-xs text-muted-foreground">Área da clínica</p>
          </div>
        </div>
        <NavItems />
        <div className="mt-auto space-y-3 pt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary-soft text-xs font-bold text-primary">VP</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{clinicProfile.name}</p>
              <p className="truncate text-xs text-muted-foreground">{clinicProfile.crmv}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => navigate("/clinica/entrar")}
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-bold">Área da clínica</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 space-y-6">
                <SheetClose asChild>
                  <div>
                    <NavItems />
                  </div>
                </SheetClose>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => navigate("/clinica/entrar")}
                >
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClinicLayout;
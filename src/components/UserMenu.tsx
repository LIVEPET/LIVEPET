import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, PawPrint, Heart, Stethoscope, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initialsFrom = (email?: string | null) => {
  if (!email) return "?";
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
};

const UserMenu = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Não foi possível sair", { description: error.message });
      return;
    }
    toast.success("Sessão encerrada");
    navigate("/login");
  };

  if (loading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />;
  }

  if (!email) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Button
          asChild
          variant="outline"
          className="rounded-full border-primary/30 text-primary hover:bg-primary-soft hover:text-primary"
        >
          <Link to="/login">Entrar</Link>
        </Button>
        <Button
          asChild
          className="rounded-full gradient-primary text-primary-foreground shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-glow"
        >
          <Link to="/login">Criar conta</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Abrir menu da conta"
          className="group flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary-soft text-xs font-bold text-primary">
              {initialsFrom(email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:block">
            {email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl border-border/60 shadow-glow">
        <DropdownMenuLabel className="px-3 py-2">
          <p className="text-xs font-normal text-muted-foreground">Conectado como</p>
          <p className="truncate text-sm font-semibold">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/pets" className="cursor-pointer gap-2">
            <PawPrint className="h-4 w-4" /> Meus Pets
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/matchpet" className="cursor-pointer gap-2">
            <Heart className="h-4 w-4" /> MatchPet
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/historico-medico" className="cursor-pointer gap-2">
            <Stethoscope className="h-4 w-4" /> Histórico Veterinário
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => toast("Em breve", { description: "Tela de configurações em desenvolvimento." })}
          className="cursor-pointer gap-2"
        >
          <Settings className="h-4 w-4" /> Configurações
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => toast("Em breve", { description: "Perfil do usuário em construção." })}
          className="cursor-pointer gap-2"
        >
          <User className="h-4 w-4" /> Meu perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

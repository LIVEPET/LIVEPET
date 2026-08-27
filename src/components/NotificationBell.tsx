import { useEffect, useState } from "react";
import { Bell, CheckCheck, Heart, Calendar, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notif = {
  id: string;
  icon: typeof Bell;
  title: string;
  body: string;
  time: string;
  read: boolean;
  tone: "primary" | "warm" | "success";
};

const seed: Notif[] = [
  {
    id: "1",
    icon: Heart,
    title: "Novo match!",
    body: "Luna deu match com Thor. Que tal iniciar uma conversa?",
    time: "agora",
    read: false,
    tone: "primary",
  },
  {
    id: "2",
    icon: Calendar,
    title: "Vacina próxima",
    body: "A V10 da Mel vence em 3 dias. Agende com seu veterinário.",
    time: "2h",
    read: false,
    tone: "warm",
  },
  {
    id: "3",
    icon: Stethoscope,
    title: "Histórico atualizado",
    body: "Consulta de check-up de Bento foi adicionada.",
    time: "ontem",
    read: true,
    tone: "success",
  },
  {
    id: "4",
    icon: Sparkles,
    title: "Bem-vindo ao LivePet",
    body: "Conclua o cadastro do seu pet para liberar o MatchPet.",
    time: "2d",
    read: true,
    tone: "primary",
  },
];

const toneClasses: Record<Notif["tone"], string> = {
  primary: "bg-primary-soft text-primary",
  warm: "bg-warm-soft text-warm",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const NotificationBell = () => {
  const [items, setItems] = useState<Notif[]>(seed);
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (open && unread > 0) {
      const t = setTimeout(() => {
        setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [open, unread]);

  const markAll = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificações"
          className="relative rounded-full hover:bg-primary-soft hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[22rem] overflow-hidden rounded-2xl border-border/60 p-0 shadow-glow"
      >
        <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notificações</p>
            {unread > 0 && (
              <Badge variant="secondary" className="h-5 rounded-full bg-primary-soft px-2 text-[10px] font-bold text-primary">
                {unread} novas
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAll}
            disabled={unread === 0}
            className="h-7 gap-1 rounded-full px-2 text-xs text-muted-foreground hover:text-primary"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Marcar tudo
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          <ul className="divide-y divide-border/60">
            {items.map((n) => {
              const Icon = n.icon;
              return (
                <li
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-smooth hover:bg-muted/50 ${
                    !n.read ? "bg-primary-soft/30" : ""
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClasses[n.tone]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">{n.body}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Não lida" />
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <div className="border-t border-border/60 bg-secondary/30 px-4 py-2 text-center">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

import { useMemo, useState } from "react";
import { Clock, Phone, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appointments as seed, statusStyles } from "@/data/clinicDemo";

const filters = ["Todos", "Confirmado", "Aguardando", "Em atendimento", "Concluído", "Cancelado"];

const ClinicSchedule = () => {
  const [list, setList] = useState(seed);
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ time: "", petName: "", tutor: "", service: "", vet: "" });

  const visible = useMemo(
    () =>
      list.filter(
        (a) =>
          (filter === "Todos" || a.status === filter) &&
          `${a.petName} ${a.tutor} ${a.service}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [list, filter, query],
  );

  const advance = (a) => {
    const nextStatus =
      a.status === "Aguardando" || a.status === "Confirmado" ? "Em atendimento" : "Concluído";
    setList((prev) => prev.map((i) => (i.id === a.id ? { ...i, status: nextStatus } : i)));
    toast.success(`${a.petName}: ${nextStatus.toLowerCase()}`);
  };

  const cancel = (a) => {
    setList((prev) => prev.map((i) => (i.id === a.id ? { ...i, status: "Cancelado" } : i)));
    toast("Atendimento cancelado", { description: `${a.petName} — ${a.time}` });
  };

  const create = (e) => {
    e.preventDefault();
    setList((prev) =>
      [
        ...prev,
        {
          id: crypto.randomUUID(),
          time: form.time,
          petName: form.petName,
          species: "Cão",
          breed: "—",
          tutor: form.tutor,
          phone: "(11) 90000-0000",
          service: form.service,
          vet: form.vet || "Equipe da clínica",
          status: "Confirmado",
        },
      ].sort((a, b) => a.time.localeCompare(b.time)),
    );
    setForm({ time: "", petName: "", tutor: "", service: "", vet: "" });
    setOpen(false);
    toast.success("Atendimento agendado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">Agenda</Badge>
          <h1 className="font-display text-3xl font-bold">Atendimentos de hoje</h1>
          <p className="text-muted-foreground">{visible.length} atendimento(s) nesta visualização.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary text-primary-foreground shadow-soft">
              <Plus className="h-4 w-4" /> Novo atendimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Agendar atendimento</DialogTitle>
              <DialogDescription>Preencha os dados básicos da consulta.</DialogDescription>
            </DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input id="time" type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pet">Pet</Label>
                  <Input id="pet" required value={form.petName} onChange={(e) => setForm({ ...form, petName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tutor">Tutor</Label>
                <Input id="tutor" required value={form.tutor} onChange={(e) => setForm({ ...form, tutor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Serviço</Label>
                <Input id="service" required placeholder="Consulta clínica" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vet">Responsável</Label>
                <Input id="vet" placeholder="Dra. Marina Alves" value={form.vet} onChange={(e) => setForm({ ...form, vet: e.target.value })} />
              </div>
              <Button type="submit" className="w-full rounded-full gradient-primary text-primary-foreground">
                Confirmar agendamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap">
            {filters.map((f) => (
              <TabsTrigger key={f} value={f} className="text-xs sm:text-sm">
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar pet, tutor ou serviço"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((a) => (
          <Card key={a.id} className="border-border/70 shadow-card">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <div className="flex w-20 flex-col items-center rounded-2xl bg-primary-soft px-3 py-2 text-primary">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-bold">{a.time}</span>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold">
                  {a.petName} <span className="text-sm font-normal text-muted-foreground">· {a.species} · {a.breed}</span>
                </p>
                <p className="text-sm text-muted-foreground">{a.service} — {a.vet}</p>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {a.tutor}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {a.phone}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${statusStyles[a.status]} hover:opacity-90`}>{a.status}</Badge>
                {a.status !== "Concluído" && a.status !== "Cancelado" && (
                  <>
                    <Button size="sm" className="rounded-full" onClick={() => advance(a)}>
                      {a.status === "Em atendimento" ? "Concluir" : "Iniciar"}
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => cancel(a)}>
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
              {a.notes && <p className="w-full rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{a.notes}</p>}
            </CardContent>
          </Card>
        ))}
        {visible.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
              Nenhum atendimento encontrado com esses filtros.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClinicSchedule;
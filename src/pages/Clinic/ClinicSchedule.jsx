import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, Phone, Plus, Search, User } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import { statusStyles } from "@/data/clinicDemo";
import { useClinic } from "@/contexts/ClinicContext";
import { formatPhone, isValidPhone } from "@/lib/phone";

const filters = ["Todos", "Confirmado", "Aguardando", "Em atendimento", "Concluído", "Cancelado"];
const speciesOptions = ["Cão", "Gato"];
const DEFAULT_VET = "Equipe da clínica";

const emptyForm = {
  petName: "",
  species: "",
  breed: "",
  time: "",
  tutor: "",
  phone: "",
  service: "",
  vet: "",
};

// Serviços e equipe vêm do Perfil; aceita texto puro ou objeto com "name".
const toName = (item) => (typeof item === "string" ? item : item?.name);
const uniqueNames = (items) => [...new Set(items.map(toName).filter(Boolean))];

// A ordem das chaves segue a ordem dos campos na tela (o primeiro erro recebe o foco).
const validate = (form, hasServices) => {
  const errors = {};
  if (!form.petName.trim()) errors.petName = "Informe o nome do pet.";
  if (!form.species) errors.species = "Selecione a espécie.";
  if (!form.time) errors.time = "Informe o horário.";
  if (!form.tutor.trim()) errors.tutor = "Informe o nome do tutor.";
  if (!form.phone.trim()) errors.phone = "Informe o telefone do tutor.";
  else if (!isValidPhone(form.phone)) {
    errors.phone = "Telefone inválido. Use DDD + número, ex.: (11) 99999-0000.";
  }
  if (!form.service.trim()) {
    errors.service = hasServices ? "Selecione o serviço." : "Informe o serviço.";
  }
  return errors;
};

const FieldError = ({ id, message }) =>
  message ? (
    <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;

const ProfileLink = ({ children }) => (
  <Link to="/clinica/perfil" className="font-medium text-primary underline-offset-4 hover:underline">
    {children}
  </Link>
);

const ClinicSchedule = () => {
  const { appointments: list, profile, addAppointment, updateAppointmentStatus } = useClinic();
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const services = useMemo(() => uniqueNames(profile.services), [profile.services]);
  const team = useMemo(() => uniqueNames(profile.team), [profile.team]);

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
    updateAppointmentStatus(a.id, nextStatus);
    toast.success(`${a.petName}: ${nextStatus.toLowerCase()}`);
  };

  const cancel = (a) => {
    updateAppointmentStatus(a.id, "Cancelado");
    toast("Atendimento cancelado", { description: `${a.petName} — ${a.time}` });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors(({ [key]: _removed, ...rest }) => rest);
  };

  const fieldProps = (key) => ({
    id: key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  const create = (e) => {
    e.preventDefault();
    const found = validate(form, services.length > 0);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    addAppointment({
      time: form.time,
      petName: form.petName.trim(),
      species: form.species,
      breed: form.breed.trim() || "—",
      tutor: form.tutor.trim(),
      phone: formatPhone(form.phone),
      service: form.service.trim(),
      vet: form.vet || DEFAULT_VET,
    });
    resetForm();
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary text-primary-foreground shadow-soft">
              <Plus className="h-4 w-4" /> Novo atendimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Agendar atendimento</DialogTitle>
              <DialogDescription>Preencha os dados da consulta.</DialogDescription>
            </DialogHeader>
            <form onSubmit={create} noValidate className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="petName">Pet</Label>
                  <Input
                    {...fieldProps("petName")}
                    value={form.petName}
                    onChange={(e) => update("petName", e.target.value)}
                  />
                  <FieldError id="petName" message={errors.petName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species">Espécie</Label>
                  <Select value={form.species} onValueChange={(v) => update("species", v)}>
                    <SelectTrigger {...fieldProps("species")}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {speciesOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="species" message={errors.species} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Raça (opcional)</Label>
                  <Input
                    id="breed"
                    value={form.breed}
                    onChange={(e) => update("breed", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    {...fieldProps("time")}
                    type="time"
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                  />
                  <FieldError id="time" message={errors.time} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tutor">Tutor</Label>
                  <Input
                    {...fieldProps("tutor")}
                    value={form.tutor}
                    onChange={(e) => update("tutor", e.target.value)}
                  />
                  <FieldError id="tutor" message={errors.tutor} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    {...fieldProps("phone")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="(11) 99999-0000"
                    value={form.phone}
                    onChange={(e) => update("phone", formatPhone(e.target.value))}
                  />
                  <FieldError id="phone" message={errors.phone} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Serviço</Label>
                {services.length > 0 ? (
                  <Select value={form.service} onValueChange={(v) => update("service", v)}>
                    <SelectTrigger {...fieldProps("service")}>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      {...fieldProps("service")}
                      placeholder="Consulta clínica"
                      value={form.service}
                      onChange={(e) => update("service", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nenhum serviço cadastrado.{" "}
                      <ProfileLink>Cadastre serviços no Perfil da clínica</ProfileLink>.
                    </p>
                  </>
                )}
                <FieldError id="service" message={errors.service} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vet">Responsável</Label>
                {team.length > 0 ? (
                  <Select value={form.vet} onValueChange={(v) => update("vet", v)}>
                    <SelectTrigger id="vet">
                      <SelectValue placeholder={DEFAULT_VET} />
                    </SelectTrigger>
                    <SelectContent>
                      {team.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input id="vet" value={DEFAULT_VET} disabled readOnly />
                    <p className="text-xs text-muted-foreground">
                      <ProfileLink>Cadastre a equipe no Perfil da clínica</ProfileLink> para escolher
                      o responsável.
                    </p>
                  </>
                )}
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
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {formatPhone(a.phone) || "—"}</span>
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
        {visible.length === 0 &&
          (list.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title="Nenhum atendimento hoje"
              description="Sua agenda está livre. Agende o primeiro atendimento para começar."
              actionLabel="Novo atendimento"
              onAction={() => setOpen(true)}
            />
          ) : (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Nenhum atendimento encontrado"
              description="Nenhum resultado para esses filtros. Tente outra busca ou limpe os filtros."
              actionLabel="Limpar filtros"
              onAction={() => {
                setFilter("Todos");
                setQuery("");
              }}
            />
          ))}
      </div>
    </div>
  );
};

export default ClinicSchedule;
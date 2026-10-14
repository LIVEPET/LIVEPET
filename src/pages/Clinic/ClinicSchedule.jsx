import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, Clock, Phone, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { clinicService } from "@/services/api";
import { formatPhone, isValidPhone } from "@/lib/phone";

const filters = ["Todos", "Confirmado", "Aguardando", "Em atendimento", "Concluído", "Cancelado"];
const DEFAULT_SPECIES = ["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"];
const DEFAULT_VET = "Equipe da clínica";

const getToday = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  petName: "",
  species: "",
  breed: "",
  date: getToday(),
  time: "",
  tutor: "",
  phone: "",
  service: "",
  vet: "",
  notes: "",
};

// Serviços e equipe vêm do Perfil; aceita texto puro ou objeto com "name".
const toName = (item) => (typeof item === "string" ? item : item?.name);
const uniqueNames = (items) => [...new Set(items.map(toName).filter(Boolean))];

// A ordem das chaves segue a ordem dos campos na tela (o primeiro erro recebe o foco).
const validate = (form, hasServices) => {
  const errors = {};
  if (!form.petName.trim()) errors.petName = "Informe o nome do pet.";
  if (!form.species) errors.species = "Selecione a espécie.";
  if (!form.date) errors.date = "Informe a data.";
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
  const location = useLocation();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("Hoje");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [speciesOptions, setSpeciesOptions] = useState(DEFAULT_SPECIES);

  const services = useMemo(() => uniqueNames(profile.services), [profile.services]);
  const team = useMemo(() => uniqueNames(profile.team), [profile.team]);

  // Sincroniza espécies cadastradas no banco de dados
  useEffect(() => {
    let active = true;
    clinicService
      .getSpecies()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setSpeciesOptions(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Pré-preenchimento ao vir da aba de Pacientes
  useEffect(() => {
    if (location.state?.prefill) {
      const p = location.state.prefill;
      setForm((current) => ({
        ...current,
        petName: p.petName || current.petName,
        species: p.species || current.species,
        breed: p.breed || current.breed,
        tutor: p.tutor || current.tutor,
        phone: p.phone || current.phone,
      }));
      setOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const visible = useMemo(
    () =>
      list.filter((a) => {
        const matchesStatus = filter === "Todos" || a.status === filter;
        const matchesDate =
          dateFilter === "Todas as datas" ||
          (dateFilter === "Hoje" && (a.date === getToday() || !a.date));
        const matchesQuery = `${a.petName} ${a.tutor} ${a.service} ${a.notes || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesStatus && matchesDate && matchesQuery;
      }),
    [list, filter, dateFilter, query],
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
      date: form.date,
      time: form.time,
      petName: form.petName.trim(),
      species: form.species,
      breed: form.breed.trim() || "—",
      tutor: form.tutor.trim(),
      phone: formatPhone(form.phone),
      service: form.service.trim(),
      vet: form.vet || DEFAULT_VET,
      notes: form.notes.trim() || "",
    });
    resetForm();
    setOpen(false);
    toast.success("Atendimento agendado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">Agenda</Badge>
            <div className="flex items-center gap-1">
              <Button
                variant={dateFilter === "Hoje" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 rounded-full px-2.5 text-xs font-semibold"
                onClick={() => setDateFilter("Hoje")}
              >
                Hoje
              </Button>
              <Button
                variant={dateFilter === "Todas as datas" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 rounded-full px-2.5 text-xs font-semibold"
                onClick={() => setDateFilter("Todas as datas")}
              >
                Todas as datas
              </Button>
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold">
            {dateFilter === "Hoje" ? "Atendimentos de hoje" : "Todos os atendimentos"}
          </h1>
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
                  <Label htmlFor="date">Data</Label>
                  <Input
                    {...fieldProps("date")}
                    type="date"
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                  />
                  <FieldError id="date" message={errors.date} />
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

              <div className="space-y-2">
                <Label htmlFor="notes">Observações / Queixa principal (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex.: Consulta de rotina, vacinação anual, tosse seca há 2 dias..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
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
              <div className="flex min-w-[5.5rem] flex-col items-center rounded-2xl bg-primary-soft px-3 py-2 text-primary">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-bold">{a.time}</span>
                {a.date && (
                  <span className="text-[10px] font-medium opacity-80">
                    {a.date === getToday() ? "Hoje" : a.date.split("-").reverse().slice(0, 2).join("/")}
                  </span>
                )}
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
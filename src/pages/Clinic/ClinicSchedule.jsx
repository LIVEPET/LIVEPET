import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Columns3,
  FileText,
  Heart,
  LayoutList,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Syringe,
  Thermometer,
  User,
} from "lucide-react";

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
import { getPriorityMeta, PRIORITY_OPTIONS, statusStyles } from "@/data/clinicDemo";
import { useClinic } from "@/contexts/ClinicContext";
import { clinicService } from "@/services/api";
import { formatPhone, isValidPhone } from "@/lib/phone";
import {
  hasPrescription,
  PrescriptionBuilder,
  PrescriptionSheetDialog,
} from "./ClinicPrescription";

const filters = ["Todos", "Confirmado", "Aguardando", "Em atendimento", "Concluído", "Cancelado"];
const DEFAULT_SPECIES = ["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"];
const DEFAULT_VET = "Equipe da clínica";

const KANBAN_COLUMNS = [
  {
    id: "waiting",
    title: "Na Espera",
    subtitle: "Aguardando / Confirmado",
    statuses: ["Confirmado", "Aguardando"],
    headerBg: "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  {
    id: "in_progress",
    title: "Em Consulta",
    subtitle: "Em atendimento",
    statuses: ["Em atendimento"],
    headerBg: "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300",
    dotColor: "bg-blue-500 animate-pulse",
  },
  {
    id: "done",
    title: "Concluídos",
    subtitle: "Concluído",
    statuses: ["Concluído"],
    headerBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
];

const getToday = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  patientId: null,
  petName: "",
  species: "",
  breed: "",
  date: getToday(),
  time: "",
  tutor: "",
  phone: "",
  service: "",
  vet: "",
  priority: "Rotina",
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

const PriorityBadge = ({ priority }) => {
  const meta = getPriorityMeta(priority);
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 border ${meta.badgeClass}`}
      title={`Classificação de Risco: ${meta.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </Badge>
  );
};

const PrioritySelector = ({ value, onChange, idPrefix = "priority" }) => {
  const current = getPriorityMeta(value).value;
  return (
    <div
      role="radiogroup"
      aria-label="Classificação de Risco (Triagem)"
      className="grid grid-cols-2 gap-2"
    >
      {PRIORITY_OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            id={`${idPrefix}-${opt.value}`}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all ${
              active
                ? `${opt.badgeClass} ring-2 ring-primary/30 font-semibold shadow-sm`
                : "border-border bg-background text-muted-foreground hover:bg-muted/60"
            }`}
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${opt.dotClass}`} />
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const ClinicSchedule = () => {
  const {
    appointments: list,
    profile,
    addAppointment,
    updateAppointmentStatus,
    updateAppointmentPriority,
    concludeAppointment,
  } = useClinic();
  const location = useLocation();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState("list");
  const [filter, setFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("Hoje");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [speciesOptions, setSpeciesOptions] = useState(DEFAULT_SPECIES);

  // Estados do Modal de Anamnese & Exame Clínico
  const [examOpen, setExamOpen] = useState(false);
  const [activeExamApp, setActiveExamApp] = useState(null);
  const [prescriptionPreviewApp, setPrescriptionPreviewApp] = useState(null);
  const [examForm, setExamForm] = useState({
    priority: "Rotina",
    queixa_principal: "",
    temperatura: "",
    peso: "",
    frequencia_cardiaca: "",
    frequencia_respiratoria: "",
    mucosas: "Normocoradas",
    diagnostico: "",
    prescricao: "",
    prescricao_itens: [],
    applyVaccine: false,
    vacina_aplicada: "",
    vacina_lote: "",
    vacina_proxima_dose: "",
  });

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
        patientId: p.patientId || null,
        petName: p.petName || current.petName,
        species: p.species || current.species,
        breed: p.breed || current.breed,
        tutor: p.tutor || current.tutor,
        phone: p.phone || current.phone,
        priority: p.priority || current.priority || "Rotina",
      }));
      setOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const visible = useMemo(
    () =>
      list.filter((a) => {
        const matchesStatus =
          viewMode === "kanban" ? true : filter === "Todos" || a.status === filter;
        const matchesDate =
          dateFilter === "Todas as datas" ||
          (dateFilter === "Hoje" && (a.date === getToday() || !a.date));
        const matchesQuery = `${a.petName} ${a.tutor} ${a.service} ${a.priority || ""} ${a.notes || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesStatus && matchesDate && matchesQuery;
      }),
    [list, viewMode, filter, dateFilter, query],
  );

  const handleOpenExam = (a) => {
    setActiveExamApp(a);
    setExamForm({
      priority: getPriorityMeta(a.priority).value,
      queixa_principal: a.queixa_principal || a.notes || "",
      temperatura: a.temperatura != null ? String(a.temperatura) : "",
      peso: a.peso != null ? String(a.peso) : "",
      frequencia_cardiaca: a.frequencia_cardiaca != null ? String(a.frequencia_cardiaca) : "",
      frequencia_respiratoria: a.frequencia_respiratoria != null ? String(a.frequencia_respiratoria) : "",
      mucosas: a.mucosas || "Normocoradas",
      diagnostico: a.diagnostico || "",
      prescricao: a.prescricao || "",
      prescricao_itens: Array.isArray(a.prescricao_itens) ? a.prescricao_itens : [],
      applyVaccine: !!a.vacina_aplicada,
      vacina_aplicada: a.vacina_aplicada || "",
      vacina_lote: a.vacina_lote || "",
      vacina_proxima_dose: a.vacina_proxima_dose || "",
    });

    if (a.status === "Confirmado" || a.status === "Aguardando") {
      updateAppointmentStatus(a.id, "Em atendimento");
      toast.success(`${a.petName}: atendimento iniciado`);
    }
    setExamOpen(true);
  };

  const handleExamPriorityChange = (nextPriority) => {
    setExamForm((f) => ({ ...f, priority: nextPriority }));
    if (activeExamApp && updateAppointmentPriority) {
      updateAppointmentPriority(activeExamApp.id, nextPriority);
      setActiveExamApp((prev) => (prev ? { ...prev, priority: nextPriority } : prev));
    }
  };

  const handleQuickAdvanceStatus = (a) => {
    if (a.status === "Confirmado" || a.status === "Aguardando") {
      updateAppointmentStatus(a.id, "Em atendimento");
      toast.success(`${a.petName} avançou para Em Consulta`);
    } else if (a.status === "Em atendimento") {
      updateAppointmentStatus(a.id, "Concluído");
      toast.success(`Atendimento de ${a.petName} marcado como Concluído`);
    }
  };

  const handleSaveExam = (e) => {
    e.preventDefault();
    if (!activeExamApp) return;

    if (examForm.applyVaccine && !examForm.vacina_aplicada.trim()) {
      toast.error("Informe o nome da vacina aplicada ou desmarque a opção.");
      return;
    }

    const payload = {
      priority: examForm.priority || "Rotina",
      queixa_principal: examForm.queixa_principal.trim() || null,
      temperatura: examForm.temperatura ? parseFloat(examForm.temperatura) : null,
      peso: examForm.peso ? parseFloat(examForm.peso) : null,
      frequencia_cardiaca: examForm.frequencia_cardiaca ? parseInt(examForm.frequencia_cardiaca, 10) : null,
      frequencia_respiratoria: examForm.frequencia_respiratoria ? parseInt(examForm.frequencia_respiratoria, 10) : null,
      mucosas: examForm.mucosas || "Normocoradas",
      diagnostico: examForm.diagnostico.trim() || null,
      prescricao: examForm.prescricao.trim() || null,
      prescricao_itens: Array.isArray(examForm.prescricao_itens) ? examForm.prescricao_itens : [],
      vacina_aplicada: examForm.applyVaccine && examForm.vacina_aplicada.trim() ? examForm.vacina_aplicada.trim() : null,
      vacina_lote: examForm.applyVaccine && examForm.vacina_lote.trim() ? examForm.vacina_lote.trim() : null,
      vacina_proxima_dose: examForm.applyVaccine && examForm.vacina_proxima_dose ? examForm.vacina_proxima_dose : null,
    };

    concludeAppointment(activeExamApp.id, payload);
    setExamOpen(false);
    toast.success(`Atendimento de ${activeExamApp.petName} concluído com sucesso! Prontuário registrado.`);
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
      patientId: form.patientId || null,
      date: form.date,
      time: form.time,
      petName: form.petName.trim(),
      species: form.species,
      breed: form.breed.trim() || "—",
      tutor: form.tutor.trim(),
      phone: formatPhone(form.phone),
      service: form.service.trim(),
      vet: form.vet || DEFAULT_VET,
      priority: form.priority || "Rotina",
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de visualização: Lista vs Quadro Kanban */}
          <div
            role="group"
            aria-label="Modo de visualização da agenda"
            className="inline-flex items-center rounded-full border border-border bg-muted/60 p-1"
          >
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-full gap-1.5 px-3 text-xs font-semibold"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Lista
            </Button>
            <Button
              type="button"
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-full gap-1.5 px-3 text-xs font-semibold"
              onClick={() => setViewMode("kanban")}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Quadro Kanban
            </Button>
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
                <DialogDescription>Preencha os dados da consulta e a triagem de risco.</DialogDescription>
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
                  <div className="space-y-2 sm:col-span-2">
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
                  <Label className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                    Classificação de Risco (Triagem)
                  </Label>
                  <PrioritySelector
                    value={form.priority}
                    onChange={(v) => update("priority", v)}
                    idPrefix="schedule-priority"
                  />
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
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {viewMode === "list" ? (
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="flex-wrap">
              {filters.map((f) => (
                <TabsTrigger key={f} value={f} className="text-xs sm:text-sm">
                  {f}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Triagem Semafórica:</span>
            {PRIORITY_OPTIONS.map((opt) => (
              <span key={opt.value} className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-2.5 py-1">
                <span className={`h-2 w-2 rounded-full ${opt.dotClass}`} />
                {opt.label}
              </span>
            ))}
          </div>
        )}
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

      {viewMode === "list" ? (
        <div className="space-y-3">
          {visible.map((a) => {
            const priorityMeta = getPriorityMeta(a.priority);
            return (
              <Card
                key={a.id}
                data-testid={`appointment-card-${a.id}`}
                className={`border-border/70 shadow-card ${priorityMeta.borderClass}`}
              >
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {a.petName}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          · {a.species} · {a.breed}
                        </span>
                      </p>
                      <PriorityBadge priority={a.priority} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {a.service} — {a.vet}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {a.tutor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {formatPhone(a.phone) || "—"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${statusStyles[a.status]} hover:opacity-90`}>{a.status}</Badge>
                    {hasPrescription(a) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full gap-1.5 border-primary/40 text-xs font-medium text-primary hover:bg-primary-soft"
                        onClick={() => setPrescriptionPreviewApp(a)}
                      >
                        <FileText className="h-3.5 w-3.5" /> Visualizar Receituário
                      </Button>
                    )}
                    {a.status !== "Concluído" && a.status !== "Cancelado" && (
                      <>
                        <Button size="sm" className="rounded-full gap-1.5" onClick={() => handleOpenExam(a)}>
                          <Stethoscope className="h-3.5 w-3.5" />
                          {a.status === "Em atendimento" ? "Atender / Concluir" : "Iniciar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full text-destructive"
                          onClick={() => cancel(a)}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {a.status === "Concluído" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full gap-1.5 text-xs font-medium"
                        onClick={() => handleOpenExam(a)}
                      >
                        <Stethoscope className="h-3.5 w-3.5" /> Prontuário
                      </Button>
                    )}
                  </div>
                  {a.notes && (
                    <p className="w-full rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                      {a.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
      ) : (
        <div
          data-testid="kanban-board"
          className="grid gap-4 lg:grid-cols-3"
        >
          {KANBAN_COLUMNS.map((col) => {
            const colItems = visible
              .filter((a) => col.statuses.includes(a.status))
              .sort((a, b) => {
                const weightDiff =
                  getPriorityMeta(b.priority).weight - getPriorityMeta(a.priority).weight;
                if (weightDiff !== 0) return weightDiff;
                return String(a.time ?? "").localeCompare(String(b.time ?? ""));
              });

            return (
              <div
                key={col.id}
                data-testid={`kanban-col-${col.id}`}
                className="flex flex-col rounded-3xl border border-border/80 bg-muted/30 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                      <h2 className="font-display text-base font-bold">{col.title}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">{col.subtitle}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold">
                    {colItems.length}
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  {colItems.map((a) => {
                    const priorityMeta = getPriorityMeta(a.priority);
                    return (
                      <Card
                        key={a.id}
                        data-testid={`kanban-card-${a.id}`}
                        className={`border-border/80 bg-card shadow-sm transition-all hover:shadow-card ${priorityMeta.borderClass}`}
                      >
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-xl bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                              <Clock className="h-3 w-3" /> {a.time}
                            </span>
                            <PriorityBadge priority={a.priority} />
                          </div>

                          <div>
                            <p className="font-semibold leading-tight">
                              {a.petName}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                · {a.species} · {a.breed}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                              {a.service} — {a.vet}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                              <User className="h-3 w-3 shrink-0" /> {a.tutor}
                            </span>
                            <Badge className={`${statusStyles[a.status]} text-[10px]`}>
                              {a.status}
                            </Badge>
                          </div>

                          {a.notes && (
                            <p className="line-clamp-2 rounded-xl bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
                              {a.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                            {hasPrescription(a) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-full rounded-full gap-1 border-primary/40 text-xs font-medium text-primary hover:bg-primary-soft"
                                onClick={() => setPrescriptionPreviewApp(a)}
                              >
                                <FileText className="h-3 w-3" /> Visualizar Receituário
                              </Button>
                            )}

                            {col.id === "waiting" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full gap-1 text-xs"
                                  onClick={() => handleOpenExam(a)}
                                >
                                  <Stethoscope className="h-3 w-3" /> Triagem / Exame
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 rounded-full gap-1 text-xs"
                                  onClick={() => handleQuickAdvanceStatus(a)}
                                >
                                  Avançar <ArrowRight className="h-3 w-3" />
                                </Button>
                              </>
                            )}

                            {col.id === "in_progress" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full gap-1 text-xs"
                                  onClick={() => handleOpenExam(a)}
                                >
                                  <Stethoscope className="h-3 w-3" /> Prontuário
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 rounded-full gap-1 text-xs"
                                  onClick={() => handleQuickAdvanceStatus(a)}
                                >
                                  Concluir <CheckCircle2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}

                            {col.id === "done" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-full rounded-full gap-1 text-xs"
                                onClick={() => handleOpenExam(a)}
                              >
                                <Stethoscope className="h-3 w-3" /> Ver Prontuário
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {colItems.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                      Nenhum paciente nesta coluna.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Anamnese e Exame Clínico Completo */}
      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          {activeExamApp && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="font-display text-2xl">
                        Atendimento Clínico & Anamnese
                      </DialogTitle>
                      <DialogDescription>
                        {activeExamApp.petName} ({activeExamApp.species} · {activeExamApp.breed}) · Tutor: {activeExamApp.tutor}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={examForm.priority} />
                    <Badge className={`${statusStyles[activeExamApp.status]} text-xs`}>
                      {activeExamApp.status}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSaveExam} className="space-y-5 pt-2">
                {/* 0. Classificação de Risco (Triagem Veterinária) */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 text-primary" /> Classificação de Risco (Triagem)
                  </Label>
                  <PrioritySelector
                    value={examForm.priority}
                    onChange={handleExamPriorityChange}
                    idPrefix="exam-priority"
                  />
                </div>

                {/* 1. Anamnese / Queixa Principal */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <Label htmlFor="queixa" className="flex items-center gap-1.5 text-sm font-semibold">
                    <Activity className="h-4 w-4 text-primary" /> Anamnese & Queixa Principal
                  </Label>
                  <Textarea
                    id="queixa"
                    rows={3}
                    placeholder="Relato do tutor: motivo da consulta, sintomas, duração, alterações de comportamento ou alimentação..."
                    value={examForm.queixa_principal}
                    onChange={(e) => setExamForm((f) => ({ ...f, queixa_principal: e.target.value }))}
                  />
                </div>

                {/* 2. Sinais Vitais & Exame Físico */}
                <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Thermometer className="h-4 w-4 text-primary" /> Sinais Vitais e Avaliação Física
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Peso */}
                    <div className="space-y-1">
                      <Label htmlFor="peso" className="text-xs font-semibold">
                        Peso Atual (kg)
                      </Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 12.5"
                        value={examForm.peso}
                        onChange={(e) => setExamForm((f) => ({ ...f, peso: e.target.value }))}
                      />
                    </div>

                    {/* Temperatura */}
                    <div className="space-y-1">
                      <Label htmlFor="temp" className="text-xs font-semibold">
                        Temperatura Retal (°C)
                      </Label>
                      <Input
                        id="temp"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 38.5"
                        value={examForm.temperatura}
                        onChange={(e) => setExamForm((f) => ({ ...f, temperatura: e.target.value }))}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Ref: Cães 37.5–39.2 °C | Gatos 38.0–39.2 °C
                      </p>
                    </div>

                    {/* Frequência Cardíaca */}
                    <div className="space-y-1">
                      <Label htmlFor="fc" className="text-xs font-medium">
                        Frequência Cardíaca (bpm) <span className="text-muted-foreground text-[10px]">(opcional)</span>
                      </Label>
                      <Input
                        id="fc"
                        type="number"
                        placeholder="Ex: 110"
                        value={examForm.frequencia_cardiaca}
                        onChange={(e) => setExamForm((f) => ({ ...f, frequencia_cardiaca: e.target.value }))}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Ref: Cães 70–160 | Gatos 140–220 bpm
                      </p>
                    </div>

                    {/* Frequência Respiratória */}
                    <div className="space-y-1">
                      <Label htmlFor="fr" className="text-xs font-medium">
                        Frequência Respiratória (mpm) <span className="text-muted-foreground text-[10px]">(opcional)</span>
                      </Label>
                      <Input
                        id="fr"
                        type="number"
                        placeholder="Ex: 24"
                        value={examForm.frequencia_respiratoria}
                        onChange={(e) => setExamForm((f) => ({ ...f, frequencia_respiratoria: e.target.value }))}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Ref: 15–35 mpm
                      </p>
                    </div>
                  </div>

                  {/* Mucosas */}
                  <div className="space-y-1 pt-1">
                    <Label htmlFor="mucosas" className="text-xs font-medium">Coloração das Mucosas</Label>
                    <Select
                      value={examForm.mucosas}
                      onValueChange={(v) => setExamForm((f) => ({ ...f, mucosas: v }))}
                    >
                      <SelectTrigger id="mucosas">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normocoradas">Normocoradas (róseas saudáveis)</SelectItem>
                        <SelectItem value="Pálidas">Pálidas (suspeita de anemia/choque)</SelectItem>
                        <SelectItem value="Congestas / Hiperêmicas">Congestas / Hiperêmicas (avermelhadas/febre)</SelectItem>
                        <SelectItem value="Ictéricas">Ictéricas (amareladas/hepático)</SelectItem>
                        <SelectItem value="Cianóticas">Cianóticas (azuladas/hipóxia)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 3. Diagnóstico e Prescrição Estruturada */}
                <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Heart className="h-4 w-4 text-primary" /> Diagnóstico & Conduta Clínica
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="diagnostico" className="text-xs font-semibold">Diagnóstico Clínico / Avaliação</Label>
                    <Textarea
                      id="diagnostico"
                      rows={2}
                      placeholder="Diagnóstico provisório ou definitivo e achados do exame clínico..."
                      value={examForm.diagnostico}
                      onChange={(e) => setExamForm((f) => ({ ...f, diagnostico: e.target.value }))}
                    />
                  </div>

                  <PrescriptionBuilder
                    items={examForm.prescricao_itens}
                    onChangeItems={(nextItems) =>
                      setExamForm((f) => ({ ...f, prescricao_itens: nextItems }))
                    }
                    notes={examForm.prescricao}
                    onChangeNotes={(nextNotes) =>
                      setExamForm((f) => ({ ...f, prescricao: nextNotes }))
                    }
                    onOpenPreview={() =>
                      setPrescriptionPreviewApp({
                        ...activeExamApp,
                        peso: examForm.peso || activeExamApp.peso,
                        prescricao: examForm.prescricao,
                        prescricao_itens: examForm.prescricao_itens,
                      })
                    }
                  />
                </div>

                {/* 4. Vacinação Rápida (Opcional) */}
                <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="applyVaccineToggle"
                      className="flex cursor-pointer items-center gap-2 text-sm font-semibold"
                    >
                      <Syringe className="h-4 w-4 text-primary" />
                      Aplicar Vacina neste atendimento
                    </Label>
                    <input
                      id="applyVaccineToggle"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                      checked={examForm.applyVaccine}
                      onChange={(e) => setExamForm((f) => ({ ...f, applyVaccine: e.target.checked }))}
                    />
                  </div>

                  {examForm.applyVaccine && (
                    <div className="grid gap-3 pt-2 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label htmlFor="vacNome" className="text-xs">Nome da Vacina</Label>
                        <Input
                          id="vacNome"
                          placeholder="Ex: V10 Polivalente"
                          value={examForm.vacina_aplicada}
                          onChange={(e) => setExamForm((f) => ({ ...f, vacina_aplicada: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="vacLote" className="text-xs">Lote</Label>
                        <Input
                          id="vacLote"
                          placeholder="Ex: LT-2026-X"
                          value={examForm.vacina_lote}
                          onChange={(e) => setExamForm((f) => ({ ...f, vacina_lote: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="vacProx" className="text-xs">Próxima Dose / Reforço</Label>
                        <Input
                          id="vacProx"
                          type="date"
                          value={examForm.vacina_proxima_dose}
                          onChange={(e) => setExamForm((f) => ({ ...f, vacina_proxima_dose: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setExamOpen(false)}>
                    Fechar
                  </Button>
                  <Button type="submit" className="gradient-primary text-primary-foreground shadow-soft">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Concluir e registrar no prontuário
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pré-visualização de Receituário Veterinário Timbrado */}
      <PrescriptionSheetDialog
        open={Boolean(prescriptionPreviewApp)}
        onOpenChange={(o) => !o && setPrescriptionPreviewApp(null)}
        appointment={prescriptionPreviewApp}
        profile={profile}
      />
    </div>
  );
};

export default ClinicSchedule;

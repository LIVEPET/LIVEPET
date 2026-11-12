import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Columns3,
  FileBadge,
  FileText,
  Heart,
  LayoutList,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  Stethoscope,
  Syringe,
  Thermometer,
  Trash2,
  User,
} from "lucide-react";

import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import ClinicDataStatus from "./ClinicDataStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import { getPriorityMeta, PRIORITY_OPTIONS, statusStyles } from "@/data/clinicDemo";
import { useClinic } from "@/contexts/ClinicContext";
import { clinicService } from "@/services/api";
import { formatPhone } from "@/lib/phone";
import { formatCurrency } from "@/lib/clinicBilling";
import {
  DEFAULT_SPECIES,
  PriorityBadge,
  getToday,
  uniqueNames,
} from "./AppointmentForm";
import { hasPrescription } from "./ClinicPrescription";
import {
  isReturnAppointmentItem,
  ReturnAppointmentBadge,
  WhatsAppActionButton,
} from "./ClinicReturnAndWhatsapp";

const filters = ["Todos", "Confirmado", "Aguardando", "Em atendimento", "Concluído", "Cancelado"];

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

const ClinicSchedule = () => {
  const {
    appointments: list,
    profile,
    addAppointment,
    updateAppointment,
    deleteAppointment,
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
  const [toDelete, setToDelete] = useState(null);

  // Encaminha pré-preenchimento legado para a página dedicada de novo atendimento
  useEffect(() => {
    if (location.state?.prefill) {
      navigate("/clinica/agenda/novo", {
        replace: true,
        state: { prefill: location.state.prefill },
      });
    }
  }, [location.state, navigate]);

  const visible = useMemo(
    () =>
      list.filter((a) => {
        const matchesStatus =
          viewMode === "kanban" ? true : filter === "Todos" || a.status === filter;
        const matchesDate =
          dateFilter === "Todas as datas" ||
          (dateFilter === "Retornos" && isReturnAppointmentItem(a)) ||
          (dateFilter === "Hoje" && (a.date === getToday() || !a.date));
        const matchesQuery = `${a.petName} ${a.tutor} ${a.service} ${a.priority || ""} ${a.notes || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesStatus && matchesDate && matchesQuery;
      }),
    [list, viewMode, filter, dateFilter, query],
  );

  const handleOpenExam = (a) => {
    if (a.status === "Confirmado" || a.status === "Aguardando") {
      updateAppointmentStatus(a.id, "Em atendimento");
    }
    navigate(`/clinica/atendimento/${a.id}`);
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

  const cancel = (a) => {
    updateAppointmentStatus(a.id, "Cancelado");
    toast("Atendimento cancelado", { description: `${a.petName} — ${a.time}` });
  };

  const startEdit = (a) => {
    navigate(`/clinica/agenda/editar/${a.id}`);
  };

  const confirmDelete = async () => {
    const a = toDelete;
    setToDelete(null);
    if (!a) return;
    await deleteAppointment(a.id);
    toast("Atendimento excluído", { description: `${a.petName} — ${a.time}` });
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
              <Button
                variant={dateFilter === "Retornos" ? "secondary" : "ghost"}
                size="sm"
                data-testid="filter-returns-btn"
                className="h-6 rounded-full px-2.5 text-xs font-semibold"
                onClick={() => setDateFilter("Retornos")}
              >
                Retornos
              </Button>
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold">
            {dateFilter === "Hoje"
              ? "Atendimentos de hoje"
              : dateFilter === "Retornos"
                ? "Retornos programados"
                : "Todos os atendimentos"}
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

          <Button
            type="button"
            className="rounded-full gradient-primary text-primary-foreground shadow-soft"
            onClick={() => navigate("/clinica/agenda/novo")}
          >
            <Plus className="h-4 w-4" /> Novo atendimento
          </Button>
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

      <ClinicDataStatus hasData={list.length > 0} />

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
                      <ReturnAppointmentBadge appointment={a} />
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
                    {(a.valor_total != null || a.valor_servico != null) && (
                      <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                        {formatCurrency(a.valor_total ?? a.valor_servico)}
                      </Badge>
                    )}
                    {a.status_pagamento && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          a.status_pagamento === "Pago"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {a.status_pagamento === "Pago" ? "Pago" : "Pendente"}
                      </Badge>
                    )}
                    <Badge className={`${statusStyles[a.status]} hover:opacity-90`}>{a.status}</Badge>
                    <WhatsAppActionButton appointment={a} profile={profile} />
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`btn-receipt-${a.id}`}
                      className="rounded-full gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary-soft"
                      onClick={() => navigate(`/clinica/recibo/${a.id}`)}
                    >
                      <Receipt className="h-3.5 w-3.5" /> Recibo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`open-documents-${a.id}`}
                      className="rounded-full gap-1.5 text-xs font-medium"
                      onClick={() => navigate(`/clinica/documentos/${a.id}`)}
                    >
                      <FileBadge className="h-3.5 w-3.5" /> Emitir Documento
                    </Button>
                    {hasPrescription(a) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full gap-1.5 border-primary/40 text-xs font-medium text-primary hover:bg-primary-soft"
                        onClick={() => navigate(`/clinica/prescricao/${a.id}`)}
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
                          className="rounded-full gap-1.5"
                          aria-label={`Editar atendimento de ${a.petName}`}
                          onClick={() => startEdit(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full gap-1.5 text-destructive"
                      aria-label={`Excluir atendimento de ${a.petName}`}
                      onClick={() => setToDelete(a)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </Button>
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
                  {toDelete?.id === a.id && (
                    <div
                      role="alertdialog"
                      aria-label="Confirmar exclusão de atendimento"
                      className="w-full mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-destructive">Excluir este atendimento?</p>
                        <p className="text-muted-foreground">
                          {toDelete.petName} — {toDelete.date} às {toDelete.time}. Ele some da agenda e do servidor. Para manter o registro, prefira "Cancelar".
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full text-xs"
                          onClick={() => setToDelete(null)}
                        >
                          Manter
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 rounded-full text-xs"
                          onClick={confirmDelete}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
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
                onAction={() => navigate("/clinica/agenda/novo")}
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
                            <div className="flex flex-wrap items-center gap-1">
                              <PriorityBadge priority={a.priority} />
                              <ReturnAppointmentBadge appointment={a} />
                            </div>
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

                          {(a.valor_total != null || a.valor_servico != null) && (
                            <div className="flex items-center justify-between text-xs py-1 border-t border-border/40">
                              <span className="font-semibold text-foreground">
                                {formatCurrency(a.valor_total ?? a.valor_servico)}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${
                                  a.status_pagamento === "Pago"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                }`}
                              >
                                {a.status_pagamento === "Pago" ? "Pago" : "Pendente"}
                              </Badge>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                            <WhatsAppActionButton appointment={a} profile={profile} compact />

                            {hasPrescription(a) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-full rounded-full gap-1 border-primary/40 text-xs font-medium text-primary hover:bg-primary-soft"
                                onClick={() => navigate(`/clinica/prescricao/${a.id}`)}
                              >
                                <FileText className="h-3 w-3" /> Visualizar Receituário
                              </Button>
                            )}

                            {col.id === "waiting" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full p-0"
                                  aria-label={`Editar atendimento de ${a.petName}`}
                                  onClick={() => startEdit(a)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full p-0 text-destructive"
                                  aria-label={`Excluir atendimento de ${a.petName}`}
                                  onClick={() => setToDelete(a)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
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
                              <div className="flex gap-1.5 w-full">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 flex-1 rounded-full gap-1 text-xs"
                                  onClick={() => handleOpenExam(a)}
                                >
                                  <Stethoscope className="h-3 w-3" /> Prontuário
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`btn-receipt-kanban-${a.id}`}
                                  className="h-8 flex-1 rounded-full gap-1 text-xs border-primary/30 text-primary hover:bg-primary-soft"
                                  onClick={() => navigate(`/clinica/recibo/${a.id}`)}
                                >
                                  <Receipt className="h-3 w-3" /> Recibo
                                </Button>
                              </div>
                            )}
                          </div>
                          {toDelete?.id === a.id && (
                            <div
                              role="alertdialog"
                              aria-label="Confirmar exclusão de atendimento"
                              className="w-full mt-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex flex-col gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <p className="font-semibold text-destructive">Excluir este atendimento?</p>
                                <p className="text-muted-foreground text-[11px]">
                                  {toDelete.petName} — {toDelete.date} às {toDelete.time}.
                                </p>
                              </div>
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 rounded-full text-xs"
                                  onClick={() => setToDelete(null)}
                                >
                                  Manter
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 px-2.5 rounded-full text-xs"
                                  onClick={confirmDelete}
                                >
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          )}
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

    </div>
  );
};

export default ClinicSchedule;

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  PawPrint,
  PieChart as PieChartIcon,
  Syringe,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import EmptyState from "@/components/EmptyState";
import { statusStyles } from "@/data/clinicDemo";
import { useClinic } from "@/contexts/ClinicContext";

const DAILY_SLOT_CAPACITY = 10;
const MONTHLY_GOALS_TARGETS = {
  consultas: 20,
  vacinas: 15,
  retornos: 10,
};

const STATUS_CHART_CONFIG = [
  { key: "Confirmado", label: "Confirmado", color: "#15803d" },
  { key: "Aguardando", label: "Aguardando", color: "#f59e0b" },
  { key: "Em atendimento", label: "Em Consulta", color: "#2563eb" },
  { key: "Concluído", label: "Concluído", color: "#10b981" },
  { key: "Cancelado", label: "Cancelado", color: "#ef4444" },
];

const WEEKDAYS = [
  { dayIndex: 1, label: "Seg" },
  { dayIndex: 2, label: "Ter" },
  { dayIndex: 3, label: "Qua" },
  { dayIndex: 4, label: "Qui" },
  { dayIndex: 5, label: "Sex" },
  { dayIndex: 6, label: "Sáb" },
  { dayIndex: 0, label: "Dom" },
];

const SPECIES_COLORS = {
  Cão: "#15803d",
  Gato: "#f97316",
  Ave: "#0ea5e9",
  Roedor: "#eab308",
  Réptil: "#8b5cf6",
  Outro: "#64748b",
};

const SERVICE_CATEGORIES = [
  {
    key: "Consultas",
    color: "#15803d",
    match: (text) => /consulta|cl[ií]nic|emerg|triagem|cirurg|atendimento/i.test(text),
  },
  {
    key: "Vacinas",
    color: "#f97316",
    match: (text, app) => Boolean(app?.vacina_aplicada) || /vacin|imuniz|v8|v10|antirrábica|raiva/i.test(text),
  },
  {
    key: "Retornos",
    color: "#0ea5e9",
    match: (text) => /retorno|reavalia|acompanhamento|p[oó]s/i.test(text),
  },
  {
    key: "Exames",
    color: "#8b5cf6",
    match: (text) => /exame|hemograma|ultrassom|raio|check|laborat/i.test(text),
  },
];

const getTodayIso = () => new Date().toISOString().split("T")[0];
const getCurrentYearMonth = () => getTodayIso().slice(0, 7);

const isVaccineAppointment = (a) => {
  const text = `${a.service || ""} ${a.notes || ""}`;
  return Boolean(a.vacina_aplicada) || /vacin|imuniz|v8|v10|raiva/i.test(text);
};

const isReturnAppointment = (a) => {
  const text = `${a.service || ""} ${a.notes || ""} ${a.queixa_principal || ""}`;
  return /retorno|reavalia|acompanhamento|rev/i.test(text);
};

export const computeDashboardMetrics = (appointments = [], patients = []) => {
  const todayIso = getTodayIso();
  const currentYM = getCurrentYearMonth();

  const todayAppointments = appointments.filter((a) => !a.date || a.date === todayIso);
  const activeAppointments = appointments.filter((a) => a.status !== "Cancelado");
  const activeToday = todayAppointments.filter((a) => a.status !== "Cancelado");
  const doneAll = appointments.filter((a) => a.status === "Concluído");
  const doneToday = todayAppointments.filter((a) => a.status === "Concluído");

  // Vacinas do mês: agendamentos do mês com vacina aplicada ou serviço de vacinação + pacientes com vacina em dia
  const monthVaccineApps = appointments.filter((a) => {
    const inMonth = !a.date || String(a.date).startsWith(currentYM);
    return inMonth && a.status !== "Cancelado" && isVaccineAppointment(a);
  }).length;

  const immunizedPatientsCount = patients.filter((p) => p.vaccinesUpToDate === true).length;
  const vaccinesMonthCount = Math.max(monthVaccineApps, immunizedPatientsCount);

  // Ocupação da agenda: baseada nos horários ocupados hoje (ou total ativo se não houver hoje) vs capacidade diária
  const baseForOccupancy = activeToday.length > 0 ? activeToday.length : activeAppointments.length;
  const occupancyRate = Math.min(
    100,
    Math.round((baseForOccupancy / DAILY_SLOT_CAPACITY) * 100),
  );

  // Metas do mês
  const concludedConsultations = doneAll.length;
  const concludedReturns = doneAll.filter(isReturnAppointment).length;

  const goals = [
    {
      label: "Consultas realizadas",
      current: concludedConsultations,
      target: MONTHLY_GOALS_TARGETS.consultas,
      value: Math.min(
        100,
        Math.round((concludedConsultations / MONTHLY_GOALS_TARGETS.consultas) * 100),
      ),
    },
    {
      label: "Vacinas aplicadas",
      current: vaccinesMonthCount,
      target: MONTHLY_GOALS_TARGETS.vacinas,
      value: Math.min(
        100,
        Math.round((vaccinesMonthCount / MONTHLY_GOALS_TARGETS.vacinas) * 100),
      ),
    },
    {
      label: "Retornos concluídos",
      current: concludedReturns,
      target: MONTHLY_GOALS_TARGETS.retornos,
      value: Math.min(
        100,
        Math.round((concludedReturns / MONTHLY_GOALS_TARGETS.retornos) * 100),
      ),
    },
  ];

  // Distribuição de atendimentos por status
  const byStatus = STATUS_CHART_CONFIG.map((cfg) => ({
    name: cfg.label,
    status: cfg.key,
    total: appointments.filter((a) => a.status === cfg.key).length,
    color: cfg.color,
  }));

  // Distribuição por dia da semana
  const byWeekday = WEEKDAYS.map((w) => {
    const count = appointments.filter((a) => {
      if (!a.date) return false;
      const parsed = new Date(`${a.date}T12:00:00`);
      return !Number.isNaN(parsed.getTime()) && parsed.getDay() === w.dayIndex;
    }).length;
    return {
      name: w.label,
      total: count,
      color: "#15803d",
    };
  });

  // Distribuição por espécie (combina pacientes cadastrados e espécies em agendamentos sem duplicar pelo nome)
  const speciesMap = new Map();
  patients.forEach((p) => {
    const key = p.name ? `${p.name.toLowerCase()}-${(p.tutor || "").toLowerCase()}` : p.id;
    speciesMap.set(key, p.species || "Cão");
  });
  appointments.forEach((a) => {
    const key = a.petName ? `${a.petName.toLowerCase()}-${(a.tutor || "").toLowerCase()}` : a.id;
    if (!speciesMap.has(key)) {
      speciesMap.set(key, a.species || "Cão");
    }
  });

  const speciesCounts = {};
  speciesMap.forEach((sp) => {
    const norm = SPECIES_COLORS[sp] ? sp : "Outro";
    speciesCounts[norm] = (speciesCounts[norm] || 0) + 1;
  });

  const bySpecies = Object.keys(SPECIES_COLORS).map((sp) => ({
    name: sp,
    value: speciesCounts[sp] || 0,
    color: SPECIES_COLORS[sp],
  }));

  // Proporção por tipo de serviço (Consultas, Vacinas, Retornos, Exames)
  const byService = SERVICE_CATEGORIES.map((cat) => {
    const count = appointments.filter((a) => {
      const text = `${a.service || ""} ${a.notes || ""}`;
      if (cat.key === "Consultas") {
        // Se não caiu especificamente apenas em vacina/retorno/exame ou se menciona consulta
        const isOtherSpecific =
          SERVICE_CATEGORIES.slice(1).some((other) => other.match(text, a)) &&
          !/consulta/i.test(text);
        return !isOtherSpecific || cat.match(text, a);
      }
      return cat.match(text, a);
    }).length;

    const pct =
      appointments.length > 0 ? Math.round((count / appointments.length) * 100) : 0;

    return {
      name: cat.key,
      count,
      percentage: pct,
      color: cat.color,
    };
  });

  return {
    todayCount: todayAppointments.length || appointments.length,
    doneTodayCount: doneToday.length || doneAll.length,
    vaccinesMonthCount,
    occupancyRate,
    activeCount: baseForOccupancy,
    goals,
    byStatus,
    byWeekday,
    bySpecies,
    byService,
  };
};

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const { profile, appointments, patients } = useClinic();
  const [chartMode, setChartMode] = useState("status");

  const metrics = useMemo(
    () => computeDashboardMetrics(appointments, patients),
    [appointments, patients],
  );

  const kpis = [
    {
      testId: "kpi-appointments",
      label: "Atendimentos hoje",
      value: appointments.length,
      icon: CalendarDays,
      hint: appointments.length
        ? `${metrics.doneTodayCount} concluído(s)`
        : "Nenhum agendado",
    },
    {
      testId: "kpi-patients",
      label: "Pacientes ativos",
      value: patients.length,
      icon: PawPrint,
      hint: patients.length ? "Cadastrados na clínica" : "Nenhum paciente ainda",
    },
    {
      testId: "kpi-vaccines",
      label: "Vacinas do mês",
      value: metrics.vaccinesMonthCount,
      icon: Syringe,
      hint:
        metrics.vaccinesMonthCount > 0
          ? `${metrics.vaccinesMonthCount} dose(s) registrada(s)`
          : "0 aplicadas neste mês",
    },
    {
      testId: "kpi-occupancy",
      label: "Ocupação da agenda",
      value: `${metrics.occupancyRate}%`,
      icon: TrendingUp,
      hint: `${metrics.activeCount}/${DAILY_SLOT_CAPACITY} horários preenchidos`,
    },
  ];

  const alerts = patients.filter((p) => p.alerts.length > 0).slice(0, 4);
  const next = appointments.filter(
    (a) => a.status === "Confirmado" || a.status === "Aguardando",
  );

  const activeSpecies = metrics.bySpecies.filter((s) => s.value > 0);
  const pieData =
    activeSpecies.length > 0
      ? activeSpecies
      : [{ name: "Sem registros", value: 1, color: "#e2e8f0", isEmpty: true }];

  const barData = chartMode === "status" ? metrics.byStatus : metrics.byWeekday;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">
            Painel da clínica
          </Badge>
          <h1 className="font-display text-3xl font-bold">
            Olá, {profile.name || "Clínica"} 👋
          </h1>
          <p className="text-muted-foreground">
            Resumo do dia, indicadores analíticos e o que precisa da sua atenção agora.
          </p>
        </div>
        <Button
          asChild
          className="rounded-full gradient-primary text-primary-foreground shadow-soft"
        >
          <Link to="/clinica/agenda">
            Ver agenda completa <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* KPIs Dinâmicos do Topo */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ testId, label, value, icon: Icon, hint }) => (
          <Card
            key={label}
            data-testid={testId}
            className="border-border/70 shadow-card transition-transform hover:-translate-y-1"
          >
            <CardContent className="flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="truncate text-sm font-medium">{label}</p>
                <p className="truncate text-xs text-muted-foreground">{hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seção de Gráficos Analíticos (Recharts) */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Gráfico 1: Volume de Atendimentos (Status ou Dia da Semana) */}
        <Card
          data-testid="chart-appointments-volume"
          className="border-border/70 shadow-card"
        >
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Volume de Atendimentos
              </CardTitle>
              <CardDescription>
                Distribuição dos agendamentos da clínica por status ou dia da semana
              </CardDescription>
            </div>
            <div
              role="group"
              aria-label="Agrupamento do gráfico de atendimentos"
              className="inline-flex self-start rounded-full border border-border bg-muted/60 p-1"
            >
              <Button
                type="button"
                size="sm"
                variant={chartMode === "status" ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-xs font-semibold"
                onClick={() => setChartMode("status")}
              >
                Por Status
              </Button>
              <Button
                type="button"
                size="sm"
                variant={chartMode === "weekday" ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-xs font-semibold"
                onClick={() => setChartMode("weekday")}
              >
                Dia da Semana
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.35} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} atendimento(s)`, "Total"]}
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {barData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
              {barData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="font-bold text-foreground">{item.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Proporção por Espécie (Donut) e Tipo de Serviço */}
        <Card
          data-testid="chart-species-services"
          className="border-border/70 shadow-card"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Distribuição por Espécie & Serviços
            </CardTitle>
            <CardDescription>
              Perfil dos pacientes atendidos e proporção de procedimentos realizados
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 sm:items-center">
            {/* Donut de Espécies */}
            <div className="flex flex-col items-center">
              <div className="h-48 w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={activeSpecies.length > 1 ? 4 : 0}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    {!pieData[0]?.isEmpty && (
                      <Tooltip
                        formatter={(val, name) => [`${val} paciente(s)`, name]}
                        contentStyle={{
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
                {metrics.bySpecies.slice(0, 4).map((sp) => (
                  <span
                    key={sp.name}
                    data-testid={`species-stat-${sp.name}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: sp.color }}
                    />
                    <span>{sp.name}:</span>
                    <strong>{sp.value}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Barras de Proporção por Tipo de Serviço */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Por Tipo de Serviço
              </p>
              {metrics.byService.map((srv) => (
                <div
                  key={srv.name}
                  data-testid={`service-stat-${srv.name}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{srv.name}</span>
                    <span className="font-semibold text-muted-foreground">
                      {srv.count} ({srv.percentage}%)
                    </span>
                  </div>
                  <Progress value={srv.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Atendimentos + Atenção + Metas do Mês */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-lg">Próximos atendimentos</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link to="/clinica/agenda">Abrir agenda</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {next.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-primary/40"
              >
                <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-sm font-semibold">
                  <Clock className="h-3.5 w-3.5" /> {a.time}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {a.petName}{" "}
                    <span className="font-normal text-muted-foreground">· {a.breed}</span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {a.service} — {a.vet}
                  </p>
                </div>
                <Badge className={`${statusStyles[a.status]} hover:opacity-90`}>
                  {a.status}
                </Badge>
              </div>
            ))}
            {next.length === 0 && (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" />}
                title="Nenhum atendimento hoje"
                description="Sua agenda está livre por enquanto. Agende um atendimento para ele aparecer aqui."
                actionLabel="Agendar atendimento"
                onAction={() => navigate("/clinica/agenda")}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <AlertTriangle className="h-4 w-4 text-warm" /> Precisam de atenção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((p) => (
                <div key={p.id} className="rounded-2xl bg-warm-soft/70 p-3">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.alerts[0]}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <EmptyState
                  compact
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Tudo em dia por aqui"
                  description="Nenhum paciente com alerta no momento."
                />
              )}
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/clinica/pacientes">Ver pacientes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="monthly-goals-card" className="border-border/70 shadow-card">
            <CardHeader className="space-y-1">
              <CardTitle className="font-display text-lg">Metas do mês</CardTitle>
              <p className="text-xs text-muted-foreground">
                Progresso calculado em tempo real com base nos atendimentos da clínica.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.goals.map((m) => (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-semibold">
                      {m.current}/{m.target} ({m.value}%)
                    </span>
                  </div>
                  <Progress value={m.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;
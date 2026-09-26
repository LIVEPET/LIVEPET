import { Link } from "react-router-dom";
import {
  CalendarDays,
  PawPrint,
  Syringe,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { appointments, patients, statusStyles, clinicProfile } from "@/data/clinicDemo";

const kpis = [
  { label: "Atendimentos hoje", value: appointments.length, icon: CalendarDays, hint: "2 concluídos" },
  { label: "Pacientes ativos", value: patients.length * 21, icon: PawPrint, hint: "+8 esta semana" },
  { label: "Vacinas do mês", value: 42, icon: Syringe, hint: "6 pendentes" },
  { label: "Ocupação da agenda", value: "78%", icon: TrendingUp, hint: "Meta: 85%" },
];

const alerts = patients.filter((p) => p.alerts.length > 0).slice(0, 4);

const ClinicDashboard = () => {
  const next = appointments.filter((a) => a.status === "Confirmado" || a.status === "Aguardando");

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">Painel da clínica</Badge>
          <h1 className="font-display text-3xl font-bold">Olá, {clinicProfile.name}</h1>
          <p className="text-muted-foreground">Resumo do dia e o que precisa da sua atenção agora.</p>
        </div>
        <Button asChild className="rounded-full gradient-primary text-primary-foreground shadow-soft">
          <Link to="/clinica/agenda">
            Ver agenda completa <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label} className="border-border/70 shadow-card transition-transform hover:-translate-y-1">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                    {a.petName} <span className="font-normal text-muted-foreground">· {a.breed}</span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {a.service} — {a.vet}
                  </p>
                </div>
                <Badge className={`${statusStyles[a.status]} hover:opacity-90`}>{a.status}</Badge>
              </div>
            ))}
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
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/clinica/pacientes">Ver pacientes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">Metas do mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Consultas realizadas", value: 78 },
                { label: "Vacinas aplicadas", value: 64 },
                { label: "Retornos concluídos", value: 45 },
              ].map((m) => (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-semibold">{m.value}%</span>
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Droplets,
  HeartPulse,
  Minus,
  Scale,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BODY_BANDS,
  formatDate,
  formatDelta,
  formatNumber,
  getBodyCondition,
} from "@/lib/clinicVitals";

// Alergias e alertas clínicos em destaque, no topo do prontuário.
export const AlertsBanner = ({ alerts }) => {
  const list = Array.isArray(alerts) ? alerts.filter(Boolean) : [];
  if (list.length === 0) return null;
  return (
    <div role="alert" className="mt-4 rounded-2xl border border-warm/50 bg-warm-soft/70 p-4">
      <p className="flex items-center gap-2 text-sm font-bold">
        <AlertTriangle className="h-4 w-4 text-warm" /> Atenção: alergias e alertas clínicos
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {list.map((alert) => (
          <li key={alert} className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium">
            {alert}
          </li>
        ))}
      </ul>
    </div>
  );
};

const VitalCard = ({ icon: Icon, label, value, unit, footer }) => (
  <div className="rounded-2xl border border-border p-3">
    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </p>
    <p className="mt-1 font-display text-xl font-bold">
      {value == null ? (
        "—"
      ) : (
        <>
          {value}
          {unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
        </>
      )}
    </p>
    <div className="mt-0.5 min-h-4 text-[11px] text-muted-foreground">{footer}</div>
  </div>
);

const measuredOn = (reading) => {
  if (!reading) return "Sem registro";
  if (reading.fromRegistration) return "Do cadastro";
  const date = formatDate(reading.date);
  return date ? `em ${date}` : "";
};

const WeightVariation = ({ change }) => {
  if (change === null || change === undefined) return null;
  const text = `${formatDelta(change)} kg`;
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const tone = change > 0 ? "text-warm" : change < 0 ? "text-sky-600" : "text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${tone}`}
      aria-label={`Variação de ${text} desde a pesagem anterior`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" /> {text}
    </span>
  );
};

export const VitalsCards = ({ vitals }) => {
  const { latest, weightChange } = vitals;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <VitalCard
        icon={Scale}
        label="Peso"
        value={latest.peso ? formatNumber(latest.peso.value) : null}
        unit="kg"
        footer={
          <>
            <WeightVariation change={weightChange} />
            {weightChange !== null && <span className="ml-1">· </span>}
            {measuredOn(latest.peso)}
          </>
        }
      />
      <VitalCard
        icon={Thermometer}
        label="Temperatura"
        value={latest.temperatura ? formatNumber(latest.temperatura.value) : null}
        unit="°C"
        footer={measuredOn(latest.temperatura)}
      />
      <VitalCard
        icon={HeartPulse}
        label="Freq. cardíaca"
        value={latest.fc ? formatNumber(latest.fc.value) : null}
        unit="bpm"
        footer={measuredOn(latest.fc)}
      />
      <VitalCard
        icon={Wind}
        label="Freq. respiratória"
        value={latest.fr ? formatNumber(latest.fr.value) : null}
        unit="mpm"
        footer={measuredOn(latest.fr)}
      />
      <VitalCard
        icon={Droplets}
        label="Mucosas"
        value={latest.mucosas ? latest.mucosas.value : null}
        footer={measuredOn(latest.mucosas)}
      />
    </div>
  );
};

const BAND_STYLES = {
  under: "bg-sky-400 text-white",
  ideal: "bg-emerald-500 text-white",
  over: "bg-amber-400 text-black",
  obese: "bg-red-500 text-white",
};

const bandOf = (score) => BODY_BANDS.find((band) => score >= band.min && score <= band.max);

// Escala de 9 pontos com o valor do paciente em destaque.
export const BodyConditionScale = ({ score }) => {
  const condition = getBodyCondition(score);
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Escore de Condição Corporal (ECC)</p>
        {condition ? (
          <Badge className={`${BAND_STYLES[condition.id]} hover:opacity-90`}>
            ECC {condition.score} · {condition.label}
          </Badge>
        ) : (
          <Badge variant="outline">Não avaliado</Badge>
        )}
      </div>

      <div
        role="img"
        aria-label={
          condition
            ? `Escore de condição corporal ${condition.score} de 9: ${condition.label}`
            : "Escore de condição corporal não avaliado"
        }
        className="mt-3 grid grid-cols-9 gap-1"
      >
        {Array.from({ length: 9 }, (_, index) => index + 1).map((n) => {
          const active = condition?.score === n;
          return (
            <div
              key={n}
              className={`flex h-9 items-center justify-center rounded-md text-xs font-bold transition-transform ${
                BAND_STYLES[bandOf(n).id]
              } ${active ? "scale-110 shadow-md ring-2 ring-foreground" : condition ? "opacity-40" : "opacity-60"}`}
            >
              {n}
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-9 text-center text-[10px] text-muted-foreground" aria-hidden="true">
        <span className="col-span-3">Abaixo do peso</span>
        <span className="col-span-2">Ideal</span>
        <span className="col-span-2">Sobrepeso</span>
        <span className="col-span-2">Obeso</span>
      </div>

      {!condition && (
        <p className="mt-2 text-xs text-muted-foreground">
          Defina o ECC em Editar → Escore de condição corporal (ECC).
        </p>
      )}
    </div>
  );
};

export const WeightChart = ({ series }) => {
  if (series.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        {series.length === 0
          ? "Nenhuma pesagem registrada ainda. O peso informado ao concluir um atendimento aparece aqui."
          : "Registre ao menos duas pesagens (ao concluir atendimentos) para ver a curva de peso."}
      </div>
    );
  }

  const first = series[0];
  const last = series[series.length - 1];
  const summary =
    `Gráfico da evolução de peso: ${formatNumber(first.peso)} kg em ${formatDate(first.date, "full")} ` +
    `até ${formatNumber(last.peso)} kg em ${formatDate(last.date, "full")}`;

  return (
    <div role="img" aria-label={summary} className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="patientWeightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.35} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            domain={[(min) => Math.floor(min - 1), (max) => Math.ceil(max + 1)]}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={40}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            formatter={(value) => [`${formatNumber(value)} kg`, "Peso"]}
            labelFormatter={(_, payload) => formatDate(payload?.[0]?.payload?.date, "full")}
          />
          <Area
            type="monotone"
            dataKey="peso"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#patientWeightFill)"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Os mesmos dados do gráfico em tabela (leitura por leitor de tela e conferência dos valores).
export const WeightTable = ({ series }) => {
  if (series.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">Histórico de pesagens</caption>
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Data</th>
            <th scope="col" className="px-3 py-2 text-left font-medium">Peso</th>
            <th scope="col" className="px-3 py-2 text-left font-medium">Variação</th>
          </tr>
        </thead>
        <tbody>
          {[...series].reverse().map((point, index) => (
            <tr key={`${point.date}-${point.time}-${index}`} className="border-t border-border">
              <td className="px-3 py-2">{formatDate(point.date, "full")}</td>
              <td className="px-3 py-2 font-medium">{formatNumber(point.peso)} kg</td>
              <td className="px-3 py-2 text-muted-foreground">
                {point.delta === null ? "—" : `${formatDelta(point.delta)} kg`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
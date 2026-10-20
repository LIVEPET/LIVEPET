// Sinais vitais, evolução de peso e Escore de Condição Corporal (ECC) do paciente.
// Os dados vêm dos atendimentos concluídos (formulário "Atender / Concluir" da Agenda).

const normalize = (text) => String(text ?? "").trim().toLowerCase();

export const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
};

// "12.5 kg" => 12.5 | "—" => null
export const weightFromText = (text) => toNumber(String(text ?? "").replace(/kg/i, "").trim());

export const formatNumber = (value) =>
  Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

// +0,7 | −0,3 | 0  (usa o sinal de menos tipográfico)
export const formatDelta = (delta) => {
  if (delta > 0) return `+${formatNumber(delta)}`;
  if (delta < 0) return `−${formatNumber(Math.abs(delta))}`;
  return "0";
};

// Aceita "2026-10-16" (padrão do Context) e "16/10/2026".
export const parseDate = (value) => {
  const text = String(value ?? "").trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return new Date(Date.UTC(+match[3], +match[2] - 1, +match[1]));
  return null;
};

// "short" => 16/10 | "full" => 16/10/2026
export const formatDate = (value, style = "short") => {
  const date = parseDate(value);
  if (!date) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return style === "full" ? `${day}/${month}/${date.getUTCFullYear()}` : `${day}/${month}`;
};

const toTimestamp = (date, time) => {
  const base = parseDate(date)?.getTime() ?? 0;
  const [hours, minutes] = String(time ?? "").split(":").map((part) => parseInt(part, 10));
  return base + ((hours || 0) * 60 + (minutes || 0)) * 60000;
};

// O atendimento tem patientId quando veio de "Registrar novo atendimento"; senão, nome + tutor.
export const belongsToPatient = (patient, appointment) => {
  if (appointment.patientId != null && patient.id != null) {
    return String(appointment.patientId) === String(patient.id);
  }
  return (
    normalize(patient.name) === normalize(appointment.petName) &&
    normalize(patient.tutor) === normalize(appointment.tutor)
  );
};

const latestOf = (records, key) => {
  for (let i = records.length - 1; i >= 0; i -= 1) {
    if (records[i][key] != null) return { value: records[i][key], date: records[i].date };
  }
  return null;
};

export const buildVitals = (patient, appointments) => {
  const records = (Array.isArray(appointments) ? appointments : [])
    .filter((a) => a && a.status === "Concluído" && belongsToPatient(patient, a))
    .map((a) => ({
      date: a.date,
      time: a.time,
      peso: toNumber(a.peso),
      temperatura: toNumber(a.temperatura),
      fc: toNumber(a.frequencia_cardiaca),
      fr: toNumber(a.frequencia_respiratoria),
      mucosas: a.mucosas ? String(a.mucosas) : null,
    }))
    .filter((r) => [r.peso, r.temperatura, r.fc, r.fr].some((v) => v != null) || r.mucosas)
    .sort((a, b) => toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time));

  const weighings = records.filter((r) => r.peso != null);
  const years = new Set(weighings.map((r) => parseDate(r.date)?.getUTCFullYear()));
  const labelStyle = years.size > 1 ? "full" : "short";

  const weightSeries = weighings.map((record, index) => ({
    date: record.date,
    time: record.time,
    label: formatDate(record.date, labelStyle) || String(index + 1),
    peso: record.peso,
    delta: index === 0 ? null : Math.round((record.peso - weighings[index - 1].peso) * 100) / 100,
  }));

  const latest = {
    peso: latestOf(records, "peso"),
    temperatura: latestOf(records, "temperatura"),
    fc: latestOf(records, "fc"),
    fr: latestOf(records, "fr"),
    mucosas: latestOf(records, "mucosas"),
  };

  // Sem nenhuma pesagem nos atendimentos, usa o peso informado no cadastro do paciente.
  if (!latest.peso) {
    const registered = weightFromText(patient.weight);
    if (registered != null) latest.peso = { value: registered, date: null, fromRegistration: true };
  }

  return {
    hasData: records.length > 0,
    latest,
    weightSeries,
    weightChange: weightSeries.length > 1 ? weightSeries[weightSeries.length - 1].delta : null,
  };
};

export const BODY_BANDS = [
  { id: "under", label: "Abaixo do peso", min: 1, max: 3 },
  { id: "ideal", label: "Ideal", min: 4, max: 5 },
  { id: "over", label: "Sobrepeso", min: 6, max: 7 },
  { id: "obese", label: "Obeso", min: 8, max: 9 },
];

// Escala de 9 pontos: devolve um inteiro de 1 a 9, ou null.
export const normalizeEcc = (value) => {
  const number = toNumber(value);
  return Number.isInteger(number) && number >= 1 && number <= 9 ? number : null;
};

export const getBodyCondition = (score) => {
  const value = normalizeEcc(score);
  if (value === null) return null;
  return { score: value, ...BODY_BANDS.find((band) => value >= band.min && value <= band.max) };
};

export const ECC_OPTIONS = Array.from({ length: 9 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1} · ${getBodyCondition(index + 1).label}`,
}));
// Helpers do Perfil da clínica: horários, serviços e equipe.
// Mantém o formato antigo ({ day, time }) para horários e aceita serviços em texto puro.

export const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const TIME_RANGE = /(\d{2}:\d{2})\s*(?:às|a|-|–|—)\s*(\d{2}:\d{2})/i;

export const buildHour = (day, open, from, to) => ({
  day,
  open,
  from: open ? from : "",
  to: open ? to : "",
  time: open ? `${from} às ${to}` : "Fechado",
});

// Sugestão inicial para a primeira vez que a clínica define os horários.
export const defaultHours = () =>
  WEEK_DAYS.map((day) => {
    if (day === "Dom") return buildHour(day, false);
    return buildHour(day, true, "08:00", day === "Sáb" ? "12:00" : "18:00");
  });

// Aceita o formato novo ({ open, from, to }) e o antigo ({ day, time: "08:00 às 18:00" }).
export const normalizeHour = (day, raw) => {
  if (!raw || typeof raw !== "object") return buildHour(day, false);
  if (typeof raw.open === "boolean") return buildHour(day, raw.open, raw.from ?? "", raw.to ?? "");
  const match = String(raw.time ?? "").match(TIME_RANGE);
  return match ? buildHour(day, true, match[1], match[2]) : buildHour(day, false);
};

// Sempre devolve os 7 dias, na ordem da semana, prontos para o formulário.
export const hoursForEditing = (hours) => {
  const list = Array.isArray(hours) ? hours : [];
  if (list.length === 0) return defaultHours();
  return WEEK_DAYS.map((day) => normalizeHour(day, list.find((h) => h?.day === day)));
};

// Lista para exibir no card: só os dias cadastrados, na ordem da semana.
export const hoursForDisplay = (hours) => {
  const list = Array.isArray(hours) ? hours.filter((h) => h && typeof h === "object") : [];
  const order = (day) => {
    const index = WEEK_DAYS.indexOf(day);
    return index === -1 ? WEEK_DAYS.length : index;
  };
  return list
    .map((h) => ({ ...normalizeHour(h.day, h), day: h.day }))
    .sort((a, b) => order(a.day) - order(b.day));
};

// Retorna { [dia]: mensagem } só para os dias com problema.
export const validateHours = (rows) => {
  const errors = {};
  rows.forEach((row) => {
    if (!row.open) return;
    if (!row.from) errors[row.day] = "Informe o horário de abertura.";
    else if (!row.to) errors[row.day] = "Informe o horário de fechamento.";
    else if (row.from >= row.to) errors[row.day] = "O fechamento deve ser depois da abertura.";
  });
  return errors;
};

// Preço: vazio => null; inválido => NaN. Aceita "80", "80,5", "80.50" e "1.200,00".
export const parsePrice = (text) => {
  const raw = String(text ?? "").replace(/R\$/gi, "").replace(/\s/g, "");
  if (!raw) return null;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  return Number(normalized);
};

export const formatPrice = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Duração em minutos: vazio => null; inválida => NaN (inteiro de 1 a 1440).
export const parseDuration = (text) => {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return NaN;
  const minutes = Number(raw);
  return minutes >= 1 && minutes <= 1440 ? minutes : NaN;
};

export const normalizeService = (raw) => {
  if (typeof raw === "string") return { name: raw.trim(), duration: null, price: null };
  if (!raw || typeof raw !== "object") return { name: "", duration: null, price: null };
  return {
    name: String(raw.name ?? "").trim(),
    duration: Number.isFinite(raw.duration) ? raw.duration : null,
    price: Number.isFinite(raw.price) ? raw.price : null,
  };
};

export const serviceMeta = (service) =>
  [
    service.duration != null ? `${service.duration} min` : "",
    service.price != null ? formatPrice(service.price) : "",
  ]
    .filter(Boolean)
    .join(" · ");

export const normalizeMember = (raw) => {
  if (typeof raw === "string") return { id: null, name: raw.trim(), role: "", crmv: "", phone: "", email: "" };
  if (!raw || typeof raw !== "object") return { id: null, name: "", role: "", crmv: "", phone: "", email: "" };
  return {
    id: raw.id ?? null,
    name: String(raw.name ?? raw.nome ?? "").trim(),
    role: String(raw.role ?? raw.especialidade ?? "").trim(),
    crmv: String(raw.crmv ?? "").trim(),
    phone: String(raw.phone ?? raw.telefone ?? "").trim(),
    email: String(raw.email ?? "").trim(),
  };
};

export const memberMeta = (member) => {
  const crmvLabel = member.crmv
    ? member.crmv.toUpperCase().startsWith("CRMV")
      ? member.crmv
      : `CRMV: ${member.crmv}`
    : "";
  return [member.role, crmvLabel].filter(Boolean).join(" · ");
};

// Nome já usado por outro item da lista? (ignora maiúsculas e o próprio item em edição)
export const isDuplicateName = (list, name, editing, normalize) => {
  const target = name.trim().toLowerCase();
  return list.some((item) => item !== editing && normalize(item).name.toLowerCase() === target);
};
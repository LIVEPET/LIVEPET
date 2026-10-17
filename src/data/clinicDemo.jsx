export const statusStyles = {
  Confirmado: "bg-primary-soft text-primary",
  Aguardando: "bg-warm-soft text-warm",
  "Em atendimento": "bg-secondary text-secondary-foreground",
  Concluído: "bg-primary text-primary-foreground",
  Cancelado: "bg-destructive/10 text-destructive",
};

export const priorityConfig = {
  Rotina: {
    value: "Rotina",
    label: "Rotina (Verde)",
    shortLabel: "Rotina",
    badgeClass: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    borderClass: "border-l-4 border-l-emerald-500",
    dotClass: "bg-emerald-500",
    weight: 1,
  },
  Prioritário: {
    value: "Prioritário",
    label: "Prioritário (Amarelo)",
    shortLabel: "Prioritário",
    badgeClass: "border-amber-400/40 bg-amber-400/20 text-amber-800 dark:text-amber-300",
    borderClass: "border-l-4 border-l-amber-400",
    dotClass: "bg-amber-400",
    weight: 2,
  },
  Urgência: {
    value: "Urgência",
    label: "Urgência (Laranja)",
    shortLabel: "Urgência",
    badgeClass: "border-orange-500/30 bg-orange-500/15 text-orange-700 dark:text-orange-400",
    borderClass: "border-l-4 border-l-orange-500",
    dotClass: "bg-orange-500",
    weight: 3,
  },
  Emergência: {
    value: "Emergência",
    label: "Emergência (Vermelho)",
    shortLabel: "Emergência",
    badgeClass: "border-red-600/30 bg-red-600/15 text-red-700 font-semibold dark:text-red-400",
    borderClass: "border-l-4 border-l-red-600",
    dotClass: "bg-red-600 animate-pulse",
    weight: 4,
  },
};

export const PRIORITY_OPTIONS = [
  priorityConfig.Rotina,
  priorityConfig.Prioritário,
  priorityConfig.Urgência,
  priorityConfig.Emergência,
];

export const getPriorityMeta = (priority) => {
  if (!priority) return priorityConfig.Rotina;
  if (priorityConfig[priority]) return priorityConfig[priority];
  const normalized = String(priority).trim().toLowerCase();
  const found = PRIORITY_OPTIONS.find(
    (item) =>
      item.label.toLowerCase() === normalized ||
      item.value.toLowerCase() === normalized,
  );
  return found || priorityConfig.Rotina;
};

export const BED_SECTORS = ["Todos", "Canil", "Gatil", "Isolamento"];

export const bedStatusStyles = {
  Livre: {
    badge: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    cardBorder: "border-emerald-500/40 hover:border-emerald-500",
    dot: "bg-emerald-500",
  },
  Ocupada: {
    badge: "border-rose-500/30 bg-rose-500/15 text-rose-700 font-semibold dark:text-rose-400",
    cardBorder: "border-l-4 border-l-rose-500 border-rose-500/40 bg-rose-500/[0.02]",
    dot: "bg-rose-500 animate-pulse",
  },
  "Em Higienização": {
    badge: "border-amber-500/40 bg-amber-400/20 text-amber-800 dark:text-amber-300",
    cardBorder: "border-amber-400/50 bg-amber-400/[0.03] border-dashed",
    dot: "bg-amber-500",
  },
};

export const createDefaultBeds = () => [
  {
    id: "canil-01",
    code: "C-01",
    name: "Canil 01",
    sector: "Canil",
    status: "Livre",
    occupant: null,
  },
  {
    id: "canil-02",
    code: "C-02",
    name: "Canil 02",
    sector: "Canil",
    status: "Livre",
    occupant: null,
  },
  {
    id: "canil-03",
    code: "C-03",
    name: "Canil 03",
    sector: "Canil",
    status: "Livre",
    occupant: null,
  },
  {
    id: "canil-04",
    code: "C-04",
    name: "Canil 04",
    sector: "Canil",
    status: "Livre",
    occupant: null,
  },
  {
    id: "gatil-01",
    code: "G-01",
    name: "Gatil 01",
    sector: "Gatil",
    status: "Livre",
    occupant: null,
  },
  {
    id: "gatil-02",
    code: "G-02",
    name: "Gatil 02",
    sector: "Gatil",
    status: "Livre",
    occupant: null,
  },
  {
    id: "isolamento-01",
    code: "UTI-01",
    name: "Isolamento / UTI 01",
    sector: "Isolamento",
    status: "Livre",
    occupant: null,
  },
  {
    id: "isolamento-02",
    code: "UTI-02",
    name: "Isolamento / UTI 02",
    sector: "Isolamento",
    status: "Livre",
    occupant: null,
  },
];
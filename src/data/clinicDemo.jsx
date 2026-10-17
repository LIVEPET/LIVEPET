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
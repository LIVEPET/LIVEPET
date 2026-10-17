export const statusStyles = {
  Confirmado: "bg-primary-soft text-primary",
  Aguardando: "bg-warm-soft text-warm",
  "Em atendimento": "bg-secondary text-secondary-foreground",
  Concluído: "bg-primary text-primary-foreground",
  Cancelado: "bg-destructive/10 text-destructive",
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
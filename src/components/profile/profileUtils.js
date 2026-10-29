// Funções e constantes compartilhadas pelos componentes da tela de perfil.

export const initialsFrom = (nameOrEmail) => {
  if (!nameOrEmail) return "LP";
  const str = nameOrEmail.trim();
  if (str.includes(" ")) {
    const parts = str.split(" ");
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
};

export const EMPTY_FORM = {
  nome: "",
  email: "",
  telefone: "",
  cidade: "",
  estado: "",
  nome_canil: "",
  bio: "",
  foto_url: "",
};

// Monta o formulário de edição a partir dos dados do tutor vindos da API.
export const formFromUser = (user) =>
  Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, user?.[key] || ""]));

// Monta o corpo enviado para authService.updateMe. Campos opcionais vazios viram null.
export const buildUpdatePayload = (form) => {
  const opcional = (valor) => valor.trim() || null;
  return {
    nome: form.nome.trim(),
    telefone: opcional(form.telefone),
    cidade: opcional(form.cidade),
    estado: opcional(form.estado),
    nome_canil: opcional(form.nome_canil),
    bio: opcional(form.bio),
    foto_url: form.foto_url || null,
  };
};

// Classes das 3 abas (antes repetidas em cada TabsTrigger).
export const TAB_TRIGGER_CLASS =
  "flex items-center gap-2 uppercase tracking-widest text-xs font-bold data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:shadow-none rounded-none bg-transparent";

// Classe dos rótulos dos campos do modal de edição (antes repetida em cada Label).
export const FIELD_LABEL_CLASS = "text-xs font-bold uppercase tracking-wider text-muted-foreground";

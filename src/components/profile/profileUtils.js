// Funções e constantes compartilhadas pelos componentes da tela de perfil.
import { formatPhone, isValidPhone, onlyDigits } from "@/lib/phone";

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
// Telefone válido já chega com máscara; um valor antigo fora do padrão fica como está para o tutor corrigir.
export const formFromUser = (user) => {
  const form = Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, user?.[key] || ""]));
  if (isValidPhone(form.telefone)) form.telefone = formatPhone(form.telefone);
  return form;
};

// Monta o corpo enviado para authService.updateMe. Campos opcionais vazios viram null.
// O telefone vai no formato da máscara, ex.: "(63) 99999-0000" (cabe nos 20 caracteres do back-end).
export const buildUpdatePayload = (form) => {
  const opcional = (valor) => valor.trim() || null;
  return {
    nome: form.nome.trim(),
    telefone: onlyDigits(form.telefone) ? formatPhone(form.telefone) : null,
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

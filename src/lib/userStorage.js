/**
 * Dados salvos no navegador separados por usuário.
 *
 * Tarefas e conversas ficam no localStorage. Com uma chave única para todos,
 * quem entrasse depois no mesmo navegador via os dados da conta anterior.
 * Aqui cada usuário tem a própria chave: "<base>__u<id do usuário>".
 */
import { getStoredUser } from "@/services/api";

/** Chave do usuário logado; null quando ninguém está logado. */
export const userScopedKey = (base, user = getStoredUser()) =>
  user?.id != null ? `${base}__u${user.id}` : null;

// A chave antiga, sem dono, pode ter dados de qualquer conta. Como não dá para
// saber de quem eram, ela é descartada em vez de ser mostrada a alguém.
const discardLegacy = (base) => {
  try {
    window.localStorage.removeItem(base);
  } catch {
    /* armazenamento indisponível */
  }
};

/** Lê o valor salvo para o usuário logado, ou `fallback` se não houver. */
export const readUserJSON = (base, fallback) => {
  discardLegacy(base);
  const key = userScopedKey(base);
  if (!key) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

/** Salva o valor para o usuário logado. Sem usuário logado, não salva nada. */
export const writeUserJSON = (base, value) => {
  const key = userScopedKey(base);
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo anônimo ou cota cheia: segue funcionando, só não persiste */
  }
};

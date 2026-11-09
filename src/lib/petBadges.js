/**
 * Regras dos selos e informações exibidas no card do pet (aba Pets).
 * Tudo é derivado dos dados reais retornados pela API, nunca fixo.
 */

/** Selo PEDIGREE: só quando a linhagem foi aprovada (não basta ter raça). */
export const hasApprovedPedigree = (pet) =>
  pet?.lineage?.status_verificacao === "aprovado";

/** Tem pedigree cadastrado: só quando existe linhagem (raça sozinha não conta). */
export const hasLineage = (pet) => Boolean(pet?.lineage);

/** Rótulo do status da linhagem, vindo do back-end (nunca inventado). */
const LINEAGE_STATUS_LABEL = {
  aprovado: "Verificado",
  pendente: "Em análise",
  declaratorio: "Declarado pelo tutor",
};

export const lineageStatusLabel = (pet) =>
  hasLineage(pet) ? LINEAGE_STATUS_LABEL[pet.lineage.status_verificacao] ?? LINEAGE_STATUS_LABEL.declaratorio : "";

/** Selo VET: só quando há ao menos uma vacina ou registro médico. */
export const hasVetRecord = (pet) =>
  (pet?.vaccines?.length ?? 0) > 0 || (pet?.medical_records?.length ?? 0) > 0;

/** Cidade do tutor no formato "Cidade, UF"; vazio quando não informada. */
export const formatTutorCity = (user) => {
  const cidade = user?.cidade?.trim();
  const estado = user?.estado?.trim();
  if (!cidade) return "";
  return estado ? `${cidade}, ${estado}` : cidade;
};

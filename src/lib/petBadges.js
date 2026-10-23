/**
 * Regras dos selos e informações exibidas no card do pet (aba Pets).
 * Tudo é derivado dos dados reais retornados pela API, nunca fixo.
 */

/** Selo PEDIGREE: só quando a linhagem foi aprovada (não basta ter raça). */
export const hasApprovedPedigree = (pet) =>
  pet?.lineage?.status_verificacao === "aprovado";

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

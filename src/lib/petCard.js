/**
 * Textos do card do pet (aba Pets), montados só com os dados reais do animal.
 * Antes, etiquetas, descrição e nota médica eram iguais para todos os pets.
 */

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "");

/** Etiquetas do card: sexo, raça e cor, na ordem, sem repetir nem vazios. */
export const buildPetTags = (pet) => {
  const tags = [texto(pet?.sexo), texto(pet?.raca), texto(pet?.cor)].filter(Boolean);
  return [...new Set(tags)];
};

const formatarPeso = (peso) =>
  `${Number(peso).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;

/**
 * Linha de peso do card, ex.: "Peso: 30,5 kg". Vazia quando não há peso.
 * Raça, sexo e idade já aparecem nas etiquetas e no selo de idade, por isso
 * não são repetidos aqui.
 */
export const buildPetWeight = (pet) =>
  Number(pet?.peso) > 0 ? `Peso: ${formatarPeso(pet.peso)}` : "";

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/** Resumo de saúde: contagem de vacinas e consultas e a consulta mais recente. */
export const buildHealthSummary = (pet) => {
  const vacinas = pet?.vaccines?.length ?? 0;
  const registros = Array.isArray(pet?.medical_records) ? pet.medical_records : [];

  const maisRecente = [...registros].sort(
    (a, b) => new Date(b.data_registro || 0) - new Date(a.data_registro || 0),
  )[0];

  return {
    counts: `${plural(vacinas, "vacina", "vacinas")} · ${plural(registros.length, "consulta", "consultas")}`,
    note: texto(maisRecente?.descricao) || "Nenhuma consulta registrada ainda.",
  };
};

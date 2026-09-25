/** Converte "aaaa-mm-dd" em Date local, sem o deslocamento de fuso de `new Date(string)`. */
export const paraData = (iso) => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
};

export const formatarData = (iso) => paraData(iso).toLocaleDateString("pt-BR");

/** Compara a data de reforço com hoje, ignorando horas. */
export const calcularStatus = (dataReforco, hoje = new Date()) => {
  const referencia = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  );
  const dias = Math.round(
    (paraData(dataReforco).getTime() - referencia.getTime()) / 86_400_000,
  );

  return dias < 0
    ? { tipo: "atrasada", rotulo: "Atrasada", dias }
    : { tipo: "em-dia", rotulo: "Em dia", dias };
};

export const textoPrazo = (dias) => {
  if (dias < 0) {
    const atraso = Math.abs(dias);
    return atraso === 1 ? "venceu ontem" : `venceu há ${atraso} dias`;
  }
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `faltam ${dias} dias`;
};

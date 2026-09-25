export type Vacina = {
  id: string;
  nome: string;
  dose: string;
  dataAplicacao: string; // ISO aaaa-mm-dd
  dataReforco: string; // ISO aaaa-mm-dd
  clinica: string;
};

export type Aviso = {
  id: string;
  titulo: string;
  detalhe: string;
};

export type Avisos = {
  alergias: Aviso[];
  recomendacoes: Aviso[];
};

export type Status = {
  tipo: "em-dia" | "atrasada";
  rotulo: string;
  dias: number;
};

/** Converte "aaaa-mm-dd" em Date local, sem o deslocamento de fuso de `new Date(string)`. */
export const paraData = (iso: string): Date => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
};

export const formatarData = (iso: string): string =>
  paraData(iso).toLocaleDateString("pt-BR");

/** Compara a data de reforço com hoje, ignorando horas. */
export const calcularStatus = (
  dataReforco: string,
  hoje = new Date()
): Status => {
  const referencia = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );
  const dias = Math.round(
    (paraData(dataReforco).getTime() - referencia.getTime()) / 86_400_000
  );

  return dias < 0
    ? { tipo: "atrasada", rotulo: "Atrasada", dias }
    : { tipo: "em-dia", rotulo: "Em dia", dias };
};

export const textoPrazo = (dias: number): string => {
  if (dias < 0) {
    const atraso = Math.abs(dias);
    return atraso === 1 ? "venceu ontem" : `venceu há ${atraso} dias`;
  }
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `faltam ${dias} dias`;
};
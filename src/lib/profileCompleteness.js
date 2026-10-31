/**
 * Quanto do perfil do tutor está preenchido (#158).
 * O telefone pesa mais porque é o contato de emergência mostrado quando
 * alguém escaneia o QR Code de um pet perdido.
 */

const preenchido = (valor) => Boolean(String(valor ?? "").trim());

export const CAMPOS_DO_PERFIL = [
  { chave: "telefone", rotulo: "Telefone", peso: 40, ok: (u) => preenchido(u?.telefone) },
  { chave: "nome", rotulo: "Nome", peso: 20, ok: (u) => preenchido(u?.nome) },
  {
    chave: "cidade",
    rotulo: "Cidade e UF",
    peso: 20,
    ok: (u) => preenchido(u?.cidade) && preenchido(u?.estado),
  },
  { chave: "foto_url", rotulo: "Foto", peso: 10, ok: (u) => preenchido(u?.foto_url) },
  { chave: "bio", rotulo: "Bio", peso: 10, ok: (u) => preenchido(u?.bio) },
];

/** Retorna { percentual: 0–100, faltando: ["Telefone", ...], semTelefone: boolean }. */
export const profileCompleteness = (user) => {
  const faltando = CAMPOS_DO_PERFIL.filter((campo) => !campo.ok(user));
  const percentual = 100 - faltando.reduce((total, campo) => total + campo.peso, 0);
  return {
    percentual,
    faltando: faltando.map((campo) => campo.rotulo),
    semTelefone: faltando.some((campo) => campo.chave === "telefone"),
  };
};

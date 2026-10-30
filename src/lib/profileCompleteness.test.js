import { describe, expect, it } from "vitest";
import { CAMPOS_DO_PERFIL, profileCompleteness } from "./profileCompleteness";

const COMPLETO = {
  nome: "Yasmim Souza",
  telefone: "(63) 99999-0000",
  cidade: "Palmas",
  estado: "TO",
  foto_url: "data:image/jpeg;base64,AAA",
  bio: "Tutora do Thor.",
};

describe("profileCompleteness", () => {
  it("os pesos somam 100", () => {
    expect(CAMPOS_DO_PERFIL.reduce((t, c) => t + c.peso, 0)).toBe(100);
  });

  it("perfil completo dá 100% e não falta nada", () => {
    expect(profileCompleteness(COMPLETO)).toEqual({ percentual: 100, faltando: [], semTelefone: false });
  });

  it("sem telefone perde 40% e marca semTelefone", () => {
    const r = profileCompleteness({ ...COMPLETO, telefone: "  " });
    expect(r.percentual).toBe(60);
    expect(r.faltando).toEqual(["Telefone"]);
    expect(r.semTelefone).toBe(true);
  });

  it("cidade sem UF não conta", () => {
    expect(profileCompleteness({ ...COMPLETO, estado: "" }).percentual).toBe(80);
  });

  it("soma os pesos de tudo que falta", () => {
    const r = profileCompleteness({ nome: "Yasmim" });
    expect(r.percentual).toBe(20);
    expect(r.faltando).toEqual(["Telefone", "Cidade e UF", "Foto", "Bio"]);
  });

  it("aceita usuário indefinido sem quebrar", () => {
    expect(profileCompleteness(undefined).percentual).toBe(0);
  });
});

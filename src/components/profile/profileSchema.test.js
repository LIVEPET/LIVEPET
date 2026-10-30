import { describe, expect, it } from "vitest";
import { UFS, profileSchema } from "./profileSchema";

const VALIDO = {
  nome: "Yasmim Souza",
  email: "yasmim@livepet.com",
  telefone: "(63) 99999-0000",
  cidade: "Palmas",
  estado: "TO",
  bio: "",
  nome_canil: "",
  foto_url: "",
};

const erroDe = (dados, campo) => {
  const resultado = profileSchema.safeParse({ ...VALIDO, ...dados });
  return resultado.success ? undefined : resultado.error.flatten().fieldErrors[campo]?.[0];
};

describe("profileSchema", () => {
  it("aceita um perfil completo e válido", () => {
    expect(profileSchema.safeParse(VALIDO).success).toBe(true);
  });

  it("aceita os campos opcionais vazios", () => {
    const vazio = { telefone: "", cidade: "", estado: "", bio: "", nome_canil: "" };
    expect(profileSchema.safeParse({ ...VALIDO, ...vazio }).success).toBe(true);
  });

  it("exige nome com 2 a 150 caracteres", () => {
    expect(erroDe({ nome: "   " }, "nome")).toBe("Informe seu nome completo.");
    expect(erroDe({ nome: "Y" }, "nome")).toBe("O nome precisa ter pelo menos 2 caracteres.");
    expect(erroDe({ nome: "a".repeat(151) }, "nome")).toMatch(/no máximo 150/);
  });

  it("recusa telefone inválido", () => {
    expect(erroDe({ telefone: "abc123" }, "telefone")).toMatch(/Telefone inválido/);
    expect(erroDe({ telefone: "(63) 8888-77" }, "telefone")).toMatch(/Telefone inválido/);
    expect(erroDe({ telefone: "(63) 3214-0000" }, "telefone")).toBeUndefined();
  });

  it("aceita só as 27 UFs", () => {
    expect(UFS).toHaveLength(27);
    expect(erroDe({ estado: "ZZ" }, "estado")).toBe("Escolha uma UF da lista.");
    expect(erroDe({ estado: "Goiás" }, "estado")).toBe("Escolha uma UF da lista.");
  });

  it("respeita os limites de cidade, bio e canil", () => {
    expect(erroDe({ cidade: "a".repeat(101) }, "cidade")).toMatch(/no máximo 100/);
    expect(erroDe({ bio: "a".repeat(501) }, "bio")).toMatch(/no máximo 500/);
    expect(erroDe({ bio: "a".repeat(500) }, "bio")).toBeUndefined();
    expect(erroDe({ nome_canil: "a".repeat(151) }, "nome_canil")).toMatch(/no máximo 150/);
  });
});

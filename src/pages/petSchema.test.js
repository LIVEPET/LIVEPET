import { describe, it, expect } from "vitest";
import { petSchema } from "./PetRegister";

// Estes testes existem por causa da subida do zod 3 para o zod 4 (#185).
// A opção `errorMap` deixou de existir na versão 4 e passou a ser ignorada
// em silêncio, trocando as mensagens em português pelo texto padrão em inglês.
// Nenhum teste pegava isso, então ficam aqui as mensagens que o tutor lê na tela.

const petValido = {
  name: "Rex",
  species: "Cachorro",
  breed: "",
  microchip: "",
  data_nascimento: "",
  size: "Pequeno",
  gender: "Macho",
  age: "",
  tutorPhone: "(62) 91234-5678",
  allergies: "",
  weight: "",
  status: "Ativo",
};

const erroDoCampo = (dados, campo) => {
  const r = petSchema.safeParse(dados);
  return r.error?.issues.find((i) => i.path[0] === campo)?.message;
};

describe("petSchema", () => {
  it("aceita um pet preenchido corretamente", () => {
    expect(petSchema.safeParse(petValido).success).toBe(true);
  });

  it("avisa em português quando o porte não foi escolhido", () => {
    expect(erroDoCampo({ ...petValido, size: "" }, "size")).toBe("Selecione o porte");
  });

  it("avisa em português quando o sexo não foi escolhido", () => {
    expect(erroDoCampo({ ...petValido, gender: "" }, "gender")).toBe("Selecione o sexo");
  });

  it("exige o nome do pet", () => {
    expect(erroDoCampo({ ...petValido, name: "" }, "name")).toBe("Informe o nome do pet");
  });

  it("exige a espécie", () => {
    expect(erroDoCampo({ ...petValido, species: "" }, "species")).toBe("Selecione a espécie");
  });

  it("recusa telefone do tutor fora do formato DDD + número", () => {
    expect(erroDoCampo({ ...petValido, tutorPhone: "123" }, "tutorPhone")).toBe(
      "Telefone inválido. Use DDD + número, ex.: (62) 91234-5678",
    );
  });

  it("recusa peso que não é número positivo", () => {
    expect(erroDoCampo({ ...petValido, weight: "abc" }, "weight")).toBe("Peso inválido");
  });

  it("aceita peso com vírgula, como o tutor digita", () => {
    expect(petSchema.safeParse({ ...petValido, weight: "4,5" }).success).toBe(true);
  });

  it("deixa os campos opcionais em branco", () => {
    const r = petSchema.safeParse({ ...petValido, breed: "", microchip: "", allergies: "" });
    expect(r.success).toBe(true);
  });

  it("limita a alergia a 500 caracteres", () => {
    expect(erroDoCampo({ ...petValido, allergies: "a".repeat(501) }, "allergies")).toBe(
      "Máximo de 500 caracteres",
    );
  });
});

import { z } from "zod";
import { isValidPhone, onlyDigits } from "@/lib/phone";

// Regras do formulário "Editar perfil". Os limites são os mesmos do back-end
// (backend/app/schemas/user.py, classe UserUpdate), para o erro aparecer no campo
// antes de enviar, e não como erro técnico depois de clicar em Salvar.

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const LIMITES = { nome: 150, cidade: 100, bio: 500, nome_canil: 150 };

const ate = (max, campo) =>
  z.string().trim().max(max, `${campo} pode ter no máximo ${max} caracteres.`);

export const profileSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe seu nome completo.")
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(LIMITES.nome, `O nome pode ter no máximo ${LIMITES.nome} caracteres.`),
  email: z.string(),
  telefone: z
    .string()
    .refine((valor) => onlyDigits(valor) === "" || isValidPhone(valor), {
      message: "Telefone inválido. Ex.: (63) 99999-0000",
    }),
  cidade: ate(LIMITES.cidade, "A cidade"),
  estado: z
    .string()
    .refine((valor) => valor === "" || UFS.includes(valor), { message: "Escolha uma UF da lista." }),
  bio: ate(LIMITES.bio, "A bio"),
  nome_canil: ate(LIMITES.nome_canil, "O nome do canil ou gatil"),
  foto_url: z.string(),
});

// Troca de senha (#156): mesmas regras do validate_update_password_strength do back-end.
export const passwordSchema = z
  .object({
    senha: z
      .string()
      .min(6, "A senha precisa ter pelo menos 6 caracteres")
      .max(100, "A senha pode ter no máximo 100 caracteres")
      .refine((valor) => /[A-Za-z]/.test(valor) && /\d/.test(valor), {
        message: "Use pelo menos uma letra e um número",
      }),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  });

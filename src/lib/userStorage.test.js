import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readUserJSON, userScopedKey, writeUserJSON } from "./userStorage";
import { getStoredConversations, saveStoredConversations } from "@/pages/Chat";

const USER_KEY = "livepet_current_user";
const YASMIM = { id: 1, nome: "Yasmim Viana" };
const ARTUR = { id: 2, nome: "Professor Artur" };

const entrarComo = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
const sair = () => localStorage.removeItem(USER_KEY);

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("userScopedKey", () => {
  it("monta uma chave diferente para cada usuário", () => {
    expect(userScopedKey("tarefas", YASMIM)).toBe("tarefas__u1");
    expect(userScopedKey("tarefas", ARTUR)).toBe("tarefas__u2");
  });

  it("devolve null sem usuário logado", () => {
    expect(userScopedKey("tarefas", null)).toBeNull();
  });
});

describe("readUserJSON e writeUserJSON", () => {
  it("cada usuário só lê o que ele mesmo salvou", () => {
    entrarComo(YASMIM);
    writeUserJSON("tarefas", [{ titulo: "Passear com o Thor" }]);
    sair();

    entrarComo(ARTUR);
    expect(readUserJSON("tarefas", [])).toEqual([]);
    writeUserJSON("tarefas", [{ titulo: "Vacina da Mel" }]);
    sair();

    entrarComo(YASMIM);
    expect(readUserJSON("tarefas", [])).toEqual([{ titulo: "Passear com o Thor" }]);
  });

  it("sem usuário logado, não lê nem salva nada", () => {
    writeUserJSON("tarefas", [{ titulo: "x" }]);
    expect(Object.keys(localStorage)).toHaveLength(0);
    expect(readUserJSON("tarefas", "vazio")).toBe("vazio");
  });

  it("descarta os dados antigos salvos sem dono", () => {
    localStorage.setItem("tarefas", JSON.stringify([{ titulo: "de outra conta" }]));
    entrarComo(ARTUR);
    expect(readUserJSON("tarefas", [])).toEqual([]);
    expect(localStorage.getItem("tarefas")).toBeNull();
  });

  it("volta ao valor padrão com JSON corrompido", () => {
    entrarComo(YASMIM);
    localStorage.setItem("tarefas__u1", "{quebrado");
    expect(readUserJSON("tarefas", [])).toEqual([]);
  });

  it("não quebra quando o navegador bloqueia o armazenamento", () => {
    entrarComo(YASMIM);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(() => writeUserJSON("tarefas", [1])).not.toThrow();
    expect(readUserJSON("tarefas", [])).toEqual([]);
  });
});

describe("conversas da tela Chat", () => {
  it("não aparecem para outra conta no mesmo navegador", () => {
    entrarComo(YASMIM);
    saveStoredConversations([{ id: "c1", petName: "Max", messages: [{ from: "me", text: "Oi!" }] }]);
    expect(getStoredConversations()).toHaveLength(1);
    sair();

    entrarComo(ARTUR);
    expect(getStoredConversations()).toEqual([]);
    sair();

    entrarComo(YASMIM);
    expect(getStoredConversations()[0].petName).toBe("Max");
  });
});

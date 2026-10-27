// =============================================================================
// LIVEPET - Funções compartilhadas pelos scripts de seed de demonstração
//
// Requer Node.js 18+ (usa o fetch nativo). Sem dependências externas.
// Variáveis de ambiente:
//   SENHA_DEMO  (obrigatória) senha das contas de demonstração
//   API_URL     (opcional)    padrão: https://livepet.onrender.com
// =============================================================================

export const API_URL = (process.env.API_URL || "https://livepet.onrender.com").replace(/\/$/, "");
const SENHA = process.env.SENHA_DEMO || "";

let erros = 0;

export const log = {
  titulo: (msg) => console.log(`\n${msg}`),
  ok: (msg) => console.log(`  [ok]    ${msg}`),
  info: (msg) => console.log(`  [info]  ${msg}`),
  erro: (msg) => {
    erros += 1;
    console.error(`  [erro]  ${msg}`);
  },
};

export function validarAmbiente() {
  const [major] = process.versions.node.split(".").map(Number);
  if (major < 18) {
    console.error(`Node.js 18 ou superior é necessário (atual: ${process.version}).`);
    process.exit(1);
  }
  if (!SENHA) {
    console.error("Defina a senha: SENHA_DEMO='SuaSenha123' node scripts/seed/<script>.mjs");
    process.exit(1);
  }
  if (SENHA.length < 6 || !/[A-Za-z]/.test(SENHA) || !/\d/.test(SENHA)) {
    console.error("A senha precisa ter 6+ caracteres, com ao menos uma letra e um número.");
    process.exit(1);
  }
}

export class ApiError extends Error {
  constructor(status, detail, path) {
    super(`HTTP ${status} em ${path}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
    this.status = status;
    this.detail = detail;
  }
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Faz uma requisição JSON à API e devolve o corpo já convertido.
 * Se a API pedir para aguardar (HTTP 429, limite de tentativas por IP),
 * espera um minuto e tenta mais uma vez.
 */
export async function api(method, path, options = {}) {
  try {
    return await requisicao(method, path, options);
  } catch (e) {
    if (e.status !== 429) throw e;
    log.info(`a API pediu para aguardar (limite de tentativas). Esperando 65 segundos...`);
    await esperar(65_000);
    return requisicao(method, path, options);
  }
}

async function requisicao(method, path, { body, token, timeoutMs = 120_000 } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new ApiError(res.status, data?.detail ?? data, path);
  return data;
}

/** A API gratuita do Render hiberna: a primeira chamada pode levar ~1 minuto. */
export async function acordarApi() {
  console.log(`\nAPI: ${API_URL}`);
  log.info("Acordando a API (pode levar até 1 minuto)...");
  try {
    await api("GET", "/health", { timeoutMs: 150_000 });
    log.ok("API online");
  } catch (e) {
    console.error(`  [erro]  API indisponível: ${e.message}`);
    process.exit(1);
  }
}

/**
 * Garante que o tutor existe e devolve o token de acesso.
 * Atualiza o perfil (cidade, foto, bio...) quando `perfil` é informado.
 */
export async function garantirTutor({ nome, email, telefone, perfil }) {
  // Tenta o login primeiro: a API limita os cadastros a 10 a cada 10 minutos
  // por IP, então só chamamos o cadastro quando a conta ainda não existe.
  const entrar = () => api("POST", "/api/v1/auth/login", { body: { email, senha: SENHA } });

  let login;
  try {
    login = await entrar();
    log.info(`conta ${email} já existia`);
  } catch (e) {
    if (e.status !== 401) throw e;
    try {
      await api("POST", "/api/v1/auth/register", { body: { nome, email, senha: SENHA, telefone } });
    } catch (erroCadastro) {
      if (erroCadastro.status === 400 && /existe um usu/i.test(String(erroCadastro.detail))) {
        throw new Error(`a conta ${email} existe com uma senha diferente de SENHA_DEMO`);
      }
      throw erroCadastro;
    }
    log.ok(`conta ${email} criada`);
    login = await entrar();
  }

  if (perfil) {
    await api("PUT", "/api/v1/auth/me", { body: perfil, token: login.access_token });
    log.ok("perfil atualizado");
  }
  return { token: login.access_token, user: login.user };
}

/** Lista os pets do tutor autenticado. */
export const listarPets = (token) => api("GET", "/api/v1/pets", { token });

/** Procura um pet do tutor pelo nome (sem diferenciar maiúsculas). */
export const acharPet = (pets, nome) =>
  pets.find((p) => p.nome.trim().toLowerCase() === nome.trim().toLowerCase());

export function finalizar() {
  console.log("");
  if (erros === 0) {
    console.log("Concluído sem erros.");
  } else {
    console.log(`Concluído com ${erros} erro(s). Veja as mensagens [erro] acima.`);
    process.exitCode = 1;
  }
}

/** Executa a função principal tratando erros inesperados. */
export function executar(main) {
  validarAmbiente();
  main()
    .then(finalizar)
    .catch((e) => {
      console.error(`\n  [erro]  ${e.message}`);
      process.exit(1);
    });
}

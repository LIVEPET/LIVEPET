/**
 * LIVEPET - Cliente de Integração com a API Back-end (FastAPI / Neon)
 * Gerencia autenticação JWT, persistência de sessão e chamadas REST.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "https://livepet.onrender.com");

const TOKEN_KEY = "livepet_access_token";
const USER_KEY = "livepet_current_user";
const AUTH_EVENT = "livepet-auth-change";

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, { detail: { token, user } })
  );
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, { detail: { token: null, user: null } })
  );
};

/**
 * Função utilitária para chamadas HTTP tipadas à API
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorDetail = "Ocorreu um erro na requisição.";
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        if (typeof errJson.detail === "string") {
          errorDetail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map((d) => d.msg || d.message).join(", ");
        }
      } else if (errJson.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // Ignora erro de parsing JSON
    }

    if (response.status === 401) {
      clearStoredAuth();
    }

    throw new Error(errorDetail);
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Serviço de Autenticação integrado ao FastAPI / PostgreSQL Neon
 */
export const authService = {
  /**
   * Cadastra um novo tutor no banco Neon
   * @param {{ nome: string, email: string, senha: string, telefone?: string }} data
   */
  async register({ nome, email, senha, telefone = null }) {
    const user = await apiFetch("/api/v1/auth/register", {
      method: "POST",
      body: {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        telefone: telefone ? telefone.trim() : null,
      },
    });

    // Realiza login automático após o cadastro para experiência fluida
    try {
      const loginRes = await this.login({ email, senha });
      return loginRes;
    } catch {
      return { user };
    }
  },

  /**
   * Autentica o tutor com e-mail e senha cadastrados no Neon
   * @param {{ email: string, senha: string }} credentials
   */
  async login({ email, senha }) {
    const data = await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: {
        email: email.trim().toLowerCase(),
        senha,
      },
    });

    setStoredAuth(data.access_token, data.user);
    return data;
  },

  /**
   * Encerra a sessão local
   */
  logout() {
    clearStoredAuth();
  },

  /**
   * Retorna os dados do usuário atualmente autenticado
   */
  getCurrentUser() {
    return getStoredUser();
  },

  /**
   * Verifica se há um token de autenticação ativo
   */
  isAuthenticated() {
    return Boolean(getAuthToken());
  },

  /**
   * Consulta os dados atualizados do tutor autenticado no back-end
   */
  async getMe() {
    const user = await apiFetch("/api/v1/auth/me");
    const currentToken = getAuthToken();
    setStoredAuth(currentToken, user);
    return user;
  },

  /**
   * Inscreve um listener para mudanças de estado de autenticação
   */
  onAuthStateChange(callback) {
    const handleAuth = (e) => {
      callback(e.detail?.user ?? null);
    };

    const handleStorage = (e) => {
      if (e.key === USER_KEY || e.key === TOKEN_KEY) {
        callback(getStoredUser());
      }
    };

    window.addEventListener(AUTH_EVENT, handleAuth);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuth);
      window.removeEventListener("storage", handleStorage);
    };
  },
};

/**
 * Serviço de Pets integrado ao FastAPI / PostgreSQL Neon
 */
export const petsService = {
  /**
   * Lista todos os pets do tutor logado
   */
  async list() {
    return apiFetch("/api/v1/pets");
  },

  /**
   * Detalhes de um pet específico
   */
  async get(id) {
    return apiFetch(`/api/v1/pets/${id}`);
  },

  /**
   * Cadastra um novo animal vinculado ao tutor logado no Neon
   * @param {Object} petData
   */
  async create(petData) {
    return apiFetch("/api/v1/pets", {
      method: "POST",
      body: petData,
    });
  },

  /**
   * Atualiza dados de um animal
   */
  async update(id, petData) {
    return apiFetch(`/api/v1/pets/${id}`, {
      method: "PUT",
      body: petData,
    });
  },

  /**
   * Remove um pet do banco
   */
  async delete(id) {
    return apiFetch(`/api/v1/pets/${id}`, {
      method: "DELETE",
    });
  },
};

export default {
  auth: authService,
  pets: petsService,
};

/**
 * LIVEPET - Cliente de Integração com a API Back-end (FastAPI / Neon)
 * Gerencia autenticação JWT, persistência de sessão e chamadas REST.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "https://livepet.onrender.com");

import { handleBackendDeployId } from "./versionChecker";

const TOKEN_KEY = "livepet_access_token";
const USER_KEY = "livepet_current_user";
const AUTH_EVENT = "livepet-auth-change";

const CLINIC_TOKEN_KEY = "livepet_clinic_access_token";
const CLINIC_KEY = "livepet_current_clinic";
const CLINIC_AUTH_EVENT = "livepet-clinic-auth-change";

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

export const getClinicAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLINIC_TOKEN_KEY);
};

export const getStoredClinic = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLINIC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredClinicAuth = (token, clinic) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(CLINIC_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(CLINIC_TOKEN_KEY);
  }

  if (clinic) {
    localStorage.setItem(CLINIC_KEY, JSON.stringify(clinic));
  } else {
    localStorage.removeItem(CLINIC_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(CLINIC_AUTH_EVENT, { detail: { token, clinic } })
  );
};

export const clearStoredClinicAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLINIC_TOKEN_KEY);
  localStorage.removeItem(CLINIC_KEY);
  window.dispatchEvent(
    new CustomEvent(CLINIC_AUTH_EVENT, { detail: { token: null, clinic: null } })
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

  const isClinicEndpoint = endpoint.includes("/clinicas");
  const clinicToken = getClinicAuthToken();
  const tutorToken = getAuthToken();
  const token = isClinicEndpoint ? (clinicToken || tutorToken) : (tutorToken || clinicToken);

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkError) {
    if (import.meta.env.DEV && url.startsWith("http://localhost:8000")) {
      const fallbackUrl = `https://livepet.onrender.com${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
      response = await fetch(fallbackUrl, { ...options, headers });
    } else {
      throw networkError;
    }
  }

  // Verifica se o cabeçalho X-Deploy-Id do Render indica nova versão do backend
  try {
    const deployId = response.headers?.get("x-deploy-id");
    if (deployId) {
      handleBackendDeployId(deployId);
    }
  } catch (e) {
    // Ignora
  }

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
   * Atualiza dados cadastrais do perfil do tutor
   */
  async updateMe(userData) {
    const updatedUser = await apiFetch("/api/v1/auth/me", {
      method: "PUT",
      body: userData,
    });
    const currentToken = getAuthToken();
    setStoredAuth(currentToken, updatedUser);
    return updatedUser;
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
   * Lista pets da comunidade disponíveis para descoberta/match (excluindo os pets do tutor logado)
   */
  async listExplore() {
    return apiFetch("/api/v1/pets/explore");
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
   * Lista espécies de pets disponíveis sincronizadas do banco de dados
   */
  async getSpecies() {
    try {
      return await apiFetch("/api/v1/pets/especies");
    } catch {
      return ["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"];
    }
  },

  /**
   * Remove um pet do banco
   */
  async delete(id) {
    return apiFetch(`/api/v1/pets/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Lista vacinas de um pet
   */
  async getVaccines(petId) {
    return apiFetch(`/api/v1/pets/${petId}/vaccines`);
  },

  /**
   * Adiciona dose de vacina ao pet
   */
  async addVaccine(petId, vaccineData) {
    return apiFetch(`/api/v1/pets/${petId}/vaccines`, {
      method: "POST",
      body: vaccineData,
    });
  },

  /**
   * Lista prontuário médico de um pet
   */
  async getMedicalRecords(petId) {
    return apiFetch(`/api/v1/pets/${petId}/medical-records`);
  },

  /**
   * Adiciona registro médico ao pet
   */
  async addMedicalRecord(petId, recordData) {
    return apiFetch(`/api/v1/pets/${petId}/medical-records`, {
      method: "POST",
      body: recordData,
    });
  },

  /**
   * Consulta pública de emergência via token do QR Code (sem necessidade de login)
   */
  async getPublicEmergency(token) {
    return apiFetch(`/api/v1/public/pet/${token}`);
  },

  /**
   * Lista contatos da rede de cuidados / emergência de um pet
   */
  async getCareContacts(petId) {
    return apiFetch(`/api/v1/pets/${petId}/care-contacts`);
  },

  /**
   * Cadastra contato de emergência ou cuidador para um pet
   */
  async addCareContact(petId, contactData) {
    return apiFetch(`/api/v1/pets/${petId}/care-contacts`, {
      method: "POST",
      body: contactData,
    });
  },

  /**
   * Remove contato de cuidados ou emergência de um pet
   */
  async deleteCareContact(petId, contactId) {
    return apiFetch(`/api/v1/pets/${petId}/care-contacts/${contactId}`, {
      method: "DELETE",
    });
  },

  /**
   * Lista solicitações de vínculo de clínicas pendentes para os pets do tutor
   */
  async listClinicLinkRequests() {
    return apiFetch("/api/v1/pets/solicitacoes-clinica");
  },

  /**
   * Aprova ou recusa uma solicitação de vínculo de clínica
   */
  async respondClinicLinkRequest(requestId, action) {
    return apiFetch(`/api/v1/pets/solicitacoes-clinica/${requestId}/responder`, {
      method: "POST",
      body: { acao: action },
    });
  },
};

export const lineageService = {
  /**
   * Busca pet por token público oficial
   */
  async searchByToken(token) {
    return apiFetch(`/api/v1/lineages/search-by-token/${encodeURIComponent(token)}`);
  },

  /**
   * Cria uma solicitação de autorização de paternidade/maternidade
   */
  async createRequest(data) {
    return apiFetch("/api/v1/lineages/requests", {
      method: "POST",
      body: data,
    });
  },

  /**
   * Lista solicitações recebidas pelo tutor atual
   */
  async getReceivedRequests() {
    return apiFetch("/api/v1/lineages/requests/received");
  },

  /**
   * Lista solicitações enviadas pelo tutor atual
   */
  async getSentRequests() {
    return apiFetch("/api/v1/lineages/requests/sent");
  },

  /**
   * Aprova solicitação de paternidade/maternidade
   */
  async approveRequest(requestId) {
    return apiFetch(`/api/v1/lineages/requests/${requestId}/approve`, {
      method: "POST",
    });
  },

  /**
   * Recusa solicitação de paternidade/maternidade
   */
  async rejectRequest(requestId) {
    return apiFetch(`/api/v1/lineages/requests/${requestId}/reject`, {
      method: "POST",
    });
  },

  /**
   * Consulta dados de linhagem e pedigree de um pet
   */
  async getLineage(petId) {
    return apiFetch(`/api/v1/lineages/pets/${petId}`);
  },

  /**
   * Salva ou atualiza os dados manuais de pedigree de um pet
   */
  async updateLineage(petId, lineageData) {
    return apiFetch(`/api/v1/lineages/pets/${petId}`, {
      method: "PUT",
      body: lineageData,
    });
  },
};

/**
 * Serviço de Marketplace de Filhotes e Ninhadas integrado ao FastAPI / PostgreSQL Neon
 */
export const marketplaceService = {
  /**
   * Lista anúncios reais do catálogo público no banco de dados
   */
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.especie && filters.especie !== "Todas") params.set("especie", filters.especie);
    if (filters.tipo && filters.tipo !== "todos") params.set("tipo", filters.tipo);
    if (filters.pedigree) params.set("pedigree", "true");

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(`/api/v1/marketplace/listings${queryStr}`);
  },

  /**
   * Lista anúncios criados pelo usuário autenticado
   */
  async myListings() {
    return apiFetch("/api/v1/marketplace/my-listings");
  },

  /**
   * Cria um novo anúncio de filhote ou ninhada no banco de dados
   */
  async create(listingData) {
    return apiFetch("/api/v1/marketplace/listings", {
      method: "POST",
      body: listingData,
    });
  },

  /**
   * Exclui um anúncio do banco de dados
   */
  async delete(listingId) {
    return apiFetch(`/api/v1/marketplace/listings/${listingId}`, {
      method: "DELETE",
    });
  },

  /**
   * Responde à confirmação pré-definida de 30 dias: 'renovar' ou 'encerrar'
   */
  async confirm(listingId, acao) {
    return apiFetch(`/api/v1/marketplace/listings/${listingId}/confirm`, {
      method: "POST",
      body: { acao },
    });
  },

  /**
   * Ambiente de Teste: Simula passagem de 30 dias para disparar confirmação via chat
   */
  async simulate30Days(listingId) {
    return apiFetch(`/api/v1/marketplace/listings/${listingId}/simulate-30-days`, {
      method: "POST",
    });
  },

  /**
   * Ambiente de Teste: Simula passagem de 24h sem resposta para exclusão automática
   */
  async simulateExpire24h(listingId) {
    return apiFetch(`/api/v1/marketplace/listings/${listingId}/simulate-expire-24h`, {
      method: "POST",
    });
  },
};

export const clinicService = {
  /**
   * Autentica a clínica veterinária parceira com e-mail e senha
   */
  async login({ email, senha }) {
    try {
      const data = await apiFetch("/api/clinicas/login", {
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          senha,
        },
      });

      setStoredClinicAuth(data.access_token, data.clinica);
      return data;
    } catch (err) {
      if (import.meta.env.DEV) {
        const mockClinic = {
          id: "dev-clinic-1",
          nome: email.split("@")[0] || "Clínica Vet LivePet",
          email: email.trim().toLowerCase(),
          crmv: "CRMV-SP 12345",
        };
        setStoredClinicAuth("dev-clinic-token", mockClinic);
        return { access_token: "dev-clinic-token", clinica: mockClinic };
      }
      throw err;
    }
  },

  /**
   * Cadastra uma nova clínica veterinária parceira
   */
  async register(clinicData) {
    try {
      const data = await apiFetch("/api/clinicas/register", {
        method: "POST",
        body: {
          ...clinicData,
          email: clinicData.email ? clinicData.email.trim().toLowerCase() : "",
        },
      });
      return data;
    } catch (err) {
      if (import.meta.env.DEV) {
        return {
          id: "dev-clinic-1",
          nome: clinicData.nome || "Clínica Vet LivePet",
          email: clinicData.email ? clinicData.email.trim().toLowerCase() : "clinica@livepet.com",
        };
      }
      throw err;
    }
  },

  /**
   * Encerra a sessão da clínica
   */
  logout() {
    clearStoredClinicAuth();
  },

  /**
   * Retorna os dados da clínica autenticada salvos localmente
   */
  getCurrentClinic() {
    return getStoredClinic();
  },

  /**
   * Verifica se há um token de clínica ativo
   */
  isAuthenticated() {
    return Boolean(getClinicAuthToken());
  },

  /**
   * Consulta os dados cadastrais atualizados da clínica autenticada no backend
   */
  async getProfile() {
    const clinic = await apiFetch("/api/clinicas/perfil");
    const currentToken = getClinicAuthToken();
    if (currentToken) {
      setStoredClinicAuth(currentToken, clinic);
    }
    return clinic;
  },

  /**
   * Atualiza dados cadastrais e perfil da clínica
   */
  async updateProfile(fields) {
    const clinic = await apiFetch("/api/clinicas/perfil", {
      method: "PUT",
      body: fields,
    });
    const currentToken = getClinicAuthToken();
    if (currentToken) {
      setStoredClinicAuth(currentToken, clinic);
    }
    return clinic;
  },

  /**
   * Obtém as espécies sincronizadas com o banco de dados
   */
  async getSpecies() {
    try {
      return await apiFetch("/api/clinicas/especies");
    } catch {
      return ["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"];
    }
  },

  /**
   * Lista atendimentos da clínica com filtros opcionais
   */
  async listAppointments(params = {}) {
    const query = new URLSearchParams();
    if (params.data) query.set("data", params.data);
    if (params.status && params.status !== "Todos") query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/api/clinicas/atendimentos${qs}`);
  },

  /**
   * Cria um novo agendamento / atendimento clínico no banco de dados
   */
  async createAppointment(data) {
    return apiFetch("/api/clinicas/atendimentos", {
      method: "POST",
      body: data,
    });
  },

  /**
   * Atualiza o status do atendimento
   */
  async updateAppointmentStatus(id, status) {
    return apiFetch(`/api/clinicas/atendimentos/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  /**
   * Exclui um agendamento do banco de dados
   */
  async deleteAppointment(id) {
    return apiFetch(`/api/clinicas/atendimentos/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Lista os pacientes únicos da clínica com base no banco de dados
   */
  async listPatients() {
    return apiFetch("/api/clinicas/pacientes");
  },

  /**
   * Atualiza dados de identificação do paciente e tutor
   */
  async updatePatient(id, data) {
    return apiFetch(`/api/clinicas/pacientes/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  /**
   * Remove paciente e seus registros da clínica
   */
  async deletePatient(id) {
    return apiFetch(`/api/clinicas/pacientes/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Conclui atendimento registrando anamnese, sinais vitais e desfecho
   */
  async concludeAppointment(id, data) {
    return apiFetch(`/api/clinicas/atendimentos/${id}/concluir`, {
      method: "POST",
      body: data,
    });
  },

  /**
   * Solicita vínculo de paciente local a um pet oficial na LivePet
   */
  async requestPetLink(data) {
    return apiFetch("/api/clinicas/solicitar-vinculo", {
      method: "POST",
      body: data,
    });
  },

  /**
   * Lista o histórico de solicitações de vínculo enviadas pela clínica
   */
  async listLinkRequests() {
    return apiFetch("/api/clinicas/solicitacoes-vinculo");
  },

  /**
   * Consulta pública de clínicas veterinárias parceiras cadastradas com busca opcional
   */
  async listPublicClinics(query = "") {
    try {
      const q = query && query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const res = await apiFetch(`/api/clinicas/publicas${q}`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /**
   * Detalhes públicos de uma clínica parceira específica
   */
  async getPublicClinic(id) {
    return apiFetch(`/api/clinicas/publicas/${id}`);
  },
};

export default {
  auth: authService,
  pets: petsService,
  lineages: lineageService,
  marketplace: marketplaceService,
  clinic: clinicService,
};

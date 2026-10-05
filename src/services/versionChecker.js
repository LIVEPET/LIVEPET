/**
 * LIVEPET - Gerenciador de Versão e Atualizações em Produção (Render)
 * Detecta novos deploys (front-end e back-end), limpa caches obsoletos,
 * encerra sessões antigas para evitar bugs e força o download da versão mais recente.
 */

import { clearStoredAuth } from "./api";

const KEY_FRONTEND_BUILD = "livepet_frontend_build_id";
const KEY_BACKEND_DEPLOY = "livepet_backend_deploy_id";
const KEY_LAST_UPDATE_TIME = "livepet_last_forced_reload_at";

/**
 * Executa a limpeza completa de cache e encerramento de sessão,
 * forçando o navegador a baixar os arquivos mais recentes do Render.
 */
export async function performHardUpdateAndLogout(reason = "nova_versao") {
  console.warn(`[LivePet VersionChecker] Atualização detectada (${reason}). Limpando caches e forçando reload...`);

  // 1. Desloga o usuário e remove tokens/dados antigos de autenticação
  clearStoredAuth();

  // 2. Limpa dados de sessão e caches temporários que possam gerar inconsistências
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error(e);
  }

  // 3. Limpa CacheStorage (Service Worker e HTTP Caches do navegador)
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    } catch (e) {
      console.warn("Aviso ao limpar CacheStorage:", e);
    }
  }

  // 4. Desregistra Service Workers se houver
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    } catch (e) {
      console.warn("Aviso ao desregistrar Service Worker:", e);
    }
  }

  // 5. Registra o timestamp para evitar loop de reload
  localStorage.setItem(KEY_LAST_UPDATE_TIME, String(Date.now()));

  // 6. Força o navegador a buscar a versão mais recente contornando qualquer cache
  const timestamp = Date.now();
  const cleanPath = window.location.pathname;
  window.location.replace(`${cleanPath}?v=${timestamp}&reload=deploy`);
}

/**
 * Verifica se a versão do build do front-end mudou em relação à salva no localStorage
 */
export function checkFrontendBuild() {
  if (typeof window === "undefined") return false;

  const currentBuild = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : null;
  if (!currentBuild) return false;

  const storedBuild = localStorage.getItem(KEY_FRONTEND_BUILD);

  // Primeira execução na máquina do usuário
  if (!storedBuild) {
    localStorage.setItem(KEY_FRONTEND_BUILD, currentBuild);
    return false;
  }

  // Se o build atual for diferente do armazenado, houve deploy no Render!
  if (storedBuild !== currentBuild) {
    localStorage.setItem(KEY_FRONTEND_BUILD, currentBuild);
    performHardUpdateAndLogout("frontend_deploy");
    return true;
  }

  return false;
}

/**
 * Compara o deploy ID do backend recebido via cabeçalho HTTP ou endpoint de health
 */
export function handleBackendDeployId(deployId) {
  if (!deployId || typeof window === "undefined") return;

  const storedDeploy = localStorage.getItem(KEY_BACKEND_DEPLOY);

  if (!storedDeploy) {
    localStorage.setItem(KEY_BACKEND_DEPLOY, deployId);
    return;
  }

  if (storedDeploy !== deployId) {
    localStorage.setItem(KEY_BACKEND_DEPLOY, deployId);
    performHardUpdateAndLogout("backend_deploy");
  }
}

/**
 * Consulta o backend para checar se uma nova versão foi implantada no Render
 */
export async function checkBackendDeploy(apiUrl) {
  if (typeof window === "undefined") return;

  try {
    const baseUrl = apiUrl || (import.meta.env.DEV ? "http://localhost:8000" : "https://livepet.onrender.com");
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/health?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.deploy_id) {
        handleBackendDeployId(data.deploy_id);
      }
    }
  } catch (err) {
    // Ignora se o servidor estiver reiniciando no Render
  }
}

/**
 * Inicializa a observação periódica e por eventos de janela
 */
export function initVersionChecker(apiUrl) {
  if (typeof window === "undefined") return;

  // 1. Checa a versão do bundle assim que a página carrega
  const updated = checkFrontendBuild();
  if (updated) return;

  // 2. Checa o backend imediatamente
  checkBackendDeploy(apiUrl);

  // 3. Ao voltar para a aba ou focar na janela, verifica se subiu novo deploy
  window.addEventListener("focus", () => checkBackendDeploy(apiUrl));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkBackendDeploy(apiUrl);
    }
  });

  // 4. Verificação periódica a cada 2 minutos
  setInterval(() => {
    checkBackendDeploy(apiUrl);
  }, 2 * 60 * 1000);
}

export default {
  init: initVersionChecker,
  checkFrontend: checkFrontendBuild,
  handleBackendDeployId,
  checkBackendDeploy,
  performHardUpdateAndLogout,
};

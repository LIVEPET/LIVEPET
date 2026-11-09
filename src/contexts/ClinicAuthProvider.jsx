import { useEffect, useState } from "react";
import { clinicService, getClinicAuthToken } from "@/services/api";
import { clinicTokenExpiry } from "@/lib/clinicSession";
import { ClinicAuthContext } from "./clinicAuth";

export const ClinicAuthProvider = ({ children }) => {
  const [revision, setRevision] = useState(0);
  const [session, setSession] = useState({ status: "loading", clinic: null, error: null });
  useEffect(() => {
    const refresh = () => {
      setSession({ status: getClinicAuthToken() ? "loading" : "anonymous", clinic: null, error: null });
      setRevision((value) => value + 1);
    };
    const onStorage = (event) => {
      if (!event.key || event.key === "livepet_clinic_access_token") {
        if (!getClinicAuthToken()) clinicService.logout();
        else refresh();
      }
    };
    window.addEventListener("livepet-clinic-auth-change", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("livepet-clinic-auth-change", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  useEffect(() => {
    const token = getClinicAuthToken();
    const expires = clinicTokenExpiry(token);
    if (!token || expires <= Date.now()) {
      if (token) clinicService.logout();
      setSession({ status: "anonymous", clinic: null, error: null });
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      if (getClinicAuthToken() === token) setRevision((value) => value + 1);
    }, Math.min(expires - Date.now(), 2147483647));
    setSession({ status: "loading", clinic: null, error: null });
    clinicService.getProfile().then((clinic) => {
      if (active && getClinicAuthToken() === token) {
        if (!clinic?.id) throw new Error("Resposta de sessão inválida.");
        setSession({ status: "authenticated", clinic, error: null });
      }
    }).catch((error) => {
      if (!active || getClinicAuthToken() !== token) return;
      if (error.status === 401 || error.status === 403) {
        clinicService.logout();
        setSession({ status: "anonymous", clinic: null, error: null });
      } else {
        setSession({ status: "error", clinic: null, error: "Não foi possível verificar sua sessão. Tente novamente." });
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [revision]);
  return (
    <ClinicAuthContext.Provider value={{
      ...session,
      login: clinicService.login,
      logout: clinicService.logout,
      retry: () => setRevision((value) => value + 1),
    }}>
      {children}
    </ClinicAuthContext.Provider>
  );
};

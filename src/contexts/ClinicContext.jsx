import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { createDefaultBeds } from "@/data/clinicDemo";
import { toast } from "sonner";
import { clinicService, getClinicAuthToken } from "@/services/api";

const getToday = () => new Date().toISOString().split("T")[0];

export const STORAGE_KEY = "livepet_clinic_data";
const STORAGE_VERSION = 1;

const PROFILE_TEXT_FIELDS = ["name", "crmv", "email", "phone", "whatsapp", "address", "about", "photo"];

// Nome do campo no perfil da tela -> nome do campo na API da clínica.
const PROFILE_API_FIELDS = {
  name: "nome",
  crmv: "crmv",
  email: "email",
  phone: "telefone",
  whatsapp: "whatsapp",
  address: "endereco",
  about: "sobre",
  photo: "foto_url",
  services: "servicos",
  hours: "horarios",
  team: "equipe",
};

const createEmptyData = () => ({
  profile: {
    name: "",
    crmv: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    about: "",
    photo: "",
    services: [],
    hours: [],
    team: [],
  },
  appointments: [],
  patients: [],
  beds: createDefaultBeds(),
});

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const asArray = (value) => (Array.isArray(value) ? value : []);

// crypto.randomUUID só existe em contextos seguros (https ou localhost);
// acessando pelo IP da rede (http://192.168...) ele não está disponível.
const newId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const normalize = (text) => String(text ?? "").trim().toLowerCase();

// Ids vindos da API são números; ids criados localmente (offline) são UUID.
const isServerId = (id) => Number.isInteger(Number(id)) && String(id).trim() !== "";

// Envia uma alteração para a API e avisa a clínica se não der certo (#62).
// A tela já foi atualizada de forma otimista; o aviso evita que a clínica
// pense que salvou algo que não chegou ao servidor.
const sincronizar = (acao, mensagem) => {
  if (!clinicService.isAuthenticated()) return Promise.resolve(null);
  let promessa;
  try {
    promessa = Promise.resolve(acao());
  } catch (err) {
    promessa = Promise.reject(err);
  }
  return promessa.catch((err) => {
    toast.error(mensagem, { description: err?.message || "Verifique sua conexão e tente de novo." });
    return null;
  });
};

const AVISO_SEM_SERVIDOR = "Este registro ainda não está salvo no servidor.";

// Campos do atendimento na tela -> campos da API.
const appointmentToApi = (a) => {
  const payload = {
    pet_name: a.petName,
    species: a.species,
    breed: a.breed,
    tutor: a.tutor,
    phone: a.phone,
    service: a.service,
    vet: a.vet,
    date: a.date,
    time: a.time,
    status: a.status,
    priority: a.priority,
    notes: a.notes,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
};

const conclusionToApi = (c = {}) => ({
  queixa_principal: c.queixa_principal ?? null,
  temperatura: c.temperatura !== "" && c.temperatura != null ? Number(c.temperatura) : null,
  peso: c.peso !== "" && c.peso != null ? Number(c.peso) : null,
  frequencia_cardiaca:
    c.frequencia_cardiaca !== "" && c.frequencia_cardiaca != null
      ? Number(c.frequencia_cardiaca)
      : null,
  frequencia_respiratoria:
    c.frequencia_respiratoria !== "" && c.frequencia_respiratoria != null
      ? Number(c.frequencia_respiratoria)
      : null,
  mucosas: c.mucosas ?? null,
  diagnostico: c.diagnostico ?? null,
  prescricao: c.prescricao ?? null,
  vacina_aplicada: c.vacina_aplicada ?? null,
  vacina_lote: c.vacina_lote ?? null,
  vacina_proxima_dose: c.vacina_proxima_dose || null,
});

const sanitizeProfile = (raw) => {
  const profile = createEmptyData().profile;
  if (!isObject(raw)) return profile;
  PROFILE_TEXT_FIELDS.forEach((key) => {
    if (typeof raw[key] === "string") profile[key] = raw[key];
  });
  profile.services = asArray(raw.services);
  profile.hours = asArray(raw.hours);
  profile.team = asArray(raw.team);
  return profile;
};

const sanitizePatient = (patient) => ({
  ...patient,
  alerts: asArray(patient.alerts),
  history: asArray(patient.history),
  vaccines: asArray(patient.vaccines),
});

const isDemoOccupant = (occ) =>
  occ &&
  ((occ.petName === "Thor" && occ.tutor === "Carlos Eduardo") ||
    (occ.petName === "Luna" && occ.tutor === "Mariana Costa"));

const sanitizeBeds = (rawBeds) => {
  if (!Array.isArray(rawBeds) || rawBeds.length === 0) return createDefaultBeds();
  const hasLegacyDemo = rawBeds.some((b) => isDemoOccupant(b?.occupant));
  if (hasLegacyDemo) return createDefaultBeds();
  return rawBeds.filter((b) => isObject(b) && b.id);
};

const getStorageKey = () => {
  const current = clinicService.getCurrentClinic();
  return current?.id ? `livepet_clinic_data_${current.id}` : STORAGE_KEY;
};

// Lê do localStorage sem nunca quebrar: se estiver indisponível, vazio ou
// corrompido, volta para os dados vazios.
const loadData = () => {
  try {
    const key = getStorageKey();
    const raw =
      window.localStorage.getItem(key) ||
      (key !== STORAGE_KEY ? window.localStorage.getItem(STORAGE_KEY) : null);
    if (!raw) return createEmptyData();
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) return createEmptyData();
    return {
      profile: sanitizeProfile(parsed.profile),
      appointments: asArray(parsed.appointments).filter((a) => isObject(a) && a.id),
      patients: asArray(parsed.patients)
        .filter((p) => isObject(p) && p.id)
        .map(sanitizePatient),
      beds: sanitizeBeds(parsed.beds),
    };
  } catch {
    return createEmptyData();
  }
};

const saveData = (data) => {
  try {
    const key = getStorageKey();
    window.localStorage.setItem(
      key,
      JSON.stringify({ version: STORAGE_VERSION, ...data }),
    );
  } catch {
    // Modo anônimo ou cota cheia: a sessão continua funcionando, só não persiste.
  }
};

const isSamePatient = (patient, appointment) =>
  normalize(patient.name) === normalize(appointment.petName) &&
  normalize(patient.tutor) === normalize(appointment.tutor);

// Mapeia todos os campos clínicos vindos da API e preserva enriquecimentos locais (#213)
export const mapAndMergeAppointment = (a, localAppointments = []) => {
  const localApp =
    asArray(localAppointments).find(
      (loc) =>
        String(loc.id) === String(a.id) ||
        (loc.localId && String(loc.localId) === String(a.id)),
    ) ||
    asArray(localAppointments).find(
      (loc) =>
        normalize(loc.petName) === normalize(a.pet_name ?? a.petName) &&
        normalize(loc.tutor) === normalize(a.tutor) &&
        String(loc.date ?? "") === String(a.date ?? "") &&
        String(loc.time ?? "") === String(a.time ?? "") &&
        normalize(loc.service) === normalize(a.service),
    );

  const merged = {
    ...(localApp || {}),
    id: a.id,
    patientId: a.pet_id ?? a.patientId ?? localApp?.patientId ?? null,
    petName: a.pet_name ?? a.petName ?? localApp?.petName ?? "",
    species: a.species ?? localApp?.species ?? "Cão",
    breed: a.breed ?? localApp?.breed ?? "—",
    tutor: a.tutor ?? localApp?.tutor ?? "",
    phone: a.phone ?? localApp?.phone ?? "",
    service: a.service ?? localApp?.service ?? "",
    vet: a.vet ?? localApp?.vet ?? "",
    date: a.date ?? localApp?.date ?? "",
    time: a.time ?? localApp?.time ?? "",
    status: a.status ?? localApp?.status ?? "Confirmado",
    priority: a.priority || localApp?.priority || "Rotina",
    notes: a.notes ?? localApp?.notes ?? "",
    queixa_principal: a.queixa_principal ?? localApp?.queixa_principal ?? null,
    temperatura: a.temperatura ?? localApp?.temperatura ?? null,
    peso: a.peso ?? localApp?.peso ?? null,
    frequencia_cardiaca: a.frequencia_cardiaca ?? localApp?.frequencia_cardiaca ?? null,
    frequencia_respiratoria:
      a.frequencia_respiratoria ?? localApp?.frequencia_respiratoria ?? null,
    mucosas: a.mucosas ?? localApp?.mucosas ?? null,
    diagnostico: a.diagnostico ?? localApp?.diagnostico ?? null,
    prescricao: a.prescricao ?? localApp?.prescricao ?? null,
    vacina_aplicada: a.vacina_aplicada ?? localApp?.vacina_aplicada ?? null,
    vacina_lote: a.vacina_lote ?? localApp?.vacina_lote ?? null,
    vacina_proxima_dose: a.vacina_proxima_dose ?? localApp?.vacina_proxima_dose ?? null,
    prescricao_itens: Array.isArray(a.prescricao_itens)
      ? a.prescricao_itens
      : Array.isArray(localApp?.prescricao_itens)
        ? localApp.prescricao_itens
        : [],
    exames_complementares: Array.isArray(a.exames_complementares)
      ? a.exames_complementares
      : Array.isArray(localApp?.exames_complementares)
        ? localApp.exames_complementares
        : [],
    itens_adicionais: Array.isArray(a.itens_adicionais)
      ? a.itens_adicionais
      : Array.isArray(localApp?.itens_adicionais)
        ? localApp.itens_adicionais
        : [],
  };

  if (a.valor_servico !== undefined || localApp?.valor_servico !== undefined) {
    merged.valor_servico = a.valor_servico ?? localApp?.valor_servico;
  }
  if (a.desconto !== undefined || localApp?.desconto !== undefined) {
    merged.desconto = a.desconto ?? localApp?.desconto;
  }
  if (a.valor_total !== undefined || localApp?.valor_total !== undefined) {
    merged.valor_total = a.valor_total ?? localApp?.valor_total;
  }
  if (a.status_pagamento !== undefined || localApp?.status_pagamento !== undefined) {
    merged.status_pagamento = a.status_pagamento ?? localApp?.status_pagamento;
  }
  if (a.forma_pagamento !== undefined || localApp?.forma_pagamento !== undefined) {
    merged.forma_pagamento = a.forma_pagamento ?? localApp?.forma_pagamento;
  }
  if (a.isReturn !== undefined || localApp?.isReturn !== undefined) {
    merged.isReturn = Boolean(a.isReturn ?? localApp?.isReturn);
  }

  return merged;
};

// Mescla pacientes vindos da API com os dados clínicos enriquecidos localmente (#213)
export const mergePatientWithLocal = (apiPatient, localPatients = []) => {
  const localPatient = asArray(localPatients).find(
    (lp) =>
      String(lp.id) === String(apiPatient.id) ||
      (normalize(lp.name) === normalize(apiPatient.name) &&
        normalize(lp.tutor) === normalize(apiPatient.tutor)),
  );

  if (!localPatient) {
    return sanitizePatient(apiPatient);
  }

  // Mescla alertas sem duplicar
  const mergedAlerts = Array.from(
    new Set([
      ...asArray(apiPatient.alerts).filter(Boolean),
      ...asArray(localPatient.alerts).filter(Boolean),
    ]),
  );

  // Mescla vacinas (pregressas e de atendimentos) sem duplicar
  const seenVaccines = new Set();
  const mergedVaccines = [];
  [...asArray(apiPatient.vaccines), ...asArray(localPatient.vaccines)].forEach((v) => {
    if (!v || !(v.nome || v.name)) return;
    const key = `${normalize(v.nome || v.name)}|${v.data_aplicacao || ""}|${normalize(v.lote || v.lot)}`;
    if (!seenVaccines.has(key)) {
      seenVaccines.add(key);
      mergedVaccines.push(v);
    }
  });

  // Mescla histórico clínico preservando altas hospitalares e resumos detalhados locais
  const apiHistory = asArray(apiPatient.history);
  const localHistory = asArray(localPatient.history);
  const mergedHistory = [...apiHistory];

  localHistory.forEach((locH) => {
    if (!locH) return;
    const existingIdx = mergedHistory.findIndex(
      (h) => normalize(h.date) === normalize(locH.date) && normalize(h.type) === normalize(locH.type),
    );
    if (existingIdx === -1) {
      mergedHistory.unshift(locH);
    } else if (
      locH.summary &&
      (!mergedHistory[existingIdx].summary ||
        /^atendimento\s/i.test(mergedHistory[existingIdx].summary))
    ) {
      mergedHistory[existingIdx] = { ...mergedHistory[existingIdx], ...locH };
    }
  });

  return sanitizePatient({
    ...localPatient,
    ...apiPatient,
    age:
      apiPatient.age && apiPatient.age !== "—"
        ? apiPatient.age
        : localPatient.age || "—",
    weight:
      apiPatient.weight && apiPatient.weight !== "—"
        ? apiPatient.weight
        : localPatient.weight || "—",
    ecc: apiPatient.ecc ?? localPatient.ecc ?? null,
    alerts: mergedAlerts,
    vaccines: mergedVaccines,
    vaccinesUpToDate:
      apiPatient.vaccinesUpToDate ??
      localPatient.vaccinesUpToDate ??
      (mergedVaccines.length > 0 ? true : null),
    history: mergedHistory,
  });
};

const patientFromAppointment = (appointment) => ({
  id: newId(),
  name: appointment.petName,
  species: appointment.species || "Cão",
  breed: appointment.breed || "—",
  age: "—",
  weight: "—",
  tutor: appointment.tutor,
  phone: appointment.phone || "—",
  photo: null,
  alerts: [],
  vaccinesUpToDate: null,
  vaccines: [],
  lastVisit: "—",
  history: [],
});

const ClinicContext = createContext(null);

export const ClinicProvider = ({ children }) => {
  const [data, setData] = useState(loadData);
  const isFetchingRef = useRef(false);
  const activeClinicIdRef = useRef(clinicService.getCurrentClinic()?.id || null);
  const pendingCreationsRef = useRef(new Map());
  const resolvedIdsRef = useRef(new Map());
  const [loading, setLoading] = useState(() => clinicService.isAuthenticated());
  const [error, setError] = useState(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const matchesAppointmentTarget = useCallback((a, targetId) => {
    const resolved = resolvedIdsRef.current.get(String(targetId));
    return (
      String(a.id) === String(targetId) ||
      (resolved !== undefined && String(a.id) === String(resolved)) ||
      (a.localId !== undefined && String(a.localId) === String(targetId))
    );
  }, []);

  const loadClinicData = useCallback(async () => {
    if (!clinicService.isAuthenticated()) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const token = getClinicAuthToken();
    setLoading(true);
    setError(null);

    try {
      const currentClinic = clinicService.getCurrentClinic();
      activeClinicIdRef.current = currentClinic?.id || null;

      const [clinicRes, apptsRes, patientsRes, vetsRes] = await Promise.allSettled([
        clinicService.getProfile(),
        clinicService.listAppointments(),
        clinicService.listPatients(),
        clinicService.listVeterinarians(false),
      ]);
      if (getClinicAuthToken() !== token) return;

      // Se nada veio da API, a tela precisa saber (e poder tentar de novo).
      const tudoFalhou = [clinicRes, apptsRes, patientsRes].every((r) => r.status === "rejected");
      if (tudoFalhou) {
        const motivo = clinicRes.reason?.message || "Verifique sua conexão.";
        setError(`Não foi possível carregar os dados da clínica. ${motivo}`);
        return;
      }

      const clinic = clinicRes.status === "fulfilled" && clinicRes.value ? clinicRes.value : currentClinic;
      const appointments = apptsRes.status === "fulfilled" && Array.isArray(apptsRes.value) ? apptsRes.value : [];
      const patients = patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value) ? patientsRes.value : [];

      let servicesList = [];
      if (clinic?.servicos) {
        try {
          const parsed = typeof clinic.servicos === "string" ? JSON.parse(clinic.servicos) : clinic.servicos;
          if (Array.isArray(parsed)) servicesList = parsed;
        } catch {}
      }
      let hoursList = [];
      if (clinic?.horarios) {
        try {
          const parsed = typeof clinic.horarios === "string" ? JSON.parse(clinic.horarios) : clinic.horarios;
          if (Array.isArray(parsed)) hoursList = parsed;
        } catch {}
      }
      let teamList = [];
      if (vetsRes.status === "fulfilled" && Array.isArray(vetsRes.value) && vetsRes.value.length > 0) {
        teamList = vetsRes.value.map((v) => ({
          id: v.id,
          name: v.nome,
          role: v.especialidade || "Veterinário(a)",
          crmv: v.crmv,
          phone: v.telefone || "",
          email: v.email || "",
          ativo: v.ativo ?? true,
        }));
      } else if (clinic?.equipe) {
        try {
          const parsed = typeof clinic.equipe === "string" ? JSON.parse(clinic.equipe) : clinic.equipe;
          if (Array.isArray(parsed)) teamList = parsed;
        } catch {}
      }

      setData((current) => {
        const mappedAppointments =
          apptsRes.status === "fulfilled"
            ? appointments.map((a) => mapAndMergeAppointment(a, current.appointments))
            : current.appointments;

        const mergedPatients =
          patientsRes.status === "fulfilled"
            ? patients.map((p) => mergePatientWithLocal(p, current.patients))
            : current.patients;

        return {
          ...current,
          profile: {
            ...current.profile,
            name: clinic?.nome || currentClinic?.nome || "",
            crmv: clinic?.crmv || currentClinic?.crmv || "",
            email: clinic?.email || currentClinic?.email || "",
            phone: clinic?.telefone || currentClinic?.telefone || "",
            whatsapp: clinic?.whatsapp || currentClinic?.whatsapp || "",
            address: clinic?.endereco || currentClinic?.endereco || "",
            about: clinic?.sobre || currentClinic?.sobre || "",
            photo: clinic?.foto_url || currentClinic?.foto_url || "",
            services: servicesList,
            hours: hoursList,
            team: teamList,
          },
          appointments: mappedAppointments,
          // Lista vinda da API vale mesmo vazia: paciente apagado não volta do localStorage.
          patients: mergedPatients,
        };
      });
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      if (getClinicAuthToken() !== token && clinicService.isAuthenticated()) loadClinicData();
    }
  }, []);

  // Monitora alterações de autenticação da clínica (login, logout, troca de conta)
  useEffect(() => {
    const handleAuthChange = (e) => {
      const clinic = e.detail?.clinic;
      if (!clinic) {
        activeClinicIdRef.current = null;
        pendingCreationsRef.current.clear();
        resolvedIdsRef.current.clear();
        setData(createEmptyData());
      } else if (clinic.id !== activeClinicIdRef.current) {
        activeClinicIdRef.current = clinic.id;
        pendingCreationsRef.current.clear();
        resolvedIdsRef.current.clear();
        setData(loadData());
        loadClinicData();
      }
    };

    const handleStorage = (event) => {
      if (!event.key || ["livepet_clinic_access_token", "livepet_current_clinic"].includes(event.key)) {
        handleAuthChange({ detail: { clinic: clinicService.isAuthenticated() ? clinicService.getCurrentClinic() : null } });
      }
    };
    window.addEventListener("livepet-clinic-auth-change", handleAuthChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("livepet-clinic-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadClinicData]);

  // Sincronização inicial se autenticado
  useEffect(() => {
    if (clinicService.isAuthenticated()) {
      loadClinicData();
    }
  }, [loadClinicData]);

  const saveProfile = useCallback((fields) => {
    setData((current) => ({ ...current, profile: { ...current.profile, ...fields } }));
    if (clinicService.isAuthenticated()) {
      const payload = {};
      Object.entries(PROFILE_API_FIELDS).forEach(([key, apiKey]) => {
        if (fields[key] !== undefined) {
          if (Array.isArray(fields[key])) {
            payload[apiKey] = JSON.stringify(fields[key]);
          } else {
            payload[apiKey] = fields[key];
          }
        }
      });
      if (Object.keys(payload).length > 0) {
        sincronizar(() => clinicService.updateProfile(payload), "Não foi possível salvar o perfil da clínica.");
      }
    }
  }, []);

  const resolveOrAwaitServerId = useCallback((id) => {
    if (isServerId(id)) return Promise.resolve(id);
    const key = String(id);
    if (resolvedIdsRef.current.has(key)) {
      return Promise.resolve(resolvedIdsRef.current.get(key));
    }
    if (pendingCreationsRef.current.has(key)) {
      return pendingCreationsRef.current.get(key).then((salvo) =>
        salvo?.id && isServerId(salvo.id) ? salvo.id : null,
      );
    }
    return Promise.resolve(null);
  }, []);

  const addAppointment = useCallback((input) => {
    const tempId = newId();
    const appointment = {
      id: tempId,
      status: "Confirmado",
      priority: input.priority || "Rotina",
      date: input.date || getToday(),
      notes: input.notes || "",
      ...input,
    };
    setData((current) => {
      const existingById = input.patientId
        ? current.patients.find((p) => String(p.id) === String(input.patientId))
        : null;
      const existingByData = !existingById
        ? current.patients.find((p) => isSamePatient(p, appointment))
        : null;
      const targetPatient = existingById || existingByData;

      const nextPatients = targetPatient
        ? current.patients.map((p) =>
            p.id === targetPatient.id
              ? {
                  ...p,
                  lastVisit: `${appointment.date} · ${appointment.time}`,
                }
              : p,
          )
        : [...current.patients, patientFromAppointment(appointment)];

      return {
        ...current,
        appointments: [...current.appointments, appointment].sort((a, b) => {
          const dateCmp = String(a.date ?? "").localeCompare(String(b.date ?? ""));
          if (dateCmp !== 0) return dateCmp;
          return String(a.time ?? "").localeCompare(String(b.time ?? ""));
        }),
        patients: nextPatients,
      };
    });

    // Envia ao servidor e troca o id temporário pelo id real que ele devolveu.
    // Preserva localId para que rotas ou chamadas em andamento não percam a referência (#213).
    const creationPromise = sincronizar(
      () => clinicService.createAppointment(appointmentToApi(appointment)),
      "O atendimento ficou só neste navegador: não foi salvo no servidor.",
    ).then((salvo) => {
      pendingCreationsRef.current.delete(String(appointment.id));
      if (!salvo?.id || salvo.id === appointment.id) return salvo;
      resolvedIdsRef.current.set(String(appointment.id), salvo.id);
      setData((current) => ({
        ...current,
        appointments: current.appointments.map((a) =>
          a.id === appointment.id || a.localId === appointment.id
            ? { ...a, id: salvo.id, localId: appointment.id }
            : a,
        ),
      }));
      return salvo;
    });

    if (clinicService.isAuthenticated()) {
      pendingCreationsRef.current.set(String(appointment.id), creationPromise);
    }

    return appointment;
  }, []);

  const updateAppointment = useCallback(
    (id, fields) => {
      setData((current) => ({
        ...current,
        appointments: current.appointments
          .map((a) => (matchesAppointmentTarget(a, id) ? { ...a, ...fields } : a))
          .sort((a, b) => {
            const dateCmp = String(a.date ?? "").localeCompare(String(b.date ?? ""));
            if (dateCmp !== 0) return dateCmp;
            return String(a.time ?? "").localeCompare(String(b.time ?? ""));
          }),
      }));

      return resolveOrAwaitServerId(id).then((serverId) => {
        if (!serverId) {
          if (clinicService.isAuthenticated()) toast.error(AVISO_SEM_SERVIDOR);
          return null;
        }
        return sincronizar(
          () => clinicService.updateAppointment(serverId, appointmentToApi(fields)),
          "Não foi possível salvar as alterações do atendimento.",
        );
      });
    },
    [matchesAppointmentTarget, resolveOrAwaitServerId],
  );

  const deleteAppointment = useCallback(
    (id) => {
      setData((current) => ({
        ...current,
        appointments: current.appointments.filter((a) => !matchesAppointmentTarget(a, id)),
      }));
      return resolveOrAwaitServerId(id).then((serverId) => {
        if (!serverId) return null;
        return sincronizar(
          () => clinicService.deleteAppointment(serverId),
          "Não foi possível excluir o atendimento no servidor.",
        );
      });
    },
    [matchesAppointmentTarget, resolveOrAwaitServerId],
  );

  const updateAppointmentStatus = useCallback(
    (id, status) => {
      setData((current) => ({
        ...current,
        appointments: current.appointments.map((a) =>
          matchesAppointmentTarget(a, id) ? { ...a, status } : a,
        ),
      }));

      resolveOrAwaitServerId(id).then((serverId) => {
        if (!serverId) {
          if (clinicService.isAuthenticated()) toast.error(AVISO_SEM_SERVIDOR);
          return;
        }
        sincronizar(
          () => clinicService.updateAppointmentStatus(serverId, status),
          "Não foi possível atualizar o status do atendimento.",
        );
      });
    },
    [matchesAppointmentTarget, resolveOrAwaitServerId],
  );

  const updateAppointmentExam = useCallback(
    (appointmentId, examId, fields) => {
      setData((current) => ({
        ...current,
        appointments: current.appointments.map((a) => {
          if (!matchesAppointmentTarget(a, appointmentId)) return a;
          const exams = asArray(a.exames_complementares).map((ex, idx) => {
            const item =
              typeof ex === "string"
                ? {
                    id: `exam-${idx}-${ex.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    nome: ex,
                    status: "Solicitado",
                    resultado: "",
                  }
                : ex;
            if (!item) return ex;
            const matchesId = item.id === examId || item.nome === examId;
            if (!matchesId) return item;
            return {
              ...item,
              ...fields,
            };
          });
          return {
            ...a,
            exames_complementares: exams,
          };
        }),
      }));
    },
    [matchesAppointmentTarget],
  );

  const updateAppointmentPriority = useCallback(
    (id, priority) => {
      setData((current) => ({
        ...current,
        appointments: current.appointments.map((a) =>
          matchesAppointmentTarget(a, id) ? { ...a, priority } : a,
        ),
      }));
    },
    [matchesAppointmentTarget],
  );

  const updateAppointmentPayment = useCallback(
    (id, paymentData) => {
      setData((current) => ({
        ...current,
        appointments: current.appointments.map((a) =>
          matchesAppointmentTarget(a, id) ? { ...a, ...paymentData } : a,
        ),
      }));
    },
    [matchesAppointmentTarget],
  );

  const updatePatient = useCallback((patientId, fields) => {
    setData((current) => {
      const target = current.patients.find((p) => String(p.id) === String(patientId));
      if (!target) return current;

      const updatedPatient = {
        ...target,
        ...fields,
        alerts: asArray(fields.alerts ?? target.alerts),
        history: asArray(fields.history ?? target.history),
      };

      const updatedPatients = current.patients.map((p) =>
        String(p.id) === String(patientId) ? updatedPatient : p,
      );

      const updatedAppointments = current.appointments.map((a) => {
        if (isSamePatient(target, a)) {
          return {
            ...a,
            petName: fields.name !== undefined ? fields.name : a.petName,
            species: fields.species !== undefined ? fields.species : a.species,
            breed: fields.breed !== undefined ? fields.breed : a.breed,
            tutor: fields.tutor !== undefined ? fields.tutor : a.tutor,
            phone: fields.phone !== undefined ? fields.phone : a.phone,
          };
        }
        return a;
      });

      return {
        ...current,
        patients: updatedPatients,
        appointments: updatedAppointments,
      };
    });

    sincronizar(() => clinicService.updatePatient(patientId, fields), "Não foi possível salvar os dados do paciente.");
  }, []);

  const deletePatient = useCallback((patientId) => {
    setData((current) => {
      const target = current.patients.find((p) => String(p.id) === String(patientId));
      return {
        ...current,
        patients: current.patients.filter((p) => String(p.id) !== String(patientId)),
        appointments: target
          ? current.appointments.filter((a) => !isSamePatient(target, a))
          : current.appointments,
      };
    });

    sincronizar(() => clinicService.deletePatient(patientId), "Não foi possível excluir o paciente no servidor.");
  }, []);

  const concludeAppointment = useCallback(
    (appointmentId, conclusion) => {
      setData((current) => {
        const app = current.appointments.find((a) => matchesAppointmentTarget(a, appointmentId));
        if (!app) return current;

        const updatedApp = {
          ...app,
          status: "Concluído",
          ...conclusion,
        };

        const historyItem = {
          date: app.date,
          type: app.service,
          vet: app.vet,
          summary:
            conclusion.diagnostico ||
            conclusion.queixa_principal ||
            app.notes ||
            "Atendimento concluído",
        };

        const appliedVaccineEntry = conclusion.vacina_aplicada
          ? {
              id: newId(),
              nome: conclusion.vacina_aplicada,
              lote: conclusion.vacina_lote || "—",
              data_aplicacao: app.date || getToday(),
              proxima_dose: conclusion.vacina_proxima_dose || null,
              veterinario: app.vet || "Clínica",
              tipo: "atendimento",
            }
          : null;

        const updatedPatients = current.patients.map((p) => {
          if (isSamePatient(p, app)) {
            const existingVaccines = asArray(p.vaccines);
            return {
              ...p,
              weight: conclusion.peso ? `${conclusion.peso} kg` : p.weight,
              vaccinesUpToDate: conclusion.vacina_aplicada ? true : p.vaccinesUpToDate,
              vaccines: appliedVaccineEntry
                ? [appliedVaccineEntry, ...existingVaccines]
                : existingVaccines,
              history: [
                historyItem,
                ...p.history.filter((h) => !(h.date === app.date && h.type === app.service)),
              ],
            };
          }
          return p;
        });

        return {
          ...current,
          appointments: current.appointments.map((a) =>
            matchesAppointmentTarget(a, appointmentId) ? updatedApp : a,
          ),
          patients: updatedPatients,
        };
      });

      resolveOrAwaitServerId(appointmentId).then((serverId) => {
        if (!serverId) {
          if (clinicService.isAuthenticated()) toast.error(AVISO_SEM_SERVIDOR);
          return;
        }
        sincronizar(
          () => clinicService.concludeAppointment(serverId, conclusionToApi(conclusion)),
          "O atendimento foi concluído aqui, mas não foi salvo no servidor.",
        );
      });
    },
    [matchesAppointmentTarget, resolveOrAwaitServerId],
  );

  const addPatientVaccine = useCallback((patientId, vaccine) => {
    setData((current) => {
      const target = current.patients.find((p) => String(p.id) === String(patientId));
      if (!target) return current;

      const newEntry = {
        id: newId(),
        nome: String(vaccine.nome || vaccine.name || "").trim(),
        lote: String(vaccine.lote || vaccine.lot || "").trim() || "—",
        data_aplicacao: vaccine.data_aplicacao || getToday(),
        proxima_dose: vaccine.proxima_dose || null,
        veterinario: String(vaccine.veterinario || vaccine.vet || "").trim() || "Histórico Pregresso",
        tipo: "pregressa",
      };

      const updatedVaccines = [newEntry, ...asArray(target.vaccines)];
      const updatedPatient = {
        ...target,
        vaccines: updatedVaccines,
        vaccinesUpToDate: true,
      };

      return {
        ...current,
        patients: current.patients.map((p) =>
          String(p.id) === String(patientId) ? updatedPatient : p,
        ),
      };
    });
  }, []);

  const linkPatientWithLivePet = useCallback(async (patientId, petIdentifier, message) => {
    try {
      const res = await clinicService.requestPetLink({
        pet_identifier: petIdentifier,
        local_patient_id: String(patientId),
        mensagem: message || "",
      });
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message || "Erro ao solicitar vínculo." };
    }
  }, []);

  const admitPatientToBed = useCallback((bedId, occupantInput) => {
    const nowTime = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const occupant = {
      patientId: occupantInput.patientId || null,
      petName: occupantInput.petName?.trim() || "Paciente",
      species: occupantInput.species || "Cão",
      breed: occupantInput.breed?.trim() || "—",
      tutor: occupantInput.tutor?.trim() || "—",
      vet: occupantInput.vet?.trim() || "Equipe da clínica",
      reason: occupantInput.reason?.trim() || "Observação clínica",
      diet: occupantInput.diet?.trim() || "Dieta hospitalar padrão",
      prescription: occupantInput.prescription?.trim() || "Em avaliação",
      nextMedicationTime: occupantInput.nextMedicationTime || "—",
      admittedAt: occupantInput.admittedAt || `Hoje, ${nowTime}`,
      evolutions: asArray(occupantInput.evolutions),
      medicationSchedule: asArray(occupantInput.medicationSchedule),
    };

    setData((current) => ({
      ...current,
      beds: asArray(current.beds).map((b) =>
        b.id === bedId ? { ...b, status: "Ocupada", occupant } : b,
      ),
    }));
  }, []);

  const addBedEvolution = useCallback((bedId, evolutionInput) => {
    const nowTime = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const entry = {
      id: newId(),
      time: evolutionInput.time || nowTime,
      vet: evolutionInput.vet || "Plantonista",
      temperature: evolutionInput.temperature || "",
      note: evolutionInput.note?.trim() || "Evolução clínica registrada.",
    };

    setData((current) => ({
      ...current,
      beds: asArray(current.beds).map((b) => {
        if (b.id !== bedId || !b.occupant) return b;
        return {
          ...b,
          occupant: {
            ...b.occupant,
            diet:
              evolutionInput.diet !== undefined && evolutionInput.diet.trim()
                ? evolutionInput.diet.trim()
                : b.occupant.diet,
            prescription:
              evolutionInput.prescription !== undefined && evolutionInput.prescription.trim()
                ? evolutionInput.prescription.trim()
                : b.occupant.prescription,
            nextMedicationTime:
              evolutionInput.nextMedicationTime || b.occupant.nextMedicationTime,
            evolutions: [entry, ...asArray(b.occupant.evolutions)],
          },
        };
      }),
    }));
  }, []);

  const addBedMedicationItem = useCallback((bedId, itemInput) => {
    const entry = {
      id: newId(),
      medication: String(itemInput.medication || "").trim() || "Medicação",
      dosage: String(itemInput.dosage || "").trim() || "Conforme prescrição",
      scheduledTime: itemInput.scheduledTime || "14:00",
      status: "Pendente",
      administeredAt: null,
      administeredBy: null,
    };

    setData((current) => ({
      ...current,
      beds: asArray(current.beds).map((b) => {
        if (b.id !== bedId || !b.occupant) return b;
        const nextSchedule = [...asArray(b.occupant.medicationSchedule), entry].sort((a, c) =>
          String(a.scheduledTime || "").localeCompare(String(c.scheduledTime || "")),
        );
        const nextPending = nextSchedule.find((m) => m.status !== "Administrado");
        return {
          ...b,
          occupant: {
            ...b.occupant,
            medicationSchedule: nextSchedule,
            nextMedicationTime: nextPending
              ? nextPending.scheduledTime
              : b.occupant.nextMedicationTime,
          },
        };
      }),
    }));
  }, []);

  const toggleBedMedicationStatus = useCallback((bedId, medId, administeredBy = "Enfermagem") => {
    const nowTime = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setData((current) => ({
      ...current,
      beds: asArray(current.beds).map((b) => {
        if (b.id !== bedId || !b.occupant) return b;
        const nextSchedule = asArray(b.occupant.medicationSchedule).map((item) => {
          if (item.id !== medId) return item;
          const willBeAdministered = item.status !== "Administrado";
          return {
            ...item,
            status: willBeAdministered ? "Administrado" : "Pendente",
            administeredAt: willBeAdministered ? nowTime : null,
            administeredBy: willBeAdministered ? administeredBy || b.occupant.vet : null,
          };
        });
        const nextPending = nextSchedule.find((m) => m.status !== "Administrado");
        return {
          ...b,
          occupant: {
            ...b.occupant,
            medicationSchedule: nextSchedule,
            nextMedicationTime: nextPending ? nextPending.scheduledTime : "Concluído",
          },
        };
      }),
    }));
  }, []);

  const removeBedMedicationItem = useCallback((bedId, medId) => {
    setData((current) => ({
      ...current,
      beds: asArray(current.beds).map((b) => {
        if (b.id !== bedId || !b.occupant) return b;
        const nextSchedule = asArray(b.occupant.medicationSchedule).filter((m) => m.id !== medId);
        const nextPending = nextSchedule.find((m) => m.status !== "Administrado");
        return {
          ...b,
          occupant: {
            ...b.occupant,
            medicationSchedule: nextSchedule,
            nextMedicationTime: nextPending
              ? nextPending.scheduledTime
              : b.occupant.nextMedicationTime,
          },
        };
      }),
    }));
  }, []);

  const dischargePatientFromBed = useCallback((bedId, dischargeNote = "") => {
    setData((current) => {
      const targetBed = asArray(current.beds).find((b) => b.id === bedId);
      const occupant = targetBed?.occupant;

      let nextPatients = current.patients;
      if (occupant) {
        const evoCount = asArray(occupant.evolutions).length;
        const medAdministeredCount = asArray(occupant.medicationSchedule).filter(
          (m) => m.status === "Administrado",
        ).length;
        const summaryParts = [
          `Motivo: ${occupant.reason}`,
          evoCount > 0 ? `${evoCount} evolução(ões) no leito` : null,
          medAdministeredCount > 0 ? `${medAdministeredCount} dose(s) administrada(s)` : null,
          String(dischargeNote || "").trim()
            ? `Recomendações: ${String(dischargeNote).trim()}`
            : null,
        ].filter(Boolean);

        const historyEntry = {
          date: getToday(),
          type: `Alta Hospitalar (${targetBed.name})`,
          vet: occupant.vet,
          summary:
            summaryParts.join(" · ") ||
            `Alta médica após internação por: ${occupant.reason}`,
        };

        let matchedAny = false;
        nextPatients = current.patients.map((p) => {
          const matchesId =
            occupant.patientId && String(p.id) === String(occupant.patientId);
          const matchesExact = isSamePatient(p, {
            petName: occupant.petName,
            tutor: occupant.tutor,
          });
          const matchesNameWhenDefaultTutor =
            normalize(p.name) === normalize(occupant.petName) &&
            (occupant.tutor === "Tutor cadastrado" || occupant.tutor === "—");

          if (matchesId || matchesExact || matchesNameWhenDefaultTutor) {
            matchedAny = true;
            return {
              ...p,
              lastVisit: getToday(),
              history: [historyEntry, ...asArray(p.history)],
            };
          }
          return p;
        });

        if (!matchedAny) {
          const createdPatient = {
            ...patientFromAppointment({
              petName: occupant.petName,
              species: occupant.species,
              breed: occupant.breed,
              tutor: occupant.tutor,
              phone: "—",
            }),
            lastVisit: getToday(),
            history: [historyEntry],
          };
          nextPatients = [...nextPatients, createdPatient];
        }
      }

      return {
        ...current,
        patients: nextPatients,
        beds: asArray(current.beds).map((b) =>
          b.id === bedId ? { ...b, status: "Em Higienização", occupant: null } : b,
        ),
      };
    });
  }, []);

  const releaseBedFromCleaning = useCallback((bedId) => {
    setData((current) => ({
      ...current,
      beds: asArray(current.beds).map((b) =>
        b.id === bedId ? { ...b, status: "Livre", occupant: null } : b,
      ),
    }));
  }, []);

  const setBedCleaning = useCallback((bedId) => {
    setData((current) => ({
      ...current,
      beds: asArray(current.beds).map((b) =>
        b.id === bedId ? { ...b, status: "Em Higienização", occupant: null } : b,
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      profile: data.profile,
      appointments: data.appointments,
      patients: data.patients,
      beds: data.beds,
      loading,
      error,
      saveProfile,
      refreshData: loadClinicData,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      updateAppointmentStatus,
      updateAppointmentPriority,
      updateAppointmentPayment,
      updateAppointmentExam,
      updatePatient,
      deletePatient,
      concludeAppointment,
      addPatientVaccine,
      linkPatientWithLivePet,
      admitPatientToBed,
      addBedEvolution,
      addBedMedicationItem,
      toggleBedMedicationStatus,
      removeBedMedicationItem,
      dischargePatientFromBed,
      releaseBedFromCleaning,
      setBedCleaning,
    }),
    [
      data,
      loading,
      error,
      saveProfile,
      loadClinicData,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      updateAppointmentStatus,
      updateAppointmentPriority,
      updateAppointmentPayment,
      updateAppointmentExam,
      updatePatient,
      deletePatient,
      concludeAppointment,
      addPatientVaccine,
      linkPatientWithLivePet,
      admitPatientToBed,
      addBedEvolution,
      addBedMedicationItem,
      toggleBedMedicationStatus,
      removeBedMedicationItem,
      dischargePatientFromBed,
      releaseBedFromCleaning,
      setBedCleaning,
    ],
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    // Fora do ClinicProvider (que fica no App), devolve dados vazios mas com o
    // mesmo formato do perfil real, para nenhuma tela quebrar com .map/.trim.
    return {
      ...createEmptyData(),
      beds: [],
      loading: false,
      error: null,
      saveProfile: () => {},
      refreshData: async () => {},
      updateAppointment: async () => null,
      deleteAppointment: async () => null,
      addAppointment: () => {},
      updateAppointmentStatus: () => {},
      updateAppointmentPayment: () => {},
      cancelAppointment: () => {},
      addPatient: () => {},
      updatePatient: () => {},
      deletePatient: () => {},
      addPatientVaccine: () => {},
      addBedMedicationItem: () => {},
      toggleBedMedicationStatus: () => {},
      removeBedMedicationItem: () => {},
      updateBed: () => {},
    };
  }
  return context;
};

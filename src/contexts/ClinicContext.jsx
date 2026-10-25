import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { createDefaultBeds } from "@/data/clinicDemo";
import { clinicService } from "@/services/api";

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
    const raw = window.localStorage.getItem(key);
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
  lastVisit: "—",
  history: [],
});

const ClinicContext = createContext(null);

export const ClinicProvider = ({ children }) => {
  const [data, setData] = useState(loadData);
  const isFetchingRef = useRef(false);
  const activeClinicIdRef = useRef(clinicService.getCurrentClinic()?.id || null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const loadClinicData = useCallback(async () => {
    if (!clinicService.isAuthenticated()) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const currentClinic = clinicService.getCurrentClinic();
      activeClinicIdRef.current = currentClinic?.id || null;

      const [clinicRes, apptsRes, patientsRes] = await Promise.allSettled([
        clinicService.getProfile(),
        clinicService.listAppointments(),
        clinicService.listPatients(),
      ]);

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
      if (clinic?.equipe) {
        try {
          const parsed = typeof clinic.equipe === "string" ? JSON.parse(clinic.equipe) : clinic.equipe;
          if (Array.isArray(parsed)) teamList = parsed;
        } catch {}
      }

      const mappedAppointments = appointments.map((a) => ({
        id: a.id,
        petName: a.pet_name,
        species: a.species,
        breed: a.breed,
        tutor: a.tutor,
        phone: a.phone,
        service: a.service,
        vet: a.vet,
        date: a.date,
        time: a.time,
        status: a.status,
        priority: a.priority || "Rotina",
        notes: a.notes || "",
      }));

      setData((current) => ({
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
        patients: patients.length > 0 ? patients : current.patients,
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Monitora alterações de autenticação da clínica (login, logout, troca de conta)
  useEffect(() => {
    const handleAuthChange = (e) => {
      const clinic = e.detail?.clinic;
      if (!clinic) {
        activeClinicIdRef.current = null;
        setData(createEmptyData());
      } else if (clinic.id !== activeClinicIdRef.current) {
        activeClinicIdRef.current = clinic.id;
        setData(createEmptyData());
        loadClinicData();
      }
    };

    window.addEventListener("livepet-clinic-auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("livepet-clinic-auth-change", handleAuthChange);
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
      clinicService.updateProfile(payload).catch(() => {});
    }
  }
}, []);

  const addAppointment = useCallback((input) => {
    const appointment = {
      id: newId(),
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

    // Tenta sincronizar em segundo plano com o backend se disponível
    try {
      clinicService
        .createAppointment({
          pet_name: appointment.petName,
          species: appointment.species,
          breed: appointment.breed,
          tutor: appointment.tutor,
          phone: appointment.phone,
          service: appointment.service,
          vet: appointment.vet,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          priority: appointment.priority,
          notes: appointment.notes,
        })
        .catch(() => {});
    } catch {
      // Ignora falhas de rede / offline
    }

    return appointment;
  }, []);

  const updateAppointmentStatus = useCallback((id, status) => {
    setData((current) => ({
      ...current,
      appointments: current.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
    try {
      clinicService.updateAppointmentStatus(id, status).catch(() => {});
    } catch {
      // Modo offline
    }
  }, []);

  const updateAppointmentExam = useCallback((appointmentId, examId, fields) => {
    setData((current) => ({
      ...current,
      appointments: current.appointments.map((a) => {
        if (a.id !== appointmentId) return a;
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
  }, []);

  const updateAppointmentPriority = useCallback((id, priority) => {
    setData((current) => ({
      ...current,
      appointments: current.appointments.map((a) => (a.id === id ? { ...a, priority } : a)),
    }));
  }, []);

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

    try {
      clinicService.updatePatient(patientId, fields).catch(() => {});
    } catch {
      // Modo offline
    }
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

    try {
      clinicService.deletePatient(patientId).catch(() => {});
    } catch {
      // Modo offline
    }
  }, []);

  const concludeAppointment = useCallback((appointmentId, conclusion) => {
    setData((current) => {
      const app = current.appointments.find((a) => a.id === appointmentId);
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

      const updatedPatients = current.patients.map((p) => {
        if (isSamePatient(p, app)) {
          return {
            ...p,
            weight: conclusion.peso ? `${conclusion.peso} kg` : p.weight,
            vaccinesUpToDate: conclusion.vacina_aplicada ? true : p.vaccinesUpToDate,
            history: [historyItem, ...p.history.filter((h) => !(h.date === app.date && h.type === app.service))],
          };
        }
        return p;
      });

      return {
        ...current,
        appointments: current.appointments.map((a) =>
          a.id === appointmentId ? updatedApp : a,
        ),
        patients: updatedPatients,
      };
    });

    try {
      clinicService.concludeAppointment(appointmentId, conclusion).catch(() => {});
    } catch {
      // Modo offline
    }
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

  const dischargePatientFromBed = useCallback((bedId, dischargeNote = "") => {
    setData((current) => {
      const targetBed = asArray(current.beds).find((b) => b.id === bedId);
      const occupant = targetBed?.occupant;

      const nextPatients = occupant
        ? current.patients.map((p) => {
            if (isSamePatient(p, { petName: occupant.petName, tutor: occupant.tutor })) {
              const historyEntry = {
                date: getToday(),
                type: `Alta Hospitalar (${targetBed.name})`,
                vet: occupant.vet,
                summary:
                  dischargeNote.trim() ||
                  `Alta médica após internação por: ${occupant.reason}`,
              };
              return {
                ...p,
                history: [historyEntry, ...asArray(p.history)],
              };
            }
            return p;
          })
        : current.patients;

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
      saveProfile,
      addAppointment,
      updateAppointmentStatus,
      updateAppointmentPriority,
      updateAppointmentExam,
      updatePatient,
      deletePatient,
      concludeAppointment,
      linkPatientWithLivePet,
      admitPatientToBed,
      addBedEvolution,
      dischargePatientFromBed,
      releaseBedFromCleaning,
      setBedCleaning,
    }),
    [
      data,
      saveProfile,
      addAppointment,
      updateAppointmentStatus,
      updateAppointmentPriority,
      updateAppointmentExam,
      updatePatient,
      deletePatient,
      concludeAppointment,
      linkPatientWithLivePet,
      admitPatientToBed,
      addBedEvolution,
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
      saveProfile: () => {},
      addAppointment: () => {},
      updateAppointmentStatus: () => {},
      cancelAppointment: () => {},
      addPatient: () => {},
      updatePatient: () => {},
      deletePatient: () => {},
      updateBed: () => {},
    };
  }
  return context;
};
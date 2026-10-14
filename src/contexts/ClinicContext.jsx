import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { clinicService } from "@/services/api";

const getToday = () => new Date().toISOString().split("T")[0];

export const STORAGE_KEY = "livepet_clinic_data";
const STORAGE_VERSION = 1;

const PROFILE_TEXT_FIELDS = ["name", "crmv", "email", "phone", "whatsapp", "address", "about"];

const createEmptyData = () => ({
  profile: {
    name: "",
    crmv: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    about: "",
    services: [],
    hours: [],
    team: [],
  },
  appointments: [],
  patients: [],
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

// Lê do localStorage sem nunca quebrar: se estiver indisponível, vazio ou
// corrompido, volta para os dados vazios.
const loadData = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyData();
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) return createEmptyData();
    return {
      profile: sanitizeProfile(parsed.profile),
      appointments: asArray(parsed.appointments).filter((a) => isObject(a) && a.id),
      patients: asArray(parsed.patients)
        .filter((p) => isObject(p) && p.id)
        .map(sanitizePatient),
    };
  } catch {
    return createEmptyData();
  }
};

const saveData = (data) => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
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

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Sincroniza pacientes do banco de dados se a clínica estiver conectada
  useEffect(() => {
    let active = true;
    clinicService
      .listPatients()
      .then((apiPatients) => {
        if (!active || !Array.isArray(apiPatients) || apiPatients.length === 0) return;
        setData((current) => {
          const merged = [...current.patients];
          let changed = false;
          apiPatients.forEach((ap) => {
            if (!merged.some((p) => isSamePatient(p, { petName: ap.name, tutor: ap.tutor }))) {
              merged.push(ap);
              changed = true;
            }
          });
          return changed ? { ...current, patients: merged } : current;
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const saveProfile = useCallback((fields) => {
    setData((current) => ({ ...current, profile: { ...current.profile, ...fields } }));
  }, []);

  const addAppointment = useCallback((input) => {
    const appointment = {
      id: newId(),
      status: "Confirmado",
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

  const value = useMemo(
    () => ({
      profile: data.profile,
      appointments: data.appointments,
      patients: data.patients,
      saveProfile,
      addAppointment,
      updateAppointmentStatus,
      updatePatient,
      deletePatient,
      concludeAppointment,
      linkPatientWithLivePet,
    }),
    [
      data,
      saveProfile,
      addAppointment,
      updateAppointmentStatus,
      updatePatient,
      deletePatient,
      concludeAppointment,
      linkPatientWithLivePet,
    ],
  );


  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error("useClinic precisa ser usado dentro de <ClinicProvider>.");
  }
  return context;
};
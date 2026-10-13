import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

  const saveProfile = useCallback((fields) => {
    setData((current) => ({ ...current, profile: { ...current.profile, ...fields } }));
  }, []);

  const addAppointment = useCallback((input) => {
    const appointment = { id: newId(), status: "Confirmado", ...input };
    setData((current) => {
      const knownPatient = current.patients.some((p) => isSamePatient(p, appointment));
      return {
        ...current,
        appointments: [...current.appointments, appointment].sort((a, b) =>
          String(a.time ?? "").localeCompare(String(b.time ?? "")),
        ),
        patients: knownPatient
          ? current.patients
          : [...current.patients, patientFromAppointment(appointment)],
      };
    });
    return appointment;
  }, []);

  const updateAppointmentStatus = useCallback((id, status) => {
    setData((current) => ({
      ...current,
      appointments: current.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
  }, []);

  const value = useMemo(
    () => ({
      profile: data.profile,
      appointments: data.appointments,
      patients: data.patients,
      saveProfile,
      addAppointment,
      updateAppointmentStatus,
    }),
    [data, saveProfile, addAppointment, updateAppointmentStatus],
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
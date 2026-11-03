/**
 * Utilitário de regras, cálculo de prazos e consolidação da carteira de vacinação
 * da clínica para o prontuário e dashboard (Issue #131).
 */

export const VACCINE_STATUS = {
  UP_TO_DATE: "em_dia",
  DUE_SOON: "vence_em_breve",
  OVERDUE: "atrasada",
  NO_BOOSTER: "sem_reforco",
  NO_RECORD: "sem_registro",
};

export const getTodayIso = () => new Date().toISOString().split("T")[0];

/**
 * Calcula a diferença em dias corridos entre uma data alvo e a data de referência.
 * Retorna valor positivo para datas futuras e negativo para datas passadas.
 */
export const getDaysDifference = (targetDate, referenceDate = getTodayIso()) => {
  if (!targetDate) return null;
  const target = new Date(`${targetDate}T00:00:00`);
  const ref = new Date(`${referenceDate}T00:00:00`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(ref.getTime())) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - ref.getTime()) / msPerDay);
};

/**
 * Avalia o status de uma dose com base na data do próximo reforço.
 * - < 0 dias: Atrasada
 * - 0 a 15 dias: Vence em breve
 * - > 15 dias: Em dia
 * - Sem data de reforço: Sem reforço cadastrado / Dose única
 */
export const calculateDoseStatus = (nextDoseDate, referenceDate = getTodayIso()) => {
  if (!nextDoseDate) {
    return {
      status: VACCINE_STATUS.NO_BOOSTER,
      label: "Dose única / Sem reforço",
      variant: "secondary",
      badgeClass: "bg-muted text-muted-foreground border-border",
      daysRemaining: null,
    };
  }

  const days = getDaysDifference(nextDoseDate, referenceDate);
  if (days === null) {
    return {
      status: VACCINE_STATUS.NO_BOOSTER,
      label: "Data inválida",
      variant: "secondary",
      badgeClass: "bg-muted text-muted-foreground",
      daysRemaining: null,
    };
  }

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      status: VACCINE_STATUS.OVERDUE,
      label: "Atrasada",
      detail: `Atrasada há ${absDays} ${absDays === 1 ? "dia" : "dias"}`,
      variant: "destructive",
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      daysRemaining: days,
    };
  }

  if (days <= 15) {
    return {
      status: VACCINE_STATUS.DUE_SOON,
      label: "Vence em breve",
      detail: days === 0 ? "Vence hoje" : `Vence em ${days} ${days === 1 ? "dia" : "dias"}`,
      variant: "warning",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      daysRemaining: days,
    };
  }

  return {
    status: VACCINE_STATUS.UP_TO_DATE,
    label: "Em dia",
    detail: `Reforço em ${days} dias`,
    variant: "success",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    daysRemaining: days,
  };
};

const normalizeName = (name) => String(name || "").trim().toLowerCase();

/**
 * Normaliza e consolida o histórico de vacinas de um paciente combinando:
 * 1. Vacinas pregressas registradas manualmente no prontuário (`patient.vaccines`)
 * 2. Vacinas aplicadas nos atendimentos clínicos concluídos da clínica
 */
export const buildPatientVaccinationHistory = (patient, appointments = [], referenceDate = getTodayIso()) => {
  if (!patient) return { doses: [], summary: { status: VACCINE_STATUS.NO_RECORD, label: "Sem registro de vacinas" } };

  const dosesList = [];

  // 1. Vacinas manuais/pregressas do paciente
  if (Array.isArray(patient.vaccines)) {
    patient.vaccines.forEach((v, index) => {
      const name = v.nome || v.name || v.vacina || "Vacina";
      const lot = v.lote || v.lot || "—";
      const applicationDate = v.data_aplicacao || v.date || v.data || "—";
      const nextDoseDate = v.proxima_dose || v.nextDose || v.proximaDose || null;
      const vet = v.veterinario || v.vet || "Histórico Pregresso";
      const id = v.id || `manual-vac-${index}-${Date.now()}`;

      dosesList.push({
        id,
        nome: name,
        lote: lot,
        data_aplicacao: applicationDate,
        proxima_dose: nextDoseDate,
        veterinario: vet,
        tipo: "pregressa",
        status: calculateDoseStatus(nextDoseDate, referenceDate),
      });
    });
  }

  // 2. Vacinas registradas nos atendimentos do paciente
  const patientAppointments = appointments.filter((a) => {
    const matchName = normalizeName(a.petName) === normalizeName(patient.name);
    const matchTutor = !patient.tutor || normalizeName(a.tutor) === normalizeName(patient.tutor);
    return matchName && matchTutor;
  });

  patientAppointments.forEach((a) => {
    if (a.vacina_aplicada) {
      dosesList.push({
        id: `appt-vac-${a.id}`,
        nome: a.vacina_aplicada,
        lote: a.vacina_lote || "—",
        data_aplicacao: a.date || "—",
        proxima_dose: a.vacina_proxima_dose || null,
        veterinario: a.vet || "Clínica",
        tipo: "atendimento",
        appointmentId: a.id,
        status: calculateDoseStatus(a.vacina_proxima_dose, referenceDate),
      });
    }
  });

  // Ordena por data de aplicação decrescente (mais recente primeiro)
  dosesList.sort((a, b) => {
    const dateA = a.data_aplicacao && a.data_aplicacao !== "—" ? new Date(a.data_aplicacao).getTime() : 0;
    const dateB = b.data_aplicacao && b.data_aplicacao !== "—" ? new Date(b.data_aplicacao).getTime() : 0;
    return dateB - dateA;
  });

  // Determina o status consolidado do paciente
  let overallStatus = VACCINE_STATUS.NO_RECORD;
  let overallLabel = "Sem registro de vacinas";
  let alertMessage = null;

  if (dosesList.length > 0) {
    const hasOverdue = dosesList.some((d) => d.status.status === VACCINE_STATUS.OVERDUE);
    const hasDueSoon = dosesList.some((d) => d.status.status === VACCINE_STATUS.DUE_SOON);

    if (hasOverdue) {
      const overdueDoses = dosesList.filter((d) => d.status.status === VACCINE_STATUS.OVERDUE);
      overallStatus = VACCINE_STATUS.OVERDUE;
      overallLabel = "Reforço atrasado";
      alertMessage = `Vacina ${overdueDoses[0].nome} com reforço atrasado desde ${overdueDoses[0].proxima_dose}`;
    } else if (hasDueSoon) {
      const dueSoonDoses = dosesList.filter((d) => d.status.status === VACCINE_STATUS.DUE_SOON);
      overallStatus = VACCINE_STATUS.DUE_SOON;
      overallLabel = "Reforço próximo";
      alertMessage = `Vacina ${dueSoonDoses[0].nome} vence em breve (${dueSoonDoses[0].proxima_dose})`;
    } else {
      overallStatus = VACCINE_STATUS.UP_TO_DATE;
      overallLabel = "Vacinação em dia";
    }
  }

  return {
    doses: dosesList,
    summary: {
      status: overallStatus,
      label: overallLabel,
      alertMessage,
      totalDoses: dosesList.length,
      overdueCount: dosesList.filter((d) => d.status.status === VACCINE_STATUS.OVERDUE).length,
      dueSoonCount: dosesList.filter((d) => d.status.status === VACCINE_STATUS.DUE_SOON).length,
    },
  };
};

/**
 * Retorna alertas de reforço vacinal para os pacientes da clínica,
 * identificando doses atrasadas ou que vencem nos próximos 15 dias.
 */
export const getVaccineAlertsForDashboard = (patients = [], appointments = [], referenceDate = getTodayIso()) => {
  const alerts = [];

  patients.forEach((patient) => {
    const history = buildPatientVaccinationHistory(patient, appointments, referenceDate);
    const { status, alertMessage } = history.summary;

    if (status === VACCINE_STATUS.OVERDUE || status === VACCINE_STATUS.DUE_SOON) {
      alerts.push({
        id: `vac-alert-${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        tutor: patient.tutor,
        phone: patient.phone,
        species: patient.species,
        status,
        message: alertMessage,
        isOverdue: status === VACCINE_STATUS.OVERDUE,
      });
    }
  });

  return alerts;
};

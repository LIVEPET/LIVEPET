import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider, STORAGE_KEY, useClinic } from "./ClinicContext";

const wrapper = ({ children }) => <ClinicProvider>{children}</ClinicProvider>;

const thor = {
  time: "09:00",
  petName: "Thor",
  species: "Cão",
  breed: "Labrador",
  tutor: "Ana",
  phone: "(11) 99999-0000",
  service: "Consulta",
  vet: "Dra. Marina",
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("ClinicContext", () => {
  it("começa vazio quando não há nada salvo", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    expect(result.current.appointments).toEqual([]);
    expect(result.current.patients).toEqual([]);
    expect(result.current.profile.name).toBe("");
  });

  it("agendar cria o atendimento e cadastra o paciente automaticamente", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    act(() => {
      result.current.addAppointment(thor);
    });
    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0].status).toBe("Confirmado");
    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0]).toMatchObject({
      name: "Thor",
      tutor: "Ana",
      photo: null,
      alerts: [],
      history: [],
    });
  });

  it("não duplica o paciente quando o mesmo pet volta a ser agendado", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    act(() => {
      result.current.addAppointment(thor);
      result.current.addAppointment({ ...thor, time: "10:00", petName: " thor ", tutor: "ANA" });
    });
    expect(result.current.appointments).toHaveLength(2);
    expect(result.current.patients).toHaveLength(1);
  });

  it("mantém os atendimentos ordenados por horário", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    act(() => {
      result.current.addAppointment({ ...thor, time: "14:00", petName: "Mel" });
      result.current.addAppointment({ ...thor, time: "08:30" });
    });
    expect(result.current.appointments.map((a) => a.time)).toEqual(["08:30", "14:00"]);
  });

  it("atualiza o status de um atendimento", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    let id;
    act(() => {
      id = result.current.addAppointment(thor).id;
    });
    act(() => result.current.updateAppointmentStatus(id, "Concluído"));
    expect(result.current.appointments[0].status).toBe("Concluído");
  });

  it("saveProfile atualiza os campos e preserva horários, serviços e equipe", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profile: { name: "Antiga", services: ["Vacina"] } }),
    );
    const { result } = renderHook(() => useClinic(), { wrapper });
    act(() => result.current.saveProfile({ name: "Clínica Pet Feliz", crmv: "SP-123" }));
    expect(result.current.profile.name).toBe("Clínica Pet Feliz");
    expect(result.current.profile.crmv).toBe("SP-123");
    expect(result.current.profile.services).toEqual(["Vacina"]);
  });

  it("persiste no localStorage e recupera ao montar de novo", () => {
    const first = renderHook(() => useClinic(), { wrapper });
    act(() => {
      first.result.current.addAppointment(thor);
      first.result.current.saveProfile({ name: "Clínica Pet Feliz" });
    });
    first.unmount();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).appointments).toHaveLength(1);

    const second = renderHook(() => useClinic(), { wrapper });
    expect(second.result.current.appointments).toHaveLength(1);
    expect(second.result.current.patients).toHaveLength(1);
    expect(second.result.current.profile.name).toBe("Clínica Pet Feliz");
  });

  it("ignora JSON corrompido sem quebrar", () => {
    localStorage.setItem(STORAGE_KEY, "{isso nao e json");
    const { result } = renderHook(() => useClinic(), { wrapper });
    expect(result.current.appointments).toEqual([]);
    expect(result.current.profile.name).toBe("");
  });

  it("ignora dados com formato inesperado", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profile: { name: 42 }, appointments: "x", patients: [null, { id: "1" }] }),
    );
    const { result } = renderHook(() => useClinic(), { wrapper });
    expect(result.current.profile.name).toBe("");
    expect(result.current.appointments).toEqual([]);
    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0].alerts).toEqual([]);
    expect(result.current.patients[0].history).toEqual([]);
  });

  it("continua funcionando quando o localStorage não está disponível", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("indisponível");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cota cheia");
    });
    const { result } = renderHook(() => useClinic(), { wrapper });
    act(() => {
      result.current.addAppointment(thor);
    });
    expect(result.current.appointments).toHaveLength(1);
  });

  it("useClinic fora do Provider devolve dados vazios com o formato do perfil", () => {
    const { result } = renderHook(() => useClinic());
    expect(result.current.profile.name).toBe("");
    expect(result.current.profile.services).toEqual([]);
    expect(result.current.profile.team).toEqual([]);
    expect(result.current.profile.hours).toEqual([]);
    expect(result.current.appointments).toEqual([]);
    expect(() => result.current.saveProfile({ name: "X" })).not.toThrow();
  });

  it("não duplica o paciente quando patientId é informado explicitamente ao agendar", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    act(() => {
      result.current.addAppointment(thor);
    });
    const patientId = result.current.patients[0].id;
    act(() => {
      result.current.addAppointment({
        ...thor,
        patientId,
        time: "15:00",
        service: "Retorno",
      });
    });
    expect(result.current.appointments).toHaveLength(2);
    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0].id).toBe(patientId);
  });

  it("updatePatient atualiza dados cadastrais do paciente e reflete nos atendimentos", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    act(() => {
      result.current.addAppointment(thor);
    });
    const patientId = result.current.patients[0].id;

    act(() => {
      result.current.updatePatient(patientId, {
        name: "Thor Guerreiro",
        breed: "Golden",
        tutor: "Ana Maria",
        phone: "(11) 98888-1111",
        alerts: ["Cardiopata"],
      });
    });

    expect(result.current.patients[0].name).toBe("Thor Guerreiro");
    expect(result.current.patients[0].breed).toBe("Golden");
    expect(result.current.patients[0].alerts).toEqual(["Cardiopata"]);
    expect(result.current.appointments[0].petName).toBe("Thor Guerreiro");
    expect(result.current.appointments[0].tutor).toBe("Ana Maria");
  });

  it("concludeAppointment conclui atendimento, adiciona exame ao histórico e atualiza peso e vacinas", () => {
    const { result } = renderHook(() => useClinic(), { wrapper });
    let appId;
    act(() => {
      appId = result.current.addAppointment(thor).id;
    });

    act(() => {
      result.current.concludeAppointment(appId, {
        queixa_principal: "Check-up",
        temperatura: 38.5,
        peso: 32.4,
        diagnostico: "Saudável",
        prescricao: "Vermífugo",
        vacina_aplicada: "V10",
      });
    });

    expect(result.current.appointments[0].status).toBe("Concluído");
    expect(result.current.appointments[0].diagnostico).toBe("Saudável");
    expect(result.current.patients[0].weight).toBe("32.4 kg");
    expect(result.current.patients[0].vaccinesUpToDate).toBe(true);
    expect(result.current.patients[0].history).toHaveLength(1);
    expect(result.current.patients[0].history[0].summary).toBe("Saudável");
  });
});

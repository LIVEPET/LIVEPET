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

  it("useClinic fora do Provider avisa com uma mensagem clara", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useClinic())).toThrow(/ClinicProvider/);
  });
});
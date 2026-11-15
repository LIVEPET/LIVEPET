import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { clinicService } from "@/services/api";
import { ClinicProvider, useClinic } from "./ClinicContext";

// Integração do contexto com a API da clínica (#62 e #213): id real do servidor,
// preservação de dados clínicos/financeiros na sincronização, edição, exclusão,
// erro visível e estados de carregamento.

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock("@/services/api", () => ({
  getClinicAuthToken: () => "token-clinica",
  clinicService: {
    isAuthenticated: vi.fn(() => true),
    getCurrentClinic: vi.fn(() => ({ id: 7, nome: "Clínica Vet Vida" })),
    getProfile: vi.fn(),
    listAppointments: vi.fn(),
    listPatients: vi.fn(),
    listVeterinarians: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
    updateAppointmentStatus: vi.fn(),
    updateProfile: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    concludeAppointment: vi.fn(),
  },
}));

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

const apiOk = () => {
  clinicService.getProfile.mockResolvedValue({ id: 7, nome: "Clínica Vet Vida", email: "vida@vet.com" });
  clinicService.listAppointments.mockResolvedValue([]);
  clinicService.listPatients.mockResolvedValue([]);
  clinicService.listVeterinarians.mockResolvedValue([]);
};

const montar = async () => {
  const hook = renderHook(() => useClinic(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  clinicService.isAuthenticated.mockReturnValue(true);
  apiOk();
});
afterEach(() => vi.restoreAllMocks());

describe("ClinicContext integrado à API (#62 e #213)", () => {
  it("carrega perfil, agenda e pacientes da API e expõe loading", async () => {
    clinicService.listAppointments.mockResolvedValue([
      { id: 31, pet_name: "Mel", species: "Gato", breed: "SRD", tutor: "Beto", phone: "(11) 98888-0000", service: "Vacina", vet: "Dra. Marina", date: "2026-11-10", time: "10:00", status: "Confirmado" },
    ]);
    const { result } = renderHook(() => useClinic(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.profile.name).toBe("Clínica Vet Vida");
    expect(result.current.appointments).toEqual([expect.objectContaining({ id: 31, petName: "Mel" })]);
  });

  it("quando a API falha por completo, expõe a mensagem de erro e permite tentar de novo", async () => {
    const falha = new Error("Sem rede");
    clinicService.getProfile.mockRejectedValue(falha);
    clinicService.listAppointments.mockRejectedValue(falha);
    clinicService.listPatients.mockRejectedValue(falha);
    clinicService.listVeterinarians.mockRejectedValue(falha);

    const { result } = await montar();
    expect(result.current.error).toMatch(/Não foi possível carregar os dados da clínica/);
    expect(result.current.error).toMatch(/Sem rede/);

    apiOk();
    await act(() => result.current.refreshData());
    expect(result.current.error).toBeNull();
    expect(result.current.profile.name).toBe("Clínica Vet Vida");
  });

  it("lista de pacientes vazia vinda da API substitui o que estava no navegador", async () => {
    localStorage.setItem(
      "livepet_clinic_data",
      JSON.stringify({ version: 1, profile: {}, appointments: [], patients: [{ id: 99, name: "Fantasma", tutor: "X", history: [], alerts: [] }] }),
    );
    const { result } = await montar();
    expect(result.current.patients).toEqual([]);
  });

  it("agendar envia para a API e troca o id temporário pelo id devolvido pelo servidor", async () => {
    clinicService.createAppointment.mockResolvedValue({ id: 42 });
    const { result } = await montar();

    let criado;
    act(() => {
      criado = result.current.addAppointment({ ...thor, date: "2026-11-10" });
    });
    expect(clinicService.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ pet_name: "Thor", tutor: "Ana", time: "09:00", date: "2026-11-10", status: "Confirmado" }),
    );
    await waitFor(() => expect(result.current.appointments[0].id).toBe(42));
    expect(result.current.appointments[0].id).not.toBe(criado.id);

    // Com o id real, a mudança de status chega ao servidor no registro certo
    clinicService.updateAppointmentStatus.mockResolvedValue({});
    act(() => result.current.updateAppointmentStatus(42, "Em atendimento"));
    await waitFor(() => expect(clinicService.updateAppointmentStatus).toHaveBeenCalledWith(42, "Em atendimento"));
  });

  it("permite iniciar e concluir atendimento recém-criado mesmo usando o id temporário antes ou depois da resposta da API (#213)", async () => {
    let resolverCriacao;
    clinicService.createAppointment.mockImplementation(
      () => new Promise((resolve) => { resolverCriacao = resolve; }),
    );
    clinicService.updateAppointmentStatus.mockResolvedValue({});
    clinicService.concludeAppointment.mockResolvedValue({});

    const { result } = await montar();

    let criado;
    act(() => {
      criado = result.current.addAppointment({ ...thor, date: "2026-11-10" });
    });

    // Inicia e conclui o atendimento imediatamente usando o ID temporário enquanto a criação ainda está em andamento
    act(() => {
      result.current.updateAppointmentStatus(criado.id, "Em atendimento");
      result.current.concludeAppointment(criado.id, {
        queixa_principal: "apatia e febre",
        temperatura: 39.4,
        peso: 28.5,
        diagnostico: "Gastroenterite",
      });
    });

    // Assim que a criação no backend resolve com id numérico 108, as chamadas pendentes usam o id 108 sem erro 422
    await act(async () => {
      resolverCriacao({ id: 108 });
    });

    await waitFor(() => {
      expect(result.current.appointments[0].id).toBe(108);
      expect(result.current.appointments[0].localId).toBe(criado.id);
      expect(clinicService.updateAppointmentStatus).toHaveBeenCalledWith(108, "Em atendimento");
      expect(clinicService.concludeAppointment).toHaveBeenCalledWith(
        108,
        expect.objectContaining({
          queixa_principal: "apatia e febre",
          temperatura: 39.4,
          peso: 28.5,
          diagnostico: "Gastroenterite",
        }),
      );
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("preserva todos os campos clínicos da API e mescla os campos enriquecidos localmente em loadClinicData (#213)", async () => {
    localStorage.setItem(
      "livepet_clinic_data_7",
      JSON.stringify({
        version: 1,
        profile: {},
        appointments: [
          {
            id: 55,
            petName: "Thor",
            species: "Cão",
            breed: "Labrador",
            tutor: "Ana",
            phone: "(11) 99999-0000",
            service: "Consulta Clínica",
            vet: "Dra. Marina",
            date: "2026-11-10",
            time: "09:00",
            status: "Concluído",
            priority: "Urgente",
            prescricao_itens: [
              { id: "rx-1", nome: "Amoxicilina", concentracao: "250mg", via: "Uso Oral", posologia: "1 comp a cada 12h", duracao: "7 dias" },
            ],
            exames_complementares: [
              { id: "ex-1", nome: "Hemograma Completo", status: "Concluído", resultado: "Leucocitose discreta" },
            ],
            valor_servico: 180,
            itens_adicionais: [{ id: "it-1", descricao: "Fluidoterapia", valor: 90 }],
            desconto: 20,
            valor_total: 250,
            status_pagamento: "Pago",
            forma_pagamento: "PIX",
            isReturn: true,
          },
        ],
        patients: [],
      }),
    );

    clinicService.listAppointments.mockResolvedValue([
      {
        id: 55,
        pet_name: "Thor",
        species: "Cão",
        breed: "Labrador",
        tutor: "Ana",
        phone: "(11) 99999-0000",
        service: "Consulta Clínica",
        vet: "Dra. Marina",
        date: "2026-11-10",
        time: "09:00",
        status: "Concluído",
        priority: "Urgente",
        notes: "Paciente em observação",
        queixa_principal: "Vômitos há 2 dias",
        temperatura: 39.1,
        peso: 29.4,
        frequencia_cardiaca: 112,
        frequencia_respiratoria: 28,
        mucosas: "Normocoradas",
        diagnostico: "Gastrite aguda",
        prescricao: "Dieta leve e hidratação",
        vacina_aplicada: "V10 Polivalente",
        vacina_lote: "LT-2026-99",
        vacina_proxima_dose: "2027-11-10",
      },
    ]);

    const { result } = await montar();
    const app = result.current.appointments[0];

    // Campos clínicos da API preservados
    expect(app).toEqual(
      expect.objectContaining({
        id: 55,
        queixa_principal: "Vômitos há 2 dias",
        temperatura: 39.1,
        peso: 29.4,
        frequencia_cardiaca: 112,
        frequencia_respiratoria: 28,
        mucosas: "Normocoradas",
        diagnostico: "Gastrite aguda",
        prescricao: "Dieta leve e hidratação",
        vacina_aplicada: "V10 Polivalente",
        vacina_lote: "LT-2026-99",
        vacina_proxima_dose: "2027-11-10",
      }),
    );

    // Campos enriquecidos localmente preservados após sincronização
    expect(app.prescricao_itens).toHaveLength(1);
    expect(app.prescricao_itens[0].nome).toBe("Amoxicilina");
    expect(app.exames_complementares).toHaveLength(1);
    expect(app.exames_complementares[0].resultado).toBe("Leucocitose discreta");
    expect(app.valor_servico).toBe(180);
    expect(app.itens_adicionais).toEqual([{ id: "it-1", descricao: "Fluidoterapia", valor: 90 }]);
    expect(app.desconto).toBe(20);
    expect(app.valor_total).toBe(250);
    expect(app.status_pagamento).toBe("Pago");
    expect(app.forma_pagamento).toBe("PIX");
    expect(app.isReturn).toBe(true);
  });

  it("preserva e mescla dados clínicos locais dos pacientes (ecc, vacinas pregressas, alertas e histórico de alta) em loadClinicData (#213)", async () => {
    localStorage.setItem(
      "livepet_clinic_data_7",
      JSON.stringify({
        version: 1,
        profile: {},
        appointments: [],
        patients: [
          {
            id: "12",
            name: "Thor",
            species: "Cão",
            breed: "Labrador",
            age: "4 anos",
            weight: "29.4 kg",
            tutor: "Ana",
            phone: "(11) 99999-0000",
            ecc: 5,
            alerts: ["Alérgico a dipirona", "Cardiopata"],
            vaccinesUpToDate: true,
            vaccines: [
              {
                id: "vac-pre-1",
                nome: "Antirrábica",
                lote: "RB-881",
                data_aplicacao: "2026-05-10",
                proxima_dose: "2027-05-10",
                veterinario: "Histórico Pregresso",
                tipo: "pregressa",
              },
            ],
            history: [
              {
                date: "2026-11-08",
                type: "Alta Hospitalar (Canil 01)",
                vet: "Dra. Marina",
                summary: "Motivo: Gastroenterite · 2 dose(s) administrada(s)",
              },
            ],
          },
        ],
      }),
    );

    clinicService.listPatients.mockResolvedValue([
      {
        id: "12",
        name: "Thor",
        species: "Cão",
        breed: "Labrador",
        age: "—",
        weight: "—",
        tutor: "Ana",
        phone: "(11) 99999-0000",
        alerts: [],
        vaccinesUpToDate: null,
        lastVisit: "2026-11-10 · 09:00",
        history: [
          {
            date: "2026-11-10",
            type: "Consulta Clínica",
            vet: "Dra. Marina",
            summary: "Atendimento concluído",
          },
        ],
      },
    ]);

    const { result } = await montar();
    expect(result.current.patients).toHaveLength(1);
    const p = result.current.patients[0];

    expect(p.ecc).toBe(5);
    expect(p.age).toBe("4 anos");
    expect(p.weight).toBe("29.4 kg");
    expect(p.alerts).toEqual(["Alérgico a dipirona", "Cardiopata"]);
    expect(p.vaccinesUpToDate).toBe(true);
    expect(p.vaccines).toEqual([
      expect.objectContaining({
        nome: "Antirrábica",
        lote: "RB-881",
        tipo: "pregressa",
      }),
    ]);
    expect(p.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "Alta Hospitalar (Canil 01)" }),
        expect.objectContaining({ type: "Consulta Clínica" }),
      ]),
    );
  });

  it("se a API recusar o agendamento, a clínica é avisada", async () => {
    clinicService.createAppointment.mockRejectedValue(new Error("Horário já ocupado"));
    const { result } = await montar();

    act(() => {
      result.current.addAppointment({ ...thor, date: "2026-11-10" });
    });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/não foi salvo no servidor/),
        expect.objectContaining({ description: "Horário já ocupado" }),
      ),
    );
  });

  it("editar atendimento atualiza a tela e chama o PUT com os campos da API", async () => {
    clinicService.listAppointments.mockResolvedValue([
      { id: 31, pet_name: "Mel", species: "Gato", breed: "SRD", tutor: "Beto", phone: "(11) 98888-0000", service: "Vacina", vet: "Dra. Marina", date: "2026-11-10", time: "10:00", status: "Confirmado" },
    ]);
    clinicService.updateAppointment.mockResolvedValue({});
    const { result } = await montar();

    await act(() => result.current.updateAppointment(31, { time: "14:30", service: "Consulta", tutor: "Beto Silva" }));

    expect(result.current.appointments[0]).toEqual(expect.objectContaining({ id: 31, time: "14:30", service: "Consulta", tutor: "Beto Silva" }));
    expect(clinicService.updateAppointment).toHaveBeenCalledWith(31, { time: "14:30", service: "Consulta", tutor: "Beto Silva" });
  });

  it("excluir atendimento remove da tela e chama o DELETE", async () => {
    clinicService.listAppointments.mockResolvedValue([
      { id: 31, pet_name: "Mel", species: "Gato", tutor: "Beto", phone: "(11) 98888-0000", service: "Vacina", vet: "x", date: "2026-11-10", time: "10:00", status: "Confirmado" },
    ]);
    clinicService.deleteAppointment.mockResolvedValue(null);
    const { result } = await montar();

    await act(() => result.current.deleteAppointment(31));

    expect(result.current.appointments).toEqual([]);
    expect(clinicService.deleteAppointment).toHaveBeenCalledWith(31);
  });

  it("erro ao salvar perfil, status ou paciente vira aviso, não silêncio", async () => {
    clinicService.updateProfile.mockRejectedValue(new Error("500"));
    clinicService.updateAppointmentStatus.mockRejectedValue(new Error("404"));
    clinicService.updatePatient.mockRejectedValue(new Error("403"));
    clinicService.listPatients.mockResolvedValue([{ id: 5, name: "Mel", tutor: "Beto", history: [], alerts: [] }]);
    clinicService.listAppointments.mockResolvedValue([
      { id: 31, pet_name: "Mel", species: "Gato", tutor: "Beto", phone: "(11) 98888-0000", service: "Vacina", vet: "x", date: "2026-11-10", time: "10:00", status: "Confirmado" },
    ]);
    const { result } = await montar();

    act(() => {
      result.current.saveProfile({ name: "Nova Clínica" });
      result.current.updateAppointmentStatus(31, "Cancelado");
      result.current.updatePatient(5, { name: "Mel Linda" });
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(3));
    expect(toast.error).toHaveBeenCalledWith("Não foi possível salvar o perfil da clínica.", expect.anything());
    expect(toast.error).toHaveBeenCalledWith("Não foi possível atualizar o status do atendimento.", expect.anything());
    expect(toast.error).toHaveBeenCalledWith("Não foi possível salvar os dados do paciente.", expect.anything());
    // A tela continua otimista: a alteração aparece mesmo com o aviso
    expect(result.current.profile.name).toBe("Nova Clínica");
  });

  it("atendimento que nunca foi salvo no servidor (id local) avisa ao mudar status", async () => {
    localStorage.setItem(
      "livepet_clinic_data",
      JSON.stringify({ version: 1, profile: {}, appointments: [{ id: "local-1", ...thor, date: "2026-11-10", status: "Confirmado" }], patients: [] }),
    );
    const { result } = await montar();

    act(() => result.current.updateAppointmentStatus("local-1", "Cancelado"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Este registro ainda não está salvo no servidor."));
    expect(clinicService.updateAppointmentStatus).not.toHaveBeenCalled();
  });
});

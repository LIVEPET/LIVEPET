import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicProvider, STORAGE_KEY } from "@/contexts/ClinicContext";
import { stubRadixForJsdom } from "@/test/clinicTestUtils";
import ClinicSchedule from "./ClinicSchedule";
import { groupPrescriptionByRoute, hasPrescription } from "./ClinicPrescription";

const savePdfMock = vi.fn();

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(function () {
      return {
        setFillColor: vi.fn(),
        rect: vi.fn(),
        roundedRect: vi.fn(),
        setFont: vi.fn(),
        setFontSize: vi.fn(),
        setTextColor: vi.fn(),
        text: vi.fn(),
        setDrawColor: vi.fn(),
        line: vi.fn(),
        splitTextToSize: vi.fn((text) => [String(text)]),
        addPage: vi.fn(),
        save: savePdfMock,
      };
    }),
  };
});

vi.mock("@/services/api", () => ({
  clinicService: {
    getCurrentClinic: () => null,
    isAuthenticated: () => false,
    getProfile: vi.fn().mockResolvedValue(null),
    listPatients: vi.fn().mockResolvedValue([]),
    listAppointments: vi.fn().mockResolvedValue([]),
    getSpecies: vi.fn().mockResolvedValue(["Cão", "Gato"]),
    createAppointment: vi.fn().mockResolvedValue({}),
    updateAppointmentStatus: vi.fn().mockResolvedValue({}),
    concludeAppointment: vi.fn().mockResolvedValue({}),
  },
}));

const today = new Date().toISOString().split("T")[0];

const seedClinic = (appointments = []) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profile: {
        name: "Clínica Vet Care",
        crmv: "CRMV-SP 45890",
        phone: "(11) 3344-5566",
        address: "Av. Paulista, 1000 - São Paulo/SP",
        services: ["Consulta clínica"],
        team: [{ name: "Dra. Helena Costa", role: "Clínica Geral", crmv: "CRMV-SP 99887" }],
        hours: [],
      },
      appointments,
      patients: [],
    }),
  );
};

const renderSchedule = () =>
  render(
    <MemoryRouter initialEntries={["/clinica/agenda"]}>
      <ClinicProvider>
        <ClinicSchedule />
      </ClinicProvider>
    </MemoryRouter>,
  );

describe("ClinicPrescription — Construtor de Prescrição & Receituário Timbrado (Issue #85)", () => {
  beforeEach(() => {
    stubRadixForJsdom();
    window.localStorage.clear();
    savePdfMock.mockClear();
  });

  it("agrupa e numera medicamentos estruturados por via de administração", () => {
    const items = [
      {
        id: "1",
        nome: "Amoxicilina + Clavulanato",
        concentracao: "250 mg",
        via: "Uso Oral",
        posologia: "1 comprimido a cada 12h",
        duracao: "7 dias",
      },
      {
        id: "2",
        nome: "Otomax Gotas",
        concentracao: "15 ml",
        via: "Uso Otológico",
        posologia: "4 gotas em cada orelha a cada 12h",
        duracao: "10 dias",
      },
      {
        id: "3",
        nome: "Dipirona Gotas",
        concentracao: "500 mg/ml",
        via: "Uso Oral",
        posologia: "1 gota por kg a cada 8h",
        duracao: "3 dias",
      },
    ];

    const groups = groupPrescriptionByRoute(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].route).toBe("Uso Oral");
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].items[0].number).toBe(1);
    expect(groups[0].items[1].number).toBe(2);
    expect(groups[1].route).toBe("Uso Otológico");
    expect(groups[1].items[0].number).toBe(3);

    expect(hasPrescription({ prescricao_itens: items })).toBe(true);
    expect(hasPrescription({ prescricao_itens: [], prescricao: "" })).toBe(false);
  });

  it("permite adicionar medicamentos estruturados no modal de exame clínico e salva a prescrição", () => {
    seedClinic([
      {
        id: "app-rx-1",
        date: today,
        time: "10:00",
        petName: "Apollo",
        species: "Cão",
        breed: "Beagle",
        tutor: "Marcos Paulo",
        phone: "(11) 98888-7777",
        service: "Consulta clínica",
        vet: "Dra. Helena Costa",
        status: "Em atendimento",
        priority: "Rotina",
      },
    ]);

    renderSchedule();

    // Antes de ter prescrição, o botão "Visualizar Receituário" não deve aparecer no card
    const cardBefore = screen.getByTestId("appointment-card-app-rx-1");
    expect(within(cardBefore).queryByRole("button", { name: /visualizar receituário/i })).toBeNull();

    // Abre o modal de exame clínico
    fireEvent.click(within(cardBefore).getByRole("button", { name: /atender \/ concluir/i }));

    // Preenche um medicamento estruturado
    fireEvent.change(screen.getByLabelText(/nome do medicamento/i), {
      target: { value: "Cefalexina" },
    });
    fireEvent.change(screen.getByLabelText(/concentração/i), {
      target: { value: "500 mg" },
    });
    fireEvent.change(screen.getByLabelText(/posologia/i), {
      target: { value: "1 comprimido a cada 12h" },
    });
    fireEvent.change(screen.getByLabelText(/duração/i), {
      target: { value: "10 dias" },
    });

    fireEvent.click(screen.getByRole("button", { name: /adicionar item/i }));

    // Verifica se o medicamento entrou na lista estruturada
    const itemsList = screen.getByTestId("prescription-items-list");
    expect(within(itemsList).getByText(/1\. Cefalexina/i)).toBeInTheDocument();
    expect(within(itemsList).getByText("500 mg")).toBeInTheDocument();
    expect(within(itemsList).getByText("Uso Oral")).toBeInTheDocument();
    expect(within(itemsList).getByText(/1 comprimido a cada 12h/i)).toBeInTheDocument();
    expect(within(itemsList).getByText(/10 dias/i)).toBeInTheDocument();

    // Conclui o atendimento
    fireEvent.click(screen.getByRole("button", { name: /concluir e registrar no prontuário/i }));

    // Agora o card do atendimento deve exibir o botão "Visualizar Receituário"
    const cardAfter = screen.getByTestId("appointment-card-app-rx-1");
    expect(
      within(cardAfter).getByRole("button", { name: /visualizar receituário/i }),
    ).toBeInTheDocument();
  });

  it("exibe o preview do Receituário Veterinário Timbrado com cabeçalho, paciente, itens e assinatura, permitindo baixar PDF e imprimir", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    seedClinic([
      {
        id: "app-rx-2",
        date: today,
        time: "14:30",
        petName: "Kiara",
        species: "Gato",
        breed: "Persa",
        peso: 4.2,
        tutor: "Fernanda Lima",
        phone: "(11) 97777-6666",
        service: "Consulta clínica",
        vet: "Dra. Helena Costa",
        status: "Concluído",
        priority: "Rotina",
        prescricao: "Manter colar elizabetano e oferecer água fresca à vontade.",
        prescricao_itens: [
          {
            id: "med-1",
            nome: "Prednisolona",
            concentracao: "5 mg",
            via: "Uso Oral",
            posologia: "1/2 comprimido a cada 24h",
            duracao: "5 dias",
          },
          {
            id: "med-2",
            nome: "Pomada Cicatrizante Vet",
            concentracao: "30 g",
            via: "Uso Tópico",
            posologia: "Aplicar fina camada no local a cada 12h",
            duracao: "7 dias",
          },
        ],
      },
    ]);

    renderSchedule();

    const card = screen.getByTestId("appointment-card-app-rx-2");
    fireEvent.click(within(card).getByRole("button", { name: /visualizar receituário/i }));

    const sheet = screen.getByTestId("prescription-sheet-preview");

    // Cabeçalho da clínica (Nome, CRMV, Endereço, Telefone)
    expect(within(sheet).getByText("Clínica Vet Care")).toBeInTheDocument();
    expect(within(sheet).getByText(/CRMV-SP 45890/i)).toBeInTheDocument();
    expect(within(sheet).getByText(/Av\. Paulista, 1000/i)).toBeInTheDocument();
    expect(within(sheet).getByText(/\(11\) 3344-5566/i)).toBeInTheDocument();

    // Dados do paciente e tutor
    expect(within(sheet).getByText("Kiara")).toBeInTheDocument();
    expect(within(sheet).getByText(/Gato · Persa/i)).toBeInTheDocument();
    expect(within(sheet).getByText(/4.2 kg/i)).toBeInTheDocument();
    expect(within(sheet).getByText("Fernanda Lima")).toBeInTheDocument();

    // Lista numerada agrupada por via de uso
    expect(within(sheet).getByText("Uso Oral")).toBeInTheDocument();
    expect(within(sheet).getByText("Uso Tópico")).toBeInTheDocument();
    expect(within(sheet).getByText(/1\. Prednisolona/i)).toBeInTheDocument();
    expect(within(sheet).getByText(/2\. Pomada Cicatrizante Vet/i)).toBeInTheDocument();
    expect(
      within(sheet).getByText(/Manter colar elizabetano e oferecer água fresca/i),
    ).toBeInTheDocument();

    // Assinatura do veterinário responsável com CRMV
    const sigBlock = screen.getByTestId("prescription-signature-block");
    expect(within(sigBlock).getByText("Dra. Helena Costa")).toBeInTheDocument();
    expect(within(sigBlock).getByText(/CRMV-SP 99887/i)).toBeInTheDocument();

    // Botão Imprimir Receituário
    fireEvent.click(screen.getByRole("button", { name: /imprimir receituário/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    // Botão Baixar PDF (jspdf)
    fireEvent.click(screen.getByRole("button", { name: /baixar pdf/i }));
    expect(savePdfMock).toHaveBeenCalledWith("receituario-kiara.pdf");

    printSpy.mockRestore();
  });
});


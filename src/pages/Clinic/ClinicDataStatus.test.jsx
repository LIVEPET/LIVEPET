import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ClinicDataStatus from "./ClinicDataStatus";

// Estados de carregamento e erro das telas da clínica (#62).

const estado = { loading: false, error: null, refreshData: vi.fn() };
vi.mock("@/contexts/ClinicContext", () => ({ useClinic: () => estado }));

describe("ClinicDataStatus", () => {
  it("mostra o esqueleto enquanto carrega sem dados na tela", () => {
    Object.assign(estado, { loading: true, error: null });
    render(<ClinicDataStatus hasData={false} rows={2} />);
    expect(screen.getByRole("status", { name: "Carregando dados da clínica" })).toBeInTheDocument();
  });

  it("não mostra nada quando já há dados, mesmo recarregando", () => {
    Object.assign(estado, { loading: true, error: null });
    const { container } = render(<ClinicDataStatus hasData />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o erro com botão para tentar de novo", () => {
    Object.assign(estado, { loading: false, error: "Não foi possível carregar os dados da clínica. Sem rede" });
    render(<ClinicDataStatus hasData={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sem rede");
    fireEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
    expect(estado.refreshData).toHaveBeenCalledTimes(1);
  });
});

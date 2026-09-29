import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renderiza titulo e descricao", () => {
    render(<EmptyState title="Nenhum pet" description="Cadastre o primeiro." />);
    expect(screen.getByText("Nenhum pet")).toBeTruthy();
    expect(screen.getByText("Cadastre o primeiro.")).toBeTruthy();
  });

  it("chama onAction ao clicar no botao", async () => {
    const onAction = vi.fn();
    render(
      <EmptyState title="Vazio" actionLabel="Adicionar" onAction={onAction} />
    );
    await userEvent.click(screen.getByText("Adicionar"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("nao renderiza botao sem actionLabel", () => {
    render(<EmptyState title="Vazio" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

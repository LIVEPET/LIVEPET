import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Footer from "./Footer";

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe("Footer", () => {
  it("renderiza as colunas de links", () => {
    renderFooter();
    expect(screen.getByText("Produto")).toBeTruthy();
    expect(screen.getByText("Comunidade")).toBeTruthy();
    expect(screen.getByText("Suporte")).toBeTruthy();
  });

  it("aponta os links internos para as rotas corretas", () => {
    renderFooter();
    expect(screen.getByText("Meus Pets").getAttribute("href")).toBe("/pets");
    expect(screen.getByText("Pedigree").getAttribute("href")).toBe("/pedigree");
  });

  it("usa mailto no link de contato", () => {
    renderFooter();
    expect(screen.getByText("Contato").getAttribute("href")).toBe(
      "mailto:contato@livepet.app"
    );
  });
});

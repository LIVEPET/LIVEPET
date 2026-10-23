import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Logo from "./Logo";

const renderizar = (rotaInicial) =>
  render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <Logo />
      <Routes>
        <Route path="/" element={<p>Tela inicial</p>} />
        <Route path="/pets" element={<p>Meus pets</p>} />
      </Routes>
    </MemoryRouter>,
  );

const linkDaLogo = () => screen.getByRole("link", { name: /página inicial/i });

afterEach(() => vi.restoreAllMocks());

describe("<Logo />", () => {
  it("é um link para a tela inicial", () => {
    renderizar("/pets");
    expect(linkDaLogo().getAttribute("href")).toBe("/");
  });

  it("volta para a tela inicial ao clicar em outra página", async () => {
    renderizar("/pets");
    expect(screen.getByText("Meus pets")).toBeInTheDocument();

    await userEvent.click(linkDaLogo());

    expect(screen.getByText("Tela inicial")).toBeInTheDocument();
  });

  it("sobe para o topo quando já está na tela inicial", async () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderizar("/");

    await userEvent.click(linkDaLogo());

    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

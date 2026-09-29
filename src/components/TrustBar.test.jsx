import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TrustBar from "./TrustBar";

describe("TrustBar", () => {
  it("renderiza os quatro selos de confianca", () => {
    render(<TrustBar />);
    expect(screen.getByText("Seguro e confiável")).toBeTruthy();
    expect(screen.getByText("Seus dados protegidos")).toBeTruthy();
    expect(screen.getByText("Suporte especializado")).toBeTruthy();
    expect(screen.getByText("Disponível 24h")).toBeTruthy();
  });
});


import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { statsService } from "@/services/api";
import Index from "./Index";

vi.mock("@/services/api", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    statsService: {
      get: vi.fn(),
    },
  };
});

// Isola os componentes que não fazem parte do escopo da Issue #200.
vi.mock("@/components/Features", () => ({ default: () => null }));
vi.mock("@/components/HowItWorks", () => ({ default: () => null }));
vi.mock("@/components/Testimonials", () => ({ default: () => null }));
vi.mock("@/components/FAQ", () => ({ default: () => null }));
vi.mock("@/components/CTABanner", () => ({ default: () => null }));

const dadosValidos = {
  tutores: 2,
  pets: 3,
  vacinas: 2,
  clinicas: 1,
};

const renderIndex = () =>
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();

  statsService.get.mockResolvedValue(dadosValidos);

  // Simula a entrada da seção de estatísticas na área visível.
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target) {
      this.callback([{ isIntersecting: true, target }]);
    }

    disconnect() {}
    unobserve() {}
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  // Conclui a animação de contagem imediatamente nos testes.
vi.stubGlobal("requestAnimationFrame", (callback) => {
  queueMicrotask(() => callback(performance.now() + 1400));
  return 1;
});

vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

describe("<Index /> - Issue #200", () => {
  it("faz apenas uma chamada ao serviço de estatísticas", async () => {
    renderIndex();

    await waitFor(() => {
      expect(statsService.get).toHaveBeenCalledTimes(1);
    });
  });

  it("exibe os valores recebidos do serviço", async () => {
    renderIndex();

    await waitFor(
      () => {
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getAllByText("2")).toHaveLength(2);
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("+2 tutores")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("exibe Skeleton enquanto aguarda a resposta", () => {
    statsService.get.mockReturnValue(new Promise(() => {}));

    renderIndex();

    expect(screen.getAllByRole("status")).toHaveLength(4);
  });

  it("exibe travessões quando o serviço falha", async () => {
    statsService.get.mockRejectedValue(new Error("Falha de conexão"));

    renderIndex();

    expect(await screen.findByText("— tutores")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("—")).toHaveLength(4);
    });
  });

  it("rejeita respostas com campos inválidos", async () => {
    statsService.get.mockResolvedValue({
      tutores: -1,
      pets: 3,
      vacinas: 2,
      clinicas: 1,
    });

    renderIndex();

    expect(await screen.findByText("— tutores")).toBeInTheDocument();

    expect(statsService.get).toHaveBeenCalledTimes(1);
  });

  it("rejeita respostas com campos ausentes", async () => {
    statsService.get.mockResolvedValue({
      tutores: 2,
      pets: 3,
      vacinas: 2,
    });

    renderIndex();

    expect(await screen.findByText("— tutores")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("—")).toHaveLength(4);
    });
  });
});

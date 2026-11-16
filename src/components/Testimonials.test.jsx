import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Testimonials from "./Testimonials";

const {
  listMock,
  emblaApiMock,
  emblaRefMock,
  getSlideCount,
  resetSlideCount,
} = vi.hoisted(() => {
  let slideCount = 0;

  const api = {
    reInit: vi.fn(),
    scrollSnapList: vi.fn(() =>
      Array.from({ length: slideCount }, (_, index) => index),
    ),
    selectedScrollSnap: vi.fn(() => 0),
    on: vi.fn(),
    off: vi.fn(),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    scrollTo: vi.fn(),
  };

  return {
    listMock: vi.fn(),
    emblaApiMock: api,
    emblaRefMock: (node) => {
      if (node) {
        slideCount = node.firstElementChild?.children.length ?? 0;
      }
    },
    getSlideCount: () => slideCount,
    resetSlideCount: () => {
      slideCount = 0;
    },
  };
});

vi.mock("@/services/api", () => ({
  testimonialsService: {
    list: listMock,
  },
}));

vi.mock("embla-carousel-react", () => ({
  default: () => [emblaRefMock, emblaApiMock],
}));

vi.mock("embla-carousel-autoplay", () => ({
  default: vi.fn(() => ({})),
}));

vi.mock("@/components/EmptyState", () => ({
  default: ({ title, description }) => (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

const makeTestimonials = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    nome_tutor: `Tutor ${index + 1}`,
    texto: `Depoimento real número ${index + 1}.`,
    criado_em: "2026-11-11T10:00:00",
  }));

describe("Testimonials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSlideCount();
  });

  it("mostra o estado de carregamento enquanto aguarda a API", () => {
    listMock.mockReturnValue(new Promise(() => {}));

    render(<Testimonials />);

    expect(screen.getByLabelText("Carregando depoimentos")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renderiza os depoimentos recebidos da API e as iniciais do tutor", async () => {
    listMock.mockResolvedValue([
      {
        id: 1,
        nome_tutor: "Maria Silva",
        texto: "Minha experiência com a LivePet foi excelente.",
      },
    ]);

    render(<Testimonials />);

    expect(
      await screen.findByText(/Minha experiência com a LivePet foi excelente\./),
    ).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("MS")).toBeInTheDocument();
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it("mostra a mensagem definida quando a API retorna uma lista vazia", async () => {
    listMock.mockResolvedValue([]);

    render(<Testimonials />);

    expect(
      await screen.findByText(
        "Ainda não temos depoimentos. Cadastre seu pet e conte como foi.",
      ),
    ).toBeInTheDocument();
  });

  it("mostra erro e permite tentar novamente", async () => {
    listMock
      .mockRejectedValueOnce(new Error("Falha de rede"))
      .mockResolvedValueOnce(makeTestimonials(1));

    render(<Testimonials />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os depoimentos. Tente novamente.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Tutor 1")).toBeInTheDocument();
    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it("trata uma resposta que não seja um array como erro", async () => {
    listMock.mockResolvedValue({ data: makeTestimonials(1) });

    render(<Testimonials />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os depoimentos. Tente novamente.",
    );
  });

  it("trata depoimentos com campos obrigatórios inválidos como erro", async () => {
    listMock.mockResolvedValue([
      {
        id: 1,
        nome_tutor: "   ",
        texto: "Texto sem nome válido.",
      },
    ]);

    render(<Testimonials />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os depoimentos. Tente novamente.",
    );
  });

  it.each([1, 2, 5])(
    "renderiza corretamente o carrossel com %i depoimento(s)",
    async (count) => {
      listMock.mockResolvedValue(makeTestimonials(count));

      const { container } = render(<Testimonials />);

      expect(
        await screen.findByText(new RegExp(`Depoimento real número ${count}\\.`)),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(container.querySelectorAll("article")).toHaveLength(count);
      });

      if (count === 1) {
        expect(
          screen.queryByRole("button", { name: "Próximo depoimento" }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "Depoimento anterior" }),
        ).not.toBeInTheDocument();
      } else {
        expect(
          screen.getByRole("button", { name: "Próximo depoimento" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Depoimento anterior" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Ir para depoimento 1" }),
        ).toBeInTheDocument();
      }
    },
  );

  it("aciona os controles de navegação do carrossel", async () => {
    listMock.mockResolvedValue(makeTestimonials(5));

    render(<Testimonials />);

    await screen.findByText(/Depoimento real número 5\./);

    fireEvent.click(screen.getByRole("button", { name: "Próximo depoimento" }));
    fireEvent.click(screen.getByRole("button", { name: "Depoimento anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Ir para depoimento 2" }));

    expect(emblaApiMock.scrollNext).toHaveBeenCalledTimes(1);
    expect(emblaApiMock.scrollPrev).toHaveBeenCalledTimes(1);
    expect(emblaApiMock.scrollTo).toHaveBeenCalledWith(1);
  });

  it("não exibe conteúdo de depoimento quando a API falha", async () => {
    listMock.mockRejectedValue(new Error("API indisponível"));

    render(<Testimonials />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Tutor 1")).not.toBeInTheDocument();
  });
});

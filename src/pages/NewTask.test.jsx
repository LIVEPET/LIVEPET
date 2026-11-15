import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import NewTask from "./NewTask";
import Tasks from "./Tasks";
import { petsService } from "@/services/api";
import { readUserJSON, writeUserJSON } from "@/lib/userStorage";

vi.mock("@/services/api", () => ({
  petsService: {
    list: vi.fn(),
  },
}));

vi.mock("@/lib/userStorage", () => ({
  readUserJSON: vi.fn(),
  writeUserJSON: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

const PETS = [
  { id: 1, nome: "Thor", especie: "Cachorro", raca: "Golden Retriever" },
  { id: 2, nome: "Mia", especie: "Gato", raca: "SRD" },
];

const renderPage = (initialEntry = "/tasks/nova") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/nova" element={<NewTask />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  petsService.list.mockResolvedValue(PETS);
  readUserJSON.mockReturnValue([]);
});

describe("<NewTask /> — Página dedicada sem modais (/tasks/nova)", () => {
  it("renderiza a página com título, campos do formulário e link de voltar", async () => {
    renderPage("/tasks/nova");

    expect(await screen.findByText("Nova Tarefa de Rotina")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Voltar para tarefas/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/O que precisa ser feito\? \*/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Horário Previsto/i)).toHaveValue("08:00");
    expect(screen.getByRole("button", { name: /Salvar Tarefa/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preenche os campos a partir de parâmetros de consulta (atalhos rápidos)", async () => {
    renderPage("/tasks/nova?title=Passeio%20matinal&category=passeio&time=08:30");

    expect(await screen.findByDisplayValue("Passeio matinal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("08:30")).toBeInTheDocument();
  });

  it("salva a tarefa no storage e navega de volta para /tasks", async () => {
    const user = userEvent.setup();
    renderPage("/tasks/nova");

    const inputTitulo = await screen.findByLabelText(/O que precisa ser feito\? \*/i);
    await user.type(inputTitulo, "Dar vacina anual");

    const botaoSalvar = screen.getByRole("button", { name: /Salvar Tarefa/i });
    await user.click(botaoSalvar);

    await waitFor(() => {
      expect(writeUserJSON).toHaveBeenCalledWith(
        "livepet_routine_tasks_v2",
        expect.arrayContaining([
          expect.objectContaining({
            label: "Dar vacina anual",
            done: false,
          }),
        ]),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Nova tarefa agendada!",
        expect.objectContaining({
          description: '"Dar vacina anual" foi adicionada à rotina.',
        }),
      );
    });
  });

  it("exibe erro se tentar salvar sem título", async () => {
    const user = userEvent.setup();
    renderPage("/tasks/nova");

    const botaoSalvar = await screen.findByRole("button", { name: /Salvar Tarefa/i });
    await user.click(botaoSalvar);

    expect(toast.error).toHaveBeenCalledWith("Informe o título da tarefa");
  });
});

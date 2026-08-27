import { useMemo, useState } from "react";
import { Plus, Calendar, ListChecks, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

type Task = { id: string; label: string; done: boolean };

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", label: "Criar cards com logotipos de parceiros (ex: Petshops, Clínicas).", done: false },
    { id: "2", label: "Adicionar campo 'Número do Contrato' na grid.", done: false },
    { id: "3", label: "Botão 'Solicitar Cupom'.", done: false },
  ]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
  }, [tasks]);

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <main className="min-h-screen bg-muted/30 p-6 flex justify-center">
      <article className="w-full max-w-2xl rounded-xl border border-border bg-card text-card-foreground shadow-lg p-6 space-y-5">
        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Parcerias com Petshops e Clínicas
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5">
                <Calendar className="h-4 w-4" /> Datas
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5">
                <ListChecks className="h-4 w-4" /> Checklist
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5">
                <Paperclip className="h-4 w-4" /> Anexo
              </Button>
            </div>
          </div>

          <div
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shadow-sm"
            aria-label="Membro J"
          >
            J
          </div>
        </header>

        {/* Labels */}
        <section className="flex flex-wrap gap-2" aria-label="Etiquetas">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400">
            #Parcerias
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400">
            #Design
          </span>
        </section>

        {/* Description */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-1">Descrição</h2>
          <p className="text-sm leading-relaxed">
            Listar parceiros com logotipos e cupons exclusivos.
          </p>
        </section>

        {/* Activities */}
        <section className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold lowercase tracking-wide text-muted-foreground">
              atividades
            </h2>
            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
          </div>

          <Progress value={progress} className="h-2" />

          <ul className="space-y-2 pt-1">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3">
                <Checkbox
                  id={`task-${t.id}`}
                  checked={t.done}
                  onCheckedChange={() => toggle(t.id)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`task-${t.id}`}
                  className={`text-sm cursor-pointer leading-snug ${
                    t.done ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {t.label}
                </label>
              </li>
            ))}
          </ul>

          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </div>
        </section>
      </article>
    </main>
  );
};

export default Tasks;

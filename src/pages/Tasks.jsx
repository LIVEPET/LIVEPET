import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Calendar,
  ListChecks,
  Trash2,
  CheckCircle2,
  Clock,
  Utensils,
  Footprints,
  Pill,
  Sparkles,
  HeartPulse,
  PawPrint,
  Filter,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { petsService } from "@/services/api";
import petDefaultDog from "@/assets/pet-thor.jpg";
import petDefaultCat from "@/assets/pet-mia.jpg";

const CATEGORIES = {
  alimentacao: {
    label: "Alimentação",
    icon: Utensils,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
    tagBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  passeio: {
    label: "Passeio & Exercício",
    icon: Footprints,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50",
    tagBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  saude: {
    label: "Saúde & Medicamento",
    icon: Pill,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50",
    tagBg: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  higiene: {
    label: "Higiene & Bem-estar",
    icon: Sparkles,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/50",
    tagBg: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  outro: {
    label: "Geral",
    icon: ListChecks,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50",
    tagBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
};

const DEFAULT_TASKS = [
  {
    id: "def-1",
    label: "Ração matinal e reposição de água fresca",
    petName: "Todos os Pets",
    category: "alimentacao",
    time: "07:30",
    done: true,
    notes: "Higienizar os bebedouros antes de colocar água fresca.",
  },
  {
    id: "def-2",
    label: "Passeio matinal no parque (30 min)",
    petName: "Thor",
    category: "passeio",
    time: "08:15",
    done: true,
    notes: "Levar saquinhos higiênicos e garrafinha de água.",
  },
  {
    id: "def-3",
    label: "Administrar suplemento vitamínico",
    petName: "Mia",
    category: "saude",
    time: "12:00",
    done: false,
    notes: "Misturar 1 gota no sachê úmido.",
  },
  {
    id: "def-4",
    label: "Escovação da pelagem e checagem de ectoparasitas",
    petName: "Thor",
    category: "higiene",
    time: "17:30",
    done: false,
    notes: "Usar a rasqueadeira macia.",
  },
  {
    id: "def-5",
    label: "Ração do jantar e sachê",
    petName: "Todos os Pets",
    category: "alimentacao",
    time: "19:30",
    done: false,
    notes: "Porções pesadas conforme orientação do veterinário.",
  },
  {
    id: "def-6",
    label: "Passeio noturno higiênico",
    petName: "Thor",
    category: "passeio",
    time: "21:00",
    done: false,
    notes: "Volta curta pelo quarteirão para necessidades.",
  },
];

const STORAGE_KEY = "livepet_routine_tasks_v2";

const Tasks = () => {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TASKS;
  });

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  // Filters
  const [selectedPet, setSelectedPet] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'done'

  // Modal New Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPet, setNewTaskPet] = useState("Todos os Pets");
  const [newTaskCategory, setNewTaskCategory] = useState("alimentacao");
  const [newTaskTime, setNewTaskTime] = useState("08:00");
  const [newTaskNotes, setNewTaskNotes] = useState("");

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("Erro ao salvar tarefas:", e);
    }
  }, [tasks]);

  // Load pets from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPets(true);
        const data = await petsService.list();
        if (mounted && Array.isArray(data)) {
          setPets(data);
        }
      } catch (err) {
        console.warn("Não foi possível carregar pets da API:", err);
      } finally {
        if (mounted) setLoadingPets(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Stats
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const pendingCount = totalCount - doneCount;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedPet !== "all" && t.petName !== selectedPet) return false;
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (statusFilter === "pending" && t.done) return false;
      if (statusFilter === "done" && !t.done) return false;
      return true;
    });
  }, [tasks, selectedPet, selectedCategory, statusFilter]);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextDone = !t.done;
          if (nextDone) {
            toast.success("Tarefa concluída!", {
              description: `"${t.label}" foi marcada como feita.`,
            });
          }
          return { ...t, done: nextDone };
        }
        return t;
      })
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast("Tarefa removida", { description: "A tarefa foi excluída da lista." });
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      label: newTaskTitle.trim(),
      petName: newTaskPet,
      category: newTaskCategory,
      time: newTaskTime || "08:00",
      done: false,
      notes: newTaskNotes.trim(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setIsModalOpen(false);
    setNewTaskTitle("");
    setNewTaskNotes("");
    toast.success("Nova tarefa agendada!", {
      description: `"${newTask.label}" foi adicionada à rotina.`,
    });
  };

  const resetToDefault = () => {
    setTasks(DEFAULT_TASKS);
    toast.info("Rotina padrão restaurada!");
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.done));
    toast.info("Tarefas concluídas foram limpas.");
  };

  const quickTemplates = [
    { label: "+ Água fresca", category: "alimentacao", time: "08:00" },
    { label: "+ Passeio matinal", category: "passeio", time: "08:30" },
    { label: "+ Remédio / Vitamina", category: "saude", time: "12:00" },
    { label: "+ Ração da noite", category: "alimentacao", time: "19:00" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <header className="rounded-2xl border border-border bg-card/80 backdrop-blur shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <ListChecks className="h-6 w-6" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Rotina Diária & Tarefas
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Acompanhe e organize a rotina de alimentação, passeios, saúde e bem-estar dos seus pets.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm font-semibold">
                <Plus className="h-4 w-4" /> Nova Tarefa
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
            <div className="p-3.5 rounded-xl bg-background/60 border border-border/70">
              <p className="text-xs font-medium text-muted-foreground">Total do Dia</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{totalCount}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Concluídas</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{doneCount}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Pendentes</p>
              <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{pendingCount}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-primary">Progresso</p>
                <span className="text-xs font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 mt-3" />
            </div>
          </div>

          {/* Quick Template Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground mr-1">Atalhos rápidos:</span>
            {quickTemplates.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNewTaskTitle(item.label.replace("+ ", ""));
                  setNewTaskCategory(item.category);
                  setNewTaskTime(item.time);
                  setIsModalOpen(true);
                }}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted text-foreground/80 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {/* Filter Controls Card */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mr-1">
              <Filter className="h-3.5 w-3.5" /> Filtrar:
            </div>

            {/* Pet selector */}
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Todos os Pets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Pets</SelectItem>
                <SelectItem value="Todos os Pets">Geral (Todos)</SelectItem>
                {pets.map((p) => (
                  <SelectItem key={p.id} value={p.nome}>
                    {p.nome}
                  </SelectItem>
                ))}
                {/* Fallback names if pets list is loading/empty */}
                {pets.length === 0 && (
                  <>
                    <SelectItem value="Thor">Thor</SelectItem>
                    <SelectItem value="Mia">Mia</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Category selector */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="alimentacao">Alimentação</SelectItem>
                <SelectItem value="passeio">Passeio</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
                <SelectItem value="higiene">Higiene</SelectItem>
                <SelectItem value="outro">Geral</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Tabs */}
            <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "all"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "pending"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pendentes
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("done")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "done"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Concluídas
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {doneCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Limpar Concluídas
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              title="Restaurar lista padrão"
              className="text-xs h-8 gap-1.5"
            >
              <RotateCcw className="h-3 w-3" /> Padrão
            </Button>
          </div>
        </section>

        {/* Task List */}
        <section className="space-y-3" aria-label="Lista de Tarefas">
          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma tarefa encontrada</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Tudo limpo para este filtro ou todas as tarefas foram concluídas! Clique em "Nova Tarefa" para adicionar uma nova rotina.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPet("all");
                  setSelectedCategory("all");
                  setStatusFilter("all");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const meta = CATEGORIES[t.category] || CATEGORIES.outro;
              const IconComp = meta.icon;

              return (
                <div
                  key={t.id}
                  className={`group relative rounded-xl border transition-all duration-200 bg-card p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 shadow-sm hover:shadow-md ${
                    t.done
                      ? "opacity-60 bg-muted/20 border-border/60"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {/* Category icon avatar */}
                  <div
                    className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center ${meta.bg} ${meta.color}`}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>

                  {/* Task details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.tagBg}`}>
                        {meta.label}
                      </span>

                      {t.petName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                          <PawPrint className="h-3 w-3" />
                          {t.petName}
                        </span>
                      )}

                      {t.time && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground ml-auto">
                          <Clock className="h-3 w-3" />
                          {t.time}
                        </span>
                      )}
                    </div>

                    <label
                      htmlFor={`task-${t.id}`}
                      className={`block font-medium text-sm sm:text-base leading-snug cursor-pointer transition-colors ${
                        t.done
                          ? "line-through text-muted-foreground"
                          : "text-foreground group-hover:text-primary"
                      }`}
                    >
                      {t.label}
                    </label>

                    {t.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                        {t.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions: Checkbox & Delete */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <Checkbox
                      id={`task-${t.id}`}
                      checked={t.done}
                      onCheckedChange={() => toggleTask(t.id)}
                      className="h-5 w-5 rounded-md"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(t.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Helpful Care Tips Box */}
        <section className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 shrink-0">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm">
            <h3 className="font-semibold text-foreground">Dica LivePet para uma rotina saudável</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manter horários previsíveis de passeio e refeição reduz a ansiedade e melhora a digestão dos pets. Em dias quentes, prefira passeios antes das 09h ou após as 18h para proteger as patinhas do asfalto quente.
            </p>
          </div>
        </section>
      </div>

      {/* Modal Nova Tarefa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Tarefa de Rotina</DialogTitle>
            <DialogDescription>
              Adicione uma atividade ou cuidado diário para a rotina do seu pet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="taskTitle">O que precisa ser feito? *</Label>
              <Input
                id="taskTitle"
                placeholder="Ex: Ração da tarde, Dar colírio, Passeio no parque..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Pet</Label>
                <Select value={newTaskPet} onValueChange={setNewTaskPet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o pet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos os Pets">Todos os Pets (Geral)</SelectItem>
                    {pets.map((p) => (
                      <SelectItem key={p.id} value={p.nome}>
                        {p.nome}
                      </SelectItem>
                    ))}
                    {pets.length === 0 && (
                      <>
                        <SelectItem value="Thor">Thor</SelectItem>
                        <SelectItem value="Mia">Mia</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                    <SelectItem value="passeio">Passeio</SelectItem>
                    <SelectItem value="saude">Saúde & Remédio</SelectItem>
                    <SelectItem value="higiene">Higiene</SelectItem>
                    <SelectItem value="outro">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taskTime">Horário Previsto</Label>
              <Input
                id="taskTime"
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taskNotes">Observações adicionais (opcional)</Label>
              <Textarea
                id="taskNotes"
                placeholder="Ex: Dosagem correta, marca do petisco, rota do passeio..."
                rows={2}
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Tarefa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Tasks;

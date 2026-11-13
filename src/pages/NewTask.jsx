import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";

import PetsCategoryHub from "@/components/PetsCategoryHub";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { petsService } from "@/services/api";
import { readUserJSON, writeUserJSON } from "@/lib/userStorage";

const STORAGE_KEY = "livepet_routine_tasks_v2";

/**
 * Página dedicada para criação de nova tarefa de rotina (/tasks/nova).
 * Substitui o antigo modal Dialog por uma tela focada e responsiva.
 */
const NewTask = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const initialTitle = searchParams.get("title") || "";
  const initialCategory = searchParams.get("category") || "alimentacao";
  const initialTime = searchParams.get("time") || "08:00";
  const initialPet = searchParams.get("pet") || "Todos os Pets";

  const [title, setTitle] = useState(initialTitle);
  const [petName, setPetName] = useState(initialPet);
  const [category, setCategory] = useState(initialCategory);
  const [time, setTime] = useState(initialTime);
  const [notes, setNotes] = useState("");

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      label: title.trim(),
      petName: petName || "Todos os Pets",
      category: category || "alimentacao",
      time: time || "08:00",
      done: false,
      notes: notes.trim(),
    };

    const currentTasks = readUserJSON(STORAGE_KEY, []);
    const updated = [newTask, ...(Array.isArray(currentTasks) ? currentTasks : [])];
    writeUserJSON(STORAGE_KEY, updated);

    toast.success("Nova tarefa agendada!", {
      description: `"${newTask.label}" foi adicionada à rotina.`,
    });

    navigate("/tasks");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <PetsCategoryHub className="!mb-0" />

        <div className="flex items-center justify-between">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para tarefas
          </Link>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <ListChecks className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight">
                  Nova Tarefa de Rotina
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Adicione uma atividade ou cuidado diário para a rotina do seu pet.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="taskTitle">O que precisa ser feito? *</Label>
                <Input
                  id="taskTitle"
                  placeholder="Ex: Ração da tarde, Dar colírio, Passeio no parque..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taskPet">Pet</Label>
                  <Select value={petName} onValueChange={setPetName}>
                    <SelectTrigger id="taskPet">
                      <SelectValue placeholder="Selecione o pet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos os Pets">Todos os Pets (Geral)</SelectItem>
                      {pets.map((p) => (
                        <SelectItem key={p.id} value={p.nome}>
                          {p.nome}
                        </SelectItem>
                      ))}
                      {pets.length === 0 && !loadingPets && (
                        <>
                          <SelectItem value="Thor">Thor</SelectItem>
                          <SelectItem value="Mia">Mia</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="taskCategory">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="taskCategory">
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
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taskNotes">Observações adicionais (opcional)</Label>
                <Textarea
                  id="taskNotes"
                  placeholder="Ex: Dosagem correta, marca do petisco, rota do passeio..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tasks")}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Salvar Tarefa
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default NewTask;

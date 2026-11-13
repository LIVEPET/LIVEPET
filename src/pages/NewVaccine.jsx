import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Syringe } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { petsService } from "@/services/api";
import { formatarData } from "@/lib/vacinas";

/**
 * Página dedicada para registro de nova vacina (/saude/vacinas/nova).
 * Substitui o antigo modal de vacina por uma página focada.
 */
const NewVaccine = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPetId = searchParams.get("petId") || searchParams.get("id");

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState(urlPetId || "");

  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  const [form, setForm] = useState({
    nome: "",
    data_aplicacao: today.toISOString().slice(0, 10),
    proxima_dose: nextYear.toISOString().slice(0, 10),
    lote: "",
    veterinario: "Clínica Veterinária",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPets(true);
        const data = await petsService.list();
        if (mounted && Array.isArray(data)) {
          setPets(data);
          if (!selectedPetId && data.length > 0) {
            setSelectedPetId(String(data[0].id));
          }
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

  const selectedPet = pets.find((p) => String(p.id) === String(selectedPetId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome da vacina.");
      return;
    }
    if (!selectedPetId) {
      toast.error("Selecione um pet para registrar a vacina.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nome: form.nome.trim(),
        data_aplicacao: form.data_aplicacao,
        proxima_dose: form.proxima_dose || null,
        lote: form.lote.trim() || null,
        veterinario: form.veterinario.trim() || null,
      };

      await petsService.addVaccine(Number(selectedPetId), payload);

      toast.success(`Vacina ${payload.nome} registrada com sucesso!`, {
        description: payload.proxima_dose
          ? `Reforço previsto para ${formatarData(payload.proxima_dose)}.`
          : undefined,
      });

      navigate(`/saude?petId=${selectedPetId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar vacina";
      toast.error("Erro ao registrar vacina", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to={selectedPetId ? `/saude?petId=${selectedPetId}` : "/saude"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para saúde do pet
          </Link>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Syringe className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight">
                  Registrar Vacina {selectedPet ? `para ${selectedPet.nome}` : ""}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                A vacina será registrada na carteira de saúde do pet e aparecerá no cartão digital e no QR Code de emergência.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="vax-pet">Pet *</Label>
                <Select
                  value={selectedPetId}
                  onValueChange={setSelectedPetId}
                  disabled={loadingPets}
                >
                  <SelectTrigger id="vax-pet">
                    <SelectValue placeholder="Selecione o pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome} {p.raca ? `(${p.raca})` : ""}
                      </SelectItem>
                    ))}
                    {pets.length === 0 && !loadingPets && (
                      <SelectItem value="1">Pet Exemplo</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vax-nome">Nome da Vacina *</Label>
                <Input
                  id="vax-nome"
                  placeholder="Ex.: V10, Antirrábica, Gripe Canina"
                  value={form.nome}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vax-aplicacao">Data de Aplicação *</Label>
                  <Input
                    id="vax-aplicacao"
                    type="date"
                    value={form.data_aplicacao}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        data_aplicacao: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vax-reforco">Próximo Reforço</Label>
                  <Input
                    id="vax-reforco"
                    type="date"
                    value={form.proxima_dose}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        proxima_dose: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vax-lote">Número do Lote</Label>
                  <Input
                    id="vax-lote"
                    placeholder="Ex.: LT-2026-A"
                    value={form.lote}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lote: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vax-vet">Clínica / Veterinário</Label>
                  <Input
                    id="vax-vet"
                    placeholder="Ex.: Clínica Vale Verde"
                    value={form.veterinario}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        veterinario: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      selectedPetId ? `/saude?petId=${selectedPetId}` : "/saude"
                    )
                  }
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary text-primary-foreground gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Salvar Vacina
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default NewVaccine;

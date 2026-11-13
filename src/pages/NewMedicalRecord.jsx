import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

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

const RECORD_TYPES = [
  "Consulta de Rotina",
  "Exame de Sangue",
  "Medicação Prescrita",
  "Procedimento Cirúrgico",
  "Limpeza de Tártaro",
  "Alergia Identificada",
];

/**
 * Página dedicada para inclusão de atendimento no prontuário (/historico-medico/novo).
 * Substitui o antigo modal Dialog por uma página completa e responsiva.
 */
const NewMedicalRecord = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPetId = searchParams.get("petId") || searchParams.get("id");

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [targetPetId, setTargetPetId] = useState(urlPetId || "");

  const [recordType, setRecordType] = useState("Consulta de Rotina");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPets(true);
        const data = await petsService.list();
        if (mounted && Array.isArray(data)) {
          setPets(data);
          if (!targetPetId && data.length > 0) {
            setTargetPetId(String(data[0].id));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPetId) {
      toast.error("Selecione um pet.");
      return;
    }
    if (!description.trim()) {
      toast.error("Preencha a descrição do atendimento.");
      return;
    }

    try {
      setSaving(true);
      const petIdNum = Number(targetPetId);
      await petsService.addMedicalRecord(petIdNum, {
        tipo: recordType,
        descricao: description.trim(),
        peso_registrado: weight ? Number(weight.replace(",", ".")) : null,
      });

      toast.success("Registro clínico adicionado com sucesso!", {
        description: "Vinculado ao prontuário do pet.",
      });

      navigate(targetPetId ? `/historico-medico?petId=${targetPetId}` : "/historico-medico");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error("Erro ao registrar no prontuário", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const selectedPet = pets.find((p) => String(p.id) === String(targetPetId));

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to={targetPetId ? `/historico-medico?petId=${targetPetId}` : "/historico-medico"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para histórico médico
          </Link>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight">
                  Novo Registro no Prontuário {selectedPet ? `de ${selectedPet.nome}` : ""}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Adicione uma consulta, exame ou procedimento veterinário ao prontuário médico do animal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="rec-pet">Pet *</Label>
                <Select
                  value={targetPetId}
                  onValueChange={setTargetPetId}
                  disabled={loadingPets}
                >
                  <SelectTrigger id="rec-pet">
                    <SelectValue placeholder="Selecione o pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome} {p.especie ? `(${p.especie} · ${p.raca || "SRD"})` : ""}
                      </SelectItem>
                    ))}
                    {pets.length === 0 && !loadingPets && (
                      <SelectItem value="1">Pet Exemplo</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rec-tipo">Tipo de Atendimento *</Label>
                  <Select value={recordType} onValueChange={setRecordType}>
                    <SelectTrigger id="rec-tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECORD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rec-peso">Peso Aferido (kg)</Label>
                  <Input
                    id="rec-peso"
                    placeholder="Ex: 12.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rec-desc">Descrição / Laudo Clínico *</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {description.length}/1500
                  </span>
                </div>
                <Textarea
                  id="rec-desc"
                  rows={4}
                  placeholder="Detalhes da consulta, prescrições, cuidados ou orientações..."
                  value={description}
                  maxLength={1500}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1500))}
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      targetPetId
                        ? `/historico-medico?petId=${targetPetId}`
                        : "/historico-medico"
                    )
                  }
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary text-primary-foreground gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Salvar no Histórico
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

export default NewMedicalRecord;

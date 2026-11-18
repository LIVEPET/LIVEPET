import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BedDouble, CheckCircle2 } from "lucide-react";
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
import { useClinic } from "@/contexts/ClinicContext";

const DEFAULT_VET = "Equipe da clínica";

/**
 * Página dedicada para admissão de paciente em um leito (/clinica/internacao/admitir/:bedId).
 * Substitui o antigo modal Dialog por uma página completa, clara e sem janelas flutuantes.
 */
const ClinicInpatientAdmitPage = () => {
  const { bedId } = useParams();
  const navigate = useNavigate();
  const { beds = [], patients = [], profile, admitPatientToBed } = useClinic();

  // Localiza a baia ou leito selecionado
  const selectedBed = useMemo(() => {
    if (!bedId) return beds[0] || null;
    return beds.find((b) => String(b.id) === String(bedId)) || null;
  }, [beds, bedId]);

  // Lista de veterinários da clínica para o select
  const teamList = useMemo(() => {
    const list = profile?.team || [];
    return list.map((m) => (typeof m === "string" ? m : m?.name)).filter(Boolean);
  }, [profile]);

  // Estado do formulário de admissão
  const [form, setForm] = useState({
    patientId: "",
    petName: "",
    species: "Cão",
    breed: "",
    age: "",
    tutor: "",
    phone: "",
    vet: teamList[0] || DEFAULT_VET,
    reason: "",
    prescription: "",
    diet: "",
    nextMedicationTime: "14:00",
  });

  // Atualiza o veterinário padrão quando a equipe for carregada
  useEffect(() => {
    if (teamList.length > 0 && form.vet === DEFAULT_VET) {
      setForm((f) => ({ ...f, vet: teamList[0] }));
    }
  }, [teamList, form.vet]);

  // Preenche dados ao selecionar um paciente já cadastrado
  const handleSelectExistingPatient = (patientId) => {
    const found = patients.find((p) => String(p.id) === String(patientId));
    if (!found) return;

    setForm((prev) => ({
      ...prev,
      patientId: String(found.id),
      petName: found.name || "",
      species: found.species || "Cão",
      breed: found.breed && found.breed !== "—" ? found.breed : "",
      age: found.age && found.age !== "—" ? found.age : "",
      tutor: found.tutor || "",
      phone: found.phone && found.phone !== "—" ? found.phone : "",
    }));
  };

  // Envio do formulário de internação
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedBed) {
      toast.error("Nenhuma baia selecionada.");
      return;
    }

    if (!form.petName.trim()) {
      toast.error("Informe o nome do pet.");
      return;
    }

    if (!form.reason.trim()) {
      toast.error("Informe o motivo da internação.");
      return;
    }

    // Registra a admissão através do ClinicContext
    admitPatientToBed(selectedBed.id, {
      patientId: form.patientId || null,
      petName: form.petName.trim(),
      species: form.species || "Cão",
      breed: form.breed.trim() || "SRD",
      age: form.age.trim() || "Não informada",
      tutor: form.tutor.trim() || "Não informado",
      phone: form.phone.trim() || "Não informado",
      vet: form.vet.trim() || DEFAULT_VET,
      reason: form.reason.trim(),
      prescription: form.prescription.trim() || "Sem prescrições no momento",
      diet: form.diet.trim() || "Padrão da clínica",
      nextMedicationTime: form.nextMedicationTime || "14:00",
      admittedAt: new Date().toISOString(),
    });

    toast.success(
      `Paciente ${form.petName} internado com sucesso na baia ${selectedBed.name}!`,
    );

    // Retorna para o mapa de leitos
    navigate("/clinica/internacao");
  };

  if (!selectedBed) {
    return (
      <div className="container max-w-xl py-12 text-center">
        <p className="text-lg font-semibold">Leito não encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/clinica/internacao">Voltar para mapa de leitos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Link de retorno */}
      <div className="flex items-center justify-between">
        <Link
          to="/clinica/internacao"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para internação
        </Link>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          {/* Cabeçalho */}
          <div className="space-y-1 mb-6 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <BedDouble className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight font-display">
                Internar Paciente — {selectedBed.name} ({selectedBed.sector})
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Registre a admissão hospitalar, motivo clínico, prescrição inicial e horários de cuidados.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Seleção rápida de paciente existente */}
            {patients.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/60">
                <Label htmlFor="admit-patient-select">
                  Importar dados de paciente cadastrado (opcional)
                </Label>
                <Select
                  value={form.patientId}
                  onValueChange={handleSelectExistingPatient}
                >
                  <SelectTrigger id="admit-patient-select">
                    <SelectValue placeholder="Escolher paciente da lista da clínica..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} ({p.species} · Tutor: {p.tutor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dados do Animal */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Dados do Animal
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admit-petName">Nome do Pet *</Label>
                  <Input
                    id="admit-petName"
                    value={form.petName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, petName: e.target.value }))
                    }
                    placeholder="Ex.: Thor"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admit-species">Espécie *</Label>
                  <Select
                    value={form.species}
                    onValueChange={(val) =>
                      setForm((f) => ({ ...f, species: val }))
                    }
                  >
                    <SelectTrigger id="admit-species">
                      <SelectValue placeholder="Selecione a espécie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cão">Cão</SelectItem>
                      <SelectItem value="Gato">Gato</SelectItem>
                      <SelectItem value="Ave">Ave</SelectItem>
                      <SelectItem value="Silvestre">Silvestre</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admit-breed">Raça</Label>
                  <Input
                    id="admit-breed"
                    value={form.breed}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, breed: e.target.value }))
                    }
                    placeholder="Ex.: Labrador"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admit-age">Idade</Label>
                  <Input
                    id="admit-age"
                    value={form.age}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, age: e.target.value }))
                    }
                    placeholder="Ex.: 4 anos"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Tutor e Equipe */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tutor & Responsável Clínico
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admit-tutor">Tutor</Label>
                  <Input
                    id="admit-tutor"
                    value={form.tutor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tutor: e.target.value }))
                    }
                    placeholder="Ex.: Fernanda Lima"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admit-phone">Telefone de Contato</Label>
                  <Input
                    id="admit-phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="Ex.: (11) 98888-7777"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admit-vet">Veterinário Responsável *</Label>
                <Input
                  id="admit-vet"
                  value={form.vet}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vet: e.target.value }))
                  }
                  placeholder="Ex.: Dra. Helena Costa"
                  required
                />
              </div>
            </div>

            {/* Plano de Internação */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Plano Hospitalar
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="admit-reason">Motivo da Internação *</Label>
                <Input
                  id="admit-reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="Ex.: Gastroenterite aguda, pós-operatório ortopédico..."
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admit-diet">Dieta Hospitalar</Label>
                  <Input
                    id="admit-diet"
                    value={form.diet}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, diet: e.target.value }))
                    }
                    placeholder="Ex.: Dieta úmida gastrointestinal"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admit-nextMed">
                    Horário da Próxima Medicação
                  </Label>
                  <Input
                    id="admit-nextMed"
                    type="time"
                    value={form.nextMedicationTime}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        nextMedicationTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admit-prescription">
                  Orientações Clínicas e Prescrição Inicial
                </Label>
                <Textarea
                  id="admit-prescription"
                  rows={3}
                  value={form.prescription}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prescription: e.target.value }))
                  }
                  placeholder="Ex.: Fluidoterapia Ringer Lactato 30ml/h, analgesia contínua..."
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/clinica/internacao")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gradient-primary text-primary-foreground gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirmar Internação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicInpatientAdmitPage;

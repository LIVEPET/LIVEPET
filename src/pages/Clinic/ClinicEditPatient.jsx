import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PawPrint, Save } from "lucide-react";
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
import { clinicService } from "@/services/api";
import { ECC_OPTIONS, normalizeEcc } from "@/lib/clinicVitals";

/**
 * Página dedicada para edição dos dados cadastrais do paciente e tutor.
 * Substitui o antigo modal Dialog por uma tela cheia limpa e responsiva.
 */
const ClinicEditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients = [], updatePatient } = useClinic();

  // Localiza o paciente pelo ID fornecido na URL
  const patient = useMemo(
    () => patients.find((p) => String(p.id) === String(id)),
    [patients, id],
  );

  // Espécies vindas do banco de dados com fallback seguro
  const [dbSpecies, setDbSpecies] = useState([
    "Cão",
    "Gato",
    "Ave",
    "Roedor",
    "Réptil",
    "Outro",
  ]);

  // Estado do formulário de edição
  const [form, setForm] = useState({
    name: "",
    species: "Cão",
    breed: "",
    age: "",
    weight: "",
    tutor: "",
    phone: "",
    alertsText: "",
    ecc: "none",
  });

  // Preenche o formulário quando o paciente for carregado
  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || "",
        species: patient.species || "Cão",
        breed: patient.breed && patient.breed !== "—" ? patient.breed : "",
        age: patient.age && patient.age !== "—" ? patient.age : "",
        weight: patient.weight && patient.weight !== "—" ? patient.weight : "",
        tutor: patient.tutor || "",
        phone: patient.phone && patient.phone !== "—" ? patient.phone : "",
        alertsText: Array.isArray(patient.alerts)
          ? patient.alerts.join(", ")
          : "",
        ecc: normalizeEcc(patient.ecc)
          ? String(normalizeEcc(patient.ecc))
          : "none",
      });
    }
  }, [patient]);

  // Carrega a lista de espécies do backend para o select
  useEffect(() => {
    let isMounted = true;
    clinicService
      .getSpecies()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDbSpecies(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Opções completas de espécies para o campo
  const speciesOptions = useMemo(() => {
    const set = new Set(dbSpecies);
    if (form.species) set.add(form.species);
    return Array.from(set);
  }, [dbSpecies, form.species]);

  // Se o paciente não existir no contexto, exibe aviso e link de retorno
  if (!patient) {
    return (
      <div className="container max-w-xl py-12 text-center">
        <p className="text-lg font-semibold">Paciente não encontrado.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O paciente solicitado não existe ou ainda não foi sincronizado.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/clinica/pacientes">Voltar para pacientes</Link>
        </Button>
      </div>
    );
  }

  // Tratamento do envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validações básicas e amigáveis
    if (!form.name.trim()) {
      toast.error("Informe o nome do pet.");
      return;
    }
    if (!form.tutor.trim()) {
      toast.error("Informe o nome do tutor.");
      return;
    }

    // Processa os alertas clínicos separados por vírgula
    const parsedAlerts = form.alertsText
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    // Monta o objeto de dados atualizados
    const updatedData = {
      name: form.name.trim(),
      species: form.species.trim(),
      breed: form.breed.trim() || "—",
      age: form.age.trim() || "—",
      weight: form.weight.trim() || "—",
      tutor: form.tutor.trim(),
      phone: form.phone.trim() || "—",
      alerts: parsedAlerts,
      ecc: form.ecc === "none" ? null : Number(form.ecc),
    };

    // Salva no contexto / localStorage da clínica
    updatePatient(patient.id, updatedData);

    toast.success("Dados do paciente e tutor atualizados com sucesso!");

    // Retorna para a listagem de pacientes reabrindo a ficha do paciente atualizado
    navigate("/clinica/pacientes", { state: { selectedPatientId: patient.id } });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Botão de retorno */}
      <div className="flex items-center justify-between">
        <Link
          to="/clinica/pacientes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para pacientes
        </Link>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          {/* Cabeçalho da página */}
          <div className="space-y-1 mb-6 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <PawPrint className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight font-display">
                Editar dados do paciente: {patient.name}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Atualize as informações cadastrais do animal, tutor e observações clínicas.
            </p>
          </div>

          {/* Formulário com todos os campos */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Bloco 1: Dados do Pet */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Dados do Animal
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pet-name">Nome do Pet *</Label>
                  <Input
                    id="pet-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex.: Thor"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pet-species">Espécie *</Label>
                  <Select
                    value={form.species}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, species: val }))
                    }
                  >
                    <SelectTrigger id="pet-species">
                      <SelectValue placeholder="Selecione a espécie" />
                    </SelectTrigger>
                    <SelectContent>
                      {speciesOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pet-breed">Raça</Label>
                  <Input
                    id="pet-breed"
                    value={form.breed}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, breed: e.target.value }))
                    }
                    placeholder="Ex.: Labrador ou SRD"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pet-age">Idade</Label>
                  <Input
                    id="pet-age"
                    value={form.age}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, age: e.target.value }))
                    }
                    placeholder="Ex.: 3 anos"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pet-weight">Peso</Label>
                  <Input
                    id="pet-weight"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, weight: e.target.value }))
                    }
                    placeholder="Ex.: 12.5 kg"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Dados do Tutor */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Dados do Tutor
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pet-tutor">Nome do Tutor *</Label>
                  <Input
                    id="pet-tutor"
                    value={form.tutor}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tutor: e.target.value }))
                    }
                    placeholder="Ex.: Ana Santos"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pet-phone">Telefone / WhatsApp</Label>
                  <Input
                    id="pet-phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Ex.: (11) 99999-0000"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Avaliação Clínica e ECC */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Condição Corporal e Alertas Clínicos
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="pet-ecc">Escore de condição corporal (ECC)</Label>
                <Select
                  value={form.ecc}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, ecc: val }))
                  }
                >
                  <SelectTrigger id="pet-ecc">
                    <SelectValue placeholder="Selecione o ECC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não avaliado</SelectItem>
                    {ECC_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pet-alerts">
                  Alertas e Alergias (separados por vírgula)
                </Label>
                <Textarea
                  id="pet-alerts"
                  rows={3}
                  value={form.alertsText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, alertsText: e.target.value }))
                  }
                  placeholder="Ex.: Alérgico a dipirona, Cardiopata, Diabético..."
                />
              </div>
            </div>

            {/* Ações do Formulário */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/clinica/pacientes")}
              >
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground gap-2">
                <Save className="h-4 w-4" /> Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicEditPatient;

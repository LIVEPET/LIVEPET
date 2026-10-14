import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  FileText,
  Link2,
  PawPrint,
  Phone,
  Search,
  ShieldCheck,
  Syringe,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import EmptyState from "@/components/EmptyState";
import { useClinic } from "@/contexts/ClinicContext";
import { clinicService } from "@/services/api";

const vaccineLabel = (upToDate) => {
  if (upToDate === true) return "Vacinas em dia";
  if (upToDate === false) return "Vacina pendente";
  return "Sem registro de vacinas";
};

const PatientPhoto = ({ patient, className, iconClassName }) =>
  patient.photo ? (
    <img src={patient.photo} alt={`Foto de ${patient.name}`} loading="lazy" className={className} />
  ) : (
    <div className={`grid place-items-center bg-primary-soft text-primary ${className}`}>
      <PawPrint className={iconClassName} />
    </div>
  );

const ClinicPatients = () => {
  const navigate = useNavigate();
  const { patients, updatePatient, deletePatient, linkPatientWithLivePet } = useClinic();
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("Todos");
  const [breed, setBreed] = useState("Todas");
  const [selected, setSelected] = useState(null);

  // Espécies sincronizadas do banco de dados
  const [dbSpecies, setDbSpecies] = useState(["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"]);

  // Estados de Exclusão de Paciente
  const [deletePatientModalOpen, setDeletePatientModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  // Estados de Edição do Paciente e Tutor
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    tutor: "",
    phone: "",
    alertsText: "",
  });

  // Estados do Vínculo com Pet Oficial do Tutor
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkPetId, setLinkPetId] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Busca espécies do banco de dados na inicialização
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

  // Opções completas de espécies para o modal de edição (banco + atual)
  const allEditSpeciesOptions = useMemo(() => {
    const set = new Set(dbSpecies);
    if (editForm.species) set.add(editForm.species);
    return Array.from(set);
  }, [dbSpecies, editForm.species]);

  // Espécies e raças dinâmicas extraídas estritamente dos pets cadastrados
  const availableSpecies = useMemo(() => {
    return Array.from(new Set(patients.map((p) => p.species).filter(Boolean))).sort();
  }, [patients]);

  const availableBreeds = useMemo(() => {
    return Array.from(
      new Set(
        patients
          .map((p) => p.breed)
          .filter((b) => b && typeof b === "string" && b.trim() && b.trim() !== "—")
      ),
    ).sort();
  }, [patients]);

  const visible = useMemo(
    () =>
      patients.filter((p) => {
        const matchesSpecies = species === "Todos" || p.species === species;
        const matchesBreed = breed === "Todas" || p.breed === breed;
        const matchesQuery = `${p.name} ${p.tutor} ${p.breed}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesSpecies && matchesBreed && matchesQuery;
      }),
    [patients, query, species, breed],
  );

  const handleOpenEdit = () => {
    if (!selected) return;
    setEditForm({
      name: selected.name || "",
      species: selected.species || "Cão",
      breed: selected.breed && selected.breed !== "—" ? selected.breed : "",
      age: selected.age && selected.age !== "—" ? selected.age : "",
      weight: selected.weight && selected.weight !== "—" ? selected.weight : "",
      tutor: selected.tutor || "",
      phone: selected.phone && selected.phone !== "—" ? selected.phone : "",
      alertsText: Array.isArray(selected.alerts) ? selected.alerts.join(", ") : "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!editForm.name.trim()) {
      toast.error("Informe o nome do pet.");
      return;
    }
    if (!editForm.tutor.trim()) {
      toast.error("Informe o nome do tutor.");
      return;
    }

    const parsedAlerts = editForm.alertsText
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const updatedData = {
      name: editForm.name.trim(),
      species: editForm.species.trim(),
      breed: editForm.breed.trim() || "—",
      age: editForm.age.trim() || "—",
      weight: editForm.weight.trim() || "—",
      tutor: editForm.tutor.trim(),
      phone: editForm.phone.trim() || "—",
      alerts: parsedAlerts,
    };

    updatePatient(selected.id, updatedData);
    setSelected((prev) => (prev ? { ...prev, ...updatedData } : null));
    setEditOpen(false);
    toast.success("Dados do paciente e tutor atualizados com sucesso!");
  };

  const handleOpenLink = () => {
    setLinkPetId("");
    setLinkMessage(
      `Olá! A clínica gostaria de vincular o prontuário do seu pet ${selected?.name} para acompanhamento veterinário integrado.`,
    );
    setLinkOpen(true);
  };

  const handleSubmitLink = async (e) => {
    e.preventDefault();
    if (!linkPetId.trim()) {
      toast.error("Informe o ID do Pet ou o código/token público.");
      return;
    }
    setIsLinking(true);
    const res = await linkPatientWithLivePet(selected.id, linkPetId.trim(), linkMessage.trim());
    setIsLinking(false);

    if (res.success) {
      toast.success(
        "Solicitação de vínculo enviada ao tutor! Assim que aprovada, os dados oficiais e foto serão sincronizados automaticamente.",
      );
      setLinkOpen(false);
    } else {
      toast.error(res.error || "Não foi possível enviar a solicitação.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">Pacientes</Badge>
        <h1 className="font-display text-3xl font-bold">Pacientes e histórico</h1>
        <p className="text-muted-foreground">Consulte prontuários, vacinas e alertas clínicos.</p>
      </div>

      {/* Barra de filtros: só aparece se houver pets cadastrados, exibindo apenas as opções reais */}
      {patients.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            {availableSpecies.length > 0 && (
              <Tabs value={species} onValueChange={setSpecies}>
                <TabsList className="flex-wrap">
                  <TabsTrigger value="Todos">Todos</TabsTrigger>
                  {availableSpecies.map((s) => (
                    <TabsTrigger key={s} value={s}>
                      {s}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {availableBreeds.length > 0 && (
              <Select value={breed} onValueChange={setBreed}>
                <SelectTrigger className="h-9 w-[170px] rounded-2xl text-xs font-medium">
                  <SelectValue placeholder="Todas as raças" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as raças</SelectItem>
                  {availableBreeds.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar pet, raça ou tutor"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {visible.length === 0 &&
        (patients.length === 0 ? (
          <EmptyState
            icon={<PawPrint className="h-8 w-8" />}
            title="Nenhum paciente cadastrado ainda"
            description="Os pets aparecem aqui depois do primeiro atendimento na clínica."
            actionLabel="Ir para a agenda"
            onAction={() => navigate("/clinica/agenda")}
          />
        ) : (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="Nenhum paciente encontrado"
            description="Nenhum resultado para esses filtros. Tente outra espécie, raça ou busca."
            actionLabel="Limpar filtros"
            onAction={() => {
              setSpecies("Todos");
              setBreed("Todas");
              setQuery("");
            }}
          />
        ))}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer overflow-hidden border-border/70 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
            onClick={() => setSelected(p)}
          >
            <div className="relative h-40 overflow-hidden">
              <PatientPhoto patient={p} className="h-full w-full object-cover" iconClassName="h-12 w-12" />
              {p.linked_pet_id && (
                <Badge className="absolute left-3 top-3 gap-1 bg-primary text-primary-foreground shadow-sm">
                  <ShieldCheck className="h-3 w-3" /> LivePet Conectado
                </Badge>
              )}
              {p.alerts.length > 0 && (
                <Badge className="absolute right-3 top-3 gap-1 bg-warm text-warm-foreground">
                  <AlertTriangle className="h-3 w-3" /> Atenção
                </Badge>
              )}
            </div>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg font-bold">{p.name}</p>
                <span className="text-xs text-muted-foreground">{p.age}</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.species} · {p.breed} · {p.weight}</p>
              <p className="text-sm">Tutor: <span className="text-muted-foreground">{p.tutor}</span></p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Syringe className="h-3 w-3" /> {vaccineLabel(p.vaccinesUpToDate)}
                  </Badge>
                  <Badge variant="outline">Última visita {p.lastVisit}</Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Excluir paciente"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPatientToDelete(p);
                    setDeletePatientModalOpen(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Painel lateral de detalhes do Paciente selecionado */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center justify-between gap-2">
                  <SheetTitle className="font-display text-2xl">{selected.name}</SheetTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-full text-xs"
                      onClick={handleOpenEdit}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                      onClick={() => {
                        setPatientToDelete(selected);
                        setDeletePatientModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </Button>
                  </div>
                </div>
                <SheetDescription>
                  {selected.species} · {selected.breed} · {selected.age} · {selected.weight}
                </SheetDescription>
              </SheetHeader>

              <PatientPhoto
                patient={selected}
                className="mt-5 h-48 w-full rounded-2xl object-cover"
                iconClassName="h-14 w-14"
              />

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-sm font-semibold">Tutor responsável</p>
                  <p className="text-sm text-muted-foreground">{selected.tutor}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {selected.phone}
                  </p>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">Vínculo LivePet</p>
                    {selected.linked_pet_id ? (
                      <Badge className="bg-primary-soft text-primary hover:bg-primary-soft gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Oficial Conectado
                      </Badge>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 gap-1 rounded-full text-xs font-medium"
                        onClick={handleOpenLink}
                      >
                        <Link2 className="h-3 w-3" /> Vincular ao tutor
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selected.linked_pet_id
                      ? "Este paciente está vinculado à conta LivePet do tutor. O prontuário e vacinas são sincronizados."
                      : "Paciente cadastrado localmente na clínica. Vincule à conta LivePet do tutor para sincronizar o prontuário."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <p className="mb-2 text-sm font-semibold">Situação clínica</p>
                  <p className="flex items-center gap-2 text-sm">
                    {selected.vaccinesUpToDate === true && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    {selected.vaccinesUpToDate === false && <AlertTriangle className="h-4 w-4 text-warm" />}
                    {selected.vaccinesUpToDate == null && <Syringe className="h-4 w-4 text-muted-foreground" />}
                    {selected.vaccinesUpToDate === true
                      ? "Carteira de vacinas em dia"
                      : selected.vaccinesUpToDate === false
                        ? "Vacinação pendente"
                        : "Sem registro de vacinas"}
                  </p>
                  {selected.alerts.map((a) => (
                    <p key={a} className="mt-2 rounded-xl bg-warm-soft/70 px-3 py-2 text-xs">{a}</p>
                  ))}
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4" /> Histórico veterinário
                  </p>
                  {selected.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum atendimento registrado ainda.</p>
                  ) : (
                    <ol className="space-y-3 border-l border-border pl-5">
                      {selected.history.map((h, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                          <p className="text-sm font-semibold">{h.type} · {h.date}</p>
                          <p className="text-xs text-muted-foreground">{h.vet}</p>
                          <p className="text-sm text-muted-foreground">{h.summary}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <Button
                  onClick={() => {
                    navigate("/clinica/agenda", {
                      state: {
                        prefill: {
                          patientId: selected.id,
                          petName: selected.name,
                          species: selected.species || "Cão",
                          breed: selected.breed && selected.breed !== "—" ? selected.breed : "",
                          tutor: selected.tutor,
                          phone: selected.phone && selected.phone !== "—" ? selected.phone : "",
                        },
                      },
                    });
                  }}
                  className="w-full rounded-full gradient-primary text-primary-foreground shadow-soft"
                >
                  Registrar novo atendimento
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Edição de Dados do Paciente e Tutor */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Editar dados do paciente</DialogTitle>
            <DialogDescription>
              Atualize as informações cadastrais do pet ou do tutor responsável.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="editName">Nome do pet</Label>
                <Input
                  id="editName"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editSpecies">Espécie</Label>
                <Select
                  value={editForm.species}
                  onValueChange={(val) => setEditForm((f) => ({ ...f, species: val }))}
                >
                  <SelectTrigger id="editSpecies">
                    <SelectValue placeholder="Selecione a espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    {allEditSpeciesOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editBreed">Raça</Label>
                <Input
                  id="editBreed"
                  value={editForm.breed}
                  onChange={(e) => setEditForm((f) => ({ ...f, breed: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editAge">Idade</Label>
                <Input
                  id="editAge"
                  placeholder="Ex: 2 anos"
                  value={editForm.age}
                  onChange={(e) => setEditForm((f) => ({ ...f, age: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editWeight">Peso</Label>
                <Input
                  id="editWeight"
                  placeholder="Ex: 12.5 kg"
                  value={editForm.weight}
                  onChange={(e) => setEditForm((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPhone">Telefone do tutor</Label>
                <Input
                  id="editPhone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editTutor">Nome do tutor</Label>
              <Input
                id="editTutor"
                value={editForm.tutor}
                onChange={(e) => setEditForm((f) => ({ ...f, tutor: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editAlerts">Alertas clínicos (separados por vírgula)</Label>
              <Input
                id="editAlerts"
                placeholder="Ex: Alérgico a dipirona, Cardiopata"
                value={editForm.alertsText}
                onChange={(e) => setEditForm((f) => ({ ...f, alertsText: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Solicitação de Vínculo com LivePet */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Vincular à conta LivePet</DialogTitle>
            <DialogDescription>
              Informe o ID do Pet ou o código do QR Code público fornecido pelo tutor. O tutor receberá uma solicitação para aprovação.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLink} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="linkPetId">ID do Pet ou Código Público</Label>
              <Input
                id="linkPetId"
                placeholder="Ex: 42 ou token do QR Code"
                value={linkPetId}
                onChange={(e) => setLinkPetId(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkMessage">Mensagem para o tutor (opcional)</Label>
              <Textarea
                id="linkMessage"
                rows={3}
                value={linkMessage}
                onChange={(e) => setLinkMessage(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLinking} className="gradient-primary text-primary-foreground">
                {isLinking ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </DialogFooter>
          </form>
      {/* Modal de Confirmação de Exclusão de Paciente */}
      <Dialog open={deletePatientModalOpen} onOpenChange={setDeletePatientModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-display">
              <Trash2 className="h-5 w-5" /> Excluir paciente {patientToDelete?.name}?
            </DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja remover o paciente <strong>{patientToDelete?.name}</strong> (Tutor: {patientToDelete?.tutor}) dos registros da clínica?
              Os atendimentos e histórico deste animal serão excluídos da clínica.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePatientModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!patientToDelete) return;
                deletePatient(patientToDelete.id);
                if (selected?.id === patientToDelete.id) {
                  setSelected(null);
                }
                setDeletePatientModalOpen(false);
                toast.success(`Paciente ${patientToDelete.name} excluído com sucesso.`);
              }}
            >
              Excluir paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicPatients;
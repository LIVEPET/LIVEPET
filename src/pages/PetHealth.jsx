import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarCheck,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Plus,
  Loader2,
  CheckCircle2,
  CreditCard,
  History,
  PawPrint,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calcularStatus, formatarData, textoPrazo } from "@/lib/vacinas";
import { getStoredUser, petsService } from "@/services/api";
import petDefaultDog from "@/assets/pet-thor.jpg";
import petDefaultCat from "@/assets/pet-mia.jpg";

// A tabela vira uma lista de cards abaixo de md: o thead some e cada célula
// exibe seu rótulo via data-label.
const celula =
  "px-3 py-4 align-top max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-4 max-md:border-b max-md:border-border/60 max-md:px-0 max-md:py-2.5 max-md:text-right max-md:last:border-b-0 max-md:before:flex-shrink-0 max-md:before:text-left max-md:before:text-[11px] max-md:before:font-bold max-md:before:uppercase max-md:before:tracking-wider max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)]";

const adaptBackendPet = (p) => ({
  id: p.id,
  nome: p.nome,
  apelido: p.nome,
  especie: p.especie || "Cachorro",
  raca: p.raca || "SRD",
  porte: p.porte || "Médio",
  sexo: p.sexo || "Não informado",
  data_nascimento: p.data_nascimento,
  registro: p.token_publico
    ? `LP-${p.token_publico.slice(0, 8).toUpperCase()}`
    : `LP-${p.id}`,
  img:
    p.foto_url ||
    (p.especie?.toLowerCase() === "gato" ? petDefaultCat : petDefaultDog),
  vacinas: (p.vaccines || []).map((v) => ({
    id: v.id,
    nome: v.nome,
    dose: v.lote ? `Lote ${v.lote}` : "Dose regular",
    dataAplicacao: v.data_aplicacao,
    dataReforco: v.proxima_dose,
    clinica: v.veterinario || "Clínica Veterinária",
  })),
  avisos: {
    alergias: (p.medical_records || [])
      .filter((m) => m.tipo?.toLowerCase().includes("alergia"))
      .map((m) => ({
        id: `alergia-${m.id}`,
        titulo: m.tipo,
        detalhe: m.descricao,
      })),
    recomendacoes: (p.medical_records || [])
      .filter((m) => !m.tipo?.toLowerCase().includes("alergia"))
      .map((m) => ({
        id: `rec-${m.id}`,
        titulo: m.tipo || "Observação Clínica",
        detalhe: m.descricao,
      })),
  },
});

const PetHealth = ({ pets: initialPets, petInicial }) => {
  const [searchParams] = useSearchParams();
  const urlPetId = searchParams.get("petId") || searchParams.get("id");

  const [dbPets, setDbPets] = useState(initialPets || []);
  const [loading, setLoading] = useState(!initialPets);
  const [petId, setPetId] = useState(
    petInicial ?? urlPetId ?? initialPets?.[0]?.id ?? "",
  );

  // Dialog de cadastro de nova vacina
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vaxForm, setVaxForm] = useState({
    nome: "",
    data_aplicacao: new Date().toISOString().slice(0, 10),
    proxima_dose: "",
    lote: "",
    veterinario: "",
  });

  // Carrega pets reais do tutor autenticado quando não fornecidos por props
  useEffect(() => {
    if (initialPets) {
      setDbPets(initialPets);
      if (!petId && initialPets.length > 0) {
        setPetId(initialPets[0].id);
      }
      return;
    }

    let isMounted = true;
    const fetchPets = async () => {
      try {
        setLoading(true);
        const data = await petsService.list();
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const adapted = data.map(adaptBackendPet);
          setDbPets(adapted);
          const found = urlPetId
            ? adapted.find((p) => String(p.id) === String(urlPetId))
            : null;
          setPetId(found ? found.id : adapted[0].id);
        } else {
          setDbPets([]);
        }
      } catch (err) {
        console.error("Erro ao buscar carteira de vacinas:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPets();
    return () => {
      isMounted = false;
    };
  }, [initialPets, urlPetId]);

  const pet = useMemo(() => {
    if (!dbPets.length) return null;
    return (
      dbPets.find((p) => String(p.id) === String(petId)) ?? dbPets[0] ?? null
    );
  }, [dbPets, petId]);

  const handleOpenAddDialog = () => {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    setVaxForm({
      nome: "",
      data_aplicacao: today.toISOString().slice(0, 10),
      proxima_dose: nextYear.toISOString().slice(0, 10),
      lote: "",
      veterinario: "Clínica Veterinária Parceira",
    });
    setDialogOpen(true);
  };

  const handleAddVaccine = async (e) => {
    e.preventDefault();
    if (!vaxForm.nome.trim()) {
      toast.error("Informe o nome da vacina.");
      return;
    }
    if (!pet) return;

    try {
      setSubmitting(true);
      const payload = {
        nome: vaxForm.nome.trim(),
        data_aplicacao: vaxForm.data_aplicacao,
        proxima_dose: vaxForm.proxima_dose || null,
        lote: vaxForm.lote.trim() || null,
        veterinario: vaxForm.veterinario.trim() || null,
      };

      const res = await petsService.addVaccine(pet.id, payload);

      const novaVacina = {
        id: res.id || Date.now(),
        nome: res.nome || payload.nome,
        dose: payload.lote ? `Lote ${payload.lote}` : "Dose regular",
        dataAplicacao: payload.data_aplicacao,
        dataReforco: payload.proxima_dose,
        clinica: payload.veterinario || "Clínica Veterinária",
      };

      setDbPets((prev) =>
        prev.map((p) =>
          p.id === pet.id
            ? { ...p, vacinas: [novaVacina, ...(p.vacinas || [])] }
            : p,
        ),
      );

      toast.success(`Vacina ${payload.nome} registrada com sucesso!`, {
        description: `Reforço previsto para ${formatarData(payload.proxima_dose)}.`,
      });
      setDialogOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar vacina";
      toast.error("Falha ao registrar vacina", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Carregando carteira de saúde e vacinas...
        </p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container max-w-2xl py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PawPrint className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Nenhum pet cadastrado ainda
        </h2>
        <p className="mt-2 text-muted-foreground">
          Cadastre seu primeiro pet para acompanhar a carteira digital de
          vacinas, reforços e alertas clínicos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="rounded-full gradient-primary">
            <Link to="/pets/novo">
              <Plus className="mr-2 h-4 w-4" /> Cadastrar Meu Pet
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const comStatus = (pet.vacinas || []).map((vacina) => ({
    ...vacina,
    status: calcularStatus(vacina.dataReforco),
  }));

  const avisos = pet.avisos || { alergias: [], recomendacoes: [] };
  const alergias = avisos.alergias || [];
  const recomendacoes = avisos.recomendacoes || [];
  const atrasadas = comStatus.filter((v) => v.status.tipo === "atrasada");
  const emDia = comStatus.length - atrasadas.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-foreground py-14 text-primary-foreground">
        <div className="blob -left-20 top-0 h-[360px] w-[360px] bg-primary/40 animate-blob" />
        <div className="blob -right-10 bottom-0 h-[300px] w-[300px] bg-warm/30" />
        <div className="container relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-warm/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-warm ring-1 ring-warm/40">
              <ShieldCheck className="h-3.5 w-3.5" />
              Carteira digital LivePet
            </span>

            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <Link to={`/cartao?id=${pet.id}`}>
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Cartão do Pet
                </Link>
              </Button>
              <Button
                onClick={handleOpenAddDialog}
                size="sm"
                className="rounded-full bg-warm text-foreground shadow-soft hover:bg-warm/90"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Registrar Vacina
              </Button>
            </div>
          </div>

          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
            Vacinas, reforços e alertas{" "}
            <span className="italic text-warm">em um só lugar</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/75">
            Acompanhamento preventivo de {pet.apelido} — {pet.raca} ·{" "}
            {pet.registro}. Atualizado com base no prontuário do banco de dados.
          </p>
        </div>
      </section>

      <section className="container py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to={`/historico-medico?petId=${pet.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-smooth hover:text-primary"
          >
            <History className="h-4 w-4" /> Histórico veterinário completo
          </Link>

          <Button
            onClick={handleOpenAddDialog}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Dose
          </Button>
        </div>

        {/* Seletor de pets do tutor */}
        <div
          className="mt-6 flex flex-wrap gap-3"
          role="group"
          aria-label="Selecione o pet"
        >
          {dbPets.map((opcao) => {
            const ativo = String(opcao.id) === String(pet.id);
            const pendentes = (opcao.vacinas || []).filter(
              (v) => calcularStatus(v.dataReforco).tipo === "atrasada",
            ).length;

            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => setPetId(opcao.id)}
                aria-pressed={ativo}
                className={`group relative flex items-center gap-3 rounded-2xl border-2 px-3 py-2 pr-4 transition-all ${
                  ativo
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div
                  className={`h-10 w-10 overflow-hidden rounded-full ring-2 ${
                    ativo ? "ring-primary" : "ring-transparent"
                  }`}
                >
                  <img
                    src={opcao.img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold leading-tight">
                    {opcao.apelido}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {opcao.especie} · {opcao.raca}
                  </div>
                </div>
                {pendentes > 0 && (
                  <span
                    className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground"
                    title={`${pendentes} vacina(s) atrasada(s)`}
                  >
                    {pendentes}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Coluna lateral */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden border-border/60 p-0 shadow-card">
              <div className="flex items-center gap-3 border-b border-border/60 bg-primary-soft/40 px-5 py-4">
                <img
                  src={pet.img}
                  alt={pet.apelido}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/30"
                />

                <div>
                  <p className="font-display text-sm font-bold">
                    {pet.apelido}
                  </p>
                  <p className="text-xs text-muted-foreground">{pet.raca}</p>
                </div>
              </div>
              <div className="p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Situação geral
                </p>
                <p className="mt-2 font-display text-5xl font-bold leading-none text-primary">
                  {emDia}
                  <span className="text-2xl text-muted-foreground">
                    /{comStatus.length}
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {comStatus.length === 0
                    ? "Nenhuma vacina registrada para este pet."
                    : atrasadas.length === 0
                    ? "Todas as vacinas estão em dia."
                    : `${atrasadas.length} ${
                        atrasadas.length === 1
                          ? "dose precisa"
                          : "doses precisam"
                      } de reforço.`}
                </p>
              </div>
            </Card>

            <Card
              className="overflow-hidden border-border/60 p-0 shadow-card"
              aria-labelledby="avisos-titulo"
            >
              <div className="flex items-center gap-2 border-b border-border/60 bg-warm-soft/60 px-5 py-4">
                <AlertTriangle className="h-4 w-4 text-warm" />
                <h2
                  id="avisos-titulo"
                  className="font-display text-sm font-bold uppercase tracking-wider"
                >
                  Avisos importantes
                </h2>
              </div>
              <div className="space-y-3 p-5">
                {alergias.map((aviso) => (
                  <article
                    key={aviso.id}
                    className="rounded-xl border-l-4 border-destructive bg-destructive/10 p-3"
                  >
                    <h3 className="text-sm font-bold text-destructive">
                      {aviso.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-foreground/80">
                      {aviso.detalhe}
                    </p>
                  </article>
                ))}

                {recomendacoes.map((aviso) => (
                  <article
                    key={aviso.id}
                    className="rounded-xl border-l-4 border-primary bg-primary-soft/50 p-3"
                  >
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-primary">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {aviso.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-foreground/80">
                      {aviso.detalhe}
                    </p>
                  </article>
                ))}

                {alergias.length === 0 && recomendacoes.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    Nenhum alerta ou observação clínica registrada para este animal.
                  </p>
                )}
              </div>
            </Card>
          </aside>

          {/* Carteira de vacinas */}
          <Card
            className="border-border/60 p-6 shadow-card sm:p-7"
            aria-labelledby="vacinas-titulo"
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Syringe className="h-3 w-3" />
                  Histórico
                </span>
                <h2
                  id="vacinas-titulo"
                  className="mt-3 font-display text-2xl font-bold"
                >
                  Carteira de vacinas
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cada linha mostra a dose aplicada e o prazo do próximo
                  reforço.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                  <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                  {comStatus.length} registros
                </span>
                <Button
                  onClick={handleOpenAddDialog}
                  size="sm"
                  className="rounded-full gradient-primary text-primary-foreground"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nova Vacina
                </Button>
              </div>
            </div>

            {comStatus.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
                <p>
                  Nenhuma vacina registrada ainda. Cadastre a primeira dose para
                  acompanhar os reforços de {pet.apelido}.
                </p>
                <Button
                  onClick={handleOpenAddDialog}
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Registrar Primeira Vacina
                </Button>
              </div>
            ) : (
              <table className="w-full border-collapse text-left max-md:block">
                <caption className="sr-only">
                  Vacinas aplicadas em {pet.nome}, com data de reforço e
                  situação
                </caption>
                <thead className="max-md:hidden">
                  <tr className="border-b border-border">
                    <th
                      scope="col"
                      className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Vacina
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Aplicação
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Próximo reforço
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody className="max-md:block">
                  {comStatus.map((vacina) => (
                    <tr
                      key={vacina.id}
                      className="border-b border-border/60 last:border-b-0 max-md:mb-3 max-md:block max-md:rounded-2xl max-md:border max-md:px-4 max-md:py-1 max-md:last:mb-0"
                    >
                      <td className={celula} data-label="Vacina">
                        <span className="max-md:text-right">
                          <span className="block font-semibold">
                            {vacina.nome}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {vacina.dose} · {vacina.clinica}
                          </span>
                        </span>
                      </td>
                      <td className={celula} data-label="Aplicação">
                        <span className="text-sm tabular-nums">
                          {formatarData(vacina.dataAplicacao)}
                        </span>
                      </td>
                      <td className={celula} data-label="Próximo reforço">
                        <span>
                          <span className="block text-sm tabular-nums">
                            {formatarData(vacina.dataReforco)}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {textoPrazo(vacina.status.dias)}
                          </span>
                        </span>
                      </td>
                      <td className={celula} data-label="Situação">
                        <span
                          className={
                            vacina.status.tipo === "em-dia"
                              ? "inline-block whitespace-nowrap rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20"
                              : "inline-block whitespace-nowrap rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive ring-1 ring-destructive/25"
                          }
                        >
                          {vacina.status.rotulo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </section>

      {/* MODAL PARA REGISTRO DE VACINA VINCULADA AO BANCO DE DADOS */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-primary" />
              Registrar Vacina para {pet.apelido}
            </DialogTitle>
            <DialogDescription>
              A vacina será salva diretamente no banco de dados e aparecerá no
              cartão digital e no QR Code de emergência.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddVaccine} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="vax-nome">Nome da Vacina *</Label>
              <Input
                id="vax-nome"
                placeholder="Ex.: V10, Antirrábica, Gripe Canina"
                value={vaxForm.nome}
                onChange={(e) =>
                  setVaxForm((prev) => ({ ...prev, nome: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vax-aplicacao">Data de Aplicação *</Label>
                <Input
                  id="vax-aplicacao"
                  type="date"
                  value={vaxForm.data_aplicacao}
                  onChange={(e) =>
                    setVaxForm((prev) => ({
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
                  value={vaxForm.proxima_dose}
                  onChange={(e) =>
                    setVaxForm((prev) => ({
                      ...prev,
                      proxima_dose: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vax-lote">Número do Lote</Label>
                <Input
                  id="vax-lote"
                  placeholder="Ex.: LT-2026-A"
                  value={vaxForm.lote}
                  onChange={(e) =>
                    setVaxForm((prev) => ({ ...prev, lote: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vax-vet">Clínica / Veterinário</Label>
                <Input
                  id="vax-vet"
                  placeholder="Ex.: Clínica Vale Verde"
                  value={vaxForm.veterinario}
                  onChange={(e) =>
                    setVaxForm((prev) => ({
                      ...prev,
                      veterinario: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gradient-primary text-primary-foreground"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Salvar Vacina
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetHealth;

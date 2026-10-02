import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Camera,
  Phone,
  Mail,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  PawPrint,
  Sparkles,
  Loader2,
  Plus,
  ExternalLink,
  Award,
  Heart,
  QrCode,
  Pencil,
  Share2,
  Grid3X3,
  Calendar,
  Syringe,
  Check,
  Copy,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService, petsService } from "@/services/api";
import { compressImage } from "@/lib/image";
import petDefaultDog from "@/assets/pet-thor.jpg";
import petDefaultCat from "@/assets/pet-mia.jpg";

const initialsFrom = (nameOrEmail) => {
  if (!nameOrEmail) return "LP";
  const str = nameOrEmail.trim();
  if (str.includes(" ")) {
    const parts = str.split(" ");
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
};

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pets");

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    nome_canil: "",
    bio: "",
    foto_url: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [userData, petsData] = await Promise.all([
          authService.getMe().catch(() => authService.getCurrentUser()),
          petsService.list().catch(() => []),
        ]);

        if (!isMounted) return;

        if (userData) {
          setCurrentUser(userData);
          setForm({
            nome: userData.nome || "",
            email: userData.email || "",
            telefone: userData.telefone || "",
            cidade: userData.cidade || "",
            estado: userData.estado || "",
            nome_canil: userData.nome_canil || "",
            bio: userData.bio || "",
            foto_url: userData.foto_url || "",
          });
        }

        if (Array.isArray(petsData)) {
          setPets(petsData);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do perfil:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalVaccines = useMemo(() => {
    return pets.reduce((acc, pet) => acc + (pet.vaccines?.length || 0), 0);
  }, [pets]);

  const totalPedigrees = useMemo(() => {
    return pets.filter((pet) => pet.lineage || pet.raca).length;
  }, [pets]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem.");
      return;
    }

    const toastId = toast.loading("Comprimindo e salvando foto de perfil...");
    try {
      const compressed = await compressImage(file, 500, 500, 0.8);
      if (!compressed) {
        toast.dismiss(toastId);
        return;
      }

      setForm((prev) => ({ ...prev, foto_url: compressed }));
      const updated = await authService.updateMe({ foto_url: compressed });
      setCurrentUser(updated);

      toast.dismiss(toastId);
      toast.success("Foto de perfil atualizada!");
    } catch (err) {
      console.error("Erro ao atualizar foto:", err);
      toast.dismiss(toastId);
      toast.error("Não foi possível atualizar a foto.");
    } finally {
      e.target.value = "";
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Link do perfil copiado para a área de transferência!", {
      icon: <Copy className="h-4 w-4" />,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe seu nome completo.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado.trim() || null,
        nome_canil: form.nome_canil.trim() || null,
        bio: form.bio.trim() || null,
        foto_url: form.foto_url || null,
      };

      const updated = await authService.updateMe(payload);
      setCurrentUser(updated);
      setIsEditOpen(false);
      toast.success("Perfil salvo com sucesso!", {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error("Não foi possível salvar o perfil.", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando seu perfil...</p>
      </div>
    );
  }

  const memberSinceYear = currentUser?.criado_em
    ? new Date(currentUser.criado_em).getFullYear()
    : new Date().getFullYear();

  const usernameHandle = (currentUser?.nome || "tutor")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Container Principal Estilo Rede Social */}
      <div className="container max-w-4xl pt-8 sm:pt-12">
        {/* Header Social Estilo Instagram */}
        <header className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12 pb-8 border-b border-border/60">
          {/* Avatar com borda Gradiente de Stories */}
          <div className="flex justify-center md:justify-start">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-primary shadow-glow transition-transform duration-300 group-hover:scale-105">
                <Avatar className="h-full w-full border-2 border-background">
                  <AvatarImage
                    src={currentUser?.foto_url || form.foto_url}
                    alt={currentUser?.nome}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary-soft text-3xl font-bold text-primary">
                    {initialsFrom(currentUser?.nome || currentUser?.email)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Botão de câmera sobre o avatar */}
              <button
                type="button"
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all duration-300 hover:scale-110"
                title="Trocar foto de perfil"
                aria-label="Trocar foto de perfil"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          {/* Dados do Perfil */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            {/* Linha 1: Handle, Selo Verificado e Ações */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                @{usernameHandle}
              </h1>

              <span
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
                title="Tutor Oficial Verificado LivePet"
              >
                <ShieldCheck className="h-4 w-4" />
                Oficial
              </span>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <Button
                  onClick={() => setIsEditOpen(true)}
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-border bg-card font-semibold shadow-soft hover:bg-muted"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  Editar perfil
                </Button>

                <Button
                  onClick={handleShareProfile}
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-xl border-border bg-card shadow-soft hover:bg-muted"
                  title="Compartilhar perfil"
                  aria-label="Compartilhar perfil"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-xl gradient-primary text-primary-foreground shadow-soft transition-bounce hover:scale-105"
                >
                  <Link to="/pets/novo">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Novo Pet
                  </Link>
                </Button>
              </div>
            </div>

            {/* Linha 2: Estatísticas estilo Instagram */}
            <div className="flex justify-center gap-8 text-sm md:justify-start">
              <div>
                <span className="font-bold text-foreground">{pets.length}</span>{" "}
                <span className="text-muted-foreground">
                  {pets.length === 1 ? "pet" : "pets"}
                </span>
              </div>
              <div>
                <span className="font-bold text-foreground">{totalVaccines}</span>{" "}
                <span className="text-muted-foreground">vacinas</span>
              </div>
              <div>
                <span className="font-bold text-foreground">{totalPedigrees}</span>{" "}
                <span className="text-muted-foreground">pedigrees</span>
              </div>
            </div>

            {/* Linha 3: Bio e Informações Pessoais */}
            <div className="space-y-1.5 text-sm">
              <p className="font-bold text-foreground">
                {currentUser?.nome || "Tutor Responsável"}
              </p>

              {currentUser?.bio ? (
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed max-w-xl">
                  {currentUser.bio}
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground/80">
                  Amor, cuidado e segurança para meus pets na plataforma LivePet.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 md:justify-start">
                {currentUser?.cidade && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {currentUser.cidade}
                    {currentUser.estado ? `, ${currentUser.estado}` : ""}
                  </span>
                )}

                {currentUser?.telefone && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {currentUser.telefone}
                  </span>
                )}

                {currentUser?.nome_canil && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-warm/15 px-2.5 py-1 text-xs font-semibold text-warm">
                    <Building2 className="h-3.5 w-3.5" />
                    {currentUser.nome_canil}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Membro desde {memberSinceYear}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Stories / Destaques Circulares de Pets */}
        <div className="py-6 border-b border-border/60 overflow-x-auto">
          <div className="flex items-center gap-5 px-1 min-w-max">
            {/* Bolha para adicionar pet */}
            <Link to="/pets/novo" className="flex flex-col items-center gap-1.5 group">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-primary-soft/50 transition-all duration-300 group-hover:scale-105 group-hover:border-primary">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary">
                Adicionar
              </span>
            </Link>

            {/* Bolhas para cada pet do tutor */}
            {pets.map((pet) => {
              const isCat = pet.especie?.toLowerCase() === "gato";
              const petImg = pet.foto_url || (isCat ? petDefaultCat : petDefaultDog);
              return (
                <Link
                  key={pet.id}
                  to={`/cartao?id=${pet.id}`}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="h-16 w-16 rounded-full p-[2px] ring-2 ring-primary/40 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary">
                    <img
                      src={petImg}
                      alt={pet.nome}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground truncate max-w-[70px]">
                    {pet.nome}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tabs de Conteúdo Estilo Instagram */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <div className="flex justify-center border-b border-border/60">
            <TabsList className="bg-transparent gap-8 h-12">
              <TabsTrigger
                value="pets"
                className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:shadow-none rounded-none bg-transparent"
              >
                <Grid3X3 className="h-4 w-4" />
                Meus Pets ({pets.length})
              </TabsTrigger>
              <TabsTrigger
                value="pedigrees"
                className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:shadow-none rounded-none bg-transparent"
              >
                <Award className="h-4 w-4" />
                Pedigrees ({totalPedigrees})
              </TabsTrigger>
              <TabsTrigger
                value="sobre"
                className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:shadow-none rounded-none bg-transparent"
              >
                <User className="h-4 w-4" />
                Sobre
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Grid de Pets estilo Feed Instagram */}
          <TabsContent value="pets" className="pt-6">
            {pets.length === 0 ? (
              <Card className="py-16 text-center border-dashed">
                <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                  Nenhum pet cadastrado ainda
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  Cadastre seus animais de estimação para gerenciar vacinas, cartão virtual e pedigree oficial.
                </p>
                <Button
                  asChild
                  className="mt-6 rounded-full gradient-primary text-primary-foreground shadow-soft"
                >
                  <Link to="/pets/novo">
                    <Plus className="mr-1.5 h-4 w-4" /> Cadastrar primeiro pet
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                {pets.map((pet) => {
                  const isCat = pet.especie?.toLowerCase() === "gato";
                  const petImg = pet.foto_url || (isCat ? petDefaultCat : petDefaultDog);

                  return (
                    <article
                      key={pet.id}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted cursor-pointer shadow-soft transition-all duration-300 hover:shadow-glow"
                    >
                      <img
                        src={petImg}
                        alt={pet.nome}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Overlay estilo Instagram ao passar o mouse */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 sm:p-4 text-white">
                        <div className="flex justify-between items-start">
                          <span className="rounded-full bg-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase">
                            {pet.especie}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-primary-foreground/80">
                            #{pet.id}
                          </span>
                        </div>

                        <div className="text-center">
                          <p className="font-display text-base sm:text-lg font-bold">
                            {pet.nome}
                          </p>
                          <p className="text-[11px] text-white/80 truncate">
                            {pet.raca || "SRD"} {pet.porte ? `· ${pet.porte}` : ""}
                          </p>
                        </div>

                        {/* Ações rápidas */}
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Button
                            asChild
                            size="sm"
                            className="h-7 rounded-lg text-xs bg-white text-black hover:bg-white/90"
                          >
                            <Link to={`/cartao?id=${pet.id}`}>Cartão</Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg text-xs border-white/40 text-white hover:bg-white/20"
                          >
                            <Link to={`/saude?petId=${pet.id}`}>Saúde</Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Pedigrees e Linhagens */}
          <TabsContent value="pedigrees" className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Certificados e Linhagens Genealógicas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pedigrees registrados e emitidos junto à CBKC, FCI e AKC.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/pedigree">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-warm" />
                    Acessar aba Pedigree
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {pets.map((pet) => {
                  const hasLineage = Boolean(pet.lineage || pet.raca);
                  const isCat = pet.especie?.toLowerCase() === "gato";
                  const petImg = pet.foto_url || (isCat ? petDefaultCat : petDefaultDog);

                  return (
                    <Card key={pet.id} className="p-4 flex items-center gap-4 border-border/60 shadow-soft">
                      <img
                        src={petImg}
                        alt={pet.nome}
                        className="h-16 w-16 rounded-xl object-cover ring-1 ring-border/60"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-base font-bold text-foreground truncate">
                            {pet.nome}
                          </p>
                          {hasLineage && (
                            <span className="rounded-full bg-warm/20 text-warm px-2 py-0.5 text-[10px] font-bold">
                              Oficial
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {pet.raca || "Raça SRD"} · {pet.especie}
                        </p>
                        <p className="text-[11px] text-primary font-mono mt-0.5">
                          Registro: CBKC-{pet.token_publico ? pet.token_publico.slice(0, 8).toUpperCase() : pet.id}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="rounded-full text-xs">
                        <Link to={`/pedigree?petId=${pet.id}`}>
                          Ver Árvore
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Informações de Contato / Sobre o Tutor */}
          <TabsContent value="sobre" className="pt-6">
            <Card className="p-6 border-border/60 shadow-soft space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Informações de Emergência e Contato do Tutor
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dados usados para identificação e contato rápido caso seu animal se perca e tenha o QR Code escaneado.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nome Completo
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {currentUser?.nome || "Não informado"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    E-mail Oficial
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {currentUser?.email || "Não informado"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Telefone / WhatsApp de Resgate
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {currentUser?.telefone || "Não informado"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cidade / Região
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {currentUser?.cidade ? `${currentUser.cidade}, ${currentUser.estado || ""}` : "Não informado"}
                  </p>
                </div>
              </div>

              {currentUser?.nome_canil && (
                <div className="rounded-2xl border border-warm/30 bg-warm/10 p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-warm" />
                    <h4 className="font-display text-sm font-bold text-foreground">
                      Canil ou Gatil Registrado
                    </h4>
                  </div>
                  <p className="mt-1 font-semibold text-warm">
                    {currentUser.nome_canil}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setIsEditOpen(true)}
                  className="rounded-full gradient-primary text-primary-foreground shadow-soft"
                >
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Editar Dados Cadastrais
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Editar Perfil do Tutor
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atualize sua foto, dados de contato e informações do tutor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Foto de Perfil */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 border border-border/60">
              <Avatar className="h-16 w-16 ring-2 ring-primary/40">
                <AvatarImage src={form.foto_url} alt={form.nome} />
                <AvatarFallback className="bg-primary-soft text-lg font-bold text-primary">
                  {initialsFrom(form.nome || form.email)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Foto de Perfil
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full text-xs"
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  Carregar nova foto
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nome" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nome Completo *
                </Label>
                <Input
                  id="edit-nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  E-mail (Login)
                </Label>
                <Input
                  id="edit-email"
                  value={form.email}
                  disabled
                  className="bg-muted/50 cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-tel" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="edit-tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(62) 99999-0000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-cidade" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cidade
                </Label>
                <Input
                  id="edit-cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="Ex.: Goiânia"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-estado" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Estado (UF)
                </Label>
                <Input
                  id="edit-estado"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="GO"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-bio" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bio / Apresentação (Opcional)
              </Label>
              <Textarea
                id="edit-bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Compartilhe um pouco sobre você e seus pets..."
              />
            </div>

            {/* Canil Opcional */}
            <div className="rounded-2xl border border-warm/25 bg-warm/5 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-warm" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Canil ou Criador Registrado (Opcional)
                </h4>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Para uso doméstico comum, deixe em branco.
              </p>
              <Input
                id="edit-canil"
                value={form.nome_canil}
                onChange={(e) => setForm({ ...form, nome_canil: e.target.value })}
                placeholder="Ex.: Canil Vale Imperial (ou deixe vazio)"
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="rounded-full text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full gradient-primary text-primary-foreground shadow-soft"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

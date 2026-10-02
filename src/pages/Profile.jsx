import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Camera,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem.");
      return;
    }

    const toastId = toast.loading("Comprimindo e salvando foto de perfil...");
    try {
      const compressed = await compressImage(file, 400, 400, 0.8);
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

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-foreground py-12 text-primary-foreground">
        <div className="blob -left-20 top-0 h-[320px] w-[320px] bg-primary/40 animate-blob" />
        <div className="blob -right-10 bottom-0 h-[280px] w-[280px] bg-warm/30" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container relative">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            {/* Avatar with Camera Button */}
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-background/20 shadow-glow ring-4 ring-primary/40">
                <AvatarImage src={form.foto_url} alt={form.nome} />
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {initialsFrom(form.nome || form.email)}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Alterar foto de perfil"
                aria-label="Alterar foto de perfil"
                className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-all duration-300 hover:scale-110 hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground ring-1 ring-primary/40">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Tutor Oficial LivePet
                </span>
                {form.nome_canil && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warm/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-warm ring-1 ring-warm/40">
                    <Building2 className="h-3.5 w-3.5 text-warm" />
                    {form.nome_canil}
                  </span>
                )}
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {form.nome || "Tutor Responsável"}
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/75">
                {form.email} · Membro desde {memberSinceYear}
              </p>
              {form.cidade && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary-foreground/70">
                  <MapPin className="h-3 w-3" />
                  {form.cidade}
                  {form.estado ? `, ${form.estado}` : ""}
                </p>
              )}
            </div>

            {/* Quick counters */}
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
                <p className="font-display text-2xl font-bold text-primary-foreground">
                  {pets.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">
                  {pets.length === 1 ? "Pet Protegido" : "Pets Protegidos"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Form: Edit Profile */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/60 p-0 shadow-card">
            <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                <User className="h-4 w-4 text-primary" />
                Dados Pessoais do Tutor
              </h2>
              <p className="text-xs text-muted-foreground">
                Informações de contato e identificação da sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    E-mail (Login)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      value={form.email}
                      disabled
                      className="pl-9 bg-muted/50 cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Telefone / WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="telefone"
                      value={form.telefone}
                      onChange={(e) =>
                        setForm({ ...form, telefone: e.target.value })
                      }
                      placeholder="(62) 99999-0000"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cidade
                  </Label>
                  <Input
                    id="cidade"
                    value={form.cidade}
                    onChange={(e) =>
                      setForm({ ...form, cidade: e.target.value })
                    }
                    placeholder="Ex.: Goiânia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Estado (UF)
                  </Label>
                  <Input
                    id="estado"
                    value={form.estado}
                    onChange={(e) =>
                      setForm({ ...form, estado: e.target.value.toUpperCase() })
                    }
                    maxLength={2}
                    placeholder="Ex.: GO"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sobre você / Bio (Opcional)
                </Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Compartilhe um pouco sobre você e seus animais de estimação..."
                />
              </div>

              {/* Informação opcional de Criador / Canil */}
              <div className="rounded-2xl border border-warm/25 bg-warm/5 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-warm" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    Identificação de Criador / Canil ou Gatil (Opcional)
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preencha apenas se você criar animais de raça pura com afixo ou registro de canil. Para uso doméstico comum, você pode deixar este campo em branco.
                </p>

                <div className="mt-4">
                  <Label htmlFor="nome_canil" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nome do Canil ou Gatil
                  </Label>
                  <Input
                    id="nome_canil"
                    value={form.nome_canil}
                    onChange={(e) =>
                      setForm({ ...form, nome_canil: e.target.value })
                    }
                    placeholder="Ex.: Canil Vale Imperial (ou deixe em branco)"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-full gradient-primary px-6 text-primary-foreground shadow-soft transition-bounce hover:scale-[1.02]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando alterações...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Salvar Perfil
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Quick Pets Summary & Shortcuts */}
        <div className="space-y-6">
          <Card className="border-border/60 p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-bold text-foreground">
                  Seus Pets ({pets.length})
                </h3>
              </div>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-primary"
              >
                <Link to="/pets/novo">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
                </Link>
              </Button>
            </div>

            {pets.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm font-medium">Nenhum pet cadastrado.</p>
                <p className="mt-1 text-xs">
                  Cadastre seu animal para gerar o cartão digital e acompanhar a saúde.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-4 rounded-full gradient-primary text-primary-foreground"
                >
                  <Link to="/pets/novo">
                    <Plus className="mr-1.5 h-4 w-4" /> Cadastrar Pet
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-border/50">
                {pets.map((pet) => {
                  const isCat = pet.especie?.toLowerCase() === "gato";
                  const fallbackImg = isCat ? petDefaultCat : petDefaultDog;
                  const petImg = pet.foto_url || fallbackImg;

                  return (
                    <div
                      key={pet.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <img
                        src={petImg}
                        alt={pet.nome}
                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-border/60"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-bold text-foreground">
                          {pet.nome}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {pet.especie} {pet.raca ? `· ${pet.raca}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                          title="Cartão Virtual"
                        >
                          <Link to={`/cartao?id=${pet.id}`}>
                            <QrCode className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-warm"
                          title="Pedigree"
                        >
                          <Link to={`/pedigree?petId=${pet.id}`}>
                            <Award className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 border-t border-border/60 pt-3">
              <Button asChild variant="outline" className="w-full rounded-full text-xs">
                <Link to="/pets">
                  Ver todos na aba Pets
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Pedigree & Safety info banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-4">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Linhagem & Pedigree
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Em breve você poderá autorizar e vincular a paternidade e maternidade de filhotes diretamente entre tutores oficiais LivePet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

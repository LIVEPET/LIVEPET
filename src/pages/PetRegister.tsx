import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PawPrint,
  Camera,
  Dog,
  Heart,
  Weight as WeightIcon,
  Ruler,
  Tag,
  Activity,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const petSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do pet").max(60),
  species: z.string().trim().min(1, "Selecione a espécie").max(40),
  breed: z.string().trim().max(60).optional().or(z.literal("")),
  size: z.enum(["Pequeno", "Médio", "Grande"], {
    errorMap: () => ({ message: "Selecione o porte" }),
  }),
  gender: z.enum(["Macho", "Fêmea"], {
    errorMap: () => ({ message: "Selecione o sexo" }),
  }),
  weight: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v.replace(",", "."))) && Number(v.replace(",", ".")) > 0), {
      message: "Peso inválido",
    }),
  status: z.enum(["Ativo", "Inativo", "Em Tratamento"]),
});

const SPECIES = ["Cachorro", "Gato", "Ave", "Roedor", "Réptil", "Outro"];

const PetRegister = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    species: "Cachorro",
    breed: "",
    size: "" as "" | "Pequeno" | "Médio" | "Grande",
    gender: "" as "" | "Macho" | "Fêmea",
    weight: "",
    status: "Ativo" as "Ativo" | "Inativo" | "Em Tratamento",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      setCheckingAuth(false);
      if (!uid) {
        toast.error("Você precisa estar logado para cadastrar um pet.");
        navigate("/login");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handlePhoto = (file: File | null) => {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const reset = () => {
    setForm({
      name: "",
      species: "Cachorro",
      breed: "",
      size: "",
      gender: "",
      weight: "",
      status: "Ativo",
    });
    setPhotoFile(null);
    setPhotoPreview("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Sessão expirada. Faça login novamente.");
      navigate("/login");
      return;
    }

    const parsed = petSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Verifique os campos obrigatórios.");
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("pet-photos")
          .upload(path, photoFile, { upsert: false, contentType: photoFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("pet-photos").getPublicUrl(path);
        photo_url = pub.publicUrl;
      }

      const { error: insErr } = await supabase.from("pets").insert({
        user_id: userId,
        name: parsed.data.name,
        species: parsed.data.species,
        breed: parsed.data.breed || null,
        size: parsed.data.size,
        gender: parsed.data.gender,
        weight: parsed.data.weight ? Number(parsed.data.weight.replace(",", ".")) : null,
        status: parsed.data.status,
        photo_url,
      });
      if (insErr) throw insErr;

      toast.success(`${parsed.data.name} foi cadastrado(a) com sucesso!`, {
        description: "O pet já está disponível em Meus Pets.",
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      reset();
      setTimeout(() => navigate("/pets"), 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error("Não foi possível cadastrar o pet.", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-primary-soft">
      <main className="container py-10">
        <div className="mb-8">
          <Link
            to="/pets"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para Meus Pets
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
              <PawPrint className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Cadastrar novo pet
              </h1>
              <p className="text-muted-foreground">
                Preencha as informações abaixo. Campos com * são obrigatórios.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* PHOTO CARD */}
          <Card className="border-border/60 p-6 shadow-card">
            <SectionTitle icon={Camera} title="Foto do pet" />
            <div className="mt-4">
              {photoPreview ? (
                <div className="relative overflow-hidden rounded-2xl">
                  <img src={photoPreview} alt="Pré-visualização" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handlePhoto(null)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Remover foto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-6 text-center text-muted-foreground transition-smooth hover:border-primary hover:bg-primary-soft/40 hover:text-primary"
                >
                  <Camera className="mb-3 h-10 w-10" />
                  <p className="text-sm font-semibold">Adicionar foto</p>
                  <p className="text-xs">JPG ou PNG, até 5MB</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
              />
              {photoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Trocar foto
                </Button>
              )}
            </div>
          </Card>

          {/* FIELDS */}
          <div className="space-y-6">
            <Card className="border-border/60 p-6 shadow-card sm:p-8">
              <SectionTitle icon={Tag} title="Identificação" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nome do pet *" error={errors.name} icon={Heart}>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex.: Thor"
                    maxLength={60}
                  />
                </Field>
                <Field label="Espécie *" error={errors.species} icon={Dog}>
                  <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPECIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Raça" error={errors.breed} icon={PawPrint}>
                  <Input
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    placeholder="Ex.: Golden Retriever"
                    maxLength={60}
                  />
                </Field>
                <Field label="Sexo *" error={errors.gender}>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v as "Macho" | "Fêmea" })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Macho">Macho</SelectItem>
                      <SelectItem value="Fêmea">Fêmea</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Card>

            <Card className="border-border/60 p-6 shadow-card sm:p-8">
              <SectionTitle icon={Activity} title="Características físicas" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Porte *" error={errors.size} icon={Ruler}>
                  <Select
                    value={form.size}
                    onValueChange={(v) => setForm({ ...form, size: v as "Pequeno" | "Médio" | "Grande" })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione o porte" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pequeno">Pequeno</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Peso (kg)" error={errors.weight} icon={WeightIcon}>
                  <Input
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="Ex.: 12.5"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Status do pet *" error={errors.status} icon={Activity}>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as "Ativo" | "Inativo" | "Em Tratamento" })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em Tratamento">Em Tratamento</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => navigate("/pets")}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full gradient-primary px-8 text-primary-foreground shadow-soft hover:shadow-glow"
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  <>Salvar Cadastro</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
  <div className="flex items-center gap-2">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
      <Icon className="h-4 w-4" />
    </span>
    <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
  </div>
);

const Field = ({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
      {label}
    </Label>
    {children}
    {error && <p className="text-xs font-medium text-destructive">{error}</p>}
  </div>
);

export default PetRegister;

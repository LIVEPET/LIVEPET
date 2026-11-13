import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Camera, CheckCircle2, Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authService } from "@/services/api";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { FIELD_LABEL_CLASS, buildUpdatePayload, formFromUser, initialsFrom } from "@/components/profile/profileUtils";
import { LIMITES, UFS, profileSchema } from "@/components/profile/profileSchema";
import { preparePhoto } from "@/components/profile/profilePhoto";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Página dedicada para edição de perfil do tutor (/perfil/editar).
 * Substitui o antigo modal de edição por uma tela cheia responsiva e limpa.
 */
const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const photoInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(() => authService.getCurrentUser());

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: formFromUser(user),
    mode: "onChange",
  });

  const {
    watch,
    setValue,
    setFocus,
    reset,
    handleSubmit,
    formState: { isValid, isDirty },
  } = form;

  // Carrega os dados mais recentes do tutor ao abrir a página
  useEffect(() => {
    let active = true;
    authService
      .getMe()
      .then((data) => {
        if (active && data) {
          setUser(data);
          reset(formFromUser(data));
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar dados do tutor para edição:", err);
      });
    return () => {
      active = false;
    };
  }, [reset]);

  // Foco automático no campo especificado (ex.: ?campo=telefone ou state.focusField)
  useEffect(() => {
    const focusField =
      location.state?.focusField || new URLSearchParams(location.search).get("campo");
    if (focusField) {
      setTimeout(() => setFocus(focusField), 50);
    }
  }, [location, setFocus]);

  const [nome, email, fotoUrl, bio] = watch(["nome", "email", "foto_url", "bio"]);

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const preview = await preparePhoto(file);
    if (preview) {
      setValue("foto_url", preview, { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const updated = await authService.updateMe(buildUpdatePayload(values));
      setUser(updated);
      toast.success("Perfil salvo com sucesso!", { icon: <CheckCircle2 className="h-4 w-4" /> });
      navigate("/perfil");
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error("Não foi possível salvar o perfil.", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 sm:pt-12">
      <div className="container max-w-2xl space-y-6">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o perfil
          </Button>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold">Editar Perfil do Tutor</h1>
          <p className="text-muted-foreground">
            Atualize seus dados pessoais, telefone de contato e foto do perfil.
          </p>
        </div>

        <Card className="border-border/70 shadow-card">
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                {/* Foto de Perfil */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/60">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/40">
                    <AvatarImage src={fotoUrl} alt={nome} />
                    <AvatarFallback className="bg-primary-soft text-lg font-bold text-primary">
                      {initialsFrom(nome || email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <p className={FIELD_LABEL_CLASS}>Foto de Perfil</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => photoInputRef.current?.click()}
                      className="rounded-full text-xs"
                    >
                      <Camera className="mr-1.5 h-3.5 w-3.5" />
                      Carregar nova foto
                    </Button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoPick}
                      data-testid="foto-modal-input"
                    />
                    {fotoUrl !== (user?.foto_url || "") && (
                      <p className="text-[11px] text-muted-foreground">
                        A foto nova será salva ao confirmar as alterações.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={FIELD_LABEL_CLASS}>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Seu nome" maxLength={LIMITES.nome} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={FIELD_LABEL_CLASS}>E-mail (Login)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="bg-muted/50 cursor-not-allowed opacity-80"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={FIELD_LABEL_CLASS}>Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="(63) 99999-0000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={FIELD_LABEL_CLASS}>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex.: Palmas" maxLength={LIMITES.cidade} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={FIELD_LABEL_CLASS}>Estado (UF)</FormLabel>
                        <FormControl>
                          <select {...field} className={SELECT_CLASS}>
                            <option value="">Selecione</option>
                            {field.value && !UFS.includes(field.value) && (
                              <option value={field.value}>{field.value}</option>
                            )}
                            {UFS.map((uf) => (
                              <option key={uf} value={uf}>
                                {uf}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className={FIELD_LABEL_CLASS}>
                          Bio / Apresentação (Opcional)
                        </FormLabel>
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            (bio?.length ?? 0) > LIMITES.bio
                              ? "font-semibold text-destructive"
                              : "text-muted-foreground",
                          )}
                          aria-live="polite"
                        >
                          {bio?.length ?? 0}/{LIMITES.bio}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Conte um pouco sobre você e seus pets..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Canil Opcional */}
                <div className="rounded-2xl border border-warm/25 bg-warm/5 p-4">
                  <FormField
                    control={form.control}
                    name="nome_canil"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-foreground">
                          <Building2 className="h-4 w-4 text-warm" />
                          Canil ou Criador Registrado (Opcional)
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Para uso doméstico comum, deixe em branco.
                        </p>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex.: Canil Vale Imperial (ou deixe vazio)"
                            maxLength={LIMITES.nome_canil}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/perfil")}
                    className="rounded-full text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !isValid}
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
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;

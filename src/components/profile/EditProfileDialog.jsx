import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Camera, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { FIELD_LABEL_CLASS, formFromUser, initialsFrom } from "./profileUtils";
import { LIMITES, UFS, profileSchema } from "./profileSchema";

// Mesmo visual do <Input>, para o <select> nativo de UF (no celular abre a lista do próprio sistema).
const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm";

// Modal de edição do perfil, com React Hook Form + Zod (regras em profileSchema.js).
// Cancelar descarta na hora; fechar no X, no Esc ou fora do modal pergunta antes se algo mudou.
const EditProfileDialog = ({ open, user, saving, onSave, onDiscard, onPickPhoto }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: formFromUser(user),
    mode: "onChange",
  });
  const { reset, setValue, trigger, watch } = form;
  // Lidos durante o render para o React Hook Form acompanhar esses dois estados.
  const { isDirty, isValid } = form.formState;

  // Toda vez que o modal abre, o formulário volta para os dados salvos do tutor.
  // O trigger() mostra na hora se algum dado antigo está fora das regras (ex.: UF "Goiás").
  useEffect(() => {
    if (!open) return;
    reset(formFromUser(user));
    trigger();
    // Só ao abrir: rodar de novo quando o tutor muda apagaria o que está sendo digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A foto escolhida pelo botão "Carregar nova foto" já é salva na hora; aqui só atualiza a prévia.
  const fotoSalva = user?.foto_url || "";
  useEffect(() => {
    if (open) setValue("foto_url", fotoSalva, { shouldDirty: false });
  }, [open, fotoSalva, setValue]);

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) return;
    if (isDirty) setConfirmOpen(true);
    else onDiscard();
  };

  const confirmDiscard = () => {
    setConfirmOpen(false);
    onDiscard();
  };

  const [nome, email, fotoUrl, bio] = watch(["nome", "email", "foto_url", "bio"]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} noValidate className="space-y-4 pt-2">
              {/* Foto de Perfil */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <Avatar className="h-16 w-16 ring-2 ring-primary/40">
                  <AvatarImage src={fotoUrl} alt={nome} />
                  <AvatarFallback className="bg-primary-soft text-lg font-bold text-primary">
                    {initialsFrom(nome || email)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <p className={FIELD_LABEL_CLASS}>Foto de Perfil</p>
                  <Button type="button" size="sm" variant="outline" onClick={onPickPhoto} className="rounded-full text-xs">
                    <Camera className="mr-1.5 h-3.5 w-3.5" />
                    Carregar nova foto
                  </Button>
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
                        <Input {...field} disabled className="bg-muted/50 cursor-not-allowed opacity-80" />
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
                          {/* Valor antigo fora da lista continua visível até o tutor escolher uma UF */}
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
                      <FormLabel className={FIELD_LABEL_CLASS}>Bio / Apresentação (Opcional)</FormLabel>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          (bio?.length ?? 0) > LIMITES.bio ? "font-semibold text-destructive" : "text-muted-foreground",
                        )}
                        aria-live="polite"
                      >
                        {bio?.length ?? 0}/{LIMITES.bio}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Conte um pouco sobre você e seus pets..." />
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
                      <p className="text-xs text-muted-foreground">Para uso doméstico comum, deixe em branco.</p>
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

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onDiscard} className="rounded-full text-xs">
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você mudou dados do perfil e ainda não salvou. Se sair agora, essas mudanças serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="rounded-full">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditProfileDialog;

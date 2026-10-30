import { useState } from "react";
import { Building2, Camera, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { FIELD_LABEL_CLASS, initialsFrom } from "./profileUtils";

// Modal de edição do perfil. O estado do formulário fica na página e chega por props.
// Cancelar descarta na hora; fechar no X, no Esc ou fora do modal pergunta antes se algo mudou.
const EditProfileDialog = ({ open, isDirty, onDiscard, form, setForm, saving, onSubmit, onPickPhoto }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) return;
    if (isDirty) setConfirmOpen(true);
    else onDiscard();
  };

  const confirmDiscard = () => {
    setConfirmOpen(false);
    onDiscard();
  };

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

          <form onSubmit={onSubmit} className="space-y-4 pt-2">
            {/* Foto de Perfil */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 border border-border/60">
              <Avatar className="h-16 w-16 ring-2 ring-primary/40">
                <AvatarImage src={form.foto_url} alt={form.nome} />
                <AvatarFallback className="bg-primary-soft text-lg font-bold text-primary">
                  {initialsFrom(form.nome || form.email)}
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
              <div className="space-y-1.5">
                <Label htmlFor="edit-nome" className={FIELD_LABEL_CLASS}>
                  Nome Completo *
                </Label>
                <Input id="edit-nome" value={form.nome} onChange={setField("nome")} placeholder="Seu nome" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className={FIELD_LABEL_CLASS}>
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
                <Label htmlFor="edit-tel" className={FIELD_LABEL_CLASS}>
                  Telefone / WhatsApp
                </Label>
                <Input id="edit-tel" value={form.telefone} onChange={setField("telefone")} placeholder="(62) 99999-0000" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-cidade" className={FIELD_LABEL_CLASS}>
                  Cidade
                </Label>
                <Input id="edit-cidade" value={form.cidade} onChange={setField("cidade")} placeholder="Ex.: Goiânia" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-estado" className={FIELD_LABEL_CLASS}>
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
              <Label htmlFor="edit-bio" className={FIELD_LABEL_CLASS}>
                Bio / Apresentação (Opcional)
              </Label>
              <Textarea
                id="edit-bio"
                rows={3}
                value={form.bio}
                onChange={setField("bio")}
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
              <p className="mt-1 text-xs text-muted-foreground">Para uso doméstico comum, deixe em branco.</p>
              <Input
                id="edit-canil"
                value={form.nome_canil}
                onChange={setField("nome_canil")}
                placeholder="Ex.: Canil Vale Imperial (ou deixe vazio)"
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onDiscard} className="rounded-full text-xs">
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

import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initialsFrom } from "./profileUtils";

// Mostra como a foto nova vai ficar antes de salvar. Nada é enviado até clicar em "Salvar foto".
const PhotoPreviewDialog = ({ photo, nome, saving, onConfirm, onCancel }) => (
  <Dialog open={Boolean(photo)} onOpenChange={(open) => !open && !saving && onCancel()}>
    <DialogContent className="max-w-sm rounded-3xl p-6">
      <DialogHeader>
        <DialogTitle className="font-display text-lg font-bold">Nova foto de perfil</DialogTitle>
        <DialogDescription className="text-xs">Veja como ela vai aparecer no seu perfil.</DialogDescription>
      </DialogHeader>

      <div className="flex justify-center py-2">
        <Avatar className="h-36 w-36 ring-4 ring-primary/30">
          <AvatarImage src={photo || undefined} alt="Pré-visualização da nova foto" className="object-cover" />
          <AvatarFallback className="bg-primary-soft text-3xl font-bold text-primary">{initialsFrom(nome)}</AvatarFallback>
        </Avatar>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving} className="rounded-full text-xs">
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
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
              Salvar foto
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default PhotoPreviewDialog;

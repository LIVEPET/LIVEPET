import { BadgeCheck, PhoneMissed } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { profileCompleteness } from "@/lib/profileCompleteness";

// Barra "Perfil X% completo" e alerta de telefone (#158). Os pesos ficam em src/lib/profileCompleteness.js.
const ProfileCompleteness = ({ user, onCompletePhone, onEdit }) => {
  const { percentual, faltando, semTelefone } = profileCompleteness(user);

  if (percentual === 100) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Perfil completo
      </span>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="mx-auto max-w-sm space-y-1.5 md:mx-0">
        <div className="flex items-center justify-between text-xs">
          <span id="perfil-completo-rotulo" className="font-semibold text-foreground">
            Perfil {percentual}% completo
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="rounded text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Completar
          </button>
        </div>
        <Progress value={percentual} aria-labelledby="perfil-completo-rotulo" className="h-2" />
        <p className="text-[11px] text-muted-foreground">Falta: {faltando.join(", ")}</p>
      </div>

      {semTelefone && (
        <Alert className="mx-auto max-w-xl border-amber-300 bg-amber-50 text-left text-amber-950 md:mx-0 [&>svg]:text-amber-700">
          <PhoneMissed className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Cadastre um telefone de emergência</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Sem telefone, quem achar seu pet e escanear o QR Code não tem como falar com você.</p>
            <Button
              type="button"
              size="sm"
              onClick={onCompletePhone}
              className="rounded-full bg-amber-700 text-white hover:bg-amber-800"
            >
              Adicionar telefone
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfileCompleteness;

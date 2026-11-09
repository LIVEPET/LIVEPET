import { AlertTriangle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Aviso de falha ao carregar dados, com botão para tentar de novo.
const LoadErrorAlert = ({ title, description = "Verifique sua conexão e tente de novo.", onRetry }) => (
  <Alert variant="destructive" className="rounded-2xl">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle className="font-semibold">{title}</AlertTitle>
    <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-muted-foreground">{description}</span>
      <Button type="button" size="sm" variant="outline" onClick={onRetry} className="rounded-full">
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Tentar de novo
      </Button>
    </AlertDescription>
  </Alert>
);

export default LoadErrorAlert;

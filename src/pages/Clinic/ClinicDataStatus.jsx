import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClinic } from "@/contexts/ClinicContext";

// Faixa de carregamento e erro das telas da clínica (#62).
// Mostra esqueleto enquanto a API responde pela primeira vez e um aviso com
// "Tentar de novo" quando nada pôde ser carregado. Com dados já na tela, fica invisível.
const ClinicDataStatus = ({ hasData = false, rows = 3 }) => {
  const { loading, error, refreshData } = useClinic();

  if (error) {
    return (
      <Alert variant="destructive" role="alert" data-testid="clinic-data-error">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Não foi possível carregar os dados</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{error}</span>
          <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={() => refreshData()}>
            <RefreshCw className="h-3.5 w-3.5" /> Tentar de novo
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (loading && !hasData) {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-label="Carregando dados da clínica" data-testid="clinic-data-loading">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return null;
};

export default ClinicDataStatus;

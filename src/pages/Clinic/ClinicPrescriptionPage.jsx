import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { PrescriptionSheetContent } from "./ClinicPrescription";

/**
 * Página dedicada para visualização do Receituário Veterinário Timbrado (/clinica/prescricao/:id).
 * Substitui o antigo modal de receita por visualização em tela cheia otimizada para impressão.
 */
const ClinicPrescriptionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appointments, profile } = useClinic();

  const appointment = useMemo(
    () => appointments.find((a) => String(a.id) === String(id)),
    [appointments, id],
  );

  if (!appointment) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/clinica/agenda")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a agenda
        </Button>
        <Card className="p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h2 className="font-display text-xl font-bold">Atendimento não encontrado</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Não foi possível localizar o atendimento para carregar o receituário.
          </p>
          <Button className="mt-4 rounded-full" onClick={() => navigate("/clinica/agenda")}>
            Ir para a agenda
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/clinica/agenda")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a agenda
        </Button>
      </div>

      <Card className="border-border/70 shadow-card p-6 sm:p-8">
        <PrescriptionSheetContent
          appointment={appointment}
          profile={profile}
          onClose={() => navigate("/clinica/agenda")}
        />
      </Card>
    </div>
  );
};

export default ClinicPrescriptionPage;


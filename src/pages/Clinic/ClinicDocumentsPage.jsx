import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileBadge, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { ClinicalDocumentsContent } from "./ClinicDocuments";

/**
 * Página dedicada para emissão de Documentos Clínicos Timbrados (/clinica/documentos/:id).
 * Substitui o antigo modal de documentos por uma tela cheia com alta legibilidade.
 */
const ClinicDocumentsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appointments, profile, patients } = useClinic();

  const appointment = useMemo(
    () => appointments.find((a) => String(a.id) === String(id)),
    [appointments, id],
  );

  const patient = useMemo(
    () =>
      patients.find(
        (p) => String(p.id) === String(appointment?.patientId) || String(p.id) === String(id),
      ),
    [patients, appointment, id],
  );

  if (!appointment && !patient) {
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
          <h2 className="font-display text-xl font-bold">Registro não encontrado</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Não foi possível localizar os dados do paciente ou atendimento para emissão do documento.
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
        <ClinicalDocumentsContent
          appointment={appointment}
          patient={patient}
          appointments={appointments}
          profile={profile}
          onClose={() => navigate("/clinica/agenda")}
        />
      </Card>
    </div>
  );
};

export default ClinicDocumentsPage;


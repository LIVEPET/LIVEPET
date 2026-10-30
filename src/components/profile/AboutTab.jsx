import { Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import SecurityCard from "./SecurityCard";

const InfoItem = ({ label, value }) => (
  <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 font-semibold text-foreground">{value || "Não informado"}</p>
  </div>
);

// Aba "Sobre": dados de contato e emergência do tutor.
const AboutTab = ({ currentUser, onEdit }) => (
  <TabsContent value="sobre" className="pt-6 space-y-6">
    <Card className="p-6 border-border/60 shadow-soft space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">
          Informações de Emergência e Contato do Tutor
        </h3>
        <p className="text-xs text-muted-foreground">
          Dados usados para identificação e contato rápido caso seu animal se perca e tenha o QR Code escaneado.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <InfoItem label="Nome Completo" value={currentUser?.nome} />
        <InfoItem label="E-mail Oficial" value={currentUser?.email} />
        <InfoItem label="Telefone / WhatsApp de Resgate" value={currentUser?.telefone} />
        <InfoItem
          label="Cidade / Região"
          value={currentUser?.cidade ? `${currentUser.cidade}, ${currentUser.estado || ""}` : ""}
        />
      </div>

      {currentUser?.nome_canil && (
        <div className="rounded-2xl border border-warm/30 bg-warm/10 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-warm" />
            <h4 className="font-display text-sm font-bold text-foreground">Canil ou Gatil Registrado</h4>
          </div>
          <p className="mt-1 font-semibold text-warm">{currentUser.nome_canil}</p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={onEdit} className="rounded-full gradient-primary text-primary-foreground shadow-soft">
          <Pencil className="mr-1.5 h-4 w-4" />
          Editar Dados Cadastrais
        </Button>
      </div>
    </Card>

    <SecurityCard />
  </TabsContent>
);

export default AboutTab;

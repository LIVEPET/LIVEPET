import { Award, Grid3X3, User } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TAB_TRIGGER_CLASS } from "./profileUtils";

// Barra com as 3 abas do perfil. Todas usam a mesma classe (TAB_TRIGGER_CLASS).
// Contagem null (pets não carregaram) esconde o número em vez de mostrar 0.
const contagem = (n) => (n === null ? "" : ` (${n})`);

const ProfileTabsNav = ({ petsCount, pedigreesCount }) => (
  <div className="flex justify-center border-b border-border/60">
    <TabsList className="bg-transparent gap-8 h-12">
      <TabsTrigger value="pets" className={TAB_TRIGGER_CLASS}>
        <Grid3X3 className="h-4 w-4" />
        Meus Pets{contagem(petsCount)}
      </TabsTrigger>
      <TabsTrigger value="pedigrees" className={TAB_TRIGGER_CLASS}>
        <Award className="h-4 w-4" />
        Pedigrees{contagem(pedigreesCount)}
      </TabsTrigger>
      <TabsTrigger value="sobre" className={TAB_TRIGGER_CLASS}>
        <User className="h-4 w-4" />
        Sobre
      </TabsTrigger>
    </TabsList>
  </div>
);

export default ProfileTabsNav;

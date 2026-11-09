import { Award, Grid3X3, User } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TAB_TRIGGER_CLASS } from "./profileUtils";

// Barra com as 3 abas do perfil. Todas usam a mesma classe (TAB_TRIGGER_CLASS).
// Contagem null (pets não carregaram) esconde o número em vez de mostrar 0.
const contagem = (n) => (n === null ? "" : ` (${n})`);

const ProfileTabsNav = ({ petsCount, pedigreesCount }) => (
  // Em 375 px as 3 abas cabem com gap menor; se não couberem, a barra rola sem empurrar a página (#157).
  <div className="-mx-4 overflow-x-auto border-b border-border/60 px-4 sm:mx-0 sm:px-0">
    <TabsList className="flex h-12 w-max min-w-full justify-center gap-1 bg-transparent sm:gap-8">
      <TabsTrigger value="pets" className={TAB_TRIGGER_CLASS}>
        <Grid3X3 className="hidden h-4 w-4 sm:block" aria-hidden="true" />
        Meus Pets{contagem(petsCount)}
      </TabsTrigger>
      <TabsTrigger value="pedigrees" className={TAB_TRIGGER_CLASS}>
        <Award className="hidden h-4 w-4 sm:block" aria-hidden="true" />
        Pedigrees{contagem(pedigreesCount)}
      </TabsTrigger>
      <TabsTrigger value="sobre" className={TAB_TRIGGER_CLASS}>
        <User className="hidden h-4 w-4 sm:block" aria-hidden="true" />
        Sobre
      </TabsTrigger>
    </TabsList>
  </div>
);

export default ProfileTabsNav;

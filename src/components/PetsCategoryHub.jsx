import { Link, useLocation } from "react-router-dom";
import { PawPrint, Award, ClipboardList, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Hub de Navegação Padronizado da Categoria Pets
 * Utilizado de forma idêntica em:
 * 1. Meus Pets (/pets)
 * 2. Pedigree & Linhagem (/pedigree)
 * 3. Tarefas da Rotina (/tasks)
 * 4. Cartão Digital (/cartao)
 */
const PetsCategoryHub = ({ petsCount = null, className = "" }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isPetsActive =
    pathname === "/pets" ||
    (pathname.startsWith("/pets/") && pathname !== "/pets/novo");
  const isPedigreeActive = pathname.startsWith("/pedigree");
  const isTasksActive = pathname.startsWith("/tasks");
  const isCartaoActive = pathname.startsWith("/cartao");

  const activeClass =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold gradient-primary text-primary-foreground shadow-sm transition-smooth";
  const inactiveClass =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth";

  return (
    <div className={`mx-auto mb-8 flex justify-center ${className}`}>
      <div className="inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-border/80 bg-card/80 p-1.5 shadow-sm backdrop-blur">
        <Link to="/pets" className={isPetsActive ? activeClass : inactiveClass}>
          <PawPrint className="h-4 w-4" /> Meus Pets
          {petsCount !== null && (
            <Badge
              variant={isPetsActive ? "secondary" : "outline"}
              className={`ml-1 h-5 rounded-full px-1.5 text-[10px] ${
                isPetsActive
                  ? "bg-white/20 text-white border-transparent"
                  : ""
              }`}
            >
              {petsCount}
            </Badge>
          )}
        </Link>

        <Link
          to="/pedigree"
          className={isPedigreeActive ? activeClass : inactiveClass}
        >
          <Award className="h-4 w-4" /> Pedigree & Linhagem
        </Link>

        <Link
          to="/tasks"
          className={isTasksActive ? activeClass : inactiveClass}
        >
          <ClipboardList className="h-4 w-4" /> Tarefas da Rotina
        </Link>

        <Link
          to="/cartao"
          className={isCartaoActive ? activeClass : inactiveClass}
        >
          <FileText className="h-4 w-4" /> Cartão Digital
        </Link>
      </div>
    </div>
  );
};

export default PetsCategoryHub;

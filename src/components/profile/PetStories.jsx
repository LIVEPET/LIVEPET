import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { getPetPhoto } from "@/lib/petPlaceholder";

// Bolhas circulares dos pets, no estilo "destaques" de rede social.
const PetStories = ({ pets }) => (
  <div className="py-6 border-b border-border/60 overflow-x-auto">
    <div className="flex items-center gap-5 px-1 min-w-max">
      {/* Bolha para adicionar pet */}
      <Link to="/pets/novo" className="flex flex-col items-center gap-1.5 group">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-primary-soft/50 transition-all duration-300 group-hover:scale-105 group-hover:border-primary">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary">
          Adicionar
        </span>
      </Link>

      {/* Bolhas para cada pet do tutor */}
      {pets.map((pet) => (
        <Link
          key={pet.id}
          to={`/cartao?id=${pet.id}`}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div className="h-16 w-16 rounded-full p-[2px] ring-2 ring-primary/40 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary">
            <img
              src={getPetPhoto(pet.foto_url)}
              alt={pet.nome}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <span className="text-[11px] font-semibold text-foreground truncate max-w-[70px]">
            {pet.nome}
          </span>
        </Link>
      ))}
    </div>
  </div>
);

export default PetStories;

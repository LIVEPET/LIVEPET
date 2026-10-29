import { Link } from "react-router-dom";
import { PawPrint, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { getPetPhoto } from "@/lib/petPlaceholder";

// Aba "Meus Pets": grade de fotos no estilo feed.
const PetsGridTab = ({ pets }) => (
  <TabsContent value="pets" className="pt-6">
    {pets.length === 0 ? (
      <Card className="py-16 text-center border-dashed">
        <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-display text-lg font-bold text-foreground">
          Nenhum pet cadastrado ainda
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
          Cadastre seus animais de estimação para gerenciar vacinas, cartão virtual e pedigree oficial.
        </p>
        <Button asChild className="mt-6 rounded-full gradient-primary text-primary-foreground shadow-soft">
          <Link to="/pets/novo">
            <Plus className="mr-1.5 h-4 w-4" /> Cadastrar primeiro pet
          </Link>
        </Button>
      </Card>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
        {pets.map((pet) => (
          <article
            key={pet.id}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted cursor-pointer shadow-soft transition-all duration-300 hover:shadow-glow"
          >
            <img
              src={getPetPhoto(pet.foto_url)}
              alt={pet.nome}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Overlay estilo Instagram ao passar o mouse */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 sm:p-4 text-white">
              <div className="flex justify-between items-start">
                <span className="rounded-full bg-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase">
                  {pet.especie}
                </span>
                <span className="font-mono text-[10px] font-bold text-primary-foreground/80">
                  #{pet.id}
                </span>
              </div>

              <div className="text-center">
                <p className="font-display text-base sm:text-lg font-bold">{pet.nome}</p>
                <p className="text-[11px] text-white/80 truncate">
                  {pet.raca || "SRD"} {pet.porte ? `· ${pet.porte}` : ""}
                </p>
              </div>

              {/* Ações rápidas */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button asChild size="sm" className="h-7 rounded-lg text-xs bg-white text-black hover:bg-white/90">
                  <Link to={`/cartao?id=${pet.id}`}>Cartão</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg text-xs border-white/40 text-white hover:bg-white/20"
                >
                  <Link to={`/saude?petId=${pet.id}`}>Saúde</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </TabsContent>
);

export default PetsGridTab;

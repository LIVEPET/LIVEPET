import { Link } from "react-router-dom";
import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { getPetPhoto } from "@/lib/petPlaceholder";
import { hasApprovedPedigree, hasLineage, lineageStatusLabel } from "@/lib/petBadges";
import LoadErrorAlert from "./LoadErrorAlert";

// Aba "Pedigrees": mostra só os pets que têm linhagem cadastrada, com dados reais.
const PedigreesTab = ({ pets, error, onRetry }) => {
  const petsComLinhagem = pets.filter(hasLineage);

  return (
    <TabsContent value="pedigrees" className="pt-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Certificados e Linhagens Genealógicas
            </h3>
            <p className="text-xs text-muted-foreground">
              Linhagens cadastradas para os seus pets no LivePet.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/pedigree">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-warm" />
              Acessar aba Pedigree
            </Link>
          </Button>
        </div>

        {error && <LoadErrorAlert title="Não foi possível carregar seus pets" onRetry={onRetry} />}

        {!error && petsComLinhagem.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="font-semibold text-foreground">Nenhum pedigree cadastrado ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cadastre a linhagem de um pet na aba Pedigree para ela aparecer aqui.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {petsComLinhagem.map((pet) => {
            const registro = pet.lineage.registro?.trim();

            return (
              <Card key={pet.id} className="p-4 flex items-center gap-4 border-border/60 shadow-soft">
                <img
                  src={getPetPhoto(pet.foto_url)}
                  alt={pet.nome}
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-border/60"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base font-bold text-foreground truncate">{pet.nome}</p>
                    <span
                      className={
                        hasApprovedPedigree(pet)
                          ? "rounded-full bg-warm/20 text-warm px-2 py-0.5 text-[10px] font-bold"
                          : "rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[10px] font-semibold"
                      }
                    >
                      {lineageStatusLabel(pet)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {pet.raca || "Raça SRD"} · {pet.especie}
                  </p>
                  {registro && (
                    <p className="text-[11px] text-primary font-mono mt-0.5">Registro: {registro}</p>
                  )}
                </div>
                <Button asChild size="sm" variant="ghost" className="rounded-full text-xs">
                  <Link to={`/pedigree?petId=${pet.id}`}>
                    Ver Árvore
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </TabsContent>
  );
};

export default PedigreesTab;

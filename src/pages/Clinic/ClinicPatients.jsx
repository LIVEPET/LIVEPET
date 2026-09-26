import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Phone, Search, Syringe, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { patients } from "@/data/clinicDemo";

const ClinicPatients = () => {
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("Todos");
  const [selected, setSelected] = useState(null);

  const visible = useMemo(
    () =>
      patients.filter(
        (p) =>
          (species === "Todos" || p.species === species) &&
          `${p.name} ${p.tutor} ${p.breed}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, species],
  );

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">Pacientes</Badge>
        <h1 className="font-display text-3xl font-bold">Pacientes e histórico</h1>
        <p className="text-muted-foreground">Consulte prontuários, vacinas e alertas clínicos.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={species} onValueChange={setSpecies}>
          <TabsList>
            {["Todos", "Cão", "Gato"].map((s) => (
              <TabsTrigger key={s} value={s}>
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar pet, raça ou tutor" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer overflow-hidden border-border/70 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
            onClick={() => setSelected(p)}
          >
            <div className="relative h-40 overflow-hidden">
              <img src={p.photo} alt={`Foto de ${p.name}`} loading="lazy" className="h-full w-full object-cover" />
              {p.alerts.length > 0 && (
                <Badge className="absolute right-3 top-3 gap-1 bg-warm text-warm-foreground">
                  <AlertTriangle className="h-3 w-3" /> Atenção
                </Badge>
              )}
            </div>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg font-bold">{p.name}</p>
                <span className="text-xs text-muted-foreground">{p.age}</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.species} · {p.breed} · {p.weight}</p>
              <p className="text-sm">Tutor: <span className="text-muted-foreground">{p.tutor}</span></p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary" className="gap-1">
                  <Syringe className="h-3 w-3" /> {p.vaccinesUpToDate ? "Vacinas em dia" : "Vacina pendente"}
                </Badge>
                <Badge variant="outline">Última visita {p.lastVisit}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="font-display text-2xl">{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.species} · {selected.breed} · {selected.age} · {selected.weight}
                </SheetDescription>
              </SheetHeader>

              <img
                src={selected.photo}
                alt={`Foto de ${selected.name}`}
                className="mt-5 h-48 w-full rounded-2xl object-cover"
              />

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-sm font-semibold">Tutor responsável</p>
                  <p className="text-sm text-muted-foreground">{selected.tutor}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {selected.phone}
                  </p>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <p className="mb-2 text-sm font-semibold">Situação clínica</p>
                  <p className="flex items-center gap-2 text-sm">
                    {selected.vaccinesUpToDate ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warm" />
                    )}
                    {selected.vaccinesUpToDate ? "Carteira de vacinas em dia" : "Vacinação pendente"}
                  </p>
                  {selected.alerts.map((a) => (
                    <p key={a} className="mt-2 rounded-xl bg-warm-soft/70 px-3 py-2 text-xs">{a}</p>
                  ))}
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4" /> Histórico veterinário
                  </p>
                  <ol className="space-y-3 border-l border-border pl-5">
                    {selected.history.map((h) => (
                      <li key={h.date + h.type} className="relative">
                        <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                        <p className="text-sm font-semibold">{h.type} · {h.date}</p>
                        <p className="text-xs text-muted-foreground">{h.vet}</p>
                        <p className="text-sm text-muted-foreground">{h.summary}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <Button className="w-full rounded-full gradient-primary text-primary-foreground">
                  Registrar novo atendimento
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClinicPatients;
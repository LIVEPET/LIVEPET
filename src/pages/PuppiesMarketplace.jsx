import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  MapPin,
  Heart,
  Phone,
  Camera,
  Award,
  Sparkles,
  PawPrint,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const formatBRL = (n) =>
  Number(n).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

const INITIAL_PUPPIES = [
  {
    id: "pup-1",
    title: "Ninhada Golden Retriever — Linha de Sangue Importada",
    breed: "Golden Retriever",
    species: "Cachorro",
    ageMonths: 2,
    availableCount: 3,
    city: "São Paulo, SP",
    price: 3800,
    pedigree: true,
    pedigreeReg: "CBKC-98442",
    seller: {
      name: "Canil Golden Valley",
      phone: "(11) 98765-4321",
      verified: true,
    },
    description:
      "Filhotes vacinados com primeira dose de V10 importada, desverminados e com microchip implantado. Pais com laudo de displasia coxofemoral A.",
    img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop",
    postedDaysAgo: 2,
  },
  {
    id: "pup-2",
    title: "Filhotes Border Collie — Padrão Pastoreio e Agility",
    breed: "Border Collie",
    species: "Cachorro",
    ageMonths: 2.5,
    availableCount: 2,
    city: "Campinas, SP",
    price: 2600,
    pedigree: true,
    pedigreeReg: "CBKC-10291",
    seller: {
      name: "Sítio Collies Brasil",
      phone: "(19) 99123-4567",
      verified: true,
    },
    description:
      "Ninhada selecionada para inteligência e companhia. Já acostumados com rotina de enriquecimento ambiental.",
    img: "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=800&h=600&fit=crop",
    postedDaysAgo: 5,
  },
  {
    id: "pup-3",
    title: "Gatinhos Persa Tradicional — Pelagem Chinchila",
    breed: "Persa",
    species: "Gato",
    ageMonths: 3,
    availableCount: 1,
    city: "Curitiba, PR",
    price: 2900,
    pedigree: true,
    pedigreeReg: "CFA-44910",
    seller: {
      name: "Gatil Royal Felines",
      phone: "(41) 98877-6655",
      verified: true,
    },
    description:
      "Excelente linhagem morfológica. Negativos para PKD e FIV/FeLV por DNA. Acompanha pedigree e atestado de saúde.",
    img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop",
    postedDaysAgo: 1,
  },
];

const PuppiesMarketplace = () => {
  const [puppies, setPuppies] = useState(INITIAL_PUPPIES);
  const [query, setQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("Todas");
  const [pedigreeOnly, setPedigreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [previewPuppy, setPreviewPuppy] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formBreed, setFormBreed] = useState("");
  const [formSpecies, setFormSpecies] = useState("Cachorro");
  const [formAge, setFormAge] = useState("2");
  const [formCount, setFormCount] = useState("1");
  const [formCity, setFormCity] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPedigree, setFormPedigree] = useState(true);

  const filteredPuppies = useMemo(() => {
    let list = puppies.filter((p) => {
      if (selectedSpecies !== "Todas" && p.species !== selectedSpecies) return false;
      if (pedigreeOnly && !p.pedigree) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.breed.toLowerCase().includes(q) &&
          !p.city.toLowerCase().includes(q) &&
          !p.seller.name.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "recent") list = [...list].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);

    return list;
  }, [puppies, selectedSpecies, pedigreeOnly, query, sortBy]);

  const handlePublishAnnounce = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBreed.trim() || !formCity.trim()) {
      toast.error("Preencha os campos obrigatórios do anúncio.");
      return;
    }

    const newAd = {
      id: `pup-${Date.now()}`,
      title: formTitle.trim(),
      breed: formBreed.trim(),
      species: formSpecies,
      ageMonths: Number(formAge) || 2,
      availableCount: Number(formCount) || 1,
      city: formCity.trim(),
      price: Number(formPrice) || 0,
      pedigree: formPedigree,
      pedigreeReg: formPedigree ? "Em emissão" : null,
      seller: {
        name: "Tutor Anunciante",
        phone: "(11) 99999-0000",
        verified: true,
      },
      description: formDesc.trim() || "Filhotes criados com carinho e acompanhamento veterinário.",
      img: "https://images.unsplash.com/photo-1591769225440-811ad7d6eab2?w=800&h=600&fit=crop",
      postedDaysAgo: 0,
    };

    setPuppies((prev) => [newAd, ...prev]);
    setAnnounceOpen(false);
    toast.success("Anúncio publicado com sucesso no marketplace!");

    // Reset
    setFormTitle("");
    setFormBreed("");
    setFormCity("");
    setFormPrice("");
    setFormDesc("");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-foreground py-12 text-primary-foreground">
        <div className="blob -left-20 top-0 h-[320px] w-[320px] bg-primary/40 animate-blob" />
        <div className="blob -right-10 bottom-0 h-[280px] w-[280px] bg-warm/30" />
        <div className="container relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-warm/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-warm ring-1 ring-warm/40">
              <ShoppingBag className="h-3.5 w-3.5" />
              Marketplace Oficial LivePet
            </span>

            <Button
              onClick={() => setAnnounceOpen(true)}
              className="rounded-full bg-warm text-foreground shadow-soft hover:bg-warm/90 font-semibold"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Anunciar Filhote / Ninhada
            </Button>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-[1.08] sm:text-4xl md:text-5xl">
            Filhotes, ninhadas e criadores{" "}
            <span className="italic text-warm">verificados</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-primary-foreground/75">
            Conecte-se com criadores responsáveis e tutores da comunidade LivePet.
            Transparência com pedigree certificado e carteira vacinal.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="container py-8 space-y-6">
        {/* Filters Toolbar */}
        <Card className="rounded-2xl border bg-card p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por raça, cidade ou título..."
                className="pl-9 rounded-full h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                <SelectTrigger className="h-9 w-[130px] rounded-full text-xs">
                  <SelectValue placeholder="Espécie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas espécies</SelectItem>
                  <SelectItem value="Cachorro">Cães</SelectItem>
                  <SelectItem value="Gato">Gatos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-[140px] rounded-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="price-asc">Menor preço</SelectItem>
                  <SelectItem value="price-desc">Maior preço</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={pedigreeOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setPedigreeOnly((v) => !v)}
                className={`rounded-full h-9 text-xs ${
                  pedigreeOnly ? "gradient-primary text-primary-foreground" : ""
                }`}
              >
                <Award className="mr-1 h-3.5 w-3.5" /> Apenas com Pedigree
              </Button>
            </div>
          </div>
        </Card>

        {/* Counter */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Exibindo <strong>{filteredPuppies.length}</strong> anúncio(s)
          </p>
        </div>

        {/* Listings Grid */}
        {filteredPuppies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center max-w-md mx-auto">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="text-lg font-bold text-foreground">Nenhum anúncio encontrado</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tente alterar os termos da busca ou seja o primeiro a publicar uma ninhada.
            </p>
            <Button
              onClick={() => setAnnounceOpen(true)}
              className="mt-4 rounded-full gradient-primary text-primary-foreground"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Anunciar Filhote
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPuppies.map((p) => (
              <Card
                key={p.id}
                onClick={() => setPreviewPuppy(p)}
                className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 flex flex-col gap-1">
                    {p.pedigree && (
                      <Badge className="rounded-full bg-amber-500/90 text-white backdrop-blur text-[10px] shadow-sm">
                        <Award className="mr-1 h-3 w-3" /> Pedigree Verificado
                      </Badge>
                    )}
                  </div>
                  <Badge className="absolute right-3 bottom-3 rounded-full bg-background/95 text-foreground font-bold shadow-md text-xs">
                    {p.price > 0 ? formatBRL(p.price) : "Adoção Responsável"}
                  </Badge>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{p.breed}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.city}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      Idade: <strong>{p.ageMonths} meses</strong>
                    </span>
                    <span>
                      Disponíveis: <strong>{p.availableCount}</strong>
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal Anunciar Filhote */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="h-5 w-5 text-primary" /> Anunciar Filhote ou Ninhada
            </DialogTitle>
            <DialogDescription>
              Publique um anúncio de filhotes para a comunidade de tutores do LivePet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePublishAnnounce} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Título do Anúncio *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Filhotes Golden ninhada de janeiro..."
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Raça *</Label>
                <Input
                  value={formBreed}
                  onChange={(e) => setFormBreed(e.target.value)}
                  placeholder="Ex: Border Collie"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Espécie</Label>
                <Select value={formSpecies} onValueChange={setFormSpecies}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cachorro">Cachorro</SelectItem>
                    <SelectItem value="Gato">Gato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Idade (meses)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={formCount}
                  onChange={(e) => setFormCount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Valor (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0 p/ adoção"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Cidade e Estado *</Label>
              <Input
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="Ex: São Paulo, SP"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Descrição</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Conte sobre linhagem, vacinas aplicadas, pais..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Pedigree Oficial CBKC/LivePet</p>
                <p className="text-[11px] text-muted-foreground">Animais possuem certidão de linhagem genealógica</p>
              </div>
              <Switch checked={formPedigree} onCheckedChange={setFormPedigree} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAnnounceOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground">
                Publicar Anúncio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Preview do Anúncio */}
      <Dialog open={!!previewPuppy} onOpenChange={(o) => !o && setPreviewPuppy(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
          {previewPuppy && (
            <div>
              <div className="relative aspect-video">
                <img
                  src={previewPuppy.img}
                  alt={previewPuppy.title}
                  className="h-full w-full object-cover"
                />
                <Badge className="absolute right-3 bottom-3 rounded-full bg-background/95 text-foreground font-bold shadow-md text-sm px-3 py-1">
                  {previewPuppy.price > 0 ? formatBRL(previewPuppy.price) : "Adoção Responsável"}
                </Badge>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {previewPuppy.breed}
                    </Badge>
                    {previewPuppy.pedigree && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 text-xs">
                        <Award className="mr-1 h-3 w-3" /> Pedigree {previewPuppy.pedigreeReg || "Ativo"}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{previewPuppy.title}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {previewPuppy.city}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
                  <p className="text-xs font-semibold text-foreground">Sobre a ninhada</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {previewPuppy.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Anunciado por</p>
                    <p className="text-xs font-bold text-foreground">{previewPuppy.seller.name}</p>
                  </div>
                  <Button asChild className="rounded-full gradient-primary text-primary-foreground">
                    <a href={`tel:${previewPuppy.seller.phone.replace(/\D/g, "")}`}>
                      <Phone className="mr-1.5 h-3.5 w-3.5" /> Falar com o Criador
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PuppiesMarketplace;

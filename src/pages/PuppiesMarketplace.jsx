import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  MessageCircle,
  Upload,
  X,
  Check,
  CheckCircle2,
  Trash2,
  ExternalLink,
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
import { petsService, authService } from "@/services/api";
import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";
import { startOrOpenConversation, getStoredConversations } from "./Chat";

const STORAGE_KEY_LISTINGS = "livepet_puppy_listings_v2";

const formatBRL = (n) => {
  const num = Number(n);
  if (!num || num === 0) return "Adoção Responsável";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
};

const getStoredListings = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_LISTINGS) || "[]");
  } catch {
    return [];
  }
};

const saveStoredListings = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

const PuppiesMarketplace = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [myPets, setMyPets] = useState([]);
  const [communityPets, setCommunityPets] = useState([]);
  const [storedListings, setStoredListings] = useState(() => getStoredListings());
  const [loading, setLoading] = useState(true);

  // Filtros
  const [query, setQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("Todas");
  const [pedigreeOnly, setPedigreeOnly] = useState(false);
  const [adTipoFilter, setAdTipoFilter] = useState("todos"); // "todos", "venda", "adocao"
  const [sortBy, setSortBy] = useState("recent");
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [previewPuppy, setPreviewPuppy] = useState(null);

  // Form de Anúncio
  const [selectedMyPetId, setSelectedMyPetId] = useState("manual");
  const [formTitle, setFormTitle] = useState("");
  const [formBreed, setFormBreed] = useState("");
  const [formSpecies, setFormSpecies] = useState("Cachorro");
  const [formSex, setFormSex] = useState("Macho");
  const [formAge, setFormAge] = useState("2");
  const [formCount, setFormCount] = useState("1");
  const [formCity, setFormCity] = useState("");
  const [formAdTipo, setFormAdTipo] = useState("venda"); // "venda" | "adocao"
  const [formPrice, setFormPrice] = useState("");
  const [formPedigree, setFormPedigree] = useState(false);
  const [formPedigreeReg, setFormPedigreeReg] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImg, setFormImg] = useState("");
  const [formPhone, setFormPhone] = useState("");

  // Contagem de conversas ativas para o mini badge de chat
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user?.telefone) setFormPhone(user.telefone);

    // Carrega conversas salvas
    const convs = getStoredConversations();
    setChatCount(convs.length);
  }, []);

  // Carrega pets reais do banco de dados (Meus Pets e Explore Pets da comunidade)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Carrega pets do tutor logado
        let userPets = [];
        try {
          userPets = await petsService.list();
          if (isMounted && Array.isArray(userPets)) {
            setMyPets(userPets);
          }
        } catch (err) {
          console.warn("Aviso ao carregar pets do tutor:", err);
        }

        // 2. Carrega pets da comunidade
        let explore = [];
        try {
          explore = await petsService.listExplore();
          if (isMounted && Array.isArray(explore)) {
            setCommunityPets(explore);
          }
        } catch (err) {
          console.warn("Aviso ao carregar pets da comunidade:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Converte pets reais da comunidade para anúncios do marketplace quando aplicável
  const dbCommunityListings = useMemo(() => {
    if (!communityPets || communityPets.length === 0) return [];
    return communityPets.map((p) => {
      const photo = getPetPhoto(p.foto_url);
      const isPuppy = (p.idade && Number(p.idade) <= 2) || !p.idade;
      return {
        id: `db-listing-${p.id}`,
        dbPetId: p.id,
        title: isPuppy
          ? `Filhote ${p.nome} — ${p.raca || p.especie}`
          : `${p.nome} — ${p.raca || p.especie}`,
        breed: p.raca || "SRD",
        species: p.especie || "Cachorro",
        sex: p.sexo || "Macho",
        ageMonths: p.idade ? Number(p.idade) * 12 : 3,
        availableCount: 1,
        city: p.tutor_cidade || p.cidade || "Brasil",
        price: 0, // Adoção responsável / Comunidade
        adTipo: "adocao",
        pedigree: Boolean(p.lineage),
        pedigreeReg: p.lineage?.registro || null,
        seller: {
          id: p.tutor_id || p.user_id,
          name: p.tutor_nome || "Tutor LivePet",
          phone: p.tutor_telefone || "",
          verified: true,
        },
        description:
          p.medical_records?.[0]?.descricao ||
          `Lindo pet cadastrado na comunidade LivePet. Acompanhamento preventivo e vacinas registradas.`,
        img: photo,
        postedDaysAgo: 1,
        isCommunityDb: true,
      };
    });
  }, [communityPets]);

  // Lista combinada de anúncios: cadastrados no marketplace + animais reais da comunidade
  const allPuppies = useMemo(() => {
    // Anúncios personalizados salvos em localStorage vêm primeiro
    return [...storedListings, ...dbCommunityListings];
  }, [storedListings, dbCommunityListings]);

  // Filtragem e busca
  const filteredPuppies = useMemo(() => {
    let list = allPuppies.filter((p) => {
      if (selectedSpecies !== "Todas" && p.species !== selectedSpecies) return false;
      if (pedigreeOnly && !p.pedigree) return false;
      if (adTipoFilter === "venda" && p.price === 0) return false;
      if (adTipoFilter === "adocao" && p.price > 0) return false;
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
  }, [allPuppies, selectedSpecies, pedigreeOnly, adTipoFilter, query, sortBy]);

  // Ao selecionar um pet que o tutor já possui cadastrado, auto-preenche todos os dados!
  const handleSelectMyPet = (petId) => {
    setSelectedMyPetId(petId);
    if (petId === "manual") {
      setFormTitle("");
      setFormBreed("");
      setFormSpecies("Cachorro");
      setFormSex("Macho");
      setFormImg("");
      setFormPedigree(false);
      setFormPedigreeReg("");
      return;
    }

    const pet = myPets.find((p) => String(p.id) === String(petId));
    if (!pet) return;

    setFormTitle(`Filhote ${pet.nome} — ${pet.raca || pet.especie}`);
    setFormBreed(pet.raca || "SRD");
    setFormSpecies(pet.especie || "Cachorro");
    setFormSex(pet.sexo || "Macho");
    setFormImg(getPetPhoto(pet.foto_url));
    setFormPedigree(Boolean(pet.lineage));
    setFormPedigreeReg(pet.lineage?.registro || "");

    // Idade estimada em meses
    if (pet.data_nascimento) {
      try {
        const birth = new Date(pet.data_nascimento);
        const now = new Date();
        const diffMonths =
          (now.getFullYear() - birth.getFullYear()) * 12 +
          (now.getMonth() - birth.getMonth());
        setFormAge(String(Math.max(1, diffMonths)));
      } catch {
        setFormAge("2");
      }
    } else if (pet.idade) {
      setFormAge(String(Number(pet.idade) * 12));
    }
  };

  // Carregador de foto do computador do usuário (Base64)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem selecionada é muito grande. Escolha uma foto de até 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormImg(event.target.result);
      toast.success("Foto carregada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  // Publicar Anúncio
  const handlePublishAnnounce = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBreed.trim() || !formCity.trim()) {
      toast.error("Preencha o título, a raça e a cidade do anúncio.");
      return;
    }

    const priceNum = formAdTipo === "adocao" ? 0 : Number(formPrice) || 0;
    const photoToUse =
      formImg ||
      getPetPhoto(null);

    const newAd = {
      id: `pup-${Date.now()}`,
      title: formTitle.trim(),
      breed: formBreed.trim(),
      species: formSpecies,
      sex: formSex,
      ageMonths: Number(formAge) || 2,
      availableCount: Number(formCount) || 1,
      city: formCity.trim(),
      price: priceNum,
      adTipo: formAdTipo,
      pedigree: formPedigree,
      pedigreeReg: formPedigree ? (formPedigreeReg.trim() || "Oficial Registrado") : null,
      seller: {
        id: currentUser?.id || "tutor-anunciante",
        name: currentUser?.nome || "Tutor LivePet",
        phone: formPhone.trim() || currentUser?.telefone || "",
        verified: true,
      },
      description:
        formDesc.trim() ||
        "Filhote criado com carinho, alimentação de qualidade e acompanhamento veterinário em dia.",
      img: photoToUse,
      postedDaysAgo: 0,
      tutorOwnerId: currentUser?.id,
    };

    const updated = [newAd, ...storedListings];
    setStoredListings(updated);
    saveStoredListings(updated);
    setAnnounceOpen(false);
    toast.success("Anúncio publicado com sucesso no marketplace!");

    // Reset Form
    setSelectedMyPetId("manual");
    setFormTitle("");
    setFormBreed("");
    setFormCity("");
    setFormPrice("");
    setFormDesc("");
    setFormImg("");
    setFormPedigree(false);
    setFormPedigreeReg("");
  };

  // Iniciar Chat Direto com o Dono do Pet
  const handleStartChat = (puppy) => {
    if (!currentUser) {
      toast("Faça login para conversar com o tutor.");
      navigate("/login?redirect=/filhotes");
      return;
    }

    // Se o usuário é o próprio anunciante
    if (puppy.tutorOwnerId && puppy.tutorOwnerId === currentUser.id) {
      toast.info("Este é o seu próprio anúncio.");
      return;
    }

    const conversationId = `chat-puppy-${puppy.id}`;
    const initialGreeting = `Olá ${puppy.seller.name}! Vi seu anúncio de "${puppy.title}" no LivePet e gostaria de mais informações.`;

    startOrOpenConversation({
      id: conversationId,
      title: puppy.title,
      petName: puppy.title.replace(/^Filhote\s*/i, ""),
      petPhoto: puppy.img,
      sellerName: puppy.seller.name,
      sellerPhone: puppy.seller.phone,
      source: "filhotes",
      initialMessage: initialGreeting,
    });

    navigate(`/chat?id=${conversationId}`);
  };

  // Excluir anúncio próprio
  const handleDeleteMyListing = (listingId) => {
    const updated = storedListings.filter((l) => l.id !== listingId);
    setStoredListings(updated);
    saveStoredListings(updated);
    if (previewPuppy?.id === listingId) setPreviewPuppy(null);
    toast.success("Anúncio removido com sucesso!");
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

            <div className="flex items-center gap-2">
              {/* Mini Botão de Chat Direto */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/chat")}
                className="rounded-full gap-1.5 border-primary-foreground/30 bg-background/10 text-primary-foreground hover:bg-background/20 backdrop-blur font-semibold"
                title="Acessar minhas conversas e mensagens"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Mensagens</span>
                {chatCount > 0 && (
                  <Badge className="ml-1 h-5 rounded-full bg-warm px-1.5 text-[10px] text-foreground font-bold">
                    {chatCount}
                  </Badge>
                )}
              </Button>

              <Button
                onClick={() => setAnnounceOpen(true)}
                className="rounded-full bg-warm text-foreground shadow-soft hover:bg-warm/90 font-semibold"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Anunciar Filhote / Ninhada
              </Button>
            </div>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-[1.08] sm:text-4xl md:text-5xl">
            Filhotes, ninhadas e criadores{" "}
            <span className="italic text-warm">verificados</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-primary-foreground/75">
            Conecte-se com criadores responsáveis e tutores da comunidade LivePet.
            Transparência com pedigree certificado, carteira vacinal e chat direto com o anunciante.
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

              <Select value={adTipoFilter} onValueChange={setAdTipoFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-full text-xs">
                  <SelectValue placeholder="Tipo de anúncio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Venda & Adoção</SelectItem>
                  <SelectItem value="venda">Apenas Venda</SelectItem>
                  <SelectItem value="adocao">Apenas Adoção</SelectItem>
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
            {myPets.length > 0 && ` · Você possui ${myPets.length} pet(s) cadastrado(s)`}
          </p>
        </div>

        {/* Listings Grid */}
        {filteredPuppies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center max-w-md mx-auto">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="text-lg font-bold text-foreground">Nenhum filhote encontrado</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste os filtros ou anuncie um novo filhote para a comunidade.
            </p>
            <Button
              onClick={() => setAnnounceOpen(true)}
              className="mt-4 rounded-full gradient-primary text-primary-foreground"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Anunciar Agora
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPuppies.map((p) => {
              const isOwn = p.tutorOwnerId && p.tutorOwnerId === currentUser?.id;
              return (
                <Card
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-glow cursor-pointer"
                  onClick={() => setPreviewPuppy(p)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={p.img}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex flex-col gap-1">
                      {p.pedigree && (
                        <Badge className="rounded-full border border-white/30 bg-black/50 text-white backdrop-blur text-[10px]">
                          <Award className="mr-1 h-3 w-3 text-amber-300" /> Pedigree Oficial
                        </Badge>
                      )}
                      <Badge className="rounded-full bg-primary/80 text-white backdrop-blur text-[10px]">
                        {p.species} · {p.sex || "Filhote"}
                      </Badge>
                    </div>

                    <div className="absolute right-3 bottom-3 rounded-full bg-card/95 px-3 py-1 text-sm font-bold text-primary shadow-soft backdrop-blur">
                      {formatBRL(p.price)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 font-display text-base font-bold text-foreground">
                        {p.title}
                      </h3>
                      {isOwn && (
                        <Badge variant="outline" className="text-[10px] shrink-0 border-primary text-primary">
                          Meu Anúncio
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {p.breed} · {p.ageMonths} meses · {p.city}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{p.seller.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" /> {p.city}
                        </p>
                      </div>

                      {/* Botão de Chat Direto */}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(p);
                        }}
                        className="rounded-full gradient-primary text-primary-foreground text-xs gap-1.5 shadow-xs hover:shadow-glow"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Conversar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Anunciar Filhote com suporte a Pet Cadastrado e Upload de Foto */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="h-5 w-5 text-primary" /> Anunciar Filhote ou Ninhada
            </DialogTitle>
            <DialogDescription>
              Publique um anúncio no marketplace oficial LivePet. Você pode importar os dados de um pet já cadastrado na sua conta ou preencher manualmente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePublishAnnounce} className="space-y-4 mt-2">
            {/* Seletor: Puxar do perfil de pet já cadastrado */}
            {myPets.length > 0 && (
              <div className="rounded-2xl border-2 border-primary/20 bg-primary-soft/30 p-3.5">
                <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" /> Importar de pet já cadastrado na sua conta
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                  Selecione um dos seus animais para preencher automaticamente nome, raça, foto, idade e pedigree:
                </p>
                <Select value={selectedMyPetId} onValueChange={handleSelectMyPet}>
                  <SelectTrigger className="rounded-xl bg-background text-xs">
                    <SelectValue placeholder="Selecione um pet..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">✍️ Preenchimento Manual (Sem vincular pet)</SelectItem>
                    {myPets.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        🐾 {p.nome} ({p.raca || p.especie})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Título do anúncio *</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Filhotes Golden Retriever com Pedigree..."
                  className="rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Espécie</Label>
                <Select value={formSpecies} onValueChange={setFormSpecies}>
                  <SelectTrigger className="rounded-xl text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cachorro">Cachorro</SelectItem>
                    <SelectItem value="Gato">Gato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Raça *</Label>
                <Input
                  value={formBreed}
                  onChange={(e) => setFormBreed(e.target.value)}
                  placeholder="Ex: Border Collie, Spitz Alemão..."
                  className="rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Sexo / Ninhada</Label>
                <Select value={formSex} onValueChange={setFormSex}>
                  <SelectTrigger className="rounded-xl text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                    <SelectItem value="Ninhada Mista">Ninhada Mista (Machos e Fêmeas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Idade (meses)</Label>
                <Input
                  type="number"
                  min="1"
                  max="48"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Tipo de Anúncio</Label>
                <Select value={formAdTipo} onValueChange={setFormAdTipo}>
                  <SelectTrigger className="rounded-xl text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda / Ninhada Comercial</SelectItem>
                    <SelectItem value="adocao">Adoção Responsável / Doação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  {formAdTipo === "adocao" ? "Valor" : "Preço (R$) *"}
                </Label>
                <Input
                  type="number"
                  disabled={formAdTipo === "adocao"}
                  value={formAdTipo === "adocao" ? "0" : formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder={formAdTipo === "adocao" ? "Gratuito (Adoção)" : "Ex: 2500"}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Quantidade disponível</Label>
                <Input
                  type="number"
                  min="1"
                  value={formCount}
                  onChange={(e) => setFormCount(e.target.value)}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Cidade / Estado *</Label>
                <Input
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Ex: Goiânia, GO ou São Paulo, SP"
                  className="rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Telefone de contato (WhatsApp)</Label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ex: (62) 99999-9999"
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-xs font-semibold">Possui Pedigree Oficial?</p>
                  <p className="text-[10px] text-muted-foreground">CBKC, CFA ou Linhagem registrada</p>
                </div>
                <Switch checked={formPedigree} onCheckedChange={setFormPedigree} />
              </div>

              {formPedigree && (
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">Nº Registro do Pedigree (Opcional)</Label>
                  <Input
                    value={formPedigreeReg}
                    onChange={(e) => setFormPedigreeReg(e.target.value)}
                    placeholder="Ex: CBKC-12345/26"
                    className="rounded-xl text-xs mt-1"
                  />
                </div>
              )}
            </div>

            {/* SEÇÃO CRUCIAL DE FOTO COM UPLOAD */}
            <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-primary" /> Foto do Filhote / Ninhada *
              </Label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {formImg ? (
                  <div className="relative h-28 w-28 shrink-0 rounded-2xl overflow-hidden border-2 border-primary shadow-sm bg-background">
                    <img src={formImg} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormImg("")}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center hover:opacity-90"
                      title="Remover foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-28 w-28 shrink-0 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/40">
                    <Camera className="h-6 w-6 mb-1 opacity-50" />
                    <span className="text-[10px]">Sem foto</span>
                  </div>
                )}

                <div className="flex-1 space-y-2 w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl text-xs h-9 border-primary/30 text-primary hover:bg-primary-soft gap-2"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Carregar foto do computador
                  </Button>

                  <div className="text-[11px] text-muted-foreground text-center">ou informe a URL da foto:</div>
                  <Input
                    value={formImg}
                    onChange={(e) => setFormImg(e.target.value)}
                    placeholder="https://exemplo.com/foto-filhote.jpg"
                    className="rounded-xl text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Descrição e cuidados dos pais</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Informe sobre as doses de vacinas, microchip, exames dos pais, laudo de displasia, temperamento..."
                className="rounded-xl text-xs mt-1"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAnnounceOpen(false)}
                className="rounded-full text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full gradient-primary text-primary-foreground text-xs"
              >
                Publicar Anúncio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Preview do Anúncio com Botão de Chat */}
      <Dialog open={!!previewPuppy} onOpenChange={(o) => !o && setPreviewPuppy(null)}>
        <DialogContent className="max-w-xl overflow-hidden rounded-3xl p-0">
          {previewPuppy && (
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={previewPuppy.img}
                  alt={previewPuppy.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4 flex flex-col gap-1">
                  {previewPuppy.pedigree && (
                    <Badge className="rounded-full border border-white/30 bg-black/60 text-white backdrop-blur text-xs">
                      <Award className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
                      Pedigree {previewPuppy.pedigreeReg || "Verificado"}
                    </Badge>
                  )}
                  <Badge className="rounded-full bg-primary/90 text-white backdrop-blur text-xs">
                    {previewPuppy.species} · {previewPuppy.sex || "Filhote"}
                  </Badge>
                </div>

                <div className="absolute right-4 bottom-4 rounded-full bg-card/95 px-4 py-1.5 text-base font-bold text-primary shadow-soft backdrop-blur">
                  {formatBRL(previewPuppy.price)}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {previewPuppy.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {previewPuppy.city} ·{" "}
                    {previewPuppy.breed} · {previewPuppy.ageMonths} meses
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Disponibilidade:</span>
                    <span className="font-semibold text-foreground">
                      {previewPuppy.availableCount} filhote(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tutor / Anunciante:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      {previewPuppy.seller.name}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Sobre o filhote e ninhada
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {previewPuppy.description}
                  </p>
                </div>

                {/* Ações: Chat e WhatsApp */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t">
                  <Button
                    onClick={() => handleStartChat(previewPuppy)}
                    className="w-full sm:flex-1 rounded-full gradient-primary text-primary-foreground gap-2 font-semibold shadow-soft hover:shadow-glow"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Conversar com o Dono no Chat
                  </Button>

                  {previewPuppy.seller.phone && (
                    <a
                      href={`https://wa.me/${previewPuppy.seller.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${previewPuppy.seller.name}! Vi seu anúncio "${previewPuppy.title}" no LivePet e gostaria de mais informações.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-smooth"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  )}

                  {previewPuppy.tutorOwnerId && previewPuppy.tutorOwnerId === currentUser?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMyListing(previewPuppy.id)}
                      className="rounded-full text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                  )}
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

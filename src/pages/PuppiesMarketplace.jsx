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
  Clock,
  AlertTriangle,
  RotateCw,
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
import { petsService, authService, marketplaceService } from "@/services/api";
import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";
import { startOrOpenConversation, getStoredConversations } from "./Chat";

const formatBRL = (n) => {
  const num = Number(n);
  if (!num || num === 0) return "Adoção Responsável";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
};

const PuppiesMarketplace = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [myPets, setMyPets] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

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

    const convs = getStoredConversations();
    setChatCount(convs.length);
  }, []);

  // Carrega pets cadastrados do tutor (para permitir importar dados no formulário)
  useEffect(() => {
    let isMounted = true;
    const loadUserPets = async () => {
      try {
        const userPets = await petsService.list();
        if (isMounted && Array.isArray(userPets)) {
          setMyPets(userPets);
        }
      } catch (err) {
        console.warn("Aviso ao carregar pets do tutor:", err);
      }
    };

    loadUserPets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carrega anúncios reais do banco de dados (FastAPI / PostgreSQL)
  const loadMarketplaceListings = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.list({
        q: query,
        especie: selectedSpecies,
        tipo: adTipoFilter,
        pedigree: pedigreeOnly,
      });
      if (Array.isArray(data)) {
        setListings(data);
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error("Erro ao carregar anúncios do marketplace:", err);
      toast.error("Não foi possível carregar os anúncios no momento.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceListings();
  }, [selectedSpecies, pedigreeOnly, adTipoFilter]);

  // Lista ordenada
  const filteredAndSortedListings = useMemo(() => {
    let list = [...listings];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          (p.raca && p.raca.toLowerCase().includes(q)) ||
          (p.cidade && p.cidade.toLowerCase().includes(q)) ||
          (p.tutor_nome && p.tutor_nome.toLowerCase().includes(q))
      );
    }

    if (sortBy === "price-asc") list.sort((a, b) => (a.preco || 0) - (b.preco || 0));
    if (sortBy === "price-desc") list.sort((a, b) => (b.preco || 0) - (a.preco || 0));
    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    }

    return list;
  }, [listings, query, sortBy]);

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

  // Publicar Anúncio REAL no Banco de Dados
  const handlePublishAnnounce = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Faça login para anunciar um filhote.");
      navigate("/login?redirect=/filhotes");
      return;
    }

    if (!formTitle.trim() || !formBreed.trim() || !formCity.trim()) {
      toast.error("Preencha o título, a raça e a cidade do anúncio.");
      return;
    }

    const priceNum = formAdTipo === "adocao" ? 0 : Number(formPrice) || 0;
    const photoToUse = formImg || null;

    try {
      setPublishing(true);
      const payload = {
        titulo: formTitle.trim(),
        raca: formBreed.trim(),
        especie: formSpecies,
        sexo: formSex,
        idade_meses: Number(formAge) || 2,
        quantidade: Number(formCount) || 1,
        cidade: formCity.trim(),
        tipo: formAdTipo,
        preco: priceNum,
        pedigree: formPedigree,
        pedigree_registro: formPedigree ? formPedigreeReg.trim() || null : null,
        telefone_contato: formPhone.trim() || currentUser?.telefone || null,
        descricao:
          formDesc.trim() ||
          "Filhote criado com carinho, alimentação de qualidade e acompanhamento veterinário em dia.",
        foto_url: photoToUse,
        pet_id: selectedMyPetId !== "manual" ? Number(selectedMyPetId) : null,
      };

      const newListing = await marketplaceService.create(payload);
      toast.success("Anúncio publicado com sucesso no LivePet!");
      setAnnounceOpen(false);

      // Recarrega listagem oficial
      await loadMarketplaceListings();

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
    } catch (err) {
      toast.error(err.message || "Erro ao publicar anúncio.");
    } finally {
      setPublishing(false);
    }
  };

  // Iniciar Chat Direto com o Dono do Pet
  const handleStartChat = (puppy) => {
    if (!currentUser) {
      toast("Faça login para conversar com o tutor.");
      navigate("/login?redirect=/filhotes");
      return;
    }

    // Se o usuário é o próprio anunciante
    if (puppy.user_id === currentUser.id || puppy.is_owner) {
      toast.info("Este é o seu próprio anúncio.");
      return;
    }

    const conversationId = `chat-puppy-${puppy.id}`;
    const initialGreeting = `Olá ${puppy.tutor_nome}! Vi seu anúncio de "${puppy.titulo}" no LivePet e gostaria de mais informações.`;

    startOrOpenConversation({
      id: conversationId,
      title: puppy.titulo,
      petName: puppy.titulo.replace(/^Filhote\s*/i, ""),
      petPhoto: puppy.foto_url,
      sellerName: puppy.tutor_nome,
      sellerPhone: puppy.tutor_telefone,
      source: "filhotes",
      initialMessage: initialGreeting,
    });

    navigate(`/chat?id=${conversationId}`);
  };

  // Excluir anúncio próprio
  const handleDeleteListing = async (listingId) => {
    if (!confirm("Tem certeza de que deseja excluir este anúncio do catálogo?")) return;

    try {
      await marketplaceService.delete(listingId);
      toast.success("Anúncio excluído com sucesso!");
      if (previewPuppy?.id === listingId) setPreviewPuppy(null);
      await loadMarketplaceListings();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir anúncio.");
    }
  };

  // Simular passagem de 30 dias para teste do ciclo de vida
  const handleSimulate30Days = async (listingId) => {
    try {
      await marketplaceService.simulate30Days(listingId);
      toast.success("Simulação de 30 dias ativada! Uma confirmação foi enviada para o seu Chat.");
      await loadMarketplaceListings();
      navigate("/chat");
    } catch (err) {
      toast.error(err.message || "Erro ao simular 30 dias.");
    }
  };

  // Simular expiração de 24h sem resposta para teste da exclusão automática
  const handleSimulateExpire24h = async (listingId) => {
    try {
      await marketplaceService.simulateExpire24h(listingId);
      toast.info("Simulação de 24h executada! O anúncio sem resposta foi excluído automaticamente do catálogo.");
      if (previewPuppy?.id === listingId) setPreviewPuppy(null);
      await loadMarketplaceListings();
    } catch (err) {
      toast.error(err.message || "Erro ao simular expiração.");
    }
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
              Catálogo Oficial de Filhotes LivePet
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
            Filhotes e ninhadas anunciados na{" "}
            <span className="italic text-warm">comunidade</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-primary-foreground/75">
            Apenas anúncios verificados e publicados por tutores da comunidade. Transparência com pedigree certificado,
            chat direto com o tutor e ciclo de verificação periódica a cada 30 dias.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mt-8 space-y-8">
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col gap-4 rounded-3xl border bg-card p-4 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadMarketplaceListings()}
              placeholder="Buscar por raça, título, cidade ou anunciante…"
              className="rounded-full pl-9 h-11"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Espécie */}
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger className="w-[130px] rounded-full h-11">
                <SelectValue placeholder="Espécie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                <SelectItem value="Cachorro">Cães</SelectItem>
                <SelectItem value="Gato">Gatos</SelectItem>
                <SelectItem value="Ave">Aves</SelectItem>
                <SelectItem value="Outro">Outros</SelectItem>
              </SelectContent>
            </Select>

            {/* Tipo: Todos / Venda / Adoção */}
            <Select value={adTipoFilter} onValueChange={setAdTipoFilter}>
              <SelectTrigger className="w-[140px] rounded-full h-11">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="venda">Venda / Reserva</SelectItem>
                <SelectItem value="adocao">Adoção Gratuita</SelectItem>
              </SelectContent>
            </Select>

            {/* Pedigree Toggle */}
            <Button
              variant={pedigreeOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setPedigreeOnly(!pedigreeOnly)}
              className="rounded-full gap-1.5 h-11 px-4 text-xs font-semibold"
            >
              <Award className="h-4 w-4" />
              Pedigree
            </Button>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] rounded-full h-11 text-xs">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="price-asc">Menor Preço</SelectItem>
                <SelectItem value="price-desc">Maior Preço</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={loadMarketplaceListings}
              className="rounded-full h-11 w-11"
              title="Atualizar catálogo"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>
            Mostrando <strong>{filteredAndSortedListings.length}</strong>{" "}
            {filteredAndSortedListings.length === 1 ? "anúncio oficial" : "anúncios oficiais"} no catálogo.
          </p>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" /> Anúncios verificados periodicamente a cada 30 dias
          </span>
        </div>

        {/* Grid de Anúncios Reais */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
              <PawPrint className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold">Carregando anúncios...</p>
            <p className="text-xs text-muted-foreground">Consultando catálogo oficial de filhotes e ninhadas.</p>
          </div>
        ) : filteredAndSortedListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card/60 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Nenhum filhote anunciado no momento</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Apenas filhotes cadastrados oficialmente por tutores ou criadores aparecem aqui.
              Seja o primeiro a anunciar um filhote ou ninhada da sua criação!
            </p>
            <Button
              onClick={() => setAnnounceOpen(true)}
              className="mt-6 rounded-full gradient-primary text-primary-foreground font-semibold"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Anunciar Filhote Agora
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedListings.map((p) => {
              const photo = getPetPhoto(p.foto_url);
              const isOwner = currentUser && (p.user_id === currentUser.id || p.is_owner);
              const isPendingConfirm = p.needs_confirmation || p.status === "pending_confirmation";

              return (
                <Card
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
                >
                  {/* Foto do Filhote */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={photo}
                      alt={p.titulo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badges superiores */}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {p.tipo === "adocao" || p.preco === 0 ? (
                        <Badge className="rounded-full bg-emerald-500/90 text-white font-semibold backdrop-blur text-[10px]">
                          💚 Adoção Responsável
                        </Badge>
                      ) : (
                        <Badge className="rounded-full bg-foreground/80 text-primary-foreground font-semibold backdrop-blur text-[10px]">
                          Venda / Reserva
                        </Badge>
                      )}

                      {p.pedigree && (
                        <Badge className="rounded-full bg-warm text-foreground font-bold backdrop-blur text-[10px] flex items-center gap-1">
                          <Award className="h-3 w-3" /> Pedigree
                        </Badge>
                      )}
                    </div>

                    {/* Preço em Destaque */}
                    <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
                      {formatBRL(p.preco)}
                    </div>

                    {/* Badge do Dono do anúncio */}
                    {isOwner && (
                      <div className="absolute top-3 right-3">
                        <Badge className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          Meu Anúncio
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-smooth line-clamp-1">
                          {p.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.raca || p.especie} • {p.sexo} • {p.idade_meses} meses
                        </p>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.descricao}
                    </p>

                    {/* Localização e Anunciante */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{p.cidade || "Brasil"}</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="truncate">{p.tutor_nome}</span>
                      </div>
                    </div>

                    {/* Alerta de Confirmação Pendente (30 dias) */}
                    {isPendingConfirm && isOwner && (
                      <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-[10px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                          Confirmação de 30 dias pendente no Chat!
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate("/chat")}
                          className="h-6 px-1.5 text-[10px] text-amber-800 underline font-bold"
                        >
                          Responder
                        </Button>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        onClick={() => setPreviewPuppy(p)}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full text-xs font-semibold"
                      >
                        Detalhes
                      </Button>

                      {/* Botão de Chat Direto com o Dono */}
                      {!isOwner && (
                        <Button
                          onClick={() => handleStartChat(p)}
                          size="sm"
                          className="rounded-full gradient-primary text-primary-foreground text-xs font-semibold px-3"
                          title="Abrir chat 1-a-1 com o anunciante"
                        >
                          <MessageCircle className="mr-1 h-3.5 w-3.5" />
                          Chat
                        </Button>
                      )}

                      {/* Ações do Dono: Excluir e Testes de 30 dias */}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteListing(p.id)}
                          className="rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-8 w-8"
                          title="Excluir este anúncio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Área de Testes / Demonstração do Dono */}
                    {isOwner && (
                      <div className="mt-2.5 border-t border-dashed border-border pt-2 flex items-center justify-between gap-1 text-[10px]">
                        <span className="text-muted-foreground">Testes de ciclo:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSimulate30Days(p.id)}
                            className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground hover:bg-primary-soft hover:text-primary transition-smooth"
                            title="Simula 30 dias decorridos e dispara confirmação via chat com 24h de prazo"
                          >
                            Simular 30d
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateExpire24h(p.id)}
                            className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-rose-600 hover:bg-rose-50 transition-smooth"
                            title="Simula 24h sem resposta e executa a exclusão automática do catálogo"
                          >
                            Simular 24h
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Anúncio */}
      <Dialog open={Boolean(previewPuppy)} onOpenChange={(open) => !open && setPreviewPuppy(null)}>
        {previewPuppy && (
          <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
            <div className="relative aspect-video w-full bg-muted">
              <img
                src={getPetPhoto(previewPuppy.foto_url)}
                alt={previewPuppy.titulo}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="rounded-full bg-foreground/90 text-primary-foreground backdrop-blur">
                  {formatBRL(previewPuppy.preco)}
                </Badge>
                {previewPuppy.pedigree && (
                  <Badge className="rounded-full bg-warm text-foreground font-bold backdrop-blur">
                    Pedigree Certificado
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    {previewPuppy.titulo}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {previewPuppy.raca} • {previewPuppy.sexo} • {previewPuppy.idade_meses} meses
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="rounded-2xl bg-muted/40 p-3 text-center border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Espécie</span>
                  <p className="font-semibold text-sm mt-0.5">{previewPuppy.especie}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3 text-center border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Disponíveis</span>
                  <p className="font-semibold text-sm mt-0.5">{previewPuppy.quantidade} filhote(s)</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3 text-center border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Local</span>
                  <p className="font-semibold text-sm mt-0.5 truncate">{previewPuppy.cidade}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3 text-center border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Pedigree</span>
                  <p className="font-semibold text-sm mt-0.5">
                    {previewPuppy.pedigree ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              {previewPuppy.pedigree && previewPuppy.pedigree_registro && (
                <div className="rounded-2xl bg-warm/15 border border-warm/30 p-3 flex items-center gap-2 text-xs">
                  <Award className="h-4 w-4 text-warm shrink-0" />
                  <span>
                    Registro de Linhagem Oficial: <strong>{previewPuppy.pedigree_registro}</strong>
                  </span>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sobre a Ninhada / Filhote
                </h4>
                <p className="mt-1 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {previewPuppy.descricao}
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Tutor / Anunciante
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      {previewPuppy.tutor_nome?.[0]?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{previewPuppy.tutor_nome}</p>
                      <p className="text-xs text-muted-foreground">Membro verificado no LivePet</p>
                    </div>
                  </div>

                  {previewPuppy.tutor_telefone && (
                    <a
                      href={`https://wa.me/${previewPuppy.tutor_telefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Phone className="h-3 w-3" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t p-4 bg-card flex flex-row items-center justify-between sm:justify-between">
              <Button variant="ghost" onClick={() => setPreviewPuppy(null)} className="rounded-full text-xs">
                Fechar
              </Button>

              <div className="flex items-center gap-2">
                {currentUser && (previewPuppy.user_id === currentUser.id || previewPuppy.is_owner) ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteListing(previewPuppy.id)}
                    className="rounded-full text-xs gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir Anúncio
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const p = previewPuppy;
                      setPreviewPuppy(null);
                      handleStartChat(p);
                    }}
                    className="rounded-full gradient-primary text-primary-foreground font-semibold text-xs gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" /> Conversar com o Dono
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal de Anúncio de Filhote / Ninhada com Upload de Foto e Importação de Pet */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Anunciar Filhote ou Ninhada
            </DialogTitle>
            <DialogDescription className="text-xs">
              Publique seu anúncio no catálogo para que tutores interessados possam encontrar e entrar em contato.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePublishAnnounce} className="space-y-4 pt-2">
            {/* Opção de Puxar de Pet já Cadastrado */}
            {myPets.length > 0 && (
              <div className="rounded-2xl border-2 border-primary/20 bg-primary-soft/30 p-3.5">
                <Label className="text-xs font-bold text-primary flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Importar dados de um pet já cadastrado
                </Label>
                <Select value={selectedMyPetId} onValueChange={handleSelectMyPet}>
                  <SelectTrigger className="rounded-xl bg-background text-xs h-9">
                    <SelectValue placeholder="Selecione um dos seus pets ou preencha manual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Preencher manualmente</SelectItem>
                    {myPets.map((pet) => (
                      <SelectItem key={pet.id} value={String(pet.id)}>
                        🐾 {pet.nome} — {pet.raca || pet.especie} ({pet.sexo || "Sexo não informado"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Ao escolher um pet cadastrado, nome, raça, foto e pedigree são importados automaticamente!
                </p>
              </div>
            )}

            {/* Modalidade: Venda ou Adoção */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormAdTipo("venda")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-smooth ${
                  formAdTipo === "venda"
                    ? "border-primary bg-primary-soft text-primary font-bold shadow-xs"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <span className="text-xs">Comercial / Reserva</span>
                <span className="text-[10px] font-normal mt-0.5">Definir preço em R$</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormAdTipo("adocao");
                  setFormPrice("0");
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-smooth ${
                  formAdTipo === "adocao"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-xs dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <span className="text-xs">Adoção Responsável</span>
                <span className="text-[10px] font-normal mt-0.5">Sem cobrança (Gratuito)</span>
              </button>
            </div>

            {/* Título do Anúncio */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Título do Anúncio *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Filhote de Golden Retriever com Pedigree"
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>

            {/* Upload de Foto do Computador + Pré-visualização */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Foto do Pet / Filhote</span>
                <span className="text-[11px] font-normal text-muted-foreground">Crucial para o anúncio</span>
              </Label>

              {formImg ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-muted">
                  <img src={formImg} alt="Preview" className="h-full w-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => setFormImg("")}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                    title="Remover foto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-primary/30 bg-muted/20 p-5 text-center transition-smooth hover:border-primary/60 hover:bg-muted/40"
                >
                  <Upload className="mx-auto h-7 w-7 text-primary mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">Clique para enviar uma foto do seu computador</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Formatos JPG, PNG ou WEBP (até 5MB)</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {/* URL alternativa opcional */}
              {!formImg && (
                <Input
                  value={formImg}
                  onChange={(e) => setFormImg(e.target.value)}
                  placeholder="Ou cole a URL da imagem aqui..."
                  className="rounded-xl h-8 text-[11px] mt-1"
                />
              )}
            </div>

            {/* Espécie e Raça */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Espécie *</Label>
                <Select value={formSpecies} onValueChange={setFormSpecies}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cachorro">Cachorro</SelectItem>
                    <SelectItem value="Gato">Gato</SelectItem>
                    <SelectItem value="Ave">Ave</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Raça *</Label>
                <Input
                  value={formBreed}
                  onChange={(e) => setFormBreed(e.target.value)}
                  placeholder="Ex: Spitz Alemão, Pug, SRD"
                  required
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* Sexo, Idade em Meses e Quantidade */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sexo</Label>
                <Select value={formSex} onValueChange={setFormSex}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                    <SelectItem value="Misto">Ninhada Mista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Idade (meses)</Label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  placeholder="Ex: 2"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Qtd. Filhotes</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={formCount}
                  onChange={(e) => setFormCount(e.target.value)}
                  placeholder="1"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* Preço (se venda) e Cidade */}
            <div className="grid grid-cols-2 gap-3">
              {formAdTipo === "venda" ? (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Preço (R$) *</Label>
                  <Input
                    type="number"
                    min="1"
                    step="10"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="Ex: 1500"
                    required
                    className="rounded-xl h-10 text-xs font-semibold"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Modalidade</Label>
                  <Input
                    value="Adoção Gratuita"
                    disabled
                    className="rounded-xl h-10 text-xs bg-muted text-emerald-600 font-bold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Cidade / UF *</Label>
                <Input
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Ex: São Paulo - SP"
                  required
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* Telefone de Contato */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">WhatsApp / Telefone de Contato</Label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            {/* Pedigree Switch */}
            <div className="rounded-2xl border p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Certificado de Pedigree</p>
                  <p className="text-[10px] text-muted-foreground">O filhote possui registro oficial em kennel club?</p>
                </div>
                <Switch checked={formPedigree} onCheckedChange={setFormPedigree} />
              </div>

              {formPedigree && (
                <div className="pt-2 border-t">
                  <Label className="text-[11px] font-semibold">Registro / Entidade (CBKC, SOBRACI, etc.)</Label>
                  <Input
                    value={formPedigreeReg}
                    onChange={(e) => setFormPedigreeReg(e.target.value)}
                    placeholder="Ex: CBKC 12345/24"
                    className="rounded-xl h-9 text-xs mt-1"
                  />
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição do Filhote / Ninhada</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Conte sobre o temperamento, vacinas tomadas, vermifugação, data para desmame e cuidados especiais…"
                rows={3}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Ciclo de 30 dias:</strong> Após 30 dias, você receberá uma confirmação automática no Chat. Se não for respondida em 24h, o anúncio será removido automaticamente para manter a base limpa.
              </span>
            </div>

            <DialogFooter className="pt-2">
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
                disabled={publishing}
                className="rounded-full gradient-primary text-primary-foreground text-xs font-semibold"
              >
                {publishing ? "Publicando..." : "Salvar e Publicar Anúncio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PuppiesMarketplace;

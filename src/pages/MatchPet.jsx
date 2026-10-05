import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  X,
  MapPin,
  ShieldCheck,
  Sparkles,
  Filter,
  PawPrint,
  Search,
  Star,
  Stethoscope,
  Phone,
  ChevronLeft,
  ChevronRight,
  Dog,
  Cat,
  Award,
  HeartHandshake,
  MessageCircle,
  Send,
  Bell,
  Bookmark,
  Calendar as CalendarIcon,
  Undo2,
  Zap,
  Trophy,
  TrendingUp,
  CheckCheck,
  Flame,
  SlidersHorizontal,
  Check,
  Info,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { petsService, authService } from "@/services/api";
import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// Constantes & Persistência Local
// ============================================================
const LIKES_KEY = "livepet_matchpet_likes_v2";
const SWIPED_KEY = (userId, petId) =>
  `livepet_swiped_${userId || "anon"}_${petId || "default"}`;
const TEMPERAMENT_KEY = (petId) => `livepet_temperament_${petId}`;
const CHAT_KEY = "livepet_matchpet_chats_v2";

export const AVAILABLE_TEMPERAMENTS = [
  "Dócil",
  "Sociável",
  "Brincalhão",
  "Calmo",
  "Ativo & Enérgico",
  "Protetor",
  "Carinhoso",
  "Curioso",
  "Independente",
  "Sociável com cães",
  "Sociável com gatos",
  "Amigável com crianças",
];

const DEFAULT_BREEDS = [
  "Golden Retriever",
  "Bulldog Francês",
  "Border Collie",
  "Poodle",
  "Pastor Alemão",
  "Shih Tzu",
  "Spitz Alemão",
  "Labrador",
  "Rottweiler",
  "Siamês",
  "Persa",
  "SRD",
];

const NOTIFICATIONS = [];

const initials = (name) => {
  if (!name) return "TU";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatAge = (birthDateStr) => {
  if (!birthDateStr) return "Registrado";
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (diffMonths < 1) return "Menos de 1 mês";
    if (diffMonths < 12)
      return `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    if (remainingMonths === 0)
      return `${years} ${years === 1 ? "ano" : "anos"}`;
    return `${years}a ${remainingMonths}m`;
  } catch {
    return "Registrado";
  }
};

const getStoredLikes = () => {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveStoredLikes = (likes) => {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  } catch (e) {
    console.error(e);
  }
};

const getSwipedSet = (userId, petId) => {
  if (!petId) return new Set();
  try {
    const raw = localStorage.getItem(SWIPED_KEY(userId, petId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const addSwipedId = (userId, petId, targetRawId) => {
  if (!petId || !targetRawId) return;
  try {
    const current = getSwipedSet(userId, petId);
    current.add(String(targetRawId));
    localStorage.setItem(SWIPED_KEY(userId, petId), JSON.stringify([...current]));
  } catch (e) {
    console.error(e);
  }
};

const removeSwipedId = (userId, petId, targetRawId) => {
  if (!petId || !targetRawId) return;
  try {
    const current = getSwipedSet(userId, petId);
    current.delete(String(targetRawId));
    localStorage.setItem(SWIPED_KEY(userId, petId), JSON.stringify([...current]));
  } catch (e) {
    console.error(e);
  }
};

const clearSwipedIds = (userId, petId) => {
  if (!petId) return;
  try {
    localStorage.removeItem(SWIPED_KEY(userId, petId));
  } catch (e) {
    console.error(e);
  }
};

const getStoredTemperament = (petId) => {
  if (!petId) return null;
  try {
    const raw = localStorage.getItem(TEMPERAMENT_KEY(petId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStoredTemperament = (petId, tags) => {
  if (!petId) return;
  try {
    localStorage.setItem(TEMPERAMENT_KEY(petId), JSON.stringify(tags));
  } catch (e) {
    console.error(e);
  }
};

// ============================================================
// Componente Principal MatchPet
// ============================================================
const MatchPet = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    const unsub = authService.onAuthStateChange((user) => setCurrentUser(user));
    return unsub;
  }, []);

  const userDisplayName =
    currentUser?.nome || currentUser?.email?.split("@")[0] || "Tutor";

  // -------- Estados de pets --------
  const [tab, setTab] = useState("descobrir");
  const [loading, setLoading] = useState(true);
  const [matchPets, setMatchPets] = useState([]);
  const [myPets, setMyPets] = useState([]);
  const [activeMyPetId, setActiveMyPetId] = useState(null);
  const [swipedSet, setSwipedSet] = useState(new Set());
  const [allLikes, setAllLikes] = useState(() => getStoredLikes());

  // Pet ativo atual
  const activePet = useMemo(() => {
    if (!myPets || myPets.length === 0) return null;
    return myPets.find((p) => p.id === activeMyPetId) || myPets[0];
  }, [myPets, activeMyPetId]);

  const myPetIds = useMemo(() => new Set(myPets.map((p) => p.id)), [myPets]);

  // Atualiza swipedSet quando troca de usuário ou pet ativo
  useEffect(() => {
    if (currentUser?.id && activePet?.id) {
      setSwipedSet(getSwipedSet(currentUser.id, activePet.id));
    } else {
      setSwipedSet(new Set());
    }
  }, [currentUser?.id, activePet?.id]);

  // Carrega pets da API
  useEffect(() => {
    let isMounted = true;
    const loadPets = async () => {
      try {
        setLoading(true);

        // 1. Pets do tutor logado
        let userPets = [];
        try {
          userPets = await petsService.list();
          if (Array.isArray(userPets) && isMounted) {
            setMyPets(userPets);
            if (userPets.length > 0) {
              setActiveMyPetId((prev) => prev || userPets[0].id);
            }
          }
        } catch (err) {
          console.warn("Aviso ao carregar pets do tutor:", err);
        }

        const myIds = new Set((userPets || []).map((p) => p.id));
        const currentUserId = currentUser?.id;

        // 2. Pets da comunidade para match
        let data = [];
        try {
          data = await petsService.listExplore();
        } catch (err) {
          console.warn("Aviso ao buscar pets via listExplore:", err);
        }

        if (!isMounted) return;

        if (Array.isArray(data) && data.length > 0) {
          const communityPets = data.filter((p) => {
            if (currentUserId && p.user_id === currentUserId) return false;
            if (p.tutor_id && currentUserId && p.tutor_id === currentUserId) return false;
            if (myIds.has(p.id)) return false;
            return true;
          });

          const dbPets = communityPets.map((p) => {
            const photo = getPetPhoto(p.foto_url);
            const customTemp = getStoredTemperament(p.id);
            const temperament =
              customTemp && customTemp.length > 0
                ? customTemp
                : p.temperamento
                ? [p.temperamento]
                : ["Dócil", "Sociável"];

            return {
              id: `db-${p.id}`,
              rawId: p.id,
              userId: p.user_id,
              tutorId: p.tutor_id,
              name: p.nome,
              breed: p.raca || "SRD",
              species: p.especie || "Cachorro",
              sex: p.sexo || "Macho",
              age: p.data_nascimento
                ? formatAge(p.data_nascimento)
                : p.idade
                ? `${p.idade} anos`
                : "Registrado",
              ageYears: p.idade ? Number(p.idade) : 2,
              distanceKm: 0,
              city: p.tutor_cidade || p.cidade || "Brasil",
              pedigree: Boolean(p.lineage),
              availableForBreeding: true,
              img: photo,
              gallery: [photo],
              tutor: {
                id: p.tutor_id || p.user_id,
                name: p.tutor_nome || "Tutor LivePet",
                phone: p.tutor_telefone || "",
                online: true,
                lastSeen: "agora",
              },
              temperament,
              medical:
                p.medical_records?.[0]?.descricao ||
                "Acompanhamento preventivo em dia.",
              vaccines: (p.vaccines || []).map((v) => ({
                name: v.nome,
                date: v.data_aplicacao || "Em dia",
              })),
              genetics: p.lineage?.registro
                ? `Registro Oficial ${p.lineage.registro}`
                : "Cadastrado no LivePet",
              certifications: p.lineage
                ? ["Pedigree LivePet", "Microchip Ativo"]
                : ["Perfil Registrado no LivePet"],
              rating: null,
              reviews: [],
            };
          });
          setMatchPets(dbPets);
        } else {
          setMatchPets([]);
        }
      } catch (err) {
        console.warn("Erro ao carregar pets para MatchPet:", err);
        if (isMounted) setMatchPets([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPets();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // -------- Filtros --------
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [breed, setBreed] = useState("Todas");
  const [sex, setSex] = useState("Todos");
  const [speciesF, setSpeciesF] = useState("Todas");
  const [maxDistance, setMaxDistance] = useState(50);
  const [ageRange, setAgeRange] = useState([0, 10]);
  const [pedigreeOnly, setPedigreeOnly] = useState(false);
  const [breedingOnly, setBreedingOnly] = useState(false);
  const [query, setQuery] = useState("");

  const activeFilterCount =
    (breed !== "Todas" ? 1 : 0) +
    (sex !== "Todos" ? 1 : 0) +
    (speciesF !== "Todas" ? 1 : 0) +
    (maxDistance !== 50 ? 1 : 0) +
    (ageRange[0] !== 0 || ageRange[1] !== 10 ? 1 : 0) +
    (pedigreeOnly ? 1 : 0) +
    (breedingOnly ? 1 : 0);

  const clearFilters = () => {
    setBreed("Todas");
    setSex("Todos");
    setSpeciesF("Todas");
    setMaxDistance(50);
    setAgeRange([0, 10]);
    setPedigreeOnly(false);
    setBreedingOnly(false);
  };

  // -------- Deck de Descoberta (com exclusão de pets já swipados) --------
  const filteredMatches = useMemo(() => {
    return matchPets.filter((p) => {
      // Bloqueia pets do próprio usuário
      if (
        (p.userId && currentUser?.id && p.userId === currentUser.id) ||
        (p.tutorId && currentUser?.id && p.tutorId === currentUser.id) ||
        myPetIds.has(p.rawId || p.id)
      ) {
        return false;
      }

      // Bloqueia pets que já foram visualizados/swipados por este pet ativo
      const targetRawStr = String(p.rawId || p.id);
      if (swipedSet.has(targetRawStr)) {
        return false;
      }

      if (breed !== "Todas" && p.breed !== breed) return false;
      if (sex !== "Todos" && p.sex !== sex) return false;
      if (speciesF !== "Todas" && p.species !== speciesF) return false;
      if (p.distanceKm > maxDistance) return false;
      if (p.ageYears < ageRange[0] || p.ageYears > ageRange[1]) return false;
      if (pedigreeOnly && !p.pedigree) return false;
      if (breedingOnly && !p.availableForBreeding) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.breed.toLowerCase().includes(q) &&
          !p.city.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [
    matchPets,
    currentUser?.id,
    myPetIds,
    swipedSet,
    breed,
    sex,
    speciesF,
    maxDistance,
    ageRange,
    pedigreeOnly,
    breedingOnly,
    query,
  ]);

  const [deckIndex, setDeckIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [matchPet, setMatchPet] = useState(null); // Celebração de Match real

  useEffect(() => {
    setDeckIndex(0);
  }, [filteredMatches.length]);

  const current = filteredMatches[deckIndex] ?? null;
  const upNext = filteredMatches[deckIndex + 1] ?? null;

  // Real Swipe Handler (Matching Mútuo Real e Persistência)
  const doSwipe = (dir) => {
    if (!current || !activePet) {
      if (!activePet) {
        toast.error("Cadastre ou selecione um pet seu para dar matches!");
      }
      return;
    }

    const currentRawId = current.rawId || current.id;
    const targetRawStr = String(currentRawId);
    const myPetIdStr = String(activePet.id);

    // Proteção absoluta contra match com o próprio pet
    const isOwn =
      (current.userId && currentUser?.id && current.userId === currentUser.id) ||
      (current.tutorId && currentUser?.id && current.tutorId === currentUser.id) ||
      myPetIds.has(currentRawId);

    if (isOwn) {
      toast.error("Você não pode curtir ou dar match com seu próprio pet.");
      setDeckIndex((i) => i + 1);
      return;
    }

    const animDir = dir === "left" ? "left" : "right";
    setSwipeDir(animDir);

    setTimeout(() => {
      // 1. Salva swipe no histórico da sessão
      setHistory((h) => [...h, { pet: current, dir: animDir }].slice(-20));

      // 2. Persiste swipe no localStorage para nunca repetir este pet no reload
      addSwipedId(currentUser?.id, activePet.id, currentRawId);
      setSwipedSet((prev) => new Set(prev).add(targetRawStr));

      if (dir === "right" || dir === "super") {
        const stored = getStoredLikes();

        // Verifica se o outro pet já curtiu o pet ativo (MATCHING MÚTUO REAL)
        const otherLikedMe = stored.some(
          (l) =>
            String(l.fromPetId) === targetRawStr &&
            String(l.toPetId) === myPetIdStr
        );

        // Salva a curtida atual
        const newLike = {
          fromPetId: activePet.id,
          fromTutorId: currentUser?.id,
          toPetId: currentRawId,
          toTutorId: current.userId || current.tutorId,
          superLike: dir === "super",
          createdAt: new Date().toISOString(),
        };

        const updatedLikes = [
          ...stored.filter(
            (l) =>
              !(
                String(l.fromPetId) === myPetIdStr &&
                String(l.toPetId) === targetRawStr
              )
          ),
          newLike,
        ];
        saveStoredLikes(updatedLikes);
        setAllLikes(updatedLikes);

        if (otherLikedMe) {
          // 🎉 DEU MATCH REAL! Ambos os tutores curtiram mutualmente!
          setMatchPet(current);
          toast.success(
            `🎉 É um Match! O tutor de ${current.name} também curtiu ${activePet.nome}!`
          );
        } else {
          toast.success(
            `Você curtiu ${current.name}! Quando o tutor curtir ${activePet.nome} de volta, vocês darão match.`
          );
        }
      }

      setDeckIndex((i) => i + 1);
      setSwipeDir(null);
    }, 280);
  };

  const undo = () => {
    if (history.length === 0 || !activePet) {
      toast("Nada para desfazer");
      return;
    }
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setDeckIndex((i) => Math.max(0, i - 1));

    const rawId = last.pet.rawId || last.pet.id;
    removeSwipedId(currentUser?.id, activePet.id, rawId);
    setSwipedSet((prev) => {
      const n = new Set(prev);
      n.delete(String(rawId));
      return n;
    });

    if (last.dir === "right") {
      const updated = allLikes.filter(
        (l) =>
          !(
            String(l.fromPetId) === String(activePet.id) &&
            String(l.toPetId) === String(rawId)
          )
      );
      saveStoredLikes(updated);
      setAllLikes(updated);
    }
    toast(`Voltamos para ${last.pet.name}`);
  };

  const resetSwipedHistory = () => {
    if (!activePet) return;
    clearSwipedIds(currentUser?.id, activePet.id);
    setSwipedSet(new Set());
    setDeckIndex(0);
    setHistory([]);
    toast.success("Histórico reiniciado para " + activePet.nome + "!");
  };

  const toggleFavorite = (id) => {
    setFavorites((p) => {
      const n = new Set(p);
      if (n.has(id)) {
        n.delete(id);
        toast("Removido dos favoritos");
      } else {
        n.add(id);
        toast.success("Adicionado aos favoritos");
      }
      return n;
    });
  };

  // -------- Matches Confirmados Mútuos --------
  const matchList = useMemo(() => {
    if (!activePet) return [];
    const myPetIdStr = String(activePet.id);
    const likesFromMe = new Set(
      allLikes
        .filter((l) => String(l.fromPetId) === myPetIdStr)
        .map((l) => String(l.toPetId))
    );
    const likesToMe = new Set(
      allLikes
        .filter((l) => String(l.toPetId) === myPetIdStr)
        .map((l) => String(l.fromPetId))
    );

    return matchPets.filter((p) => {
      const targetIdStr = String(p.rawId || p.id);
      return likesFromMe.has(targetIdStr) && likesToMe.has(targetIdStr);
    });
  }, [allLikes, activePet, matchPets]);

  const recommended = useMemo(() => {
    return matchPets
      .filter((p) => !myPetIds.has(p.rawId || p.id))
      .slice(0, 4);
  }, [matchPets, myPetIds]);

  // -------- Perfil Sheet --------
  const [profilePet, setProfilePet] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  useEffect(() => setGalleryIdx(0), [profilePet?.id]);

  // -------- Mini Perfil de Temperamento do Pet Ativo --------
  const [temperamentDialogOpen, setTemperamentDialogOpen] = useState(false);
  const [editingTemperament, setEditingTemperament] = useState([]);

  const openTemperamentDialog = () => {
    if (!activePet) return;
    const existing =
      getStoredTemperament(activePet.id) ||
      (activePet.temperamento ? [activePet.temperamento] : ["Dócil", "Sociável"]);
    setEditingTemperament(existing);
    setTemperamentDialogOpen(true);
  };

  const toggleTemperamentTag = (tag) => {
    setEditingTemperament((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const saveTemperament = () => {
    if (!activePet) return;
    saveStoredTemperament(activePet.id, editingTemperament);
    // Atualiza estado local de pets
    setMyPets((list) =>
      list.map((p) =>
        p.id === activePet.id ? { ...p, temperamento: editingTemperament.join(", ") } : p
      )
    );
    setTemperamentDialogOpen(false);
    toast.success(`Mini perfil de ${activePet.nome} atualizado!`);
  };

  // -------- Chat Funcional Tutor a Tutor --------
  const [chatPet, setChatPet] = useState(null);
  const [chatsData, setChatsData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CHAT_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);

  const getChatKey = (targetPet) => {
    if (!activePet || !targetPet) return "default";
    const myId = String(activePet.id);
    const theirId = String(targetPet.rawId || targetPet.id);
    return [myId, theirId].sort().join("__");
  };

  const openChat = (pet) => {
    setChatPet(pet);
    try {
      const stored = JSON.parse(localStorage.getItem(CHAT_KEY) || "{}");
      setChatsData(stored);
    } catch (e) {
      console.warn(e);
    }
  };

  const activeChatMessages = useMemo(() => {
    if (!chatPet || !activePet) return [];
    const key = getChatKey(chatPet);
    return chatsData[key] || [];
  }, [chatsData, chatPet, activePet]);

  const sendMessage = () => {
    if (!chatPet || !chatInput.trim() || !activePet) return;
    const text = chatInput.trim();
    const time = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const key = getChatKey(chatPet);
    const newMsg = {
      id: Date.now(),
      senderPetId: activePet.id,
      senderTutorId: currentUser?.id,
      senderName: userDisplayName,
      petName: activePet.nome,
      text,
      time,
    };

    setChatsData((prev) => {
      const updated = {
        ...prev,
        [key]: [...(prev[key] || []), newMsg],
      };
      try {
        localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setChatInput("");
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages, chatPet]);

  const heroStats = [
    {
      label: "Visualizados",
      value: swipedSet.size,
      icon: Flame,
    },
    {
      label: "Matches Mútuos",
      value: matchList.length,
      icon: HeartHandshake,
    },
    {
      label: "Favoritos",
      value: favorites.size,
      icon: Bookmark,
    },
    {
      label: "Restantes no deck",
      value: filteredMatches.length,
      icon: PawPrint,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-secondary via-background to-primary-soft">
      {/* Elementos decorativos de fundo */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />
      <div className="blob h-[480px] w-[480px] -left-32 -top-24 bg-primary/20 animate-blob" />
      <div className="blob h-[420px] w-[420px] -right-24 top-1/3 bg-accent-warm/20 animate-blob" />
      <PawPrint className="pointer-events-none absolute left-[6%] top-[14%] h-8 w-8 text-primary/15 animate-float-y" />
      <PawPrint
        className="pointer-events-none absolute right-[10%] top-[26%] h-10 w-10 text-accent-warm/20 animate-float-y"
        style={{ animationDelay: "1.2s" }}
      />

      <main className="container relative z-10 py-8 md:py-12">
        {/* ===== Header da página MatchPet ===== */}
        <Card className="rounded-3xl border bg-card/80 p-4 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                MatchPet
              </span>
            </div>

            {/* Seletor do Pet Ativo & Botão de Mini Perfil de Temperamento */}
            {myPets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs shadow-soft">
                  <span className="text-muted-foreground hidden lg:inline">
                    Buscando para:
                  </span>
                  {myPets.length === 1 ? (
                    <span className="font-semibold text-primary truncate max-w-[140px]">
                      🐾 {myPets[0].nome}
                    </span>
                  ) : (
                    <select
                      value={activeMyPetId || myPets[0].id}
                      onChange={(e) => setActiveMyPetId(Number(e.target.value))}
                      className="bg-transparent font-semibold text-primary focus:outline-none cursor-pointer text-xs"
                      title="Selecione qual dos seus pets está buscando combinações"
                    >
                      {myPets.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          className="text-foreground bg-card"
                        >
                          🐾 {p.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openTemperamentDialog}
                  className="rounded-full text-xs h-8 border-primary/30 text-primary hover:bg-primary-soft gap-1.5"
                  title="Configurar temperamento e características do pet ativo"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Mini Perfil de Temperamento
                </Button>
              </div>
            )}

            <div className="relative ml-auto flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar pets, raças, cidades…"
                className="rounded-full pl-9"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setFiltersOpen(true)}
              className="rounded-full border-primary/30 text-primary hover:bg-primary-soft"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge className="ml-1 rounded-full bg-primary text-primary-foreground hover:bg-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <s.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ===== Tabs: Descobrir, Matches, Conversas ===== */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v)}
          className="mx-auto mt-6"
        >
          <TabsList className="mx-auto grid w-full max-w-xl grid-cols-3 rounded-full bg-card/80 p-1 backdrop-blur">
            <TabsTrigger
              value="descobrir"
              className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
            >
              <Flame className="mr-1.5 h-4 w-4" /> Descobrir
            </TabsTrigger>
            <TabsTrigger
              value="matches"
              className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
            >
              <HeartHandshake className="mr-1.5 h-4 w-4" /> Matches
              {matchList.length > 0 && (
                <Badge className="ml-1 h-5 rounded-full bg-accent-warm px-1.5 text-[10px] text-white hover:bg-accent-warm">
                  {matchList.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="conversas"
              className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
            >
              <MessageCircle className="mr-1.5 h-4 w-4" /> Conversas
            </TabsTrigger>
          </TabsList>

          {/* ============ ABA DESCOBRIR ============ */}
          <TabsContent value="descobrir" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              {/* Deck Central */}
              <div className="flex flex-col items-center">
                {loading ? (
                  <SkeletonCard />
                ) : current ? (
                  <div className="relative h-[560px] w-full max-w-sm">
                    {/* Card de trás */}
                    {upNext && (
                      <Card className="absolute inset-0 translate-y-3 scale-95 overflow-hidden rounded-3xl border-2 border-primary/10 opacity-60 shadow-soft">
                        <img
                          src={upNext.img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </Card>
                    )}
                    {/* Card atual interativo */}
                    <SwipeCard
                      pet={current}
                      swipeDir={swipeDir}
                      onOpenProfile={() => setProfilePet(current)}
                      onLike={() => doSwipe("right")}
                      onDislike={() => doSwipe("left")}
                    />
                  </div>
                ) : (
                  <EmptyDeck
                    swipedCount={swipedSet.size}
                    onReset={resetSwipedHistory}
                  />
                )}

                {/* Controles de Ação do Deck */}
                {current && !loading && (
                  <>
                    <div className="mt-7 flex items-center justify-center gap-3">
                      <ActionBtn
                        title="Desfazer último swipe"
                        onClick={undo}
                        className="h-12 w-12 border-2 border-accent-yellow/40 text-accent-yellow"
                      >
                        <Undo2 className="!h-5 !w-5" />
                      </ActionBtn>
                      <ActionBtn
                        title="Pular pet"
                        onClick={() => doSwipe("left")}
                        className="h-16 w-16 border-2 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="!h-7 !w-7" />
                      </ActionBtn>
                      <ActionBtn
                        title="Super like"
                        onClick={() => doSwipe("super")}
                        className="h-14 w-14 border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent-warm/10 text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <Zap className="!h-6 !w-6" />
                      </ActionBtn>
                      <ActionBtn
                        title="Curtir pet"
                        onClick={() => doSwipe("right")}
                        className="h-16 w-16 gradient-primary text-primary-foreground shadow-glow"
                      >
                        <Heart className="!h-7 !w-7" />
                      </ActionBtn>
                      <ActionBtn
                        title="Favoritar"
                        onClick={() => toggleFavorite(current.id)}
                        className={`h-12 w-12 border-2 ${
                          favorites.has(current.id)
                            ? "border-accent-warm bg-accent-warm text-white"
                            : "border-accent-warm/40 text-accent-warm"
                        }`}
                      >
                        <Bookmark className="!h-5 !w-5" />
                      </ActionBtn>
                    </div>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      {filteredMatches.length - deckIndex - 1} pets restantes no
                      deck · {swipedSet.size} avaliados
                    </p>
                  </>
                )}
              </div>

              {/* Sidebar Lateral */}
              <aside className="space-y-6">
                <Card className="rounded-3xl border bg-card/80 p-5 shadow-soft backdrop-blur">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Pets da Comunidade
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {recommended.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        Nenhum pet encontrado no momento.
                      </p>
                    ) : (
                      recommended.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setProfilePet(p)}
                          className="group flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-background/60 p-2 text-left transition-smooth hover:border-primary/30 hover:bg-primary-soft"
                        >
                          <img
                            src={p.img}
                            alt={p.name}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="truncate text-sm font-semibold">
                                {p.name}
                              </p>
                              {p.pedigree && (
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {p.breed} · {p.city}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[11px]"
                          >
                            {p.sex}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="rounded-3xl border bg-card/80 p-5 shadow-soft backdrop-blur">
                  <div className="mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent-warm" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Dica LivePet
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O MatchPet conecta tutores com interesses mútuos de
                    socialização, passeios ou acasalamento responsável. Matches
                    só acontecem quando ambos os tutores confirmam interesse!
                  </p>
                </Card>
              </aside>
            </div>
          </TabsContent>

          {/* ============ ABA MATCHES ============ */}
          <TabsContent value="matches" className="mt-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">Matches Mútuos</h2>
                <p className="text-sm text-muted-foreground">
                  Pets onde ambos os tutores demonstraram interesse de conexão.
                </p>
              </div>
              <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
                {matchList.length} matches confirmados
              </Badge>
            </div>
            {matchList.length === 0 ? (
              <EmptyState
                icon={<HeartHandshake className="h-8 w-8 text-primary" />}
                title="Nenhum match confirmado ainda"
                description={
                  activePet
                    ? `Curta outros pets na aba Descobrir! Quando o tutor curtir ${activePet.nome} de volta, a combinação aparecerá aqui.`
                    : "Cadastre um pet seu para começar a combinar!"
                }
                action={
                  <Button
                    onClick={() => setTab("descobrir")}
                    className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
                  >
                    Descobrir pets
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matchList.map((p) => (
                  <Card
                    key={p.id}
                    className="group overflow-hidden rounded-3xl border bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-glow"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <Badge className="absolute left-3 top-3 rounded-full bg-emerald-500 text-white">
                        <HeartHandshake className="mr-1 h-3.5 w-3.5" /> Match Mútuo
                      </Badge>
                      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                        <p className="text-lg font-bold">
                          {p.name}, {p.ageYears}a
                        </p>
                        <p className="text-xs opacity-90">
                          {p.breed} · {p.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      <Button
                        size="sm"
                        onClick={() => openChat(p)}
                        className="flex-1 rounded-full gradient-primary text-primary-foreground hover:shadow-glow"
                      >
                        <MessageCircle className="h-4 w-4" /> Conversar
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setProfilePet(p)}
                        className="rounded-full"
                        title="Ver detalhes do pet"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ ABA CONVERSAS ============ */}
          <TabsContent value="conversas" className="mt-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">Conversas</h2>
              <p className="text-sm text-muted-foreground">
                Mensagens diretas com tutores dos seus matches.
              </p>
            </div>
            {matchList.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-8 w-8 text-primary" />}
                title="Sem conversas ainda"
                description="Faça matches mútuos para começar a conversar com outros tutores."
                action={
                  <Button
                    onClick={() => setTab("descobrir")}
                    className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
                  >
                    Encontrar matches
                  </Button>
                }
              />
            ) : (
              <Card className="overflow-hidden rounded-3xl border bg-card shadow-soft">
                <ul className="divide-y">
                  {matchList.map((p) => {
                    const key = getChatKey(p);
                    const msgs = chatsData[key] ?? [];
                    const lastMsg = msgs[msgs.length - 1];
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => openChat(p)}
                          className="flex w-full items-center gap-3 p-4 text-left transition-smooth hover:bg-muted/50"
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={p.img} alt={p.name} />
                              <AvatarFallback>
                                {initials(p.tutor.name)}
                              </AvatarFallback>
                            </Avatar>
                            {p.tutor.online && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold">
                                {p.tutor.name}
                              </p>
                              <span className="text-[11px] text-muted-foreground">
                                {lastMsg ? lastMsg.time : p.tutor.lastSeen}
                              </span>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {lastMsg
                                ? `${
                                    lastMsg.senderTutorId === currentUser?.id
                                      ? "Você: "
                                      : `${lastMsg.senderName || "Tutor"}: `
                                  }${lastMsg.text}`
                                : `Iniciar conversa sobre ${p.name}!`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-full">
                            {p.name}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== Dialog de Mini Perfil de Temperamento do Pet Ativo ===== */}
      <Dialog
        open={temperamentDialogOpen}
        onOpenChange={setTemperamentDialogOpen}
      >
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Perfil Comportamental — {activePet?.nome || "Pet"}
            </DialogTitle>
            <DialogDescription>
              Selecione as características e temperamento de {activePet?.nome}.
              Essas informações aparecerão no MatchPet para outros tutores.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-3">
              <Avatar className="h-12 w-12 border">
                <AvatarImage
                  src={getPetPhoto(activePet?.foto_url)}
                  alt={activePet?.nome}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials(activePet?.nome || "PT")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{activePet?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {activePet?.raca || "SRD"} · {activePet?.especie || "Cachorro"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Traços de Temperamento
              </Label>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {AVAILABLE_TEMPERAMENTS.map((tag) => {
                  const selected = editingTemperament.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTemperamentTag(tag)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-smooth ${
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/70 bg-card text-foreground hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setTemperamentDialogOpen(false)}
              className="flex-1 rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveTemperament}
              className="flex-1 rounded-full gradient-primary text-primary-foreground"
            >
              Salvar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Filtros Sheet ===== */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" /> Filtros de Descoberta
            </SheetTitle>
            <SheetDescription>
              Filtre por espécie, raça, sexo e outros critérios para refinar
              suas buscas.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Espécie
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["Todas", "Cachorro", "Gato"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeciesF(s)}
                    className={`rounded-2xl border-2 py-3 text-sm font-semibold transition-smooth ${
                      speciesF === s
                        ? "border-transparent gradient-primary text-primary-foreground shadow-soft"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {s === "Cachorro"
                      ? "🐶 Cão"
                      : s === "Gato"
                      ? "🐱 Gato"
                      : "Todas"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Raça
              </Label>
              <Select value={breed} onValueChange={setBreed}>
                <SelectTrigger className="mt-2 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as raças</SelectItem>
                  {DEFAULT_BREEDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Sexo
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["Todos", "Macho", "Fêmea"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`rounded-2xl border-2 py-2.5 text-sm font-semibold transition-smooth ${
                      sex === s
                        ? "border-transparent gradient-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Distância
                </Label>
                <span className="text-sm font-semibold">
                  Até {maxDistance} km
                </span>
              </div>
              <Slider
                value={[maxDistance]}
                onValueChange={(v) => setMaxDistance(v[0])}
                min={1}
                max={100}
                step={1}
                className="mt-3"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Idade
                </Label>
                <span className="text-sm font-semibold">
                  {ageRange[0]} – {ageRange[1]} anos
                </span>
              </div>
              <Slider
                value={ageRange}
                onValueChange={(v) => setAgeRange([v[0], v[1]])}
                min={0}
                max={15}
                step={1}
                className="mt-3"
              />
            </div>

            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ped" className="text-sm">
                  Somente com pedigree
                </Label>
                <Switch
                  id="ped"
                  checked={pedigreeOnly}
                  onCheckedChange={setPedigreeOnly}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="brd" className="text-sm">
                  Disponível para cruzamento
                </Label>
                <Switch
                  id="brd"
                  checked={breedingOnly}
                  onCheckedChange={setBreedingOnly}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1 rounded-full"
            >
              Limpar
            </Button>
            <Button
              onClick={() => setFiltersOpen(false)}
              className="flex-1 rounded-full gradient-primary text-primary-foreground"
            >
              Aplicar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Perfil Completo do Pet (Sheet) ===== */}
      <Sheet
        open={!!profilePet}
        onOpenChange={(o) => !o && setProfilePet(null)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
          {profilePet && (
            <div className="flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={profilePet.gallery[galleryIdx] ?? profilePet.img}
                  alt={profilePet.name}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                {profilePet.gallery.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setGalleryIdx(
                          (i) =>
                            (i - 1 + profilePet.gallery.length) %
                            profilePet.gallery.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-soft backdrop-blur transition-smooth hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setGalleryIdx(
                          (i) => (i + 1) % profilePet.gallery.length
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-soft backdrop-blur transition-smooth hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                      {profilePet.gallery.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-6 rounded-full transition-all ${
                            i === galleryIdx ? "bg-white" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <Badge className="absolute right-3 top-3 rounded-full bg-primary/90 text-primary-foreground">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Perfil Verificado
                </Badge>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">
                        {profilePet.name}, {profilePet.ageYears}a
                      </h2>
                      <p className="text-sm opacity-90">
                        {profilePet.breed} · {profilePet.sex} ·{" "}
                        {profilePet.city}
                      </p>
                    </div>
                    {profilePet.pedigree && (
                      <Badge className="rounded-full border border-white/30 bg-white/15 text-white backdrop-blur">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Pedigree
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {/* Ações principais */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => {
                      if (profilePet) {
                        const isOwn =
                          (profilePet.userId &&
                            currentUser?.id &&
                            profilePet.userId === currentUser.id) ||
                          (profilePet.tutorId &&
                            currentUser?.id &&
                            profilePet.tutorId === currentUser.id) ||
                          myPetIds.has(profilePet.rawId || profilePet.id);
                        if (isOwn) {
                          toast.error(
                            "Você não pode curtir o seu próprio pet!"
                          );
                          return;
                        }
                        doSwipe("right");
                        setProfilePet(null);
                      }
                    }}
                    className="rounded-2xl gradient-primary text-primary-foreground hover:shadow-glow"
                  >
                    <Heart className="h-4 w-4" /> Curtir
                  </Button>
                  <Button
                    onClick={() => {
                      if (profilePet) {
                        const isOwn =
                          (profilePet.userId &&
                            currentUser?.id &&
                            profilePet.userId === currentUser.id) ||
                          (profilePet.tutorId &&
                            currentUser?.id &&
                            profilePet.tutorId === currentUser.id) ||
                          myPetIds.has(profilePet.rawId || profilePet.id);
                        if (isOwn) {
                          toast.error("Você não pode conversar com você mesmo.");
                          return;
                        }
                        openChat(profilePet);
                        setProfilePet(null);
                      }
                    }}
                    variant="outline"
                    className="rounded-2xl border-primary/30 text-primary hover:bg-primary-soft"
                  >
                    <MessageCircle className="h-4 w-4" /> Conversar
                  </Button>
                  <Button
                    onClick={() => toggleFavorite(profilePet.id)}
                    variant="outline"
                    className={`rounded-2xl ${
                      favorites.has(profilePet.id)
                        ? "border-accent-warm bg-accent-warm text-white hover:bg-accent-warm/90"
                        : ""
                    }`}
                  >
                    <Bookmark className="h-4 w-4" /> Salvar
                  </Button>
                </div>

                {/* Dados e Certificações Reais */}
                <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Dados & Registros do Pet
                    </h3>
                    <Badge variant="outline" className="rounded-full">
                      {profilePet.species}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border bg-background/80 p-2.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Raça
                      </span>
                      <span className="font-semibold text-foreground">
                        {profilePet.breed}
                      </span>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-2.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Pedigree
                      </span>
                      <span className="font-semibold text-foreground">
                        {profilePet.pedigree
                          ? "Oficial Registrado"
                          : "Sem registro oficial"}
                      </span>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-2.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Vacinas
                      </span>
                      <span className="font-semibold text-foreground">
                        {profilePet.vaccines.length > 0
                          ? `${profilePet.vaccines.length} registradas`
                          : "Acompanhamento em dia"}
                      </span>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-2.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Idade
                      </span>
                      <span className="font-semibold text-foreground">
                        {profilePet.age}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informações detalhadas */}
                <div className="space-y-3">
                  <InfoLine
                    icon={<Sparkles className="h-4 w-4" />}
                    title="Temperamento Informado"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {profilePet.temperament.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="rounded-full"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </InfoLine>

                  <InfoLine
                    icon={<MapPin className="h-4 w-4" />}
                    title="Localização"
                  >
                    <p className="text-sm text-muted-foreground">
                      {profilePet.city} · Tutor parceiro LivePet
                    </p>
                  </InfoLine>

                  <InfoLine
                    icon={
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                          {initials(profilePet.tutor.name)}
                        </AvatarFallback>
                      </Avatar>
                    }
                    title="Tutor Responsável"
                  >
                    <p className="text-sm font-semibold">
                      {profilePet.tutor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profilePet.tutor.online
                        ? "🟢 Ativo no LivePet"
                        : "Membro da Comunidade"}
                    </p>
                  </InfoLine>

                  {profilePet.vaccines.length > 0 && (
                    <InfoLine
                      icon={<Stethoscope className="h-4 w-4" />}
                      title="Carteira de Vacinação"
                    >
                      <ul className="space-y-1">
                        {profilePet.vaccines.map((v, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between text-xs text-muted-foreground"
                          >
                            <span>💉 {v.name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {v.date}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </InfoLine>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ===== Chat Tutor a Tutor Dialog ===== */}
      <Dialog open={!!chatPet} onOpenChange={(o) => !o && setChatPet(null)}>
        <DialogContent className="max-h-[85vh] max-w-md rounded-3xl p-0">
          {chatPet && (
            <>
              <div className="flex items-center gap-3 border-b p-4">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chatPet.img} />
                    <AvatarFallback>
                      {initials(chatPet.tutor.name)}
                    </AvatarFallback>
                  </Avatar>
                  {chatPet.tutor.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{chatPet.tutor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Tutor de {chatPet.name} · {chatPet.city}
                  </p>
                </div>
                {chatPet.tutor.phone && (
                  <a
                    href={`https://wa.me/${chatPet.tutor.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá ${chatPet.tutor.name}! Vi seu pet ${chatPet.name} no MatchPet do LivePet!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <ExternalLink className="h-3 w-3" /> WhatsApp
                  </a>
                )}
              </div>

              {/* Histórico Real de Mensagens */}
              <div className="h-80 space-y-3 overflow-y-auto bg-muted/20 p-4">
                {activeChatMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Inicie a conversa!</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Envie uma mensagem para {chatPet.tutor.name} combinarem um
                      encontro ou conversarem sobre {chatPet.name} e{" "}
                      {activePet?.nome || "seu pet"}.
                    </p>
                  </div>
                ) : (
                  activeChatMessages.map((m) => {
                    const isMe =
                      m.senderTutorId === currentUser?.id ||
                      m.senderPetId === activePet?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isMe
                              ? "gradient-primary text-primary-foreground"
                              : "bg-card border"
                          }`}
                        >
                          <p>{m.text}</p>
                          <p
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isMe ? "text-white/70" : "text-muted-foreground"
                            }`}
                          >
                            {m.time}
                            {isMe && <CheckCheck className="h-3 w-3" />}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Atalhos Rápidos */}
              <div className="flex flex-wrap gap-1.5 border-t bg-card px-3 pt-2">
                {[
                  {
                    label: "📅 Sugerir passeio no parque",
                    text: `Olá! Que tal marcarmos um passeio para ${chatPet.name} e ${activePet?.nome || "meu pet"} no parque?`,
                  },
                  {
                    label: "🐾 Saber mais sobre temperamento",
                    text: `Olá! Adorei o perfil de ${chatPet.name}. Como ele se comporta no dia a dia com outros pets?`,
                  },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setChatInput(q.text);
                    }}
                    className="rounded-full border bg-background px-3 py-1 text-xs hover:border-primary/40 hover:text-primary transition-smooth"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Barra de Entrada de Mensagem */}
              <div className="flex items-center gap-2 border-t p-3">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Escreva uma mensagem…"
                  className="rounded-full"
                />

                <Button
                  onClick={sendMessage}
                  disabled={!chatInput.trim()}
                  size="icon"
                  className="rounded-full gradient-primary text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Celebração de Match Mútuo Real ===== */}
      <Dialog open={!!matchPet} onOpenChange={(o) => !o && setMatchPet(null)}>
        <DialogContent className="max-w-md overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-primary via-primary-glow to-accent-warm p-0 text-primary-foreground">
          {matchPet && (
            <div className="relative p-8 text-center">
              <Heart className="absolute left-6 top-6 h-6 w-6 animate-heartbeat" />
              <Sparkles className="absolute right-6 top-6 h-6 w-6 animate-twinkle" />
              <h2 className="text-4xl font-bold">É um Match! 🎉</h2>
              <p className="mt-2 text-sm opacity-90">
                Você e {matchPet.name} demonstraram interesse mútuo!
              </p>
              <div className="my-6 flex items-center justify-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={getPetPhoto(activePet?.foto_url)}
                    alt={activePet?.nome}
                  />
                  <AvatarFallback className="bg-white text-primary font-bold">
                    {initials(activePet?.nome || "EU")}
                  </AvatarFallback>
                </Avatar>
                <HeartHandshake className="h-8 w-8 animate-heartbeat" />
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={matchPet.img} />
                  <AvatarFallback>{matchPet.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const p = matchPet;
                    setMatchPet(null);
                    openChat(p);
                  }}
                  className="flex-1 rounded-full bg-white text-primary hover:bg-white/90"
                >
                  <MessageCircle className="h-4 w-4" /> Iniciar Conversa
                </Button>
                <Button
                  onClick={() => setMatchPet(null)}
                  variant="outline"
                  className="flex-1 rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================
// Subcomponentes Auxiliares
// ============================================================
const ActionBtn = ({ children, className = "", title, onClick }) => (
  <Button
    title={title}
    onClick={onClick}
    size="icon"
    variant="outline"
    className={`rounded-full bg-card shadow-soft transition-bounce hover:scale-110 ${className}`}
  >
    {children}
  </Button>
);

const SwipeCard = ({ pet, swipeDir, onOpenProfile }) => {
  return (
    <Card
      onClick={onOpenProfile}
      className={`group absolute inset-0 cursor-pointer overflow-hidden rounded-3xl border-2 border-primary/10 bg-card shadow-glow transition-all duration-300 ease-out ${
        swipeDir === "right"
          ? "translate-x-[120%] rotate-12 opacity-0"
          : swipeDir === "left"
          ? "-translate-x-[120%] -rotate-12 opacity-0"
          : ""
      }`}
    >
      <div className="relative h-full">
        <img
          src={pet.img}
          alt={pet.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Selos Topo */}
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          {pet.pedigree ? (
            <Badge className="rounded-full border border-white/30 bg-white/20 text-white backdrop-blur shadow-sm">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Pedigree verificado
            </Badge>
          ) : (
            <Badge className="rounded-full border border-white/30 bg-white/20 text-white backdrop-blur shadow-sm">
              <PawPrint className="mr-1 h-3.5 w-3.5 text-primary" />
              {pet.breed}
            </Badge>
          )}
          <Badge className="rounded-full border border-white/30 bg-primary/90 text-primary-foreground backdrop-blur shadow-sm">
            {pet.species === "Cachorro" ? "🐶 Cão" : "🐱 Gato"} · {pet.sex}
          </Badge>
        </div>

        {/* Stamps Direcionais de Animação */}
        <div
          className={`absolute right-6 top-16 rounded-2xl border-4 border-emerald-400 px-4 py-2 text-2xl font-bold uppercase text-emerald-400 transition-opacity ${
            swipeDir === "right" ? "opacity-100" : "opacity-0"
          } -rotate-12`}
        >
          Curtir
        </div>
        <div
          className={`absolute left-6 top-16 rounded-2xl border-4 border-destructive px-4 py-2 text-2xl font-bold uppercase text-destructive transition-opacity ${
            swipeDir === "left" ? "opacity-100" : "opacity-0"
          } rotate-12`}
        >
          Pular
        </div>

        {/* Informações na parte inferior do card */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-3xl font-bold">
                {pet.name}, {pet.ageYears}a
              </h3>
              <p className="text-sm opacity-90">
                {pet.breed} · {pet.sex}
              </p>
            </div>
            {pet.species === "Cachorro" ? (
              <Dog className="h-7 w-7 opacity-80" />
            ) : (
              <Cat className="h-7 w-7 opacity-80" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs opacity-90">
            <MapPin className="h-3.5 w-3.5" />
            {pet.city} · Tutor: {pet.tutor.name}
          </div>

          {/* Temperamento do Pet */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pet.temperament.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur border border-white/20"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Status Real de Saúde & Disponibilidade */}
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-black/40 px-3 py-1.5 backdrop-blur text-[11px]">
            <span className="opacity-90 flex items-center gap-1">
              <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />
              {pet.vaccines.length > 0
                ? `${pet.vaccines.length} vacinas registradas`
                : "Acompanhamento preventivo"}
            </span>
            <span className="font-semibold text-accent-warm">
              {pet.availableForBreeding ? "Disponível para match" : "Socialização"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const InfoLine = ({ icon, title, children }) => (
  <div className="rounded-2xl border bg-muted/30 p-3">
    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
    {children}
  </div>
);

const SkeletonCard = () => (
  <div className="w-full max-w-sm">
    <Skeleton className="h-[560px] w-full rounded-3xl" />
    <div className="mt-7 flex items-center justify-center gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-14 rounded-full" />
      ))}
    </div>
  </div>
);

const EmptyDeck = ({ swipedCount, onReset }) => (
  <Card className="flex h-[560px] w-full max-w-sm flex-col items-center justify-center rounded-3xl border bg-card p-8 text-center shadow-soft">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
      <Sparkles className="h-8 w-8 text-primary animate-twinkle" />
    </div>
    <h3 className="text-xl font-bold">
      {swipedCount > 0
        ? "Você visualizou todos os pets disponíveis"
        : "Nenhum pet disponível no momento"}
    </h3>
    <p className="mt-2 text-sm text-muted-foreground">
      {swipedCount > 0
        ? `Você já avaliou ${swipedCount} pets para este perfil. Se quiser rever pets anteriores, você pode recomeçar.`
        : "Cadastre novos pets ou ajuste os filtros para encontrar combinações no MatchPet."}
    </p>
    <Button
      onClick={onReset}
      className="mt-5 rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
    >
      <Undo2 className="mr-1.5 h-4 w-4" /> Recomeçar Descoberta
    </Button>
  </Card>
);

const EmptyState = ({ icon, title, description, action }) => (
  <Card className="flex flex-col items-center justify-center rounded-3xl border bg-card p-12 text-center shadow-soft">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
      {icon}
    </div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </Card>
);

export default MatchPet;

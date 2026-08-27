import { useEffect, useMemo, useRef, useState } from "react";
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
  ShoppingBag,
  HeartHandshake,
  MessageCircle,
  Send,
  Bell,
  Share2,
  Bookmark,
  Calendar as CalendarIcon,
  Camera,
  Plus,
  Undo2,
  Zap,
  Trophy,
  TrendingUp,
  CheckCheck,
  Image as ImageIcon,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

// Fotos autênticas de pets — Unsplash
const petThor = "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80";
const petMia = "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80";
const petBento = "https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=800&q=80";
const petLuna = "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&w=800&q=80";
const petAmora = "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=80";
const petSimba = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80";
const petZeca = "https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=800&q=80";
const petNina = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80";

// ============================================================
// Tipos
// ============================================================
type Sex = "Macho" | "Fêmea";
type Species = "Cachorro" | "Gato";

type CompatibilityBreakdown = {
  breed: number;
  genetic: number;
  temperament: number;
  age: number;
};

type Tutor = {
  name: string;
  avatar?: string;
  phone: string;
  online: boolean;
  lastSeen: string;
};

type MatchPetItem = {
  id: string;
  name: string;
  breed: string;
  species: Species;
  sex: Sex;
  ageYears: number;
  city: string;
  distanceKm: number;
  img: string;
  gallery: string[];
  pedigree: boolean;
  availableForBreeding: boolean;
  temperament: string[];
  medical: string;
  genetics: string;
  vaccines: { name: string; date: string }[];
  certifications: string[];
  rating: number;
  reviews: { tutor: string; text: string; stars: number }[];
  tutor: Tutor;
  compat: CompatibilityBreakdown;
};

type Puppy = {
  id: string;
  title: string;
  breed: string;
  species: Species;
  ageMonths: number;
  city: string;
  price: number;
  img: string;
  postedDaysAgo: number;
  available: number;
  status: "Ativo" | "Reservado" | "Encerrado";
  seller: { name: string; phone: string; rating: number };
  pedigree: boolean;
};

type ChatMessage = {
  from: "me" | "them";
  text: string;
  time: string;
};

// ============================================================
// Helpers
// ============================================================
const compatScore = (c: CompatibilityBreakdown) =>
  Math.round((c.breed + c.genetic + c.temperament + c.age) / 4);

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ============================================================
// Dados mock
// ============================================================
const MATCH_PETS: MatchPetItem[] = [
  {
    id: "thor",
    name: "Thor",
    breed: "Golden Retriever",
    species: "Cachorro",
    sex: "Macho",
    ageYears: 3,
    city: "São Paulo, SP",
    distanceKm: 4,
    img: petThor,
    gallery: [petThor, petBento, petZeca],
    pedigree: true,
    availableForBreeding: true,
    temperament: ["Brincalhão", "Sociável", "Inteligente"],
    medical: "Vacinação em dia. Quadril e coração avaliados sem alterações.",
    genetics: "Linhagem campeã CBKC. DNA livre para displasia.",
    vaccines: [
      { name: "V10", date: "10/04/2026" },
      { name: "Antirrábica", date: "22/05/2026" },
    ],
    certifications: ["CBKC", "OFA Hips Good", "DNA Profile"],
    rating: 4.9,
    reviews: [
      { tutor: "Carla M.", text: "Tutor super atencioso, cachorro lindo!", stars: 5 },
      { tutor: "André S.", text: "Pedigree confirmado, recomendo.", stars: 5 },
    ],
    tutor: {
      name: "Marina Albuquerque",
      phone: "(11) 98765-4321",
      online: true,
      lastSeen: "agora",
    },
    compat: { breed: 98, genetic: 95, temperament: 94, age: 96 },
  },
  {
    id: "bento",
    name: "Bento",
    breed: "Labrador",
    species: "Cachorro",
    sex: "Macho",
    ageYears: 2,
    city: "Belo Horizonte, MG",
    distanceKm: 12,
    img: petBento,
    gallery: [petBento, petThor],
    pedigree: true,
    availableForBreeding: true,
    temperament: ["Sociável", "Família", "Ativo"],
    medical: "Cardio, quadril e cotovelo avaliados. Laudo CRMV-MG 5.110.",
    genetics: "Linhagem americana. Pais com certificados OFA.",
    vaccines: [
      { name: "V10", date: "01/02/2026" },
      { name: "Antirrábica", date: "15/03/2026" },
    ],
    certifications: ["CBKC", "OFA Elbows Normal"],
    rating: 4.8,
    reviews: [{ tutor: "Júlia P.", text: "Match perfeito!", stars: 5 }],
    tutor: {
      name: "Lucas Pereira",
      phone: "(31) 99811-2030",
      online: false,
      lastSeen: "há 2h",
    },
    compat: { breed: 92, genetic: 88, temperament: 90, age: 82 },
  },
  {
    id: "amora",
    name: "Amora",
    breed: "Shih Tzu",
    species: "Cachorro",
    sex: "Fêmea",
    ageYears: 5,
    city: "Porto Alegre, RS",
    distanceKm: 6,
    img: petAmora,
    gallery: [petAmora],
    pedigree: true,
    availableForBreeding: true,
    temperament: ["Calma", "Carinhosa"],
    medical: "Check-up completo recente.",
    genetics: "Pais campeões nacionais.",
    vaccines: [{ name: "V10", date: "10/01/2026" }],
    certifications: ["CBKC"],
    rating: 4.7,
    reviews: [{ tutor: "Renato T.", text: "Tutora muito gentil.", stars: 5 }],
    tutor: {
      name: "Renata Lima",
      phone: "(51) 99876-3322",
      online: true,
      lastSeen: "agora",
    },
    compat: { breed: 95, genetic: 92, temperament: 93, age: 88 },
  },
  {
    id: "zeca",
    name: "Zeca",
    breed: "Border Collie",
    species: "Cachorro",
    sex: "Macho",
    ageYears: 1,
    city: "Florianópolis, SC",
    distanceKm: 22,
    img: petZeca,
    gallery: [petZeca, petThor],
    pedigree: true,
    availableForBreeding: false,
    temperament: ["Aventureiro", "Inteligente"],
    medical: "Vacinação V10 e antirrábica em dia.",
    genetics: "DNA: CEA livre.",
    vaccines: [{ name: "V10", date: "05/05/2026" }],
    certifications: ["CBKC", "DNA CEA Clear"],
    rating: 4.9,
    reviews: [],
    tutor: {
      name: "Pedro Henrique",
      phone: "(48) 99654-7711",
      online: false,
      lastSeen: "ontem",
    },
    compat: { breed: 80, genetic: 85, temperament: 78, age: 70 },
  },
  {
    id: "mia",
    name: "Mia",
    breed: "Persa",
    species: "Gato",
    sex: "Fêmea",
    ageYears: 1,
    city: "Rio de Janeiro, RJ",
    distanceKm: 9,
    img: petMia,
    gallery: [petMia, petLuna],
    pedigree: true,
    availableForBreeding: true,
    temperament: ["Dócil", "Carinhosa"],
    medical: "FIV/FELV negativos.",
    genetics: "Linhagem CFA.",
    vaccines: [{ name: "Tríplice", date: "20/02/2026" }],
    certifications: ["CFA"],
    rating: 4.8,
    reviews: [{ tutor: "Bia R.", text: "Linda e dócil.", stars: 5 }],
    tutor: {
      name: "Camila Rocha",
      phone: "(21) 99221-8843",
      online: true,
      lastSeen: "agora",
    },
    compat: { breed: 94, genetic: 90, temperament: 92, age: 86 },
  },
  {
    id: "luna",
    name: "Luna",
    breed: "Siamês",
    species: "Gato",
    sex: "Fêmea",
    ageYears: 1,
    city: "Curitiba, PR",
    distanceKm: 15,
    img: petLuna,
    gallery: [petLuna, petMia],
    pedigree: true,
    availableForBreeding: true,
    temperament: ["Tranquila", "Curiosa"],
    medical: "Vacinação em dia.",
    genetics: "Linhagem tradicional siamesa.",
    vaccines: [{ name: "Tríplice", date: "12/03/2026" }],
    certifications: ["TICA"],
    rating: 4.6,
    reviews: [],
    tutor: {
      name: "Bruno Tavares",
      phone: "(41) 99332-7755",
      online: false,
      lastSeen: "há 30min",
    },
    compat: { breed: 86, genetic: 82, temperament: 88, age: 84 },
  },
  {
    id: "simba",
    name: "Simba",
    breed: "Maine Coon",
    species: "Gato",
    sex: "Macho",
    ageYears: 4,
    city: "Salvador, BA",
    distanceKm: 30,
    img: petSimba,
    gallery: [petSimba],
    pedigree: true,
    availableForBreeding: true,
    temperament: ["Sereno", "Observador"],
    medical: "Cardio sem alterações (HCM negativo).",
    genetics: "DNA HCM Clear.",
    vaccines: [{ name: "Tríplice", date: "01/02/2026" }],
    certifications: ["TICA", "DNA HCM Clear"],
    rating: 4.9,
    reviews: [{ tutor: "Diego A.", text: "Gato impecável.", stars: 5 }],
    tutor: {
      name: "Júlia Mota",
      phone: "(71) 98855-1122",
      online: true,
      lastSeen: "agora",
    },
    compat: { breed: 91, genetic: 94, temperament: 89, age: 90 },
  },
  {
    id: "nina",
    name: "Nina",
    breed: "Maltês",
    species: "Cachorro",
    sex: "Fêmea",
    ageYears: 2,
    city: "Recife, PE",
    distanceKm: 18,
    img: petNina,
    gallery: [petNina],
    pedigree: true,
    availableForBreeding: true,
    temperament: ["Elegante", "Independente"],
    medical: "Sem histórico de doenças.",
    genetics: "Pedigree CBKC.",
    vaccines: [{ name: "V10", date: "01/04/2026" }],
    certifications: ["CBKC"],
    rating: 4.7,
    reviews: [],
    tutor: {
      name: "Carla Dias",
      phone: "(81) 98777-3344",
      online: false,
      lastSeen: "há 1d",
    },
    compat: { breed: 89, genetic: 86, temperament: 87, age: 88 },
  },
];

const PUPPIES: Puppy[] = [
  {
    id: "p1",
    title: "Filhotes Golden — ninhada de janeiro",
    breed: "Golden Retriever",
    species: "Cachorro",
    ageMonths: 2,
    city: "São Paulo, SP",
    price: 4800,
    img: petThor,
    postedDaysAgo: 2,
    available: 3,
    status: "Ativo",
    seller: { name: "Canil Vale Dourado", phone: "(11) 99887-6655", rating: 4.9 },
    pedigree: true,
  },
  {
    id: "p2",
    title: "Shih Tzu fêmea pedigree CBKC",
    breed: "Shih Tzu",
    species: "Cachorro",
    ageMonths: 3,
    city: "Porto Alegre, RS",
    price: 3200,
    img: petAmora,
    postedDaysAgo: 5,
    available: 1,
    status: "Reservado",
    seller: { name: "Renata Lima", phone: "(51) 99876-3322", rating: 4.7 },
    pedigree: true,
  },
  {
    id: "p3",
    title: "Persa filhote — pronto entrega",
    breed: "Persa",
    species: "Gato",
    ageMonths: 2,
    city: "Rio de Janeiro, RJ",
    price: 2500,
    img: petMia,
    postedDaysAgo: 1,
    available: 2,
    status: "Ativo",
    seller: { name: "Cattery Royal", phone: "(21) 99221-8843", rating: 4.8 },
    pedigree: true,
  },
  {
    id: "p4",
    title: "Border Collie linhagem trabalho",
    breed: "Border Collie",
    species: "Cachorro",
    ageMonths: 4,
    city: "Florianópolis, SC",
    price: 5200,
    img: petZeca,
    postedDaysAgo: 7,
    available: 4,
    status: "Ativo",
    seller: { name: "Canil Sul Pastor", phone: "(48) 99654-7711", rating: 4.9 },
    pedigree: true,
  },
  {
    id: "p5",
    title: "Siamês macho — disponível",
    breed: "Siamês",
    species: "Gato",
    ageMonths: 3,
    city: "Curitiba, PR",
    price: 1800,
    img: petLuna,
    postedDaysAgo: 10,
    available: 1,
    status: "Ativo",
    seller: { name: "Bruno Tavares", phone: "(41) 99332-7755", rating: 4.5 },
    pedigree: false,
  },
  {
    id: "p6",
    title: "Labrador ninhada — pais campeões",
    breed: "Labrador",
    species: "Cachorro",
    ageMonths: 2,
    city: "Belo Horizonte, MG",
    price: 3900,
    img: petBento,
    postedDaysAgo: 3,
    available: 5,
    status: "Ativo",
    seller: { name: "Canil Mineiro", phone: "(31) 99811-2030", rating: 4.8 },
    pedigree: true,
  },
];

const BREEDS = Array.from(
  new Set([...MATCH_PETS.map((p) => p.breed), ...PUPPIES.map((p) => p.breed)]),
).sort();

const NOTIFICATIONS = [
  { id: 1, icon: Heart, text: "Marina curtiu seu pet Thor", time: "agora" },
  { id: 2, icon: HeartHandshake, text: "Novo match com Mia!", time: "há 10min" },
  { id: 3, icon: ShoppingBag, text: "Filhote Golden disponível perto de você", time: "há 1h" },
  { id: 4, icon: MessageCircle, text: "Camila te enviou uma mensagem", time: "há 2h" },
];

// ============================================================
// Página
// ============================================================
type SwipeDir = "left" | "right" | null;

const MatchPet = () => {
  // -------- estados gerais --------
  const [tab, setTab] = useState<"descobrir" | "matches" | "conversas" | "filhotes">("descobrir");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // -------- filtros --------
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [breed, setBreed] = useState<string>("Todas");
  const [sex, setSex] = useState<"Todos" | Sex>("Todos");
  const [speciesF, setSpeciesF] = useState<"Todas" | Species>("Todas");
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 10]);
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

  // -------- match deck --------
  const filteredMatches = useMemo(() => {
    return MATCH_PETS.filter((p) => {
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
  }, [breed, sex, speciesF, maxDistance, ageRange, pedigreeOnly, breedingOnly, query]);

  const [deckIndex, setDeckIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<SwipeDir>(null);
  const [history, setHistory] = useState<{ pet: MatchPetItem; dir: SwipeDir }[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [superLikes, setSuperLikes] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [matchPet, setMatchPet] = useState<MatchPetItem | null>(null); // celebração

  useEffect(() => {
    setDeckIndex(0);
  }, [filteredMatches.length]);

  const current = filteredMatches[deckIndex] ?? null;
  const upNext = filteredMatches[deckIndex + 1] ?? null;

  const doSwipe = (dir: "left" | "right" | "super") => {
    if (!current) return;
    const animDir: SwipeDir = dir === "left" ? "left" : "right";
    setSwipeDir(animDir);
    setTimeout(() => {
      setHistory((h) => [...h, { pet: current, dir: animDir }].slice(-20));
      if (dir === "right") {
        setLikes((p) => new Set(p).add(current.id));
        if (Math.random() > 0.4) setMatchPet(current);
        else toast.success(`Você curtiu ${current.name}!`);
      } else if (dir === "super") {
        setSuperLikes((p) => new Set(p).add(current.id));
        setLikes((p) => new Set(p).add(current.id));
        setMatchPet(current);
      }
      setDeckIndex((i) => i + 1);
      setSwipeDir(null);
    }, 280);
  };

  const undo = () => {
    if (history.length === 0) {
      toast("Nada para desfazer");
      return;
    }
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setDeckIndex((i) => Math.max(0, i - 1));
    if (last.dir === "right") {
      setLikes((p) => {
        const n = new Set(p);
        n.delete(last.pet.id);
        return n;
      });
    }
    toast(`Voltamos para ${last.pet.name}`);
  };

  const toggleFavorite = (id: string) => {
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

  // -------- perfil sheet --------
  const [profilePet, setProfilePet] = useState<MatchPetItem | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  useEffect(() => setGalleryIdx(0), [profilePet?.id]);

  // -------- chat --------
  const [chatPet, setChatPet] = useState<MatchPetItem | null>(null);
  const [chatStore, setChatStore] = useState<Record<string, ChatMessage[]>>({});
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const openChat = (pet: MatchPetItem) => {
    setChatPet(pet);
    setChatStore((s) => {
      if (s[pet.id]) return s;
      return {
        ...s,
        [pet.id]: [
          { from: "them", text: `Olá! Sou tutor(a) de ${pet.name}. Que bom o seu interesse!`, time: "09:21" },
        ],
      };
    });
  };

  const sendMessage = () => {
    if (!chatPet || !chatInput.trim()) return;
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setChatStore((s) => ({
      ...s,
      [chatPet.id]: [...(s[chatPet.id] ?? []), { from: "me", text: chatInput.trim(), time }],
    }));
    setChatInput("");
    setTimeout(() => {
      const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setChatStore((s) => ({
        ...s,
        [chatPet.id]: [
          ...(s[chatPet.id] ?? []),
          { from: "them", text: "Combinado! Posso te enviar mais informações e fotos 📸", time: t },
        ],
      }));
    }, 1200);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatStore, chatPet]);

  // -------- compartilhar --------
  const share = async (pet: MatchPetItem) => {
    const url = `${window.location.origin}/matchpet?pet=${pet.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `MatchPet — ${pet.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      /* user cancelled */
    }
  };

  // -------- marketplace --------
  const [puppyQuery, setPuppyQuery] = useState("");
  const [puppySort, setPuppySort] = useState<"recent" | "price-asc" | "price-desc">("recent");
  const [puppyFavs, setPuppyFavs] = useState<Set<string>>(new Set());
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [puppyPreview, setPuppyPreview] = useState<Puppy | null>(null);

  const filteredPuppies = useMemo(() => {
    let list = PUPPIES.filter((p) => {
      if (breed !== "Todas" && p.breed !== breed) return false;
      if (speciesF !== "Todas" && p.species !== speciesF) return false;
      if (pedigreeOnly && !p.pedigree) return false;
      if (puppyQuery) {
        const q = puppyQuery.toLowerCase();
        if (
          !p.breed.toLowerCase().includes(q) &&
          !p.city.toLowerCase().includes(q) &&
          !p.title.toLowerCase().includes(q) &&
          !p.seller.name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
    if (puppySort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (puppySort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (puppySort === "recent") list = [...list].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    return list;
  }, [breed, speciesF, pedigreeOnly, puppyQuery, puppySort]);

  const togglePuppyFav = (id: string) => {
    setPuppyFavs((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  // -------- listas derivadas --------
  const matchList = MATCH_PETS.filter((p) => likes.has(p.id));
  const recommended = [...MATCH_PETS].sort((a, b) => compatScore(b.compat) - compatScore(a.compat)).slice(0, 4);

  const heroStats = [
    { label: "Pets curtidos", value: likes.size, icon: Heart },
    { label: "Super likes", value: superLikes.size, icon: Zap },
    { label: "Matches", value: matchList.length, icon: HeartHandshake },
    { label: "Próximos", value: filteredMatches.length, icon: Flame },
  ];

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-secondary via-background to-primary-soft">
      {/* Decorativos */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />
      <div className="blob h-[480px] w-[480px] -left-32 -top-24 bg-primary/20 animate-blob" />
      <div className="blob h-[420px] w-[420px] -right-24 top-1/3 bg-accent-warm/20 animate-blob" />
      <PawPrint className="pointer-events-none absolute left-[6%] top-[14%] h-8 w-8 text-primary/15 animate-float-y" />
      <PawPrint
        className="pointer-events-none absolute right-[10%] top-[26%] h-10 w-10 text-accent-warm/20 animate-float-y"
        style={{ animationDelay: "1.2s" }}
      />

      <main className="container relative z-10 py-8 md:py-12">
        {/* ===== Sub-header in-app ===== */}
        <Card className="rounded-3xl border bg-card/80 p-4 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">MatchPet</span>
            </div>

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

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-warm text-[10px] font-bold text-white">
                    {NOTIFICATIONS.length}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 rounded-2xl p-2">
                <div className="border-b px-2 py-2 text-sm font-semibold">Notificações</div>
                <div className="max-h-72 space-y-1 overflow-y-auto py-1">
                  {NOTIFICATIONS.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => toast(n.text)}
                      className="flex w-full items-start gap-3 rounded-xl p-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <n.icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block">{n.text}</span>
                        <span className="text-xs text-muted-foreground">{n.time}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => toast.success("Todas marcadas como lidas")}
                  className="w-full rounded-xl p-2 text-center text-xs font-medium text-primary hover:bg-primary-soft"
                >
                  Marcar todas como lidas
                </button>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="group flex items-center gap-2 rounded-full border bg-card px-1 py-1 pr-3 shadow-soft transition-smooth hover:shadow-glow">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-xs text-primary-foreground">
                      MA
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">Marina</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 rounded-2xl p-2">
                <button onClick={() => toast("Abrindo seu perfil…")} className="w-full rounded-xl p-2 text-left text-sm hover:bg-muted">Meu perfil</button>
                <button onClick={() => setTab("matches")} className="w-full rounded-xl p-2 text-left text-sm hover:bg-muted">Meus matches</button>
                <button onClick={() => toast("Configurações em breve")} className="w-full rounded-xl p-2 text-left text-sm hover:bg-muted">Configurações</button>
                <button onClick={() => toast("Sessão encerrada")} className="w-full rounded-xl p-2 text-left text-sm text-destructive hover:bg-destructive/10">Sair</button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
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

        {/* ===== Tabs ===== */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as never)} className="mx-auto mt-6">
          <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-4 rounded-full bg-card/80 p-1 backdrop-blur">
            <TabsTrigger value="descobrir" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Flame className="mr-1.5 h-4 w-4" /> Descobrir
            </TabsTrigger>
            <TabsTrigger value="matches" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <HeartHandshake className="mr-1.5 h-4 w-4" /> Matches
              {matchList.length > 0 && (
                <Badge className="ml-1 h-5 rounded-full bg-accent-warm px-1.5 text-[10px] text-white hover:bg-accent-warm">
                  {matchList.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="conversas" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Conversas
            </TabsTrigger>
            <TabsTrigger value="filhotes" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Filhotes
            </TabsTrigger>
          </TabsList>

          {/* ============ DESCOBRIR ============ */}
          <TabsContent value="descobrir" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              {/* Deck */}
              <div className="flex flex-col items-center">
                {loading ? (
                  <SkeletonCard />
                ) : current ? (
                  <div className="relative h-[560px] w-full max-w-sm">
                    {/* card de trás */}
                    {upNext && (
                      <Card className="absolute inset-0 translate-y-3 scale-95 overflow-hidden rounded-3xl border-2 border-primary/10 opacity-60 shadow-soft">
                        <img src={upNext.img} alt="" className="h-full w-full object-cover" />
                      </Card>
                    )}
                    {/* card atual */}
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
                    likesCount={likes.size}
                    onReset={() => {
                      clearFilters();
                      setHistory([]);
                      setLikes(new Set());
                      setSuperLikes(new Set());
                      setDeckIndex(0);
                    }}
                  />
                )}

                {/* Ações */}
                {current && !loading && (
                  <>
                    <div className="mt-7 flex items-center justify-center gap-3">
                      <ActionBtn
                        title="Desfazer"
                        onClick={undo}
                        className="h-12 w-12 border-2 border-accent-yellow/40 text-accent-yellow"
                      >
                        <Undo2 className="!h-5 !w-5" />
                      </ActionBtn>
                      <ActionBtn
                        title="Não curtir"
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
                        title="Curtir"
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
                      {filteredMatches.length - deckIndex - 1} pets restantes · {likes.size} curtidos
                    </p>
                  </>
                )}
              </div>

              {/* Sidebar recomendações */}
              <aside className="space-y-6">
                <Card className="rounded-3xl border bg-card/80 p-5 shadow-soft backdrop-blur">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Recomendados para você
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {recommended.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setProfilePet(p)}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-background/60 p-2 text-left transition-smooth hover:border-primary/30 hover:bg-primary-soft"
                      >
                        <img src={p.img} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="truncate text-sm font-semibold">{p.name}</p>
                            {p.pedigree && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{p.breed} · {p.city}</p>
                        </div>
                        <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                          {compatScore(p.compat)}%
                        </Badge>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className="rounded-3xl border bg-card/80 p-5 shadow-soft backdrop-blur">
                  <div className="mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent-warm" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Pets populares
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MATCH_PETS.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setProfilePet(p)}
                        className="group relative aspect-square overflow-hidden rounded-2xl"
                      >
                        <img src={p.img} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                          <p className="text-xs font-semibold text-white">{p.name}</p>
                          <p className="text-[10px] text-white/80">{p.breed}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </aside>
            </div>
          </TabsContent>

          {/* ============ MATCHES ============ */}
          <TabsContent value="matches" className="mt-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">Suas combinações</h2>
                <p className="text-sm text-muted-foreground">
                  Pets que você curtiu — converse, agende ou compartilhe.
                </p>
              </div>
              <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
                {matchList.length} matches
              </Badge>
            </div>
            {matchList.length === 0 ? (
              <EmptyState
                icon={<HeartHandshake className="h-8 w-8 text-primary" />}
                title="Nenhum match ainda"
                description="Volte para Descobrir e comece a curtir pets compatíveis."
                action={
                  <Button onClick={() => setTab("descobrir")} className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow">
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
                      <img src={p.img} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <Badge className="absolute left-3 top-3 rounded-full bg-primary/90 text-primary-foreground">
                        {compatScore(p.compat)}% match
                      </Badge>
                      {superLikes.has(p.id) && (
                        <Badge className="absolute right-3 top-3 rounded-full bg-accent-warm text-white hover:bg-accent-warm">
                          <Zap className="mr-1 h-3 w-3" /> Super
                        </Badge>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                        <p className="text-lg font-bold">{p.name}, {p.ageYears}a</p>
                        <p className="text-xs opacity-90">{p.breed} · {p.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      <Button size="sm" onClick={() => openChat(p)} className="flex-1 rounded-full gradient-primary text-primary-foreground hover:shadow-glow">
                        <MessageCircle className="h-4 w-4" /> Conversar
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => setProfilePet(p)} className="rounded-full">
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => share(p)} className="rounded-full">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ CONVERSAS ============ */}
          <TabsContent value="conversas" className="mt-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">Conversas</h2>
              <p className="text-sm text-muted-foreground">Mensagens diretas com tutores dos seus matches.</p>
            </div>
            {matchList.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-8 w-8 text-primary" />}
                title="Sem conversas ainda"
                description="Faça matches para começar a conversar com tutores."
                action={
                  <Button onClick={() => setTab("descobrir")} className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow">
                    Encontrar matches
                  </Button>
                }
              />
            ) : (
              <Card className="overflow-hidden rounded-3xl border bg-card shadow-soft">
                <ul className="divide-y">
                  {matchList.map((p) => {
                    const msgs = chatStore[p.id] ?? [];
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
                              <AvatarFallback>{initials(p.tutor.name)}</AvatarFallback>
                            </Avatar>
                            {p.tutor.online && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold">{p.tutor.name}</p>
                              <span className="text-[11px] text-muted-foreground">{p.tutor.lastSeen}</span>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {lastMsg ? `${lastMsg.from === "me" ? "Você: " : ""}${lastMsg.text}` : `Diga oi sobre ${p.name}!`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-full">{p.name}</Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </TabsContent>

          {/* ============ FILHOTES ============ */}
          <TabsContent value="filhotes" className="mt-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Marketplace de filhotes</h2>
                <p className="text-sm text-muted-foreground">{filteredPuppies.length} anúncios disponíveis</p>
              </div>
              <Button
                onClick={() => setAnnounceOpen(true)}
                className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
              >
                <Plus className="h-4 w-4" /> Anunciar filhote
              </Button>
            </div>

            <Card className="mb-5 rounded-3xl border bg-card/80 p-3 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={puppyQuery}
                    onChange={(e) => setPuppyQuery(e.target.value)}
                    placeholder="Buscar anúncios, raças, cidades…"
                    className="rounded-full pl-9"
                  />
                </div>
                <Select value={puppySort} onValueChange={(v) => setPuppySort(v as never)}>
                  <SelectTrigger className="w-[180px] rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="price-asc">Menor preço</SelectItem>
                    <SelectItem value="price-desc">Maior preço</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setFiltersOpen(true)} className="rounded-full">
                  <Filter className="h-4 w-4" /> Filtros
                </Button>
              </div>
            </Card>

            {filteredPuppies.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="h-8 w-8 text-primary" />}
                title="Nenhum filhote encontrado"
                description="Ajuste os filtros ou seja o primeiro a anunciar."
                action={
                  <Button onClick={() => setAnnounceOpen(true)} className="rounded-full gradient-primary text-primary-foreground">
                    <Plus className="h-4 w-4" /> Anunciar agora
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPuppies.map((p) => (
                  <Card
                    key={p.id}
                    className="group cursor-pointer overflow-hidden rounded-3xl border bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-glow"
                    onClick={() => setPuppyPreview(p)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={p.img} alt={p.breed} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute left-3 top-3 flex flex-col gap-1">
                        {p.pedigree && (
                          <Badge className="rounded-full border border-white/30 bg-white/15 text-white backdrop-blur">
                            <Award className="mr-1 h-3.5 w-3.5" /> Pedigree
                          </Badge>
                        )}
                        <Badge
                          className={`rounded-full ${
                            p.status === "Ativo"
                              ? "bg-emerald-500"
                              : p.status === "Reservado"
                                ? "bg-accent-warm"
                                : "bg-muted-foreground"
                          } text-white hover:opacity-90`}
                        >
                          {p.status}
                        </Badge>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePuppyFav(p.id); }}
                        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-smooth ${
                          puppyFavs.has(p.id) ? "bg-accent-warm text-white" : "bg-white/80 text-foreground hover:bg-white"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${puppyFavs.has(p.id) ? "fill-current" : ""}`} />
                      </button>
                      <div className="absolute right-3 bottom-3 rounded-full bg-card/95 px-3 py-1 text-sm font-bold text-primary shadow-soft backdrop-blur">
                        {formatBRL(p.price)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 text-base font-bold">{p.title}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {p.species === "Cachorro" ? <Dog className="h-3.5 w-3.5" /> : <Cat className="h-3.5 w-3.5" />}
                        {p.breed} · {p.ageMonths} {p.ageMonths === 1 ? "mês" : "meses"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {p.city}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                        <div className="text-xs">
                          <p className="font-medium">{p.seller.name}</p>
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <Star className="h-3 w-3 fill-accent-yellow text-accent-yellow" /> {p.seller.rating}
                            <span className="mx-1">·</span>
                            {p.available} disp. · há {p.postedDaysAgo}d
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success("Contato enviado!", {
                              description: `Falaremos com ${p.seller.name}.`,
                            });
                          }}
                          className="rounded-full gradient-primary text-primary-foreground hover:shadow-glow"
                        >
                          <Phone className="h-3.5 w-3.5" /> Contatar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== Filtros (Sheet) ===== */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" /> Filtros avançados
            </SheetTitle>
            <SheetDescription>
              Refine para encontrar o match ideal — raça, distância, idade e mais.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Espécie</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["Todas", "Cachorro", "Gato"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeciesF(s as never)}
                    className={`rounded-2xl border-2 py-3 text-sm font-semibold transition-smooth ${
                      speciesF === s
                        ? "border-transparent gradient-primary text-primary-foreground shadow-soft"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {s === "Cachorro" ? "🐶 Cão" : s === "Gato" ? "🐱 Gato" : "Todas"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Raça</Label>
              <Select value={breed} onValueChange={setBreed}>
                <SelectTrigger className="mt-2 rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as raças</SelectItem>
                  {BREEDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sexo</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["Todos", "Macho", "Fêmea"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSex(s as never)}
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
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Distância</Label>
                <span className="text-sm font-semibold">Até {maxDistance} km</span>
              </div>
              <Slider
                value={[maxDistance]}
                onValueChange={(v) => setMaxDistance(v[0])}
                min={1} max={100} step={1}
                className="mt-3"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Idade</Label>
                <span className="text-sm font-semibold">{ageRange[0]} – {ageRange[1]} anos</span>
              </div>
              <Slider
                value={ageRange}
                onValueChange={(v) => setAgeRange([v[0], v[1]] as [number, number])}
                min={0} max={15} step={1}
                className="mt-3"
              />
            </div>

            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ped" className="text-sm">Somente com pedigree</Label>
                <Switch id="ped" checked={pedigreeOnly} onCheckedChange={setPedigreeOnly} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="brd" className="text-sm">Disponível para cruzamento</Label>
                <Switch id="brd" checked={breedingOnly} onCheckedChange={setBreedingOnly} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <Button variant="outline" onClick={clearFilters} className="flex-1 rounded-full">Limpar</Button>
            <Button onClick={() => setFiltersOpen(false)} className="flex-1 rounded-full gradient-primary text-primary-foreground">
              Aplicar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Perfil completo (Sheet) ===== */}
      <Sheet open={!!profilePet} onOpenChange={(o) => !o && setProfilePet(null)}>
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
                      onClick={() => setGalleryIdx((i) => (i - 1 + profilePet.gallery.length) % profilePet.gallery.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-soft backdrop-blur transition-smooth hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setGalleryIdx((i) => (i + 1) % profilePet.gallery.length)}
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
                  {compatScore(profilePet.compat)}% compatível
                </Badge>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">{profilePet.name}, {profilePet.ageYears}a</h2>
                      <p className="text-sm opacity-90">{profilePet.breed} · {profilePet.sex} · {profilePet.city}</p>
                    </div>
                    {profilePet.pedigree && (
                      <Badge className="rounded-full border border-white/30 bg-white/15 text-white backdrop-blur">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verificado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {/* Ações principais */}
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    onClick={() => {
                      if (profilePet) {
                        setLikes((p) => new Set(p).add(profilePet.id));
                        setMatchPet(profilePet);
                      }
                    }}
                    className="rounded-2xl gradient-primary text-primary-foreground hover:shadow-glow"
                  >
                    <Heart className="h-4 w-4" /> Match
                  </Button>
                  <Button
                    onClick={() => { openChat(profilePet); setProfilePet(null); }}
                    variant="outline"
                    className="rounded-2xl border-primary/30 text-primary hover:bg-primary-soft"
                  >
                    <MessageCircle className="h-4 w-4" /> Conversar
                  </Button>
                  <Button
                    onClick={() => toggleFavorite(profilePet.id)}
                    variant="outline"
                    className={`rounded-2xl ${
                      favorites.has(profilePet.id) ? "border-accent-warm bg-accent-warm text-white hover:bg-accent-warm/90" : ""
                    }`}
                  >
                    <Bookmark className="h-4 w-4" /> Salvar
                  </Button>
                  <Button onClick={() => share(profilePet)} variant="outline" className="rounded-2xl">
                    <Share2 className="h-4 w-4" /> Compartilhar
                  </Button>
                </div>

                {/* Compatibilidade detalhada */}
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Compatibilidade
                    </h3>
                    <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                      {compatScore(profilePet.compat)}%
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <CompatBar label="Raça" value={profilePet.compat.breed} />
                    <CompatBar label="Genética" value={profilePet.compat.genetic} />
                    <CompatBar label="Temperamento" value={profilePet.compat.temperament} />
                    <CompatBar label="Idade ideal" value={profilePet.compat.age} />
                  </div>
                </div>

                {/* Tabs informações */}
                <Tabs defaultValue="info">
                  <TabsList className="grid w-full grid-cols-4 rounded-full">
                    <TabsTrigger value="info" className="rounded-full">Info</TabsTrigger>
                    <TabsTrigger value="medico" className="rounded-full">Médico</TabsTrigger>
                    <TabsTrigger value="pedigree" className="rounded-full">Pedigree</TabsTrigger>
                    <TabsTrigger value="aval" className="rounded-full">Avaliações</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="mt-3 space-y-3">
                    <InfoLine icon={<Sparkles className="h-4 w-4" />} title="Temperamento">
                      <div className="flex flex-wrap gap-1.5">
                        {profilePet.temperament.map((t) => (
                          <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>
                        ))}
                      </div>
                    </InfoLine>
                    <InfoLine icon={<MapPin className="h-4 w-4" />} title="Localização">
                      <p className="text-sm text-muted-foreground">{profilePet.city} · {profilePet.distanceKm} km de você</p>
                    </InfoLine>
                    <InfoLine icon={<Avatar className="h-6 w-6"><AvatarFallback className="bg-primary text-primary-foreground text-[10px]">{initials(profilePet.tutor.name)}</AvatarFallback></Avatar>} title="Tutor">
                      <p className="text-sm font-semibold">{profilePet.tutor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {profilePet.tutor.online ? "🟢 Online agora" : `Visto ${profilePet.tutor.lastSeen}`}
                      </p>
                    </InfoLine>
                  </TabsContent>
                  <TabsContent value="medico" className="mt-3 space-y-3">
                    <InfoLine icon={<Stethoscope className="h-4 w-4" />} title="Histórico médico">
                      <p className="text-sm text-muted-foreground">{profilePet.medical}</p>
                    </InfoLine>
                    <InfoLine icon={<CalendarIcon className="h-4 w-4" />} title="Vacinas">
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {profilePet.vaccines.map((v) => (
                          <li key={v.name} className="flex items-center justify-between">
                            <span>{v.name}</span>
                            <span className="text-xs">{v.date}</span>
                          </li>
                        ))}
                      </ul>
                    </InfoLine>
                  </TabsContent>
                  <TabsContent value="pedigree" className="mt-3 space-y-3">
                    <InfoLine icon={<Award className="h-4 w-4" />} title="Genética">
                      <p className="text-sm text-muted-foreground">{profilePet.genetics}</p>
                    </InfoLine>
                    <InfoLine icon={<ShieldCheck className="h-4 w-4" />} title="Certificações">
                      <div className="flex flex-wrap gap-1.5">
                        {profilePet.certifications.map((c) => (
                          <Badge key={c} className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </InfoLine>
                  </TabsContent>
                  <TabsContent value="aval" className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent-yellow text-accent-yellow" />
                      <span className="text-2xl font-bold">{profilePet.rating}</span>
                      <span className="text-sm text-muted-foreground">({profilePet.reviews.length} avaliações)</span>
                    </div>
                    {profilePet.reviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem avaliações ainda.</p>
                    ) : (
                      profilePet.reviews.map((r, i) => (
                        <div key={i} className="rounded-2xl border bg-muted/30 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold">{r.tutor}</span>
                            <span className="flex items-center gap-0.5 text-accent-yellow">
                              {Array.from({ length: r.stars }).map((_, k) => (
                                <Star key={k} className="h-3.5 w-3.5 fill-current" />
                              ))}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ===== Chat Dialog ===== */}
      <Dialog open={!!chatPet} onOpenChange={(o) => !o && setChatPet(null)}>
        <DialogContent className="max-h-[85vh] max-w-md rounded-3xl p-0">
          {chatPet && (
            <>
              <div className="flex items-center gap-3 border-b p-4">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chatPet.img} />
                    <AvatarFallback>{initials(chatPet.tutor.name)}</AvatarFallback>
                  </Avatar>
                  {chatPet.tutor.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{chatPet.tutor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {chatPet.tutor.online ? "Online" : `Visto ${chatPet.tutor.lastSeen}`} · sobre {chatPet.name}
                  </p>
                </div>
              </div>

              <div className="h-80 space-y-3 overflow-y-auto bg-muted/20 p-4">
                {(chatStore[chatPet.id] ?? []).map((m, i) => (
                  <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        m.from === "me"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-card"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className={`mt-1 flex items-center gap-1 text-[10px] ${m.from === "me" ? "text-white/70" : "text-muted-foreground"}`}>
                        {m.time}
                        {m.from === "me" && <CheckCheck className="h-3 w-3" />}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <div className="flex flex-wrap gap-1.5 border-t bg-card px-3 pt-2">
                {[
                  { label: "📸 Enviar foto", fn: () => toast("Galeria em breve") },
                  { label: "📅 Agendar encontro", fn: () => toast.success("Convite enviado para agendamento") },
                  { label: "💞 Solicitar reprodução", fn: () => toast.success("Solicitação enviada ao tutor") },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={q.fn}
                    className="rounded-full border bg-background px-3 py-1 text-xs hover:border-primary/40 hover:text-primary"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t p-3">
                <Button variant="outline" size="icon" onClick={() => toast("Galeria em breve")} className="rounded-full">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Escreva uma mensagem…"
                  className="rounded-full"
                />
                <Button onClick={sendMessage} size="icon" className="rounded-full gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Celebração de Match ===== */}
      <Dialog open={!!matchPet} onOpenChange={(o) => !o && setMatchPet(null)}>
        <DialogContent className="max-w-md overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-primary via-primary-glow to-accent-warm p-0 text-primary-foreground">
          {matchPet && (
            <div className="relative p-8 text-center">
              <Heart className="absolute left-6 top-6 h-6 w-6 animate-heartbeat" />
              <Sparkles className="absolute right-6 top-6 h-6 w-6 animate-twinkle" />
              <h2 className="text-4xl font-bold">É um Match! 🎉</h2>
              <p className="mt-2 text-sm opacity-90">Você e {matchPet.name} podem se conectar agora.</p>
              <div className="my-6 flex items-center justify-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white">
                  <AvatarFallback className="bg-white text-primary">EU</AvatarFallback>
                </Avatar>
                <HeartHandshake className="h-8 w-8 animate-heartbeat" />
                <Avatar className="h-20 w-20 border-4 border-white">
                  <AvatarImage src={matchPet.img} />
                  <AvatarFallback>{matchPet.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => { const p = matchPet; setMatchPet(null); openChat(p); }}
                  className="flex-1 rounded-full bg-white text-primary hover:bg-white/90"
                >
                  <MessageCircle className="h-4 w-4" /> Conversar
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

      {/* ===== Anunciar filhote ===== */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Anunciar filhote
            </DialogTitle>
            <DialogDescription>
              Preencha as informações para publicar no marketplace.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setAnnounceOpen(false);
              toast.success("Anúncio publicado!", { description: "Seu anúncio está visível no marketplace." });
            }}
          >
            <div>
              <Label>Título</Label>
              <Input required placeholder="Ex: Filhotes Golden ninhada de janeiro" className="mt-1 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Raça</Label>
                <Input required placeholder="Ex: Labrador" className="mt-1 rounded-full" />
              </div>
              <div>
                <Label>Espécie</Label>
                <Select defaultValue="Cachorro">
                  <SelectTrigger className="mt-1 rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cachorro">Cachorro</SelectItem>
                    <SelectItem value="Gato">Gato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Idade (meses)</Label>
                <Input required type="number" min={1} placeholder="2" className="mt-1 rounded-full" />
              </div>
              <div>
                <Label>Quantidade disponível</Label>
                <Input required type="number" min={1} placeholder="3" className="mt-1 rounded-full" />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input required placeholder="São Paulo, SP" className="mt-1 rounded-full" />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input required type="number" min={0} placeholder="3500" className="mt-1 rounded-full" />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea placeholder="Conte sobre os filhotes, pais, certificações…" className="mt-1 rounded-2xl" rows={3} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border bg-muted/30 p-3">
              <Label className="text-sm">Possui pedigree CBKC/CFA</Label>
              <Switch defaultChecked />
            </div>
            <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center">
              <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Clique ou arraste fotos dos filhotes</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAnnounceOpen(false)} className="rounded-full">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-full gradient-primary text-primary-foreground">
                Publicar anúncio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Preview filhote ===== */}
      <Dialog open={!!puppyPreview} onOpenChange={(o) => !o && setPuppyPreview(null)}>
        <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0">
          {puppyPreview && (
            <>
              <div className="relative aspect-video">
                <img src={puppyPreview.img} alt={puppyPreview.title} className="h-full w-full object-cover" />
                <Badge className="absolute right-3 top-3 rounded-full bg-card text-primary shadow-soft hover:bg-card">
                  {formatBRL(puppyPreview.price)}
                </Badge>
              </div>
              <div className="space-y-3 p-5">
                <DialogHeader>
                  <DialogTitle>{puppyPreview.title}</DialogTitle>
                  <DialogDescription>
                    {puppyPreview.breed} · {puppyPreview.ageMonths} meses · {puppyPreview.city}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border bg-muted/30 p-2"><p className="font-bold">{puppyPreview.available}</p><p className="text-muted-foreground">disponíveis</p></div>
                  <div className="rounded-xl border bg-muted/30 p-2"><p className="font-bold">há {puppyPreview.postedDaysAgo}d</p><p className="text-muted-foreground">anúncio</p></div>
                  <div className="rounded-xl border bg-muted/30 p-2"><p className="font-bold">{puppyPreview.status}</p><p className="text-muted-foreground">status</p></div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-semibold">{puppyPreview.seller.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-accent-yellow text-accent-yellow" /> {puppyPreview.seller.rating}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success("Mensagem enviada!", { description: `${puppyPreview.seller.name} receberá seu interesse.` });
                      setPuppyPreview(null);
                    }}
                    className="rounded-full gradient-primary text-primary-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" /> Contatar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================
// Subcomponentes
// ============================================================
const ActionBtn = ({
  children,
  className = "",
  title,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  onClick: () => void;
}) => (
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

const SwipeCard = ({
  pet,
  swipeDir,
  onOpenProfile,
  onLike,
  onDislike,
}: {
  pet: MatchPetItem;
  swipeDir: SwipeDir;
  onOpenProfile: () => void;
  onLike: () => void;
  onDislike: () => void;
}) => {
  const score = compatScore(pet.compat);
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

        {/* selos topo */}
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          {pet.pedigree && (
            <Badge className="rounded-full border border-white/30 bg-white/15 text-white backdrop-blur">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Pedigree verificado
            </Badge>
          )}
          <Badge className="rounded-full border border-white/30 bg-primary/90 text-primary-foreground backdrop-blur">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {score}% match
          </Badge>
        </div>

        {/* stamps direcionais */}
        <div className={`absolute right-6 top-16 rounded-2xl border-4 border-emerald-400 px-4 py-2 text-2xl font-bold uppercase text-emerald-400 transition-opacity ${swipeDir === "right" ? "opacity-100" : "opacity-0"} -rotate-12`}>
          Curtir
        </div>
        <div className={`absolute left-6 top-16 rounded-2xl border-4 border-destructive px-4 py-2 text-2xl font-bold uppercase text-destructive transition-opacity ${swipeDir === "left" ? "opacity-100" : "opacity-0"} rotate-12`}>
          Pular
        </div>

        {/* info bottom */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-3xl font-bold">{pet.name}, {pet.ageYears}a</h3>
              <p className="text-sm opacity-90">{pet.breed} · {pet.sex}</p>
            </div>
            {pet.species === "Cachorro" ? (
              <Dog className="h-7 w-7 opacity-80" />
            ) : (
              <Cat className="h-7 w-7 opacity-80" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs opacity-90">
            <MapPin className="h-3.5 w-3.5" />
            {pet.city} · {pet.distanceKm} km
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pet.temperament.map((t) => (
              <span key={t} className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] backdrop-blur">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-2xl bg-black/30 p-2 backdrop-blur">
            <p className="mb-1 text-[10px] uppercase tracking-wider opacity-80">Compatibilidade genética</p>
            <Progress value={score} className="h-1.5 bg-white/20" />
          </div>
        </div>
      </div>
    </Card>
  );
};

const CompatBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value}%</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
);

const InfoLine = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
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

const EmptyDeck = ({
  likesCount,
  onReset,
}: {
  likesCount: number;
  onReset: () => void;
}) => (
  <Card className="flex h-[560px] w-full max-w-sm flex-col items-center justify-center rounded-3xl border bg-card p-8 text-center shadow-soft">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
      <Sparkles className="h-8 w-8 text-primary animate-twinkle" />
    </div>
    <h3 className="text-xl font-bold">Acabaram os pets por aqui</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      {likesCount > 0
        ? `Você curtiu ${likesCount} pet${likesCount > 1 ? "s" : ""}. Confira na aba Matches.`
        : "Ajuste os filtros e tente novamente."}
    </p>
    <Button onClick={onReset} className="mt-5 rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow">
      <Undo2 className="h-4 w-4" /> Recomeçar
    </Button>
  </Card>
);

const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <Card className="flex flex-col items-center justify-center rounded-3xl border bg-card p-12 text-center shadow-soft">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">{icon}</div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </Card>
);

export default MatchPet;

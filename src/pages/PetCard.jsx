import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStoredUser, petsService } from "@/services/api";

import {
  Printer,
  Syringe,
  HeartPulse,
  Phone,
  PawPrint,
  Stethoscope,
  User,
  ScanLine,
  ShieldCheck,
  Scale,
  FlaskConical,
  CalendarCheck,
  ClipboardList,
  GitBranch,
  History,
  ChevronRight,
  Crown,
  Activity,
  FileText,
  Pill,
  Trophy,
  Sparkles,
  Users,
  Heart,
  Siren,
  Mail,
  MessageCircle,
  Clock,
  Footprints,
  Utensils,
  Home,
  Car,
  GraduationCap,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";

import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";

const activityIcons = {
  Passeios: Footprints,
  Passeio: Footprints,
  Alimentação: Utensils,
  Hospedagem: Home,
  Medicação: Pill,
  Transporte: Car,
  Consultas: Stethoscope,
  Recreação: Heart,
  Treinamento: GraduationCap,
  Treino: GraduationCap,
  Vacinação: Syringe,
  Vacina: Syringe,
  Exames: FlaskConical,
  Procedimentos: Activity,
  Procedimento: Activity,
  Cuidado: Heart,
  Saúde: HeartPulse,
  Rotina: Clock,
};

const bondTone = {
  "Muito Alto": "bg-emerald-100 text-emerald-700",
  Alto: "bg-sky-100 text-sky-700",
  Médio: "bg-amber-100 text-amber-700",
  Baixo: "bg-muted text-muted-foreground",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const raw = dateStr.split("T")[0];
    const [year, month, day] = raw.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const formatAge = (birthDateStr) => {
  if (!birthDateStr) return "Não informada";
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
    return "Não informada";
  }
};

const PetCard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Estados do modo de emergência público (QR Code)
  const [emergencyPet, setEmergencyPet] = useState(null);
  const [emergencyLoading, setEmergencyLoading] = useState(Boolean(token));
  const [emergencyError, setEmergencyError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [loading, setLoading] = useState(!token);

  // Modais de detalhamento
  const [open, setOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [lineageOpen, setLineageOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedAncestor, setSelectedAncestor] = useState(null);

  // 1. Busca dados de emergência se token público estiver presente na URL
  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadEmergency = async () => {
      try {
        setEmergencyLoading(true);
        setEmergencyError(null);
        const data = await petsService.getPublicEmergency(token);
        if (isMounted) setEmergencyPet(data);
      } catch (err) {
        if (isMounted) setEmergencyError("Animal não encontrado ou QR Code desativado.");
      } finally {
        if (isMounted) setEmergencyLoading(false);
      }
    };
    loadEmergency();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Se for acesso regular (sem token), exige autenticação
  useEffect(() => {
    if (!token && !getStoredUser()) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  // 3. Carrega dados do tutor logado e busca os pets reais cadastrados no banco
  useEffect(() => {
    if (token) return;
    const user = getStoredUser();
    setCurrentUser(user);

    const loadPets = async () => {
      try {
        setLoading(true);
        const data = await petsService.list();
        if (Array.isArray(data) && data.length > 0) {
          setPets(data);
          const requestedId =
            searchParams.get("id") || searchParams.get("petId");
          const target = requestedId
            ? data.find((p) => String(p.id) === String(requestedId))
            : null;
          setSelectedPetId(target ? target.id : data[0].id);
        } else {
          setPets([]);
        }
      } catch (err) {
        console.error("Erro ao carregar pets do tutor:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPets();
  }, [searchParams]);

  // Pet atualmente selecionado pelo usuário
  const selectedPet = useMemo(() => {
    if (!pets.length) return null;
    return pets.find((p) => p.id === selectedPetId) || pets[0];
  }, [pets, selectedPetId]);

  // Foto do animal com fallback neutro
  const petPhoto = useMemo(() => {
    return getPetPhoto(selectedPet?.foto_url);
  }, [selectedPet]);

  // Dados consolidados do tutor autenticado
  const tutorData = useMemo(() => {
    return {
      name: currentUser?.nome || "Tutor LivePet",
      phone: currentUser?.telefone || "(62) 99999-0000",
      email: currentUser?.email || "tutor@livepet.com",
    };
  }, [currentUser]);

  // Lista de vacinas do banco de dados
  const vaccinesList = useMemo(() => {
    return selectedPet?.vaccines || [];
  }, [selectedPet]);

  // Histórico clínico / prontuário do banco de dados
  const medicalHistory = useMemo(() => {
    return selectedPet?.medical_records || [];
  }, [selectedPet]);

  // Veterinário de referência extraído do último registro de vacina ou prontuário
  const vetInfo = useMemo(() => {
    const vetFromVac = vaccinesList.find((v) => v.veterinario)?.veterinario;
    return {
      name: vetFromVac || "Clínica Veterinária Parceira",
      crmv: "CRMV Regularizado",
      phone: tutorData.phone,
    };
  }, [vaccinesList, tutorData]);

  // Rede de contatos: inclui sempre o tutor e veterinário vinculado
  const careNetwork = useMemo(() => {
    const contacts = [];

    // Tutor Principal (usuário logado)
    contacts.push({
      id: "tutor",
      name: tutorData.name,
      role: "Tutor(a) Principal",
      relationTutor: "Próprio(a)",
      relationPet: "Tutor responsável",
      phone: tutorData.phone,
      email: tutorData.email,
      photo:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face",
      category: "emergency",
      bondLevel: "Muito Alto",
      timeTogether: "Tutor Titular",
      interactions: 120,
      lastInteraction: "Hoje",
      frequency: "Diária",
      timesResponsible: 100,
      totalDays: 365,
      longestStreak: "365 dias",
      lastResponsibility: "Em andamento",
      activities: [
        "Alimentação",
        "Passeios",
        "Medicação",
        "Consultas",
        "Recreação",
      ],
      timeline: [
        { date: "Hoje", title: "Responsável pelo animal", type: "Rotina" },
      ],
      notes: "Tutor titular cadastrado na plataforma oficial LivePet.",
    });

    // Se houver contatos registrados no banco de dados
    if (selectedPet?.care_contacts && selectedPet.care_contacts.length > 0) {
      selectedPet.care_contacts.forEach((c) => {
        contacts.push({
          id: `db-${c.id}`,
          name: c.nome,
          role: c.funcao,
          relationTutor: c.relacao_tutor || "Contato autorizado",
          relationPet: c.relacao_pet || "Cuidador",
          phone: c.telefone,
          email: c.email,
          photo:
            c.foto_url ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
          category: c.categoria || "care",
          bondLevel: c.nivel_vinculo || "Alto",
          timeTogether: "Rede ativa",
          interactions: 24,
          lastInteraction: "Recente",
          frequency: "Semanal",
          timesResponsible: 10,
          totalDays: 20,
          longestStreak: "5 dias",
          lastResponsibility: "Recente",
          activities: ["Passeios", "Alimentação"],
          timeline: [
            { date: "Recente", title: "Apoio ao tutor", type: "Cuidado" },
          ],
          notes: c.observacoes || "Contato cadastrado na rede de cuidados.",
        });
      });
    } else {
      // Contato de emergência da clínica
      contacts.push({
        id: "vet",
        name: vetInfo.name,
        role: "Veterinário(a) de Referência",
        relationTutor: "Profissional de saúde",
        relationPet: "Atendimento clínico",
        phone: vetInfo.phone,
        photo:
          "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=face",
        category: "emergency",
        bondLevel: "Alto",
        timeTogether: "Histórico clínico",
        interactions: vaccinesList.length + medicalHistory.length,
        lastInteraction: "Último registro",
        frequency: "Semestral",
        timesResponsible: 1,
        totalDays: 1,
        longestStreak: "—",
        lastResponsibility: "Atendimento clínico",
        activities: ["Consultas", "Vacinação", "Procedimentos"],
        timeline: [
          {
            date: "Ativo",
            title: "Acompanhamento profissional",
            type: "Consulta",
          },
        ],
        notes: "Profissional ou clínica responsável pelos registros clínicos.",
      });
    }

    return contacts;
  }, [tutorData, selectedPet, vetInfo, vaccinesList, medicalHistory]);

  // URL pública de emergência e QR Payload
  const publicEmergencyUrl = useMemo(() => {
    if (!selectedPet?.token_publico) return "";
    return `https://livepet-1.onrender.com/cartao?token=${selectedPet.token_publico}`;
  }, [selectedPet]);

  const qrPayload = useMemo(() => {
    if (!selectedPet) return "";
    return JSON.stringify({
      sistema: "LivePet",
      pet: selectedPet.nome,
      especie: selectedPet.especie,
      raca: selectedPet.raca || "SRD",
      porte: selectedPet.porte,
      tutor: tutorData.name,
      telefone_emergencia: tutorData.phone,
      token_publico: selectedPet.token_publico,
      url_emergencia: publicEmergencyUrl,
    });
  }, [selectedPet, tutorData, publicEmergencyUrl]);

  // Pedigree e Linhagem
  const lineageData = useMemo(() => {
    const lin = selectedPet?.lineage;
    const selfName = selectedPet?.nome || "Pet";
    const registryNum = lin?.registro || `CBKC-${selectedPet?.id || 1000}`;

    return {
      registry: registryNum,
      generations: lin?.generacoes || 3,
      tree: {
        self: {
          name: selfName,
          title: "Titular",
          color: "from-primary to-primary/70",
        },
        parents: [
          {
            name:
              lin?.pai_nome ||
              (lin?.pai_pet_id ? "Pai Vinculado LivePet" : "Pai Sob Consulta"),
            role: "Pai",
            registry: lin?.pai_registro || "—",
            titles:
              lin?.pai_titulos ||
              (lin?.pai_nome ? "Pedigree Declarado" : "Pendente"),
          },
          {
            name:
              lin?.mae_nome ||
              (lin?.mae_pet_id ? "Mãe Vinculada LivePet" : "Mãe Sob Consulta"),
            role: "Mãe",
            registry: lin?.mae_registro || "—",
            titles:
              lin?.mae_titulos ||
              (lin?.mae_nome ? "Pedigree Declarado" : "Pendente"),
          },
        ],
        grandparents: [
          {
            name: lin?.avo_pat_m_nome || "Avô paterno",
            role: "Avô paterno",
            registry: lin?.avo_pat_m_registro || "—",
          },
          {
            name: lin?.avo_pat_f_nome || "Avó paterna",
            role: "Avó paterna",
            registry: lin?.avo_pat_f_registro || "—",
          },
          {
            name: lin?.avo_mat_m_nome || "Avô materno",
            role: "Avô materno",
            registry: lin?.avo_mat_m_registro || "—",
          },
          {
            name: lin?.avo_mat_f_nome || "Avó materna",
            role: "Avó materna",
            registry: lin?.avo_mat_f_registro || "—",
          },
        ],
      },
    };
  }, [selectedPet]);

  // Atualiza o ancestral selecionado padrão quando a linhagem muda
  useEffect(() => {
    if (selectedPet) {
      setSelectedAncestor({
        name: selectedPet.nome,
        role: "Titular",
        registry: lineageData.registry,
        titles: "Pedigree certificado LivePet",
      });
    }
  }, [selectedPet, lineageData]);

  // ============================================================
  // RENDERIZAÇÃO DO MODO DE EMERGÊNCIA PÚBLICO (QUANDO HÁ TOKEN)
  // ============================================================
  if (token) {
    if (emergencyLoading) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Buscando dados de emergência do animal...
          </p>
        </div>
      );
    }

    if (emergencyError || !emergencyPet) {
      return (
        <div className="container max-w-md py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Animal não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {emergencyError || "Este QR Code pode estar desatualizado ou não cadastrado na rede LivePet."}
          </p>
          <Button asChild className="mt-6 rounded-full gradient-primary">
            <Link to="/">Página Inicial LivePet</Link>
          </Button>
        </div>
      );
    }

    const hasVaccines = emergencyPet.vacinas_principais && emergencyPet.vacinas_principais.length > 0;
    const isRabiesVaccinated = emergencyPet.vacinas_principais?.some((v) => {
      const n = (v.nome || "").toLowerCase();
      return n.includes("raiva") || n.includes("antirrábica") || n.includes("antirrabica");
    });

    const cleanPhone = emergencyPet.tutor_telefone ? emergencyPet.tutor_telefone.replace(/\D/g, "") : "";
    const whatsappUrl = cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
          `Olá, encontrei o seu pet ${emergencyPet.nome} através do QR Code do LivePet!`
        )}`
      : null;

    return (
      <div className="container max-w-lg py-6 px-4">
        {/* Banner de Alerta e Conscientização */}
        <div className="mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-4 text-amber-950 dark:text-amber-200 flex items-start gap-3 shadow-sm">
          <Siren className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold text-sm">Modo de Emergência — Animal Encontrado</p>
            <p className="text-xs opacity-90 mt-0.5">
              Você está visualizando a identificação de segurança de <strong>{emergencyPet.nome}</strong>. Por favor, ajude-o contatando o tutor abaixo.
            </p>
          </div>
        </div>

        {/* Card Principal de Identificação */}
        <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-soft p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <img
                src={getPetPhoto(emergencyPet.foto_url)}
                alt={emergencyPet.nome}
                className="h-28 w-28 rounded-2xl object-cover border-4 border-background shadow-md bg-muted"
              />
              <span
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-sm"
                title="Cadastrado na Rede LivePet"
              >
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {emergencyPet.nome}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[emergencyPet.especie, emergencyPet.raca, emergencyPet.sexo, emergencyPet.porte, emergencyPet.cor]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>

          {/* Destaque de Saúde e Imunização contra Raiva */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Proteção e Vacinação Comprovada</span>
            </div>
            <p className="text-xs text-emerald-900/85 dark:text-emerald-200/85 leading-relaxed">
              {isRabiesVaccinated
                ? "Este animal possui vacinação antirrábica registrada na plataforma. Ele é vacinado, cuidado e NÃO oferece risco de raiva. Por favor, trate-o com carinho e ajude-o a voltar para sua família!"
                : hasVaccines
                ? "Este animal possui histórico de vacinas registrado na plataforma LivePet. Ele é vacinado e acompanhado por tutor responsável."
                : "Animal registrado no LivePet. Por favor, acolha-o em segurança até conseguir contato com o tutor."}
            </p>

            {hasVaccines && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20">
                <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 mb-1.5">
                  Vacinas registradas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {emergencyPet.vacinas_principais.map((v, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-background/80 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs py-0.5"
                    >
                      <Syringe className="h-3 w-3 mr-1 text-emerald-600" />
                      {v.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avisos Médicos Vitais */}
          {emergencyPet.avisos_medicos &&
            emergencyPet.avisos_medicos !== "Nenhum alerta médico crítico registrado." && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-1">
                  <HeartPulse className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Cuidados Médicos / Alertas</span>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
                  {emergencyPet.avisos_medicos}
                </p>
              </div>
            )}

          {/* Contato do Tutor */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Tutor Responsável
              </p>
              <p className="text-base font-bold text-foreground">{emergencyPet.tutor_nome}</p>
              {emergencyPet.tutor_telefone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3 w-3 text-primary" />
                  {emergencyPet.tutor_telefone}
                </p>
              )}
            </div>

            {emergencyPet.tutor_telefone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button asChild className="w-full rounded-xl gradient-primary text-primary-foreground shadow-sm">
                  <a href={`tel:${cleanPhone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Ligar para o Tutor
                  </a>
                </Button>
                {whatsappUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
                      Chamar WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="text-center pt-1">
            <p className="text-[11px] text-muted-foreground">
              Identificação digital oficial fornecida pela plataforma <strong>LivePet</strong>.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Estado de carregamento inicial
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Carregando seus animais cadastrados no LivePet...
        </p>
      </div>
    );
  }

  // Estado quando o tutor não possui nenhum pet cadastrado ainda
  if (!loading && pets.length === 0) {
    return (
      <div className="container max-w-3xl py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PawPrint className="h-10 w-10" />
        </div>
        <Badge className="mb-3 rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
          Carteira Digital LivePet
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Nenhum pet cadastrado ainda
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Olá, <strong className="text-foreground">{tutorData.name}</strong>!
          Para gerar o seu Cartão Animal oficial com QR Code de emergência,
          vacinas e histórico clínico, cadastre seu primeiro pet.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild className="rounded-full gradient-primary shadow-soft">
            <Link to="/pets/novo">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Meu Primeiro Pet
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-14">
        {/* Cabeçalho da Página */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
              Carteira digital oficial · LivePet
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Cartão Animal
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Identificação oficial do pet com QR Code de emergência vinculado ao
              banco de dados. Dados exclusivos do tutor{" "}
              <strong className="text-foreground">{tutorData.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link to="/pets/novo">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Pet
              </Link>
            </Button>
            <Button
              onClick={() => window.print()}
              className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Imprimir cartão
            </Button>
          </div>
        </div>

        {/* SELETOR DE PETS DO TUTOR */}
        {pets.length > 1 && (
          <div className="mb-8 overflow-hidden rounded-2xl border bg-card p-3 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Selecione o pet para visualizar o cartão:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pets.map((p) => {
                const isActive = p.id === selectedPet.id;
                const photo = getPetPhoto(p.foto_url);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPetId(p.id)}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                        : "border-border/70 bg-background hover:bg-muted/40"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={p.nome}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                    />
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {p.nome}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.raca || p.especie}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="print-area space-y-6">
          {/* CARTÃO OFICIAL FISICO/DIGITAL */}
          <Card className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border-2 border-primary/20 bg-white p-0 shadow-soft print:max-w-full print:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_280px]">
              {/* Lado Esquerdo - Badge Oficial */}
              <div className="gradient-primary relative flex flex-col items-center justify-between gap-4 p-6 text-primary-foreground">
                <div className="flex w-full items-center gap-2">
                  <PawPrint className="h-5 w-5" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    LivePet
                  </span>
                </div>
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-white/15 shadow-inner">
                  <img
                    src={petPhoto}
                    alt={selectedPet.nome}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="w-full text-center">
                  <p className="text-[10px] uppercase tracking-widest opacity-80">
                    Cartão Oficial
                  </p>
                  <p className="font-mono text-xs font-semibold">
                    ID #{selectedPet.id} · {selectedPet.token_publico?.slice(0, 6)}
                  </p>
                </div>
              </div>

              {/* Centro - Dados de Identificação */}
              <div className="flex flex-col gap-5 p-6 md:p-8">
                <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Nome do animal
                    </p>
                    <h2 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
                      {selectedPet.nome}
                    </h2>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full text-[10px] uppercase tracking-widest"
                  >
                    Identificação Digital
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <Field label="Espécie" value={selectedPet.especie} />
                  <Field label="Raça" value={selectedPet.raca || "SRD"} />
                  <Field
                    label="Idade"
                    value={formatAge(selectedPet.data_nascimento)}
                  />
                  <Field
                    label="Nascimento"
                    value={formatDate(selectedPet.data_nascimento)}
                  />
                  <Field
                    label="Porte / Sexo"
                    value={`${selectedPet.porte || "Médio"} · ${
                      selectedPet.sexo || "Não informado"
                    }`}
                  />
                  <Field
                    label="Peso Atual"
                    value={
                      selectedPet.peso ? `${selectedPet.peso} kg` : "Não aferido"
                    }
                  />
                  <Field
                    label="Pelagem / Cor"
                    value={selectedPet.cor || "Padrão"}
                  />
                  <Field
                    label="Token Público"
                    value={selectedPet.token_publico?.slice(0, 12) + "..."}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Tutor Responsável
                      </p>
                      <p className="text-sm font-semibold">{tutorData.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tutorData.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Stethoscope className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Veterinário / Clínica
                      </p>
                      <p className="text-sm font-semibold">{vetInfo.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {vetInfo.crmv} · {vetInfo.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lado Direito - QR Code de Emergência */}
              <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-border/60 bg-muted/30 p-6 md:border-l md:border-t-0">
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Mostrar dados do QR Code"
                  className="group relative rounded-2xl border-2 border-primary/20 bg-white p-3 transition-smooth hover:border-primary hover:shadow-glow"
                >
                  <QRCodeSVG
                    value={qrPayload}
                    size={160}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/0 transition-smooth group-hover:bg-primary/5">
                    <ScanLine className="h-6 w-6 text-primary opacity-0 transition-smooth group-hover:opacity-100" />
                  </span>
                </button>
                <p className="max-w-[200px] text-center text-xs text-muted-foreground">
                  Escaneie para acessar o contato do tutor e avisos médicos
                </p>
              </div>
            </div>
          </Card>

          {/* GRID DE INFORMAÇÕES REAIS DO BANCO DE DADOS */}
          <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. VACINAS VINCULADAS AO BANCO */}
            <InfoCard
              icon={<Syringe className="h-5 w-5" />}
              title="Vacinas Registradas"
              accent="bg-emerald-50 text-emerald-700"
            >
              {vaccinesList.length > 0 ? (
                <>
                  <ul className="divide-y divide-border/60">
                  {vaccinesList.map((v) => (
                    <li
                      key={v.id || v.nome}
                      className="flex flex-col gap-0.5 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {v.nome}
                        </span>
                        {v.lote && (
                          <span className="text-[10px] text-muted-foreground">
                            Lt: {v.lote}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Aplicada: {formatDate(v.data_aplicacao)}
                        {v.proxima_dose &&
                          ` · Reforço: ${formatDate(v.proxima_dose)}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-border/60 pt-2 text-center">
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                  >
                    <Link to={`/saude?petId=${selectedPet.id}`}>
                      Ver carteira de vacinas completa →
                    </Link>
                  </Button>
                </div>
              </>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <p>Nenhuma vacina registrada para {selectedPet.nome}.</p>
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="mt-1 text-primary"
                  >
                    <Link to={`/saude?petId=${selectedPet.id}`}>
                      Ir para a Carteira de Vacinas
                    </Link>
                  </Button>
                </div>
              )}
            </InfoCard>

            {/* 2. SAÚDE E BEM-ESTAR */}
            <InfoCard
              icon={<HeartPulse className="h-5 w-5" />}
              title="Saúde e Bem-Estar"
              accent="bg-rose-50 text-rose-700"
            >
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      Índice de saúde LivePet
                    </span>
                    <span className="font-semibold text-foreground">
                      {vaccinesList.length > 0 ? "92/100" : "80/100"}
                    </span>
                  </div>
                  <Progress
                    value={vaccinesList.length > 0 ? 92 : 80}
                    className="h-2"
                  />
                </div>
                <ul className="space-y-2 text-sm">
                  <HealthRow
                    icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
                    label="Status vacinal"
                    value={
                      vaccinesList.length > 0
                        ? `${vaccinesList.length} doses registradas`
                        : "Pendente de doses"
                    }
                  />
                  <HealthRow
                    icon={<Scale className="h-4 w-4 text-sky-600" />}
                    label="Peso aferido"
                    value={
                      selectedPet.peso
                        ? `${selectedPet.peso} kg · Regular`
                        : "Não informado"
                    }
                  />
                  <HealthRow
                    icon={<FlaskConical className="h-4 w-4 text-violet-600" />}
                    label="Histórico clínico"
                    value={
                      medicalHistory.length > 0
                        ? `${medicalHistory.length} ocorrências`
                        : "Sem prontuário"
                    }
                  />
                  <HealthRow
                    icon={<CalendarCheck className="h-4 w-4 text-amber-600" />}
                    label="Próximo reforço"
                    value={
                      vaccinesList.find((v) => v.proxima_dose)
                        ? formatDate(
                            vaccinesList.find((v) => v.proxima_dose)
                              ?.proxima_dose
                          )
                        : "Consulte o veterinário"
                    }
                  />
                </ul>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setHealthOpen(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                  >
                    <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    Resumo
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                  >
                    <Link to={`/historico-medico?petId=${selectedPet.id}`}>
                      <History className="mr-1 h-3.5 w-3.5" />
                      Histórico
                    </Link>
                  </Button>
                </div>
              </div>
            </InfoCard>

            {/* 3. REDE DE CUIDADOS E EMERGÊNCIA */}
            <InfoCard
              icon={<Users className="h-5 w-5" />}
              title="Rede de Cuidados"
              accent="bg-sky-50 text-sky-700"
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Siren className="h-3.5 w-3.5 text-rose-600" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                      Contatos de Emergência
                    </p>
                  </div>
                  <div className="space-y-2">
                    {careNetwork
                      .filter((c) => c.category === "emergency")
                      .map((c) => (
                        <CareCard
                          key={c.id}
                          contact={c}
                          onClick={() => setSelectedContact(c)}
                        />
                      ))}
                  </div>
                </div>
                {careNetwork.some((c) => c.category === "care") && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-sky-600" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                        Cuidadores e Apoio
                      </p>
                    </div>
                    <div className="space-y-2">
                      {careNetwork
                        .filter((c) => c.category === "care")
                        .map((c) => (
                          <CareCard
                            key={c.id}
                            contact={c}
                            onClick={() => setSelectedContact(c)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* 4. LINHAGEM / PEDIGREE */}
            <InfoCard
              icon={<GitBranch className="h-5 w-5" />}
              title="Linhagem e Pedigree"
              accent="bg-amber-50 text-amber-700"
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-50 to-white p-3 ring-1 ring-amber-100">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Registro Oficial
                    </p>
                    <p className="truncate font-semibold text-foreground">
                      {lineageData.registry}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Certificação genealógica de {selectedPet.nome}. Raça:{" "}
                  <strong>{selectedPet.raca || "SRD"}</strong>.
                </p>
                <Button
                  onClick={() => setLineageOpen(true)}
                  variant="outline"
                  className="w-full rounded-full"
                >
                  <GitBranch className="mr-1.5 h-4 w-4" />
                  Ver árvore genealógica
                </Button>
              </div>
            </InfoCard>

            {/* 5. HISTÓRICO CLÍNICO VETERINÁRIO */}
            <InfoCard
              icon={<History className="h-5 w-5" />}
              title="Histórico Veterinário"
              accent="bg-indigo-50 text-indigo-700"
            >
              <div className="space-y-3 text-sm">
                {medicalHistory.length > 0 ? (
                  <ul className="space-y-2">
                    {medicalHistory.slice(0, 3).map((h) => (
                      <li
                        key={h.id}
                        className="flex items-start gap-2 rounded-xl bg-muted/40 p-2"
                      >
                        <Stethoscope className="mt-0.5 h-4 w-4 text-indigo-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {h.tipo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(h.data_registro)}
                            {h.peso_registrado &&
                              ` · ${h.peso_registrado} kg`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    <p>Nenhum prontuário registrado ainda.</p>
                  </div>
                )}
                <Button
                  onClick={() => setHistoryOpen(true)}
                  variant="outline"
                  className="w-full rounded-full"
                >
                  <History className="mr-1.5 h-4 w-4" />
                  Ver linha do tempo completa
                </Button>
              </div>
            </InfoCard>
          </div>
        </div>
      </main>

      {/* DIALOG 1: QR Code do Pet */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Ficha do Animal — {selectedPet?.nome}
            </DialogTitle>
            <DialogDescription>
              Dados compartilhados através do escaneamento do QR Code oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border bg-muted/30 p-4 text-sm">
              <p>
                <strong>Espécie:</strong> {selectedPet?.especie}
              </p>
              <p>
                <strong>Raça:</strong> {selectedPet?.raca || "SRD"}
              </p>
              <p>
                <strong>Idade:</strong>{" "}
                {formatAge(selectedPet?.data_nascimento)}
              </p>
              <p>
                <strong>Porte:</strong> {selectedPet?.porte || "Médio"}
              </p>
              <p>
                <strong>Identificador:</strong> {selectedPet?.token_publico}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-3 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Tutor Responsável
                </p>
                <p className="font-semibold">{tutorData.name}</p>
                <p className="text-muted-foreground">{tutorData.phone}</p>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Veterinário
                </p>
                <p className="font-semibold">{vetInfo.name}</p>
                <p className="text-muted-foreground">{vetInfo.phone}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Saúde e Bem-Estar */}
      <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-600" />
              Saúde e Bem-Estar — {selectedPet?.nome}
            </DialogTitle>
            <DialogDescription>
              Histórico clínico e imunológico registrado no LivePet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox
                label="Vacinas"
                value={`${vaccinesList.length}`}
                sub="aplicadas"
              />
              <StatBox
                label="Peso Atual"
                value={
                  selectedPet?.peso ? `${selectedPet.peso}kg` : "Pendente"
                }
                sub="aferido"
              />
              <StatBox
                label="Prontuários"
                value={`${medicalHistory.length}`}
                sub="registros"
              />
              <StatBox
                label="Próximo Reforço"
                value={
                  vaccinesList.find((v) => v.proxima_dose)
                    ? formatDate(
                        vaccinesList.find((v) => v.proxima_dose)?.proxima_dose
                      )
                    : "—"
                }
                sub="agendamento"
              />
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="h-4 w-4 text-violet-600" /> Registros de
                Saúde do Animal
              </h4>
              {medicalHistory.length > 0 ? (
                <ul className="divide-y divide-border/60 rounded-xl border">
                  {medicalHistory.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{m.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(m.data_registro)}
                        </p>
                        {m.descricao && (
                          <p className="mt-1 text-xs text-foreground/80">
                            {m.descricao}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {m.peso_registrado ? `${m.peso_registrado} kg` : "OK"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Nenhum registro clínico adicional cadastrado para este pet.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Linhagem e Árvore Genealógica */}
      <Dialog open={lineageOpen} onOpenChange={setLineageOpen}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Linhagem e Pedigree — {selectedPet?.nome}
            </DialogTitle>
            <DialogDescription>
              Registro {lineageData.registry} · {lineageData.generations}{" "}
              gerações genealógicas.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="tree" className="pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tree">Árvore genealógica</TabsTrigger>
              <TabsTrigger value="list">Lista detalhada</TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="pt-4">
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="relative overflow-x-auto rounded-2xl border bg-gradient-to-b from-muted/30 to-background p-5">
                  <div className="relative mx-auto min-w-[640px]">
                    <div className="relative grid grid-cols-4 gap-3">
                      {lineageData.tree.grandparents.map((g, i) => (
                        <TreeNode
                          key={g.name + i}
                          title={g.name}
                          subtitle={g.role}
                          meta={g.registry}
                          tone="muted"
                          gender={i % 2 === 0 ? "male" : "female"}
                          active={selectedAncestor?.name === g.name}
                          onClick={() =>
                            setSelectedAncestor({
                              ...g,
                              titles: "Linhagem ancestral",
                            })
                          }
                          delay={i * 60}
                        />
                      ))}
                    </div>

                    <div className="h-10" />

                    <div className="relative grid grid-cols-2 gap-6 px-[12.5%]">
                      {lineageData.tree.parents.map((p, i) => (
                        <TreeNode
                          key={p.name + i}
                          title={p.name}
                          subtitle={p.role}
                          meta={p.registry}
                          titles={p.titles}
                          tone="accent"
                          gender={i === 0 ? "male" : "female"}
                          active={selectedAncestor?.name === p.name}
                          onClick={() => setSelectedAncestor(p)}
                          delay={240 + i * 80}
                        />
                      ))}
                    </div>

                    <div className="h-10" />

                    <div className="relative flex justify-center">
                      <div className="w-64">
                        <TreeNode
                          title={selectedPet?.nome || "Titular"}
                          subtitle="Titular"
                          meta={lineageData.registry}
                          tone="primary"
                          gender="male"
                          active={selectedAncestor?.name === selectedPet?.nome}
                          onClick={() =>
                            setSelectedAncestor({
                              name: selectedPet?.nome,
                              role: "Titular",
                              registry: lineageData.registry,
                              titles: "Pedigree certificado LivePet",
                            })
                          }
                          delay={420}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl border bg-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Detalhes do ancestral
                  </p>
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-xl font-bold">
                        {selectedAncestor?.name || selectedPet?.nome}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAncestor?.role || "Titular"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verificado
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedAncestor?.registry || lineageData.registry}
                      </span>
                    </div>
                    {selectedAncestor?.titles && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                        <Trophy className="h-4 w-4" />
                        <span className="font-medium">
                          {selectedAncestor.titles}
                        </span>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="list" className="pt-4">
              <ul className="space-y-2 text-sm">
                <LineageItem
                  name={selectedPet?.nome || "Titular"}
                  role="Titular"
                  meta={lineageData.registry}
                />
                {lineageData.tree.parents.map((p, i) => (
                  <LineageItem
                    key={p.name + i}
                    name={p.name}
                    role={p.role}
                    meta={`${p.registry} · ${p.titles}`}
                  />
                ))}
                {lineageData.tree.grandparents.map((g, i) => (
                  <LineageItem
                    key={g.name + i}
                    name={g.name}
                    role={g.role}
                    meta={g.registry}
                  />
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: Histórico Veterinário Completo */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Histórico Veterinário — {selectedPet?.nome}
            </DialogTitle>
            <DialogDescription>
              Linha do tempo oficial integrada aos registros de vacinas e
              consultas do LivePet.
            </DialogDescription>
          </DialogHeader>

          <div className="relative pt-4">
            {medicalHistory.length > 0 || vaccinesList.length > 0 ? (
              <ul className="space-y-4">
                {vaccinesList.map((v) => (
                  <li key={`v-${v.id}`} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Syringe className="h-4 w-4" />
                    </span>
                    <div className="flex-1 rounded-xl border bg-card p-3">
                      <Badge
                        variant="secondary"
                        className="rounded-full text-[10px] uppercase"
                      >
                        Vacina
                      </Badge>
                      <p className="mt-1 font-semibold">{v.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Aplicada em {formatDate(v.data_aplicacao)}
                        {v.veterinario && ` · ${v.veterinario}`}
                      </p>
                    </div>
                  </li>
                ))}
                {medicalHistory.map((m) => (
                  <li key={`m-${m.id}`} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <div className="flex-1 rounded-xl border bg-card p-3">
                      <Badge
                        variant="secondary"
                        className="rounded-full text-[10px] uppercase"
                      >
                        {m.tipo}
                      </Badge>
                      <p className="mt-1 font-semibold">{m.tipo}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.descricao}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Registrado em {formatDate(m.data_registro)}
                        {m.peso_registrado && ` · ${m.peso_registrado} kg`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum atendimento ou vacina registrado para este pet ainda.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: Contato da Rede de Cuidados */}
      <Dialog
        open={!!selectedContact}
        onOpenChange={(o) => !o && setSelectedContact(null)}
      >
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
          {selectedContact && (
            <>
              <div className="relative rounded-t-2xl bg-gradient-to-br from-sky-50 via-white to-rose-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={selectedContact.photo}
                      alt={selectedContact.name}
                      className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                        selectedContact.category === "emergency"
                          ? "bg-rose-500 text-white"
                          : "bg-sky-500 text-white"
                      }`}
                    >
                      {selectedContact.category === "emergency" ? (
                        <Siren className="h-3.5 w-3.5" />
                      ) : (
                        <Heart className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogHeader className="space-y-1 text-left">
                      <DialogTitle className="text-xl">
                        {selectedContact.name}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedContact.role}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        className={`rounded-full text-[10px] uppercase tracking-wider ${
                          selectedContact.category === "emergency"
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
                            : "bg-sky-100 text-sky-700 hover:bg-sky-100"
                        }`}
                      >
                        {selectedContact.category === "emergency"
                          ? "Emergência"
                          : "Rede de Cuidados"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`rounded-full text-[10px] uppercase tracking-wider ${
                          bondTone[selectedContact.bondLevel] || ""
                        }`}
                      >
                        Vínculo {selectedContact.bondLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-full">
                    <a href={`tel:${selectedContact.phone.replace(/\D/g, "")}`}>
                      <Phone className="mr-1.5 h-3.5 w-3.5" /> Ligar
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <a
                      href={`https://wa.me/55${selectedContact.phone.replace(
                        /\D/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Mensagem
                    </a>
                  </Button>
                  {selectedContact.email && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      <a href={`mailto:${selectedContact.email}`}>
                        <Mail className="mr-1.5 h-3.5 w-3.5" /> E-mail
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-5 px-6 pb-6">
                <Section
                  title="Dados Gerais"
                  icon={<User className="h-4 w-4" />}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Telefone" value={selectedContact.phone} />
                    <Field label="Função" value={selectedContact.role} />
                    <Field
                      label="Relação com o tutor"
                      value={selectedContact.relationTutor}
                    />
                    <Field
                      label="Relação com o animal"
                      value={selectedContact.relationPet}
                    />
                  </div>
                </Section>

                <Section
                  title="Observações"
                  icon={<FileText className="h-4 w-4" />}
                >
                  <p className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {selectedContact.notes}
                  </p>
                </Section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ESTILO DE IMPRESSÃO A4 */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body, html { background: #ffffff !important; }
          header, footer, .no-print { display: none !important; }
          .print-area { background: #ffffff !important; padding: 0 !important; }
          .print-area * { color: #0f172a !important; box-shadow: none !important; }
          .print-area .gradient-primary { background: #0f172a !important; color: #ffffff !important; }
          .print-area .gradient-primary * { color: #ffffff !important; }
        }
      `}</style>
    </div>
  );
};

const Field = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p className="font-medium text-foreground">{value}</p>
  </div>
);

const InfoCard = ({ icon, title, accent, children }) => (
  <Card className="rounded-3xl border bg-white p-5 shadow-soft">
    <div className="mb-3 flex items-center gap-3">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${accent}`}
      >
        {icon}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </Card>
);

const HealthRow = ({ icon, label, value }) => (
  <li className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2">
    <span className="flex items-center gap-2 text-sm text-foreground">
      {icon}
      {label}
    </span>
    <span className="text-xs font-medium text-foreground">{value}</span>
  </li>
);

const StatBox = ({ label, value, sub }) => (
  <div className="rounded-xl border bg-muted/30 p-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-[11px] text-muted-foreground">{sub}</p>
  </div>
);

const TreeNode = ({
  title,
  subtitle,
  meta,
  titles,
  tone,
  gender,
  active,
  onClick,
  delay = 0,
}) => {
  const toneCls =
    tone === "primary"
      ? "gradient-primary text-primary-foreground border-transparent shadow-glow"
      : tone === "accent"
      ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-50"
      : "bg-card border-border hover:bg-muted/50";
  const genderCls =
    gender === "female"
      ? "bg-pink-100 text-pink-700"
      : "bg-sky-100 text-sky-700";
  const ringCls = active
    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.03]"
    : "ring-1 ring-transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative w-full rounded-2xl border p-3 text-left opacity-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md [animation:fade-up_0.5s_ease-out_forwards] ${toneCls} ${ringCls}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            tone === "primary"
              ? "bg-white/20 text-primary-foreground"
              : genderCls
          }`}
          aria-hidden
        >
          {gender === "female" ? "♀" : "♂"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider opacity-80">
            {subtitle}
          </p>
          <p className="truncate text-sm font-bold leading-tight">{title}</p>
        </div>
      </div>
      <div className="mt-2 space-y-1 border-t border-current/10 pt-2">
        <p className="truncate text-[11px] opacity-80">{meta}</p>
        {titles && (
          <p className="flex items-center gap-1 truncate text-[11px] font-semibold">
            <Trophy className="h-3 w-3" /> {titles}
          </p>
        )}
      </div>
      {tone === "primary" && (
        <Crown className="absolute -right-2 -top-2 h-5 w-5 text-amber-400 drop-shadow" />
      )}
    </button>
  );
};

const LineageItem = ({ name, role, meta }) => (
  <li className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
    <div>
      <p className="font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{role}</p>
    </div>
    <span className="text-xs text-muted-foreground">{meta}</span>
  </li>
);

const CareCard = ({ contact, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
  >
    <div className="relative shrink-0">
      <img
        src={contact.photo}
        alt={contact.name}
        className="h-11 w-11 rounded-full object-cover ring-2 ring-background"
      />
      <span
        className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card ${
          contact.category === "emergency" ? "bg-rose-500" : "bg-sky-500"
        }`}
        aria-hidden
      >
        {contact.category === "emergency" ? (
          <Siren className="h-2.5 w-2.5 text-white" />
        ) : (
          <Heart className="h-2.5 w-2.5 text-white" />
        )}
      </span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{contact.name}</p>
      <p className="truncate text-[11px] text-muted-foreground">
        {contact.role}
      </p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
            bondTone[contact.bondLevel] || ""
          }`}
        >
          {contact.bondLevel}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Phone className="h-2.5 w-2.5" />
          {contact.phone}
        </span>
      </div>
    </div>
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
  </button>
);

const Section = ({ title, icon, children }) => (
  <div>
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <h4 className="text-sm font-semibold">{title}</h4>
    </div>
    {children}
  </div>
);

export default PetCard;

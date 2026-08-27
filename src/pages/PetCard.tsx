import { useState } from "react";
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
  Dumbbell,
  GraduationCap,
} from "lucide-react";

const pet = {
  name: "Thor",
  species: "Cachorro",
  breed: "Golden Retriever",
  age: "3 anos",
  birthDate: "12/03/2022",
  microchip: "982 000 412 558 901",
  photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face",
  tutor: {
    name: "Marina Albuquerque",
    phone: "(11) 98765-4321",
    email: "marina@pawcare.app",
  },
  vet: {
    name: "Dra. Helena Costa",
    crmv: "CRMV-SP 45128",
    clinic: "Clínica Vida Animal",
    phone: "(11) 4002-8922",
  },
  vaccines: [
    { name: "V10 (Múltipla canina)", date: "10/04/2026", next: "10/04/2027" },
    { name: "Antirrábica", date: "22/05/2026", next: "22/05/2027" },
    { name: "Gripe canina", date: "15/01/2026", next: "15/01/2027" },
    { name: "Giárdia", date: "08/03/2026", next: "08/03/2027" },
  ],
  health: {
    score: 92,
    weight: { current: 30.2, ideal: "28–32 kg", status: "Ideal" },
    lastCheckup: "18/05/2026",
    nextCheckup: "18/11/2026",
    exams: [
      { name: "Hemograma completo", date: "12/05/2026", status: "Normal" },
      { name: "Ultrassom abdominal", date: "02/04/2026", status: "Normal" },
      { name: "Raio-X de quadril", date: "20/02/2026", status: "Leve alteração" },
    ],
    recommendations: [
      "Manter atividade física moderada (caminhadas diárias de 30 min).",
      "Suplementação de condroitina para suporte articular.",
      "Reavaliar quadril em 6 meses.",
      "Escovação dental 3x na semana.",
    ],
  },
  lineage: {
    registry: "CBKC nº 4521987",
    generations: 3,
    tree: {
      self: { name: "Thor", title: "Titular", color: "from-primary to-primary/70" },
      parents: [
        { name: "Apollo do Vale", role: "Pai", registry: "CBKC 41200", titles: "Campeão Nacional 2021" },
        { name: "Luna Estrela", role: "Mãe", registry: "CBKC 39811", titles: "Campeã Jovem 2020" },
      ],
      grandparents: [
        { name: "Zeus Imperial", role: "Avô paterno", registry: "CBKC 31022" },
        { name: "Aurora Bella", role: "Avó paterna", registry: "CBKC 30988" },
        { name: "Rex Magnífico", role: "Avô materno", registry: "CBKC 28741" },
        { name: "Stella Doce", role: "Avó materna", registry: "CBKC 28710" },
      ],
    },
  },
  history: [
    { date: "18/05/2026", type: "Consulta", title: "Check-up semestral", pro: "Dra. Helena Costa", desc: "Estado geral excelente. Peso ideal e exames normais.", icon: Stethoscope },
    { date: "10/04/2026", type: "Vacina", title: "V10 (Múltipla canina)", pro: "Dra. Helena Costa", desc: "Reforço anual aplicado. Sem reações adversas.", icon: Syringe },
    { date: "02/04/2026", type: "Exame", title: "Ultrassom abdominal", pro: "Dr. Rafael Lima", desc: "Órgãos sem alterações. Resultado normal.", icon: FlaskConical },
    { date: "15/03/2026", type: "Procedimento", title: "Limpeza dentária", pro: "Dr. Pedro Sá", desc: "Profilaxia dental sob sedação. Recuperação completa.", icon: Activity },
    { date: "20/02/2026", type: "Exame", title: "Raio-X de quadril", pro: "Dr. Rafael Lima", desc: "Leve displasia identificada. Acompanhamento iniciado.", icon: FlaskConical },
    { date: "15/01/2026", type: "Vacina", title: "Gripe canina", pro: "Dra. Helena Costa", desc: "Vacinação preventiva sazonal.", icon: Syringe },
    { date: "08/12/2025", type: "Tratamento", title: "Suplementação articular", pro: "Dra. Helena Costa", desc: "Início de condroitina + glucosamina diária.", icon: Pill },
  ],
};

type Ancestor = { name: string; role: string; registry: string; titles?: string };

type CareContact = {
  id: string;
  name: string;
  role: string;
  relationTutor: string;
  relationPet: string;
  phone: string;
  email?: string;
  photo: string;
  category: "emergency" | "care";
  bondLevel: "Muito Alto" | "Alto" | "Médio" | "Baixo";
  timeTogether: string;
  interactions: number;
  lastInteraction: string;
  frequency: string;
  timesResponsible: number;
  totalDays: number;
  longestStreak: string;
  lastResponsibility: string;
  activities: string[];
  timeline: { date: string; title: string; type: string }[];
  notes: string;
};

const careNetwork: CareContact[] = [
  {
    id: "tutor",
    name: "Marina Albuquerque",
    role: "Tutora Principal",
    relationTutor: "Própria",
    relationPet: "Tutora desde filhote",
    phone: "(11) 98765-4321",
    email: "marina@pawcare.app",
    photo: "https://i.pravatar.cc/120?img=47",
    category: "emergency",
    bondLevel: "Muito Alto",
    timeTogether: "3 anos e 2 meses",
    interactions: 1240,
    lastInteraction: "Hoje",
    frequency: "Diária",
    timesResponsible: 1100,
    totalDays: 1160,
    longestStreak: "365 dias",
    lastResponsibility: "Em andamento",
    activities: ["Alimentação", "Passeios", "Medicação", "Consultas", "Recreação"],
    timeline: [
      { date: "Hoje", title: "Alimentação matinal e passeio", type: "Rotina" },
      { date: "Ontem", title: "Banho e escovação", type: "Cuidado" },
      { date: "05/06/2026", title: "Consulta veterinária", type: "Saúde" },
    ],
    notes: "Tutora principal. Acompanha integralmente a rotina e decisões de saúde.",
  },
  {
    id: "vet",
    name: "Dra. Helena Costa",
    role: "Veterinária Responsável",
    relationTutor: "Profissional de confiança",
    relationPet: "Veterinária desde 2022",
    phone: "(11) 4002-8922",
    email: "helena@vidaanimal.vet",
    photo: "https://i.pravatar.cc/120?img=32",
    category: "emergency",
    bondLevel: "Alto",
    timeTogether: "3 anos",
    interactions: 28,
    lastInteraction: "18/05/2026",
    frequency: "Semestral",
    timesResponsible: 12,
    totalDays: 4,
    longestStreak: "2 dias",
    lastResponsibility: "18/05/2026",
    activities: ["Consultas", "Vacinação", "Exames", "Procedimentos"],
    timeline: [
      { date: "18/05/2026", title: "Check-up semestral", type: "Consulta" },
      { date: "10/04/2026", title: "Aplicação V10", type: "Vacina" },
      { date: "15/03/2026", title: "Limpeza dentária", type: "Procedimento" },
    ],
    notes: "Profissional de referência para emergências clínicas e rotina veterinária.",
  },
  {
    id: "fam",
    name: "Rafael Albuquerque",
    role: "Familiar de Emergência",
    relationTutor: "Irmão da tutora",
    relationPet: "Cuidador secundário",
    phone: "(11) 99988-1122",
    photo: "https://i.pravatar.cc/120?img=12",
    category: "emergency",
    bondLevel: "Alto",
    timeTogether: "3 anos",
    interactions: 320,
    lastInteraction: "02/06/2026",
    frequency: "Semanal",
    timesResponsible: 24,
    totalDays: 48,
    longestStreak: "10 dias",
    lastResponsibility: "20/04/2026",
    activities: ["Hospedagem", "Passeios", "Alimentação"],
    timeline: [
      { date: "02/06/2026", title: "Visita e passeio", type: "Recreação" },
      { date: "20/04/2026", title: "Hospedagem por 4 dias", type: "Hospedagem" },
    ],
    notes: "Mora próximo e pode assumir o pet em emergências.",
  },
  {
    id: "sitter",
    name: "Camila Duarte",
    role: "Pet Sitter",
    relationTutor: "Profissional contratada",
    relationPet: "Cuidadora desde 2024",
    phone: "(11) 97654-3210",
    photo: "https://i.pravatar.cc/120?img=45",
    category: "care",
    bondLevel: "Alto",
    timeTogether: "1 ano e 8 meses",
    interactions: 86,
    lastInteraction: "28/05/2026",
    frequency: "Mensal",
    timesResponsible: 18,
    totalDays: 62,
    longestStreak: "12 dias",
    lastResponsibility: "10/05/2026",
    activities: ["Hospedagem", "Alimentação", "Medicação", "Passeios"],
    timeline: [
      { date: "10/05/2026", title: "Hospedagem viagem da tutora", type: "Hospedagem" },
      { date: "12/03/2026", title: "Cuidado integral 7 dias", type: "Hospedagem" },
    ],
    notes: "Excelente referência. Conhece a medicação e rotina de sono.",
  },
  {
    id: "walker",
    name: "Bruno Tavares",
    role: "Passeador",
    relationTutor: "Profissional contratado",
    relationPet: "Passeador desde 2025",
    phone: "(11) 96543-2109",
    photo: "https://i.pravatar.cc/120?img=15",
    category: "care",
    bondLevel: "Médio",
    timeTogether: "10 meses",
    interactions: 120,
    lastInteraction: "06/06/2026",
    frequency: "3x por semana",
    timesResponsible: 120,
    totalDays: 0,
    longestStreak: "—",
    lastResponsibility: "06/06/2026",
    activities: ["Passeios", "Recreação"],
    timeline: [
      { date: "06/06/2026", title: "Passeio de 50 min — Parque Ibirapuera", type: "Passeio" },
      { date: "04/06/2026", title: "Passeio de 45 min", type: "Passeio" },
    ],
    notes: "Pontual. Envia fotos e relatório ao final de cada passeio.",
  },
  {
    id: "trainer",
    name: "Lucas Pereira",
    role: "Adestrador",
    relationTutor: "Profissional contratado",
    relationPet: "Adestrador desde 2023",
    phone: "(11) 95432-1098",
    photo: "https://i.pravatar.cc/120?img=53",
    category: "care",
    bondLevel: "Médio",
    timeTogether: "2 anos",
    interactions: 48,
    lastInteraction: "22/05/2026",
    frequency: "Quinzenal",
    timesResponsible: 48,
    totalDays: 0,
    longestStreak: "—",
    lastResponsibility: "22/05/2026",
    activities: ["Treinamento", "Recreação"],
    timeline: [
      { date: "22/05/2026", title: "Sessão de reforço de comandos", type: "Treino" },
      { date: "08/05/2026", title: "Sessão socialização", type: "Treino" },
    ],
    notes: "Trabalha obediência básica e comandos avançados.",
  },
];

const activityIcons: Record<string, typeof Footprints> = {
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

const bondTone: Record<CareContact["bondLevel"], string> = {
  "Muito Alto": "bg-emerald-100 text-emerald-700",
  Alto: "bg-sky-100 text-sky-700",
  Médio: "bg-amber-100 text-amber-700",
  Baixo: "bg-muted text-muted-foreground",
};

const PetCard = () => {
  const [open, setOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [lineageOpen, setLineageOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CareContact | null>(null);
  const [selectedAncestor, setSelectedAncestor] = useState<Ancestor>({
    name: pet.lineage.tree.self.name,
    role: "Titular",
    registry: pet.lineage.registry,
    titles: "Pedigree certificado",
  });

  const qrPayload = JSON.stringify({
    pet: pet.name,
    species: pet.species,
    breed: pet.breed,
    microchip: pet.microchip,
    tutor: pet.tutor.name,
    tutorPhone: pet.tutor.phone,
    vet: pet.vet.name,
    vetPhone: pet.vet.phone,
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-14">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
              Carteira digital
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Cartão Animal
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Identificação oficial do pet com QR Code para acesso rápido aos
              dados do tutor e do veterinário. Pronto para impressão.
            </p>
          </div>
          <Button
            onClick={() => window.print()}
            className="rounded-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
          >
            <Printer className="h-4 w-4" />
            Imprimir cartão
          </Button>
        </div>

        <div className="print-area space-y-6">
          {/* CARTÃO */}
          <Card className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border-2 border-primary/15 bg-white p-0 shadow-soft print:max-w-full print:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_280px]">
              <div className="gradient-primary relative flex flex-col items-center justify-between gap-4 p-6 text-primary-foreground">
                <div className="flex w-full items-center gap-2">
                  <PawPrint className="h-5 w-5" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    Pawcare
                  </span>
                </div>
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-white/15 shadow-inner">
                  <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover" />
                </div>
                <div className="w-full text-center">
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Cartão Animal</p>
                  <p className="font-mono text-xs font-semibold">Nº {pet.microchip.slice(-6)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-5 p-6 md:p-8">
                <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Nome do animal</p>
                    <h2 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">{pet.name}</h2>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-widest">
                    Documento digital
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <Field label="Espécie" value={pet.species} />
                  <Field label="Raça" value={pet.breed} />
                  <Field label="Idade" value={pet.age} />
                  <Field label="Nascimento" value={pet.birthDate} />
                  <Field label="Microchip" value={pet.microchip} className="col-span-2 sm:col-span-4" />
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tutor</p>
                      <p className="text-sm font-semibold">{pet.tutor.name}</p>
                      <p className="text-xs text-muted-foreground">{pet.tutor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Stethoscope className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Veterinário</p>
                      <p className="text-sm font-semibold">{pet.vet.name}</p>
                      <p className="text-xs text-muted-foreground">{pet.vet.crmv} · {pet.vet.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-border/60 bg-muted/30 p-6 md:border-l md:border-t-0">
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Mostrar dados do pet"
                  className="group relative rounded-2xl border-2 border-primary/20 bg-white p-3 transition-smooth hover:border-primary hover:shadow-glow"
                >
                  <QRCodeSVG value={qrPayload} size={170} level="M" bgColor="#ffffff" fgColor="#0f172a" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/0 transition-smooth group-hover:bg-primary/5">
                    <ScanLine className="h-6 w-6 text-primary opacity-0 transition-smooth group-hover:opacity-100" />
                  </span>
                </button>
                <p className="max-w-[200px] text-center text-xs text-muted-foreground">
                  Escaneie ou clique no QR para ver os dados do pet
                </p>
              </div>
            </div>
          </Card>

          {/* INFO GRID */}
          <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon={<Syringe className="h-5 w-5" />} title="Vacinas" accent="bg-emerald-50 text-emerald-700">
              <ul className="divide-y divide-border/60">
                {pet.vaccines.map((v) => (
                  <li key={v.name} className="flex flex-col gap-0.5 py-2 text-sm">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">Aplicada {v.date} · Próxima {v.next}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>

            {/* SAÚDE E BEM-ESTAR */}
            <InfoCard icon={<HeartPulse className="h-5 w-5" />} title="Saúde e Bem-Estar" accent="bg-rose-50 text-rose-700">
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Índice de saúde</span>
                    <span className="font-semibold text-foreground">{pet.health.score}/100</span>
                  </div>
                  <Progress value={pet.health.score} className="h-2" />
                </div>
                <ul className="space-y-2 text-sm">
                  <HealthRow icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} label="Vacinação em dia" value="Tudo regular" />
                  <HealthRow icon={<Scale className="h-4 w-4 text-sky-600" />} label="Peso ideal" value={`${pet.health.weight.current} kg · ${pet.health.weight.status}`} />
                  <HealthRow icon={<FlaskConical className="h-4 w-4 text-violet-600" />} label="Exames atualizados" value={`Último em ${pet.health.exams[0].date}`} />
                  <HealthRow icon={<CalendarCheck className="h-4 w-4 text-amber-600" />} label="Acompanhamento vet." value={`Próximo: ${pet.health.nextCheckup}`} />
                </ul>
                <Button onClick={() => setHealthOpen(true)} variant="outline" className="w-full rounded-full">
                  <ClipboardList className="h-4 w-4" />
                  Ver detalhes da saúde
                </Button>
              </div>
            </InfoCard>

            <InfoCard icon={<Users className="h-5 w-5" />} title="Rede de Cuidados" accent="bg-sky-50 text-sky-700">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Siren className="h-3.5 w-3.5 text-rose-600" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                      Contatos de Emergência
                    </p>
                  </div>
                  <div className="space-y-2">
                    {careNetwork.filter((c) => c.category === "emergency").map((c) => (
                      <CareCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-sky-600" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                      Rede de Cuidados
                    </p>
                  </div>
                  <div className="space-y-2">
                    {careNetwork.filter((c) => c.category === "care").map((c) => (
                      <CareCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} />
                    ))}
                  </div>
                </div>
              </div>
            </InfoCard>


            {/* LINHAGEM */}
            <InfoCard icon={<GitBranch className="h-5 w-5" />} title="Linhagem" accent="bg-amber-50 text-amber-700">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-50 to-white p-3 ring-1 ring-amber-100">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pedigree oficial</p>
                    <p className="truncate font-semibold">{pet.lineage.registry}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Registro com {pet.lineage.generations} gerações certificadas. Visualize a árvore genealógica completa.
                </p>
                <Button onClick={() => setLineageOpen(true)} variant="outline" className="w-full rounded-full">
                  <GitBranch className="h-4 w-4" />
                  Ver árvore genealógica
                </Button>
              </div>
            </InfoCard>

            {/* HISTÓRICO VETERINÁRIO */}
            <InfoCard icon={<History className="h-5 w-5" />} title="Histórico Veterinário" accent="bg-indigo-50 text-indigo-700">
              <div className="space-y-3 text-sm">
                <ul className="space-y-2">
                  {pet.history.slice(0, 3).map((h) => (
                    <li key={h.date + h.title} className="flex items-start gap-2 rounded-xl bg-muted/40 p-2">
                      <h.icon className="mt-0.5 h-4 w-4 text-indigo-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{h.date} · {h.pro}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => setHistoryOpen(true)} variant="outline" className="w-full rounded-full">
                  <History className="h-4 w-4" />
                  Ver linha do tempo completa
                </Button>
              </div>
            </InfoCard>
          </div>
        </div>
      </main>



      {/* Dialog QR */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Dados do pet — {pet.name}
            </DialogTitle>
            <DialogDescription>
              Informações lidas a partir do QR Code do cartão animal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border bg-muted/30 p-4 text-sm">
              <p><strong>Espécie:</strong> {pet.species}</p>
              <p><strong>Raça:</strong> {pet.breed}</p>
              <p><strong>Idade:</strong> {pet.age}</p>
              <p><strong>Microchip:</strong> {pet.microchip}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-3 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tutor</p>
                <p className="font-semibold">{pet.tutor.name}</p>
                <p className="text-muted-foreground">{pet.tutor.phone}</p>
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Veterinário</p>
                <p className="font-semibold">{pet.vet.name}</p>
                <p className="text-muted-foreground">{pet.vet.phone}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Saúde */}
      <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-600" />
              Saúde e Bem-Estar — {pet.name}
            </DialogTitle>
            <DialogDescription>
              Panorama completo da condição clínica e recomendações do veterinário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Índice" value={`${pet.health.score}`} sub="de 100" />
              <StatBox label="Peso" value={`${pet.health.weight.current}kg`} sub={pet.health.weight.status} />
              <StatBox label="Última consulta" value={pet.health.lastCheckup} sub="check-up" />
              <StatBox label="Próxima" value={pet.health.nextCheckup} sub="agendar" />
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="h-4 w-4 text-violet-600" /> Exames recentes
              </h4>
              <ul className="divide-y divide-border/60 rounded-xl border">
                {pet.health.exams.map((e) => (
                  <li key={e.name} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.date}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">{e.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" /> Observações e recomendações
              </h4>
              <ul className="space-y-2 rounded-xl bg-muted/40 p-3 text-sm">
                {pet.health.recommendations.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Linhagem */}
      <Dialog open={lineageOpen} onOpenChange={setLineageOpen}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Linhagem — {pet.name}
            </DialogTitle>
            <DialogDescription>
              Pedigree {pet.lineage.registry} · {pet.lineage.generations} gerações certificadas.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="tree" className="pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tree">Árvore genealógica</TabsTrigger>
              <TabsTrigger value="list">Lista detalhada</TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="pt-4">
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                {/* Visual tree */}
                <div className="relative overflow-x-auto rounded-2xl border bg-gradient-to-b from-muted/30 to-background p-5">
                  <div className="relative mx-auto min-w-[640px]">
                    {/* Generation labels */}
                    <div className="pointer-events-none absolute inset-y-0 -left-1 hidden flex-col justify-between py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:flex">
                      <span className="rounded-full bg-background px-2 py-1 ring-1 ring-border">3ª geração</span>
                      <span className="rounded-full bg-background px-2 py-1 ring-1 ring-border">2ª geração</span>
                      <span className="rounded-full bg-background px-2 py-1 ring-1 ring-border">Titular</span>
                    </div>

                    {/* SVG connectors */}
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100"
                    >
                      {/* grandparents -> parents (4 -> 2) */}
                      <path d="M12.5,18 V32 H37.5 V46" className="fill-none stroke-amber-300/70" strokeWidth="0.4" />
                      <path d="M37.5,18 V32 H37.5 V46" className="fill-none stroke-amber-300/70" strokeWidth="0.4" />
                      <path d="M62.5,18 V32 H62.5 V46" className="fill-none stroke-amber-300/70" strokeWidth="0.4" />
                      <path d="M87.5,18 V32 H62.5 V46" className="fill-none stroke-amber-300/70" strokeWidth="0.4" />
                      {/* parents -> self (2 -> 1) */}
                      <path d="M37.5,62 V76 H50 V90" className="fill-none stroke-primary/50" strokeWidth="0.5" />
                      <path d="M62.5,62 V76 H50 V90" className="fill-none stroke-primary/50" strokeWidth="0.5" />
                    </svg>

                    {/* Avós */}
                    <div className="relative grid grid-cols-4 gap-3">
                      {pet.lineage.tree.grandparents.map((g, i) => (
                        <TreeNode
                          key={g.name}
                          title={g.name}
                          subtitle={g.role}
                          meta={g.registry}
                          tone="muted"
                          gender={i % 2 === 0 ? "male" : "female"}
                          active={selectedAncestor.name === g.name}
                          onClick={() => setSelectedAncestor({ ...g, titles: "Linhagem ancestral" })}
                          delay={i * 60}
                        />
                      ))}
                    </div>

                    <div className="h-10" />

                    {/* Pais */}
                    <div className="relative grid grid-cols-2 gap-6 px-[12.5%]">
                      {pet.lineage.tree.parents.map((p, i) => (
                        <TreeNode
                          key={p.name}
                          title={p.name}
                          subtitle={p.role}
                          meta={p.registry}
                          titles={p.titles}
                          tone="accent"
                          gender={i === 0 ? "male" : "female"}
                          active={selectedAncestor.name === p.name}
                          onClick={() => setSelectedAncestor(p)}
                          delay={240 + i * 80}
                        />
                      ))}
                    </div>

                    <div className="h-10" />

                    {/* Titular */}
                    <div className="relative flex justify-center">
                      <div className="w-64">
                        <TreeNode
                          title={pet.lineage.tree.self.name}
                          subtitle="Titular"
                          meta={pet.lineage.registry}
                          tone="primary"
                          gender="male"
                          active={selectedAncestor.name === pet.lineage.tree.self.name}
                          onClick={() =>
                            setSelectedAncestor({
                              name: pet.lineage.tree.self.name,
                              role: "Titular",
                              registry: pet.lineage.registry,
                              titles: "Pedigree certificado",
                            })
                          }
                          delay={420}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detail panel */}
                <aside className="rounded-2xl border bg-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Detalhes do ancestral
                  </p>
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-xl font-bold">{selectedAncestor.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedAncestor.role}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verificado
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedAncestor.registry}</span>
                    </div>
                    {selectedAncestor.titles && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                        <Trophy className="h-4 w-4" />
                        <span className="font-medium">{selectedAncestor.titles}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg bg-primary-soft/60 px-3 py-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">Compatibilidade racial 98%</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">
                    Toque em qualquer ancestral da árvore para ver detalhes e histórico de títulos.
                  </p>
                </aside>
              </div>
            </TabsContent>


            <TabsContent value="list" className="pt-4">
              <ul className="space-y-2 text-sm">
                <LineageItem name={pet.lineage.tree.self.name} role="Titular" meta={pet.lineage.registry} />
                {pet.lineage.tree.parents.map((p) => (
                  <LineageItem key={p.name} name={p.name} role={p.role} meta={`${p.registry} · ${p.titles}`} />
                ))}
                {pet.lineage.tree.grandparents.map((g) => (
                  <LineageItem key={g.name} name={g.name} role={g.role} meta={g.registry} />
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Histórico Veterinário — {pet.name}
            </DialogTitle>
            <DialogDescription>
              Linha do tempo completa da vida clínica do animal.
            </DialogDescription>
          </DialogHeader>

          <div className="relative pt-4">
            <div className="absolute bottom-2 left-[19px] top-6 w-px bg-border" />
            <ul className="space-y-4">
              {pet.history.map((h) => (
                <li key={h.date + h.title} className="relative flex gap-4 pl-1">
                  <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-indigo-50 text-indigo-600 shadow-sm">
                    <h.icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 rounded-xl border bg-card p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wider">
                        {h.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{h.date}</span>
                    </div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{h.desc}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Stethoscope className="h-3 w-3" /> {h.pro}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Contato — Rede de Cuidados */}
      <Dialog open={!!selectedContact} onOpenChange={(o) => !o && setSelectedContact(null)}>
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
                      <DialogTitle className="text-xl">{selectedContact.name}</DialogTitle>
                      <DialogDescription>{selectedContact.role}</DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        className={`rounded-full text-[10px] uppercase tracking-wider ${
                          selectedContact.category === "emergency"
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
                            : "bg-sky-100 text-sky-700 hover:bg-sky-100"
                        }`}
                      >
                        {selectedContact.category === "emergency" ? "Emergência" : "Rede de Cuidados"}
                      </Badge>
                      <Badge variant="secondary" className={`rounded-full text-[10px] uppercase tracking-wider ${bondTone[selectedContact.bondLevel]}`}>
                        Vínculo {selectedContact.bondLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-full">
                    <a href={`tel:${selectedContact.phone.replace(/\D/g, "")}`}>
                      <Phone className="h-3.5 w-3.5" /> Ligar
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <a href={`https://wa.me/55${selectedContact.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" /> Mensagem
                    </a>
                  </Button>
                  {selectedContact.email && (
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <a href={`mailto:${selectedContact.email}`}>
                        <Mail className="h-3.5 w-3.5" /> E-mail
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-5 px-6 pb-6">
                <Section title="Dados Gerais" icon={<User className="h-4 w-4" />}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Telefone" value={selectedContact.phone} />
                    <Field label="Função" value={selectedContact.role} />
                    <Field label="Relação com o tutor" value={selectedContact.relationTutor} />
                    <Field label="Relação com o animal" value={selectedContact.relationPet} />
                  </div>
                </Section>

                <Section title="Índice de Convivência" icon={<Sparkles className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatBox label="Tempo juntos" value={selectedContact.timeTogether} sub="Convivência" />
                    <StatBox label="Interações" value={String(selectedContact.interactions)} sub="Registradas" />
                    <StatBox label="Última" value={selectedContact.lastInteraction} sub="Interação" />
                    <StatBox label="Frequência" value={selectedContact.frequency} sub="Contato" />
                  </div>
                </Section>

                <Section title="Histórico de Responsabilidade" icon={<ShieldCheck className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatBox label="Vezes responsável" value={String(selectedContact.timesResponsible)} sub="Período total" />
                    <StatBox label="Dias totais" value={String(selectedContact.totalDays)} sub="Sob cuidados" />
                    <StatBox label="Maior período" value={selectedContact.longestStreak} sub="Consecutivo" />
                    <StatBox label="Última" value={selectedContact.lastResponsibility} sub="Responsabilidade" />
                  </div>
                </Section>

                <Section title="Nível de Familiaridade" icon={<Heart className="h-4 w-4" />}>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Vínculo automático</span>
                      <Badge className={`rounded-full ${bondTone[selectedContact.bondLevel]}`}>
                        {selectedContact.bondLevel}
                      </Badge>
                    </div>
                    <Progress
                      value={
                        selectedContact.bondLevel === "Muito Alto"
                          ? 95
                          : selectedContact.bondLevel === "Alto"
                          ? 75
                          : selectedContact.bondLevel === "Médio"
                          ? 50
                          : 25
                      }
                      className="h-2"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Calculado a partir da frequência de contato e interações registradas.
                    </p>
                  </div>
                </Section>

                <Section title="Atividades Frequentes" icon={<Activity className="h-4 w-4" />}>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.activities.map((a) => {
                      const Icon = activityIcons[a] ?? Sparkles;
                      return (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium"
                        >
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {a}
                        </span>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Histórico de Cuidados" icon={<History className="h-4 w-4" />}>
                  <div className="relative">
                    <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" />
                    <ul className="space-y-3">
                      {selectedContact.timeline.map((t, i) => {
                        const Icon = activityIcons[t.type] ?? Clock;
                        return (
                          <li key={i} className="relative flex gap-3 pl-1">
                            <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-sky-50 text-sky-600 shadow-sm">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="flex-1 rounded-xl border bg-card p-3">
                              <div className="mb-0.5 flex items-center gap-2">
                                <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wider">
                                  {t.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{t.date}</span>
                              </div>
                              <p className="text-sm font-medium">{t.title}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Section>

                <Section title="Observações" icon={<FileText className="h-4 w-4" />}>
                  <p className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {selectedContact.notes}
                  </p>
                </Section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


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

const Field = ({ label, value, className = "" }: { label: string; value: string; className?: string }) => (
  <div className={className}>
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

const InfoCard = ({ icon, title, accent, children }: { icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) => (
  <Card className="rounded-3xl border bg-white p-5 shadow-soft">
    <div className="mb-3 flex items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${accent}`}>{icon}</span>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </Card>
);

const ContactBlock = ({ label, name, phone, extra }: { label: string; name: string; phone: string; extra?: string }) => (
  <div className="rounded-xl border bg-muted/30 p-3">
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-semibold">{name}</p>
    <p className="text-muted-foreground">{phone}</p>
    {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
  </div>
);

const HealthRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <li className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2">
    <span className="flex items-center gap-2 text-sm">{icon}{label}</span>
    <span className="text-xs font-medium text-foreground">{value}</span>
  </li>
);

const StatBox = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="rounded-xl border bg-muted/30 p-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-lg font-bold">{value}</p>
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
}: {
  title: string;
  subtitle: string;
  meta: string;
  titles?: string;
  tone: "primary" | "accent" | "muted";
  gender?: "male" | "female";
  active?: boolean;
  onClick?: () => void;
  delay?: number;
}) => {
  const toneCls =
    tone === "primary"
      ? "gradient-primary text-primary-foreground border-transparent shadow-glow"
      : tone === "accent"
      ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-50"
      : "bg-card border-border hover:bg-muted/50";
  const genderCls =
    gender === "female" ? "bg-pink-100 text-pink-700" : "bg-sky-100 text-sky-700";
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
            tone === "primary" ? "bg-white/20 text-primary-foreground" : genderCls
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


const LineageItem = ({ name, role, meta }: { name: string; role: string; meta: string }) => (
  <li className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
    <div>
      <p className="font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{role}</p>
    </div>
    <span className="text-xs text-muted-foreground">{meta}</span>
  </li>
);

const CareCard = ({ contact, onClick }: { contact: CareContact; onClick: () => void }) => (
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
      <p className="truncate text-[11px] text-muted-foreground">{contact.role}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${bondTone[contact.bondLevel]}`}>
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

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
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

import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Building2,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClinic } from "@/contexts/ClinicContext";
import { clinicService } from "@/services/api";
import {
  formatPrice,
  hoursForDisplay,
  memberMeta,
  normalizeMember,
  normalizeService,
} from "@/lib/clinicProfile";

export default function Partnerships() {
  const [query, setQuery] = useState("");
  const [activeClinic, setActiveClinic] = useState(null);
  const [dbClinics, setDbClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  // Perfil da clínica ativa gerenciada no painel local (caso esteja logada/em edição)
  const { profile: localClinicProfile } = useClinic();

  useEffect(() => {
    let isMounted = true;
    const fetchClinics = async () => {
      try {
        setLoadingClinics(true);
        const data = await clinicService.listPublicClinics();
        if (isMounted && Array.isArray(data)) {
          setDbClinics(data);
        }
      } catch {
        if (isMounted) setDbClinics([]);
      } finally {
        if (isMounted) setLoadingClinics(false);
      }
    };
    fetchClinics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Formata número de WhatsApp e link oficial para conversa
  const getWhatsAppLink = (phoneOrWa, clinicName) => {
    if (!phoneOrWa) return null;
    const digits = phoneOrWa.replace(/\D/g, "");
    if (!digits) return null;
    const cleanNumber = digits.length <= 11 ? `55${digits}` : digits;
    const message = encodeURIComponent(
      `Olá! Encontrei o perfil da clínica ${clinicName || ""} no LivePet e gostaria de agendar uma consulta para meu pet.`
    );
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  // Mapeia clínicas reais do banco de dados Neon
  const mappedClinics = useMemo(() => {
    // Lista base vinda do banco de dados
    const list = dbClinics.map((c) => {
      let rawServices = [];
      if (c.servicos) {
        try {
          const parsed = typeof c.servicos === "string" ? JSON.parse(c.servicos) : c.servicos;
          if (Array.isArray(parsed)) rawServices = parsed;
        } catch {}
      }
      const services = rawServices.map(normalizeService).filter((s) => s.name);

      let rawHours = [];
      if (c.horarios) {
        try {
          const parsed = typeof c.horarios === "string" ? JSON.parse(c.horarios) : c.horarios;
          if (Array.isArray(parsed)) rawHours = parsed;
        } catch {}
      }
      const hours = hoursForDisplay(rawHours);

      let rawTeam = [];
      if (c.equipe) {
        try {
          const parsed = typeof c.equipe === "string" ? JSON.parse(c.equipe) : c.equipe;
          if (Array.isArray(parsed)) rawTeam = parsed;
        } catch {}
      }
      const team = rawTeam.map(normalizeMember).filter((m) => m.name);

      // Se a clínica em edição no contexto for esta mesma (por email ou nome), usa os dados mais recentes
      const isCurrentLocal =
        localClinicProfile?.name &&
        (localClinicProfile.email === c.email || localClinicProfile.name.trim() === c.nome.trim());

      const effectivePhoto = isCurrentLocal && localClinicProfile.photo ? localClinicProfile.photo : c.foto_url;
      const effectiveWa = isCurrentLocal && localClinicProfile.whatsapp ? localClinicProfile.whatsapp : (c.whatsapp || c.telefone || "");
      const effectiveServices = isCurrentLocal && localClinicProfile.services?.length
        ? localClinicProfile.services.map(normalizeService).filter((s) => s.name)
        : services;
      const effectiveHours = isCurrentLocal && localClinicProfile.hours?.length
        ? hoursForDisplay(localClinicProfile.hours)
        : hours;
      const effectiveTeam = isCurrentLocal && localClinicProfile.team?.length
        ? localClinicProfile.team.map(normalizeMember).filter((m) => m.name)
        : team;

      return {
        id: `clinic-db-${c.id}`,
        realId: c.id,
        name: c.nome,
        city: c.endereco ? c.endereco.split("-")[1]?.trim() || c.endereco : "Brasil",
        address: c.endereco || "Atendimento sob agendamento",
        crmv: c.crmv || "CRMV Regular",
        cnpj: c.cnpj,
        phone: c.telefone || c.whatsapp || "",
        whatsapp: effectiveWa,
        photoUrl: effectivePhoto,
        contract: `VET-${String(c.id).padStart(4, "0")}`,
        accent: "from-emerald-600/25 to-teal-500/10",
        initials:
          c.nome
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "CV",
        description:
          c.sobre ||
          "Clínica veterinária parceira credenciada na plataforma LivePet para consultas, exames e cuidados clínicos.",
        services: effectiveServices,
        hours: effectiveHours,
        team: effectiveTeam,
      };
    });

    // Se o usuário cadastrou ou tem uma clínica configurada localmente que ainda não está na lista da API, insere no topo
    if (
      localClinicProfile?.name &&
      !list.some(
        (c) =>
          c.name.trim().toLowerCase() === localClinicProfile.name.trim().toLowerCase() ||
          (localClinicProfile.email && c.email === localClinicProfile.email)
      )
    ) {
      list.unshift({
        id: "clinic-local-managed",
        realId: "local",
        name: localClinicProfile.name,
        city: localClinicProfile.address
          ? localClinicProfile.address.split("-")[1]?.trim() || localClinicProfile.address
          : "Brasil",
        address: localClinicProfile.address || "Atendimento sob agendamento",
        crmv: localClinicProfile.crmv || "CRMV Regular",
        cnpj: null,
        phone: localClinicProfile.phone || localClinicProfile.whatsapp || "",
        whatsapp: localClinicProfile.whatsapp || localClinicProfile.phone || "",
        photoUrl: localClinicProfile.photo || null,
        contract: "VET-NOVO",
        accent: "from-teal-600/25 to-emerald-500/10",
        initials:
          localClinicProfile.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "CL",
        description:
          localClinicProfile.about ||
          "Clínica veterinária parceira credenciada na plataforma LivePet para consultas, exames e cuidados clínicos.",
        services: (localClinicProfile.services || []).map(normalizeService).filter((s) => s.name),
        hours: hoursForDisplay(localClinicProfile.hours || []),
        team: (localClinicProfile.team || []).map(normalizeMember).filter((m) => m.name),
      });
    }

    return list;
  }, [dbClinics, localClinicProfile]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mappedClinics;
    return mappedClinics.filter((c) => {
      const matchServices = c.services.some((s) => s.name.toLowerCase().includes(q));
      const matchTeam = c.team.some((m) => m.name.toLowerCase().includes(q) || (m.crmv && m.crmv.toLowerCase().includes(q)));
      return (
        c.name.toLowerCase().includes(q) ||
        c.contract.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.crmv && c.crmv.toLowerCase().includes(q)) ||
        matchServices ||
        matchTeam
      );
    });
  }, [mappedClinics, query]);

  const clinicsWithWhatsApp = useMemo(() => {
    return mappedClinics.filter((c) => Boolean(c.whatsapp || c.phone)).length;
  }, [mappedClinics]);

  const clearFilters = () => {
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden gradient-soft py-12 lg:py-16">
          <div className="blob -left-20 top-10 h-[320px] w-[320px] bg-primary/20" />
          <div className="container relative">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                <Stethoscope className="h-3.5 w-3.5" /> Rede Credenciada Oficial
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Clínicas Veterinárias{" "}
                <span className="italic text-primary">Parceiras</span>
              </h1>
              <p className="mt-3 text-muted-foreground text-base sm:text-lg">
                Consulte todas as clínicas veterinárias cadastradas no banco de dados do LivePet. Chame diretamente no WhatsApp e agende consultas com profissionais com CRMV verificado.
              </p>

              {/* Stats dinâmicos do banco de dados */}
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/70 p-2 shadow-card backdrop-blur sm:gap-1">
                <Stat value={mappedClinics.length} label="clínicas cadastradas no banco" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <Stat value={clinicsWithWhatsApp} label="com atendimento WhatsApp" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <Stat value="100%" label="dados em tempo real" />
              </div>
            </div>
          </div>
        </section>

        {/* Barra de busca */}
        <section className="sticky top-16 z-30 border-y border-border/60 bg-background/85 backdrop-blur-lg lg:top-20">
          <div className="container py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="partner-search"
                  placeholder="Buscar por clínica, veterinário, serviço ou cidade..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-9"
                />

                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Limpar busca"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <strong className="text-foreground">{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "clínica" : "clínicas"}
                {query && (
                  <button
                    onClick={clearFilters}
                    className="ml-2 text-primary font-medium hover:underline"
                  >
                    limpar busca
                  </button>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Informações de facilidade */}
        <section className="container pt-8">
          <div className="grid gap-3 rounded-3xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3 sm:p-5">
            <Step
              n={1}
              title="Clínicas verificadas"
              desc="Profissionais e hospitais veterinários com CRMV ativo homologados no sistema."
            />
            <Step
              n={2}
              title="Contato ágil no WhatsApp"
              desc="Converse diretamente com a equipe técnica da clínica com apenas um clique."
            />
            <Step
              n={3}
              title="Prontuário 100% integrado"
              desc="Consultas e vacinas sincronizadas no histórico do animal tutorado no LivePet."
            />
          </div>
        </section>

        {/* Grid de clínicas reais */}
        <section className="py-10">
          <div className="container">
            {loadingClinics && (
              <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-soft/30 p-3 text-xs text-primary animate-pulse">
                <Sparkles className="h-4 w-4" />
                <span>Carregando clínicas diretamente do banco de dados Neon...</span>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground">
                  Nenhuma clínica encontrada
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                  {query
                    ? `Não encontramos clínicas cadastradas correspondentes ao termo "${query}".`
                    : "Ainda não há clínicas veterinárias cadastradas no banco de dados."}
                </p>
                {query && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4 rounded-full"
                  >
                    Limpar termo de busca
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((clinic) => {
                  const waUrl = getWhatsAppLink(clinic.whatsapp || clinic.phone, clinic.name);

                  return (
                    <article
                      key={clinic.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition-bounce hover:-translate-y-1 hover:shadow-glow"
                    >
                      {/* Banner do card com foto da clínica */}
                      <div className={`relative h-28 bg-gradient-to-br ${clinic.accent}`}>
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur shadow-sm">
                          <Stethoscope className="h-3.5 w-3.5 text-primary" /> Clínica Veterinária
                        </span>

                        {/* Avatar ou Logo da clínica */}
                        <div className="absolute -bottom-8 left-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary text-xl font-bold text-primary-foreground shadow-soft">
                          {clinic.photoUrl ? (
                            <img
                              src={clinic.photoUrl}
                              alt={clinic.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{clinic.initials}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-4 p-6 pt-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-xl font-bold text-foreground">
                              {clinic.name}
                            </h3>
                            <span
                              title="Clínica parceira cadastrada e verificada no LivePet"
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                            >
                              <Check className="h-3 w-3" strokeWidth={3} /> Verificada
                            </span>
                          </div>

                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {clinic.crmv && (
                              <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                                {clinic.crmv}
                              </span>
                            )}
                            {clinic.address && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{clinic.address}</span>
                              </span>
                            )}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {clinic.description}
                        </p>

                        {/* Serviços cadastrados com valores */}
                        {clinic.services.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Principais Serviços
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {clinic.services.slice(0, 3).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-foreground"
                                >
                                  <span>{s.name}</span>
                                  {s.price != null && (
                                    <strong className="text-primary font-mono ml-0.5">
                                      {formatPrice(s.price)}
                                    </strong>
                                  )}
                                </span>
                              ))}
                              {clinic.services.length > 3 && (
                                <span className="text-[11px] text-muted-foreground self-center">
                                  +{clinic.services.length - 3} mais
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Ações inferiores */}
                        <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-4">
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button
                                className="w-full gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft transition-smooth font-medium"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Chamar no WhatsApp
                              </Button>
                            </a>
                          ) : (
                            <Button
                              disabled
                              variant="outline"
                              className="flex-1 rounded-full text-xs text-muted-foreground"
                            >
                              WhatsApp não informado
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            onClick={() => setActiveClinic(clinic)}
                            className="rounded-full shrink-0"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Reassurance */}
        <section className="border-t border-border/60 bg-muted/30 py-12">
          <div className="container grid gap-6 md:grid-cols-3">
            <Reassure
              icon={ShieldCheck}
              title="Atendimento Direto & Seguro"
              desc="Sem intermediários nem taxas extras. Você conversa e agenda diretamente com o profissional veterinário."
            />
            <Reassure
              icon={BadgePercent}
              title="Vínculo com Prontuário"
              desc="Ao ser atendido por clínicas parceiras, todas as vacinas e prescrições sincronizam no histórico do seu animal."
            />
            <Reassure
              icon={Building2}
              title="CRMV Homologado"
              desc="Apenas clínicas com registro profissional e dados reais persistidos no banco de dados Neon."
            />
          </div>
        </section>
      </main>

      {/* Modal de Detalhes da Clínica */}
      <Dialog open={!!activeClinic} onOpenChange={(o) => !o && setActiveClinic(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {activeClinic && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary text-lg font-bold text-primary-foreground">
                    {activeClinic.photoUrl ? (
                      <img
                        src={activeClinic.photoUrl}
                        alt={activeClinic.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{activeClinic.initials}</span>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="font-display text-2xl">
                      {activeClinic.name}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-foreground">{activeClinic.crmv}</span>
                      <span>·</span>
                      <span>{activeClinic.address}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Sobre a clínica */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Sobre a Clínica
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-muted/40 p-3 rounded-2xl border border-border/60">
                    {activeClinic.description}
                  </p>
                </div>

                {/* Serviços e procedimentos */}
                {activeClinic.services.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Serviços & Procedimentos Cadastrados
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {activeClinic.services.map((srv, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card text-xs"
                        >
                          <span className="font-medium text-foreground">{srv.name}</span>
                          <span className="text-muted-foreground font-mono">
                            {srv.price != null
                              ? formatPrice(srv.price)
                              : typeof srv.price === "string" && srv.price
                              ? srv.price
                              : "Sob consulta"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Horários de Atendimento */}
                {activeClinic.hours && activeClinic.hours.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Horários de Atendimento
                    </h4>
                    <div className="grid gap-1.5 sm:grid-cols-2 text-xs">
                      {activeClinic.hours.map((h) => (
                        <div
                          key={h.day}
                          className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/60 px-3 py-1.5"
                        >
                          <span className="text-muted-foreground font-medium">{h.day}</span>
                          <span className="font-semibold text-foreground">{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corpo Clínico & Profissionais */}
                {activeClinic.team && activeClinic.team.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      <Users className="h-3.5 w-3.5 text-primary" /> Corpo Clínico
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      {activeClinic.team.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col p-2.5 rounded-xl border border-border/70 bg-card"
                        >
                          <span className="font-semibold text-foreground">{m.name}</span>
                          <span className="text-muted-foreground text-[11px]">
                            {memberMeta(m) || "Médico Veterinário"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações de contato direto */}
                <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Canais de Atendimento
                  </h4>
                  <div className="space-y-1.5 text-xs text-foreground">
                    {activeClinic.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span>{activeClinic.address}</span>
                      </div>
                    )}
                    {activeClinic.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <span>{activeClinic.phone}</span>
                      </div>
                    )}
                    {activeClinic.whatsapp && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>WhatsApp: {activeClinic.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveClinic(null)}
                  className="rounded-full w-full sm:w-auto"
                >
                  Fechar
                </Button>

                {getWhatsAppLink(activeClinic.whatsapp || activeClinic.phone, activeClinic.name) && (
                  <a
                    href={getWhatsAppLink(activeClinic.whatsapp || activeClinic.phone, activeClinic.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex-1"
                  >
                    <Button className="w-full gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <MessageCircle className="h-4 w-4" />
                      Conversar no WhatsApp
                    </Button>
                  </a>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="px-3 py-1 text-center">
      <span className="font-display text-lg font-bold text-foreground sm:text-xl">
        {value}
      </span>
      <span className="ml-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card/60 p-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Reassure({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

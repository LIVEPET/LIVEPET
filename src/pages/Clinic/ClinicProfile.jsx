import { useState } from "react";
import {
  Building2,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/EmptyState";
import { useClinic } from "@/contexts/ClinicContext";
import {
  hoursForDisplay,
  memberMeta,
  normalizeMember,
  normalizeService,
  serviceMeta,
} from "@/lib/clinicProfile";
import { ConfirmRemoveDialog, HoursDialog, ServiceDialog, TeamDialog } from "./ProfileEditors";

const headerClass = "flex-row items-center justify-between space-y-0";

const AddButton = ({ label, onClick }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    aria-label={label}
    className="h-8 gap-1 rounded-full text-xs"
    onClick={onClick}
  >
    <Plus className="h-3.5 w-3.5" /> Adicionar
  </Button>
);

const IconButton = ({ label, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="rounded-full p-1.5 text-muted-foreground outline-none transition-colors hover:bg-background hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
  >
    {children}
  </button>
);

const ClinicProfile = () => {
  const { profile, saveProfile } = useClinic();
  const [form, setForm] = useState({
    name: profile.name,
    crmv: profile.crmv,
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    address: profile.address,
    about: profile.about,
  });
  const [hoursOpen, setHoursOpen] = useState(false);
  const [serviceDialog, setServiceDialog] = useState({ open: false, item: null });
  const [memberDialog, setMemberDialog] = useState({ open: false, item: null });
  const [removal, setRemoval] = useState(null);

  const hours = hoursForDisplay(profile.hours);
  const services = profile.services
    .map((raw) => ({ raw, ...normalizeService(raw) }))
    .filter((item) => item.name);
  const team = profile.team
    .map((raw) => ({ raw, ...normalizeMember(raw) }))
    .filter((item) => item.name);

  const save = (e) => {
    e.preventDefault();
    saveProfile(form);
    toast.success("Perfil da clínica atualizado!");
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  const saveHours = (nextHours) => {
    saveProfile({ hours: nextHours });
    setHoursOpen(false);
    toast.success("Horários atualizados!");
  };

  const saveService = (data, original) => {
    const current = profile.services.map((raw) => (raw === original ? data : normalizeService(raw)));
    saveProfile({ services: (original ? current : [...current, data]).filter((s) => s.name) });
    setServiceDialog((dialog) => ({ ...dialog, open: false }));
    toast.success(original ? "Serviço atualizado!" : "Serviço adicionado!");
  };

  const saveMember = (data, original) => {
    const current = profile.team.map((raw) => (raw === original ? data : normalizeMember(raw)));
    saveProfile({ team: (original ? current : [...current, data]).filter((m) => m.name) });
    setMemberDialog((dialog) => ({ ...dialog, open: false }));
    toast.success(original ? "Profissional atualizado!" : "Profissional adicionado!");
  };

  const confirmRemoval = () => {
    if (!removal) return;
    if (removal.kind === "service") {
      saveProfile({
        services: profile.services
          .filter((raw) => raw !== removal.raw)
          .map(normalizeService)
          .filter((s) => s.name),
      });
      toast.success("Serviço removido.");
    } else {
      saveProfile({
        team: profile.team
          .filter((raw) => raw !== removal.raw)
          .map(normalizeMember)
          .filter((m) => m.name),
      });
      toast.success("Profissional removido.");
    }
    setRemoval(null);
  };

  const openNewService = () => setServiceDialog({ open: true, item: null });
  const openNewMember = () => setMemberDialog({ open: true, item: null });

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 bg-primary-soft text-primary hover:bg-primary-soft">Perfil</Badge>
        <h1 className="font-display text-3xl font-bold">Perfil da clínica</h1>
        <p className="text-muted-foreground">Informações que os tutores veem ao encontrar sua clínica.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Building2 className="h-5 w-5 text-primary" /> Dados da clínica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" required {...field("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crmv">Registro (CRMV)</Label>
                  <Input id="crmv" required {...field("crmv")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required {...field("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" required {...field("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" {...field("whatsapp")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" {...field("address")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="about">Sobre a clínica</Label>
                <Textarea id="about" rows={4} {...field("about")} />
              </div>
              <Button type="submit" className="rounded-full gradient-primary text-primary-foreground shadow-soft">
                <Save className="h-4 w-4" /> Salvar alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-card">
            <CardHeader className={headerClass}>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Clock className="h-4 w-4 text-primary" /> Horários
              </CardTitle>
              {hours.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Editar horários"
                  className="h-8 gap-1 rounded-full text-xs"
                  onClick={() => setHoursOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {hours.length === 0 ? (
                <EmptyState
                  compact
                  className="w-full"
                  icon={<Clock className="h-5 w-5" />}
                  title="Horários não definidos"
                  description="Informe quando a clínica atende."
                  actionLabel="Adicionar horários"
                  onAction={() => setHoursOpen(true)}
                />
              ) : (
                hours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-medium">{h.time}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader className={headerClass}>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Stethoscope className="h-4 w-4 text-primary" /> Serviços
              </CardTitle>
              {services.length > 0 && <AddButton label="Adicionar serviço" onClick={openNewService} />}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {services.length === 0 ? (
                <EmptyState
                  compact
                  className="w-full"
                  icon={<Stethoscope className="h-5 w-5" />}
                  title="Nenhum serviço cadastrado"
                  description="Liste o que sua clínica oferece."
                  actionLabel="Adicionar serviço"
                  onAction={openNewService}
                />
              ) : (
                services.map((s, index) => {
                  const meta = serviceMeta(s);
                  return (
                    <div
                      key={`${s.name}-${index}`}
                      className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 py-0.5 pl-3 pr-1 text-sm"
                    >
                      <span className="font-medium">{s.name}</span>
                      {meta && <span className="text-xs text-muted-foreground">· {meta}</span>}
                      <IconButton
                        label={`Editar serviço ${s.name}`}
                        onClick={() => setServiceDialog({ open: true, item: s.raw })}
                      >
                        <Pencil className="h-3 w-3" />
                      </IconButton>
                      <IconButton
                        label={`Remover serviço ${s.name}`}
                        onClick={() => setRemoval({ kind: "service", raw: s.raw, name: s.name })}
                      >
                        <X className="h-3 w-3" />
                      </IconButton>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader className={headerClass}>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Users className="h-4 w-4 text-primary" /> Equipe
              </CardTitle>
              {team.length > 0 && <AddButton label="Adicionar profissional" onClick={openNewMember} />}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {team.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Users className="h-5 w-5" />}
                  title="Equipe não cadastrada"
                  description="Adicione os veterinários da clínica."
                  actionLabel="Adicionar profissional"
                  onAction={openNewMember}
                />
              ) : (
                team.map((m, index) => {
                  const meta = memberMeta(m);
                  return (
                    <div
                      key={`${m.name}-${index}`}
                      className="flex items-start justify-between gap-2 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{m.name}</p>
                        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <IconButton
                          label={`Editar ${m.name}`}
                          onClick={() => setMemberDialog({ open: true, item: m.raw })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton
                          label={`Remover ${m.name}`}
                          onClick={() => setRemoval({ kind: "member", raw: m.raw, name: m.name })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {form.email || "Não informado"}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {form.phone || "Não informado"}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {form.address || "Não informado"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <HoursDialog
        open={hoursOpen}
        onOpenChange={setHoursOpen}
        hours={profile.hours}
        onSave={saveHours}
      />
      <ServiceDialog
        open={serviceDialog.open}
        onOpenChange={(open) => setServiceDialog((dialog) => ({ ...dialog, open }))}
        service={serviceDialog.item}
        services={profile.services}
        onSave={saveService}
      />
      <TeamDialog
        open={memberDialog.open}
        onOpenChange={(open) => setMemberDialog((dialog) => ({ ...dialog, open }))}
        member={memberDialog.item}
        team={profile.team}
        onSave={saveMember}
      />
      <ConfirmRemoveDialog
        open={Boolean(removal)}
        onOpenChange={(open) => !open && setRemoval(null)}
        title={
          removal?.kind === "service"
            ? `Remover o serviço "${removal?.name}"?`
            : `Remover ${removal?.name} da equipe?`
        }
        description={
          removal?.kind === "service"
            ? "Ele deixa de aparecer como opção ao agendar. Atendimentos já agendados não são alterados."
            : "Ele deixa de aparecer como responsável ao agendar. Atendimentos já agendados não são alterados."
        }
        onConfirm={confirmRemoval}
      />
    </div>
  );
};

export default ClinicProfile;
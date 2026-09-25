import { useState } from "react";
import { Building2, Clock, Mail, MapPin, Phone, Save, Stethoscope, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clinicProfile } from "@/data/clinicDemo";

const ClinicProfile = () => {
  const [form, setForm] = useState({
    name: clinicProfile.name,
    crmv: clinicProfile.crmv,
    email: clinicProfile.email,
    phone: clinicProfile.phone,
    whatsapp: clinicProfile.whatsapp,
    address: clinicProfile.address,
    about: clinicProfile.about,
  });

  const save = (e) => {
    e.preventDefault();
    toast.success("Perfil da clínica atualizado!");
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Clock className="h-4 w-4 text-primary" /> Horários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {clinicProfile.hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <span className="text-muted-foreground">{h.day}</span>
                  <span className="font-medium">{h.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Stethoscope className="h-4 w-4 text-primary" /> Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {clinicProfile.services.map((s) => (
                <Badge key={s} variant="secondary" className="rounded-full">
                  {s}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Users className="h-4 w-4 text-primary" /> Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {clinicProfile.team.map((t) => (
                <div key={t.name} className="rounded-xl border border-border p-3">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.crmv}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {form.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {form.phone}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {form.address}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClinicProfile;
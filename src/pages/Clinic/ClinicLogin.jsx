import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope, ShieldCheck, CalendarCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  { icon: CalendarCheck, title: "Agenda organizada", text: "Confirmações, atendimentos do dia e histórico em um só lugar." },
  { icon: Users, title: "Pacientes conectados", text: "Acesse o Cartão Animal e o histórico veterinário de cada pet." },
  { icon: ShieldCheck, title: "Dados verificados", text: "Pedigree e vacinas validados pela rede LivePet." },
];

const ClinicLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Bem-vindo de volta!", { description: "Entrando na área da clínica." });
    navigate("/clinica");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between gradient-primary p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3 font-display text-xl font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
            <Stethoscope className="h-5 w-5" />
          </span>
          LivePet
        </Link>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight">
              O painel feito para clínicas veterinárias
            </h1>
            <p className="mt-3 max-w-md text-primary-foreground/80">
              Centralize atendimentos, prontuários e a comunicação com os tutores cadastrados no LivePet.
            </p>
          </div>
          <ul className="space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-primary-foreground/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} LivePet — rede de cuidados animais</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <Card className="w-full max-w-md border-border/70 shadow-card">
          <CardContent className="p-7 sm:p-9">
            <div className="mb-7 space-y-2 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Stethoscope className="h-6 w-6" />
              </span>
              <h2 className="font-display text-2xl font-bold">Acesso da clínica</h2>
              <p className="text-sm text-muted-foreground">
                Entre com o e-mail cadastrado da sua clínica parceira.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-email">E-mail profissional</Label>
                <Input
                  id="clinic-email"
                  type="email"
                  required
                  placeholder="contato@suaclinica.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-password">Senha</Label>
                <Input
                  id="clinic-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full rounded-full gradient-primary text-primary-foreground shadow-soft">
                Entrar no painel
              </Button>
            </form>
            <div className="mt-6 space-y-3 text-center text-sm">
              <button
                type="button"
                onClick={() => toast("Em breve", { description: "Cadastro de novas clínicas em análise." })}
                className="text-primary underline-offset-4 hover:underline"
              >
                Quero cadastrar minha clínica
              </button>
              <p className="text-muted-foreground">
                É tutor?{" "}
                <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                  Acesse a área do cliente
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicLogin;
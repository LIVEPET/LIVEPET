import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Stethoscope, ShieldCheck, CalendarCheck, Users, Building2, Lock, Mail, Phone, FileBadge, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { clinicService } from "@/services/api";

const highlights = [
  { icon: CalendarCheck, title: "Agenda organizada", text: "Confirmações, atendimentos do dia e histórico em um só lugar." },
  { icon: Users, title: "Pacientes conectados", text: "Acesse o Cartão Animal e o histórico veterinário de cada pet." },
  { icon: ShieldCheck, title: "Dados verificados", text: "Pedigree e vacinas validados pela rede LivePet." },
];

const ClinicLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  // Campos de login e cadastro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Campos adicionais do cadastro
  const [name, setName] = useState("");
  const [crmv, setCrmv] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await clinicService.login({ email, senha: password });
      toast.success("Bem-vindo de volta!", {
        description: `Painel da ${res.clinica?.nome || "clínica"} liberado.`,
      });
      const destination = location.state?.from?.pathname || "/clinica";
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "E-mail ou senha incorretos.";
      toast.error("Falha ao entrar", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error("Nome da clínica deve ter pelo menos 2 caracteres.");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast.error("A senha deve ter no mínimo 6 caracteres e conter letras e números.");
      return;
    }

    setLoading(true);
    try {
      await clinicService.register({
        nome: name.trim(),
        email: email.trim(),
        senha: password,
        crmv: crmv.trim() || undefined,
        telefone: phone.trim() || undefined,
      });

      // Login automático após registro
      const loginRes = await clinicService.login({ email, senha: password });
      toast.success("Clínica cadastrada com sucesso!", {
        description: `Bem-vindo(a) ao LivePet, ${loginRes.clinica?.nome || name}!`,
      });
      navigate("/clinica", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar clínica.";
      toast.error("Falha no cadastro", { description: msg });
    } finally {
      setLoading(false);
    }
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
            <div className="mb-6 space-y-2 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Stethoscope className="h-6 w-6" />
              </span>
              <h2 className="font-display text-2xl font-bold">
                {tab === "login" ? "Acesso da clínica" : "Cadastro de clínica parceira"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tab === "login"
                  ? "Entre com o e-mail cadastrado da sua clínica parceira."
                  : "Cadastre sua clínica e comece a gerenciar atendimentos na LivePet."}
              </p>
            </div>

            {/* Alternador de Abas */}
            <div className="mb-6 inline-flex w-full rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                  tab === "login"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                  tab === "signup"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cadastrar clínica
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-email">E-mail profissional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-email"
                      type="email"
                      required
                      placeholder="contato@suaclinica.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full gradient-primary text-primary-foreground shadow-soft"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                    </>
                  ) : (
                    "Entrar no painel"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Nome da clínica ou consultório *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-name"
                      type="text"
                      required
                      placeholder="Ex: Clínica Veterinária Vida Animal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-reg-email">E-mail profissional *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-reg-email"
                      type="email"
                      required
                      placeholder="contato@suaclinica.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-reg-crmv">CRMV do responsável técnico (opcional)</Label>
                  <div className="relative">
                    <FileBadge className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-reg-crmv"
                      type="text"
                      placeholder="Ex: CRMV-SP 12345"
                      value={crmv}
                      onChange={(e) => setCrmv(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-reg-phone">Telefone / WhatsApp (opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-reg-phone"
                      type="text"
                      placeholder="Ex: (11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-reg-password">Senha de acesso *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-reg-password"
                      type="password"
                      required
                      placeholder="Mínimo 6 chars (letras e números)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deve conter pelo menos 6 caracteres com letras e números.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full gradient-primary text-primary-foreground shadow-soft"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...
                    </>
                  ) : (
                    "Cadastrar clínica e entrar"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 space-y-3 text-center text-sm">
              {tab === "login" ? (
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Quero cadastrar minha clínica
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Já possui conta da clínica? Faça login
                </button>
              )}
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
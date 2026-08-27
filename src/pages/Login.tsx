import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, PawPrint, Shield, Stethoscope, Bell, Sparkles, Heart, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const credSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Senha precisa ter ao menos 6 caracteres").max(72),
});

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/pets");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      if (tab === "signup") {
        const redirectUrl = `${window.location.origin}/pets`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada!", { description: "Verifique seu e-mail para confirmar." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate("/pets");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error("Não foi possível continuar", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/pets",
      });
      if (result.error) throw result.error;
      if (!result.redirected) {
        navigate("/pets");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error("Falha ao entrar com Google", { description: msg });
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-secondary via-background to-primary-soft">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
      <div className="blob h-[520px] w-[520px] -left-40 -top-32 bg-primary/30 animate-blob" />
      <div className="blob h-[460px] w-[460px] -right-32 bottom-0 bg-accent-warm/25 animate-blob" style={{ animationDelay: "2s" }} />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur transition-smooth hover:border-primary/40 hover:bg-card hover:text-primary hover:shadow-soft"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Voltar ao site
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-20 pt-2 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10">
        <section className="hidden flex-col gap-8 lg:flex">
          <div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-2 text-xs font-semibold text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
              A vida do seu pet, organizada de verdade
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] text-foreground">
              Mais carinho. <span className="italic text-primary">Menos planilhas.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Prontuário, vacinas, agendamentos e pedigree em um app feito com — e para — quem ama animais.
            </p>
          </div>

          <ul className="grid gap-4">
            {[
              { icon: Stethoscope, title: "Prontuário digital", desc: "Histórico completo sempre na mão." },
              { icon: Bell, title: "Lembretes inteligentes", desc: "Vacinas e consultas no tempo certo." },
              { icon: Shield, title: "Validação de pedigree", desc: "Disponível nos planos Pro e Família." },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur shadow-soft">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative">
          <div className="absolute -inset-1 rounded-[2.25rem] gradient-primary opacity-30 blur-2xl" />
          <div className="relative rounded-[2rem] border border-border/60 bg-card/95 p-7 shadow-glow backdrop-blur-xl sm:p-9">
            <div className="mb-7 inline-flex w-full rounded-full bg-muted p-1">
              <button type="button" onClick={() => setTab("login")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-smooth ${tab === "login" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                Entrar
              </button>
              <button type="button" onClick={() => setTab("signup")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-smooth ${tab === "signup" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                Criar conta
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
                <PawPrint className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold leading-tight text-foreground">
                  {tab === "login" ? "Bem-vindo de volta!" : "Vamos começar?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tab === "login" ? "Que bom te ver de novo por aqui." : "É grátis e leva menos de 1 minuto."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {tab === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-semibold text-foreground">Nome completo</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="h-12 rounded-2xl border-border bg-background pl-11 text-base" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com" autoComplete="email"
                    className="h-12 rounded-2xl border-border bg-background pl-11 text-base" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                    className="h-12 rounded-2xl border-border bg-background pl-11 pr-11 text-base" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {tab === "signup" && (
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox id="terms" className="mt-0.5" required />
                  <span>Aceito os <a href="#" className="font-medium text-primary">Termos</a> e a <a href="#" className="font-medium text-primary">Política de Privacidade</a>.</span>
                </label>
              )}

              <Button type="submit" disabled={loading}
                className="mt-2 h-12 rounded-full gradient-primary text-base font-semibold text-primary-foreground shadow-soft hover:shadow-glow">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (tab === "login" ? "Entrar na minha conta" : "Criar conta grátis")}
              </Button>

              <div className="relative my-1 flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">ou continue com</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <Button type="button" variant="outline" onClick={handleGoogle} disabled={loading}
                className="h-12 rounded-2xl border-border bg-background font-medium hover:bg-muted">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Entrar com Google
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {tab === "login" ? (
                <>Ainda não tem conta?{" "}
                  <button type="button" onClick={() => setTab("signup")} className="font-semibold text-primary">Criar conta grátis</button>
                </>
              ) : (
                <>Já tem conta?{" "}
                  <button type="button" onClick={() => setTab("login")} className="font-semibold text-primary">Entrar</button>
                </>
              )}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;

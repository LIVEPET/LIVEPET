import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authService } from "@/services/api";
import { FIELD_LABEL_CLASS } from "./profileUtils";
import { passwordSchema } from "./profileSchema";

const VAZIO = { senha: "", confirmacao: "" };

// Bloco "Segurança" da aba Sobre: troca de senha pelo PUT /api/v1/auth/me (#156).
// A senha só existe no estado do formulário: não vai para console, localStorage nem URL.
const SecurityCard = () => {
  const [mostrar, setMostrar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const form = useForm({ resolver: zodResolver(passwordSchema), defaultValues: VAZIO, mode: "onChange" });

  const onSubmit = async ({ senha }) => {
    setSalvando(true);
    try {
      await authService.updateMe({ senha });
      form.reset(VAZIO);
      setMostrar(false);
      toast.success("Senha alterada com sucesso!");
    } catch (err) {
      // Só a mensagem do servidor; o objeto da requisição (com a senha) nunca é registrado.
      const detalhe = err instanceof Error ? err.message : undefined;
      toast.error("Não foi possível alterar a senha.", { description: detalhe });
    } finally {
      setSalvando(false);
    }
  };

  const tipo = mostrar ? "text" : "password";

  return (
    <Card className="p-6 border-border/60 shadow-soft space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <KeyRound className="h-4 w-4 text-primary" />
          Segurança
        </h3>
        <p className="text-xs text-muted-foreground">
          Troque sua senha de acesso. Use pelo menos 6 caracteres, com letra e número.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={FIELD_LABEL_CLASS}>Nova senha</FormLabel>
                  <FormControl>
                    <Input {...field} type={tipo} autoComplete="new-password" maxLength={100} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmacao"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={FIELD_LABEL_CLASS}>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input {...field} type={tipo} autoComplete="new-password" maxLength={100} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrar((v) => !v)}
              aria-pressed={mostrar}
              className="rounded-full text-xs"
            >
              {mostrar ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
              {mostrar ? "Esconder senha" : "Mostrar senha"}
            </Button>
            <Button
              type="submit"
              disabled={salvando || !form.formState.isValid}
              className="rounded-full gradient-primary text-primary-foreground shadow-soft"
            >
              {salvando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {salvando ? "Salvando..." : "Alterar senha"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default SecurityCard;

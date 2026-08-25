import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import MoviLogo from "@/components/MoviLogo";
import { Clock, CheckCircle2, Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, isApproved } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado de sucesso pós-cadastro
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user && isApproved) {
      navigate("/", { replace: true });
    }
  }, [user, isApproved, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingNotice(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      
      if (error) {
        setLoading(false);
        toast.error("Email ou senha inválidos. Confira os dados e tente novamente.");
        return;
      }

      if (data?.user) {
        // Consultar status e papéis do usuário
        const [{ data: profile }, { data: roles }] = await Promise.all([
          supabase.from("profiles").select("status, rejection_reason").eq("id", data.user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        ]);

        const hasRoles = roles && roles.length > 0;
        const status = profile?.status || (hasRoles ? "aprovado" : "pendente");

        if (status === "pendente" && !hasRoles) {
          await supabase.auth.signOut();
          setLoading(false);
          setPendingNotice("Seu cadastro foi realizado com sucesso! Seu acesso está aguardando aprovação da coordenação.");
          toast.warning("Acesso pendente: aguardando aprovação da coordenação.");
          return;
        }

        if (status === "rejeitado" && !hasRoles) {
          await supabase.auth.signOut();
          setLoading(false);
          const reason = profile?.rejection_reason ? `: ${profile.rejection_reason}` : ".";
          setPendingNotice(`Acesso recusado: Seu cadastro foi rejeitado pela coordenação${reason}`);
          toast.error("Acesso negado pela coordenação.");
          return;
        }

        setLoading(false);
        toast.success("Bem-vindo de volta ao MOVI+!");
        navigate("/", { replace: true });
      }
    } catch {
      setLoading(false);
      toast.error("Ocorreu um erro ao tentar entrar. Tente novamente.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingNotice(null);

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      setLoading(false);
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            nome: cleanEmail.split("@")[0],
          },
        },
      });

      if (error) {
        setLoading(false);
        toast.error(error.message || "Erro ao realizar o cadastro. Tente novamente.");
        return;
      }

      // Garante inserção direta na tabela profiles com fallback caso o trigger ainda não tenha sido executado
      if (data?.user?.id) {
        try {
          const { error: pErr } = await supabase.from("profiles").upsert({
            id: data.user.id,
            email: cleanEmail,
            nome: cleanEmail.split("@")[0],
            status: "pendente",
          } as any);

          if (pErr) {
            // Se a coluna status ainda não existir no Supabase, tenta upsert sem ela
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email: cleanEmail,
              nome: cleanEmail.split("@")[0],
            } as any);
          }
        } catch (insertErr) {
          console.warn("Aviso na inserção de profiles:", insertErr);
        }
      }

      // Desconecta a sessão para garantir que o usuário não entre sem aprovação
      await supabase.auth.signOut();

      setLoading(false);
      setRegisterSuccess(true);
      toast.success("Solicitação de cadastro registrada!");
    } catch {
      setLoading(false);
      toast.error("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background selection:bg-primary/30">
      
      {/* Coluna da Esquerda - Branding Editorial */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 border-r border-white/5 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50"></div>

        <div className="relative z-10">
          <MoviLogo size="lg" className="h-14 w-auto text-foreground" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            MOVI+ MCJB
          </div>
          <h1 className="text-5xl font-medium leading-tight mb-6 text-foreground/90">
            <i className="text-primary/85 font-serif">Sistema de Gestão Comunitária</i>
          </h1>
          <p className="text-muted-foreground text-lg font-light leading-relaxed">
            Plataforma centralizada de turmas, matrículas, presenças e controle de acesso do Movimento Comunitário do Jardim Botânico.
          </p>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground/60 flex items-center gap-2">
          <span>© {new Date().getFullYear()} MCJB — Todos os direitos reservados.</span>
        </div>
      </div>

      {/* Coluna da Direita - Formulários */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
          
          {/* Logo Visível no Mobile */}
          <div className="lg:hidden flex justify-center mb-4">
            <MoviLogo size="md" className="h-11 w-auto text-foreground" />
          </div>

          {/* ESTADO 1: TELA DE ESPERA / SUCESSO DO CADASTRO */}
          {registerSuccess ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 p-8 rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cadastro Criado
                </div>
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                  Cadastro realizado com sucesso!
                </h2>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm text-foreground/90 font-medium leading-relaxed">
                  Seu acesso está <span className="text-amber-400 font-semibold">aguardando aprovação da coordenação</span>.
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  Assim que a equipe da coordenação revisar seus dados e atribuir o cargo (coordenação, instrutor ou secretaria), seu login será liberado automaticamente.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setRegisterSuccess(false);
                  setMode("login");
                  setPassword("");
                }}
                className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar para o Login
              </Button>
            </div>
          ) : (
            /* ESTADO 2: FORMULÁRIOS DE LOGIN E CADASTRO */
            <div className="space-y-8">
              
              {/* Cabeçalho com Switcher de Modo */}
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                      {mode === "login" ? "Acesso ao Sistema" : "Novo Cadastro"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {mode === "login"
                        ? "Insira suas credenciais para continuar."
                        : "Preencha seus dados para solicitar acesso à coordenação."}
                    </p>
                  </div>
                </div>

                {/* Alternador Entrar / Cadastrar */}
                <div className="flex p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setPendingNotice(null);
                    }}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300",
                      mode === "login"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setPendingNotice(null);
                    }}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300",
                      mode === "register"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Criar Conta
                  </button>
                </div>
              </div>

              {/* Aviso de Conta Pendente ou Recusada */}
              {pendingNotice && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3 animate-in fade-in duration-300">
                  <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1 leading-relaxed">
                    <span className="font-semibold block text-amber-200">Aviso de Acesso:</span>
                    <span>{pendingNotice}</span>
                  </div>
                </div>
              )}

              {/* Formulário (Login ou Cadastro) */}
              <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-6">
                <div className="space-y-5">
                  
                  {/* Campo E-mail */}
                  <div className="space-y-2 group">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> E-mail
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-transparent border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all text-base sm:text-lg h-12"
                      placeholder="seu@email.com"
                    />
                  </div>

                  {/* Campo Senha */}
                  <div className="space-y-2 group">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Senha
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? "Ocultar" : "Mostrar"}</span>
                      </button>
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-transparent border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all text-base sm:text-lg h-12"
                      placeholder="••••••••"
                    />
                    {mode === "register" && (
                      <p className="text-[11px] text-muted-foreground">
                        Mínimo de 6 caracteres.
                      </p>
                    )}
                  </div>
                </div>

                {/* Botão de Envio Principal */}
                <Button
                  type="submit"
                  className="w-full h-14 text-base font-medium tracking-wide rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 ease-out mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      {mode === "login" ? "Autenticando..." : "Criando cadastro..."}
                    </span>
                  ) : mode === "login" ? (
                    "Entrar no Sistema"
                  ) : (
                    "Solicitar Acesso"
                  )}
                </Button>

                {/* Rodapé informativo para cadastro */}
                {mode === "register" && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-muted-foreground text-center leading-relaxed">
                    Ao solicitar o cadastro, seu perfil ficará pendente até a aprovação e definição de cargo pela coordenação.
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

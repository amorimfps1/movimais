import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2, Clock, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import MoviLogo from "@/components/MoviLogo";

interface Props {
  requireRoles?: AppRole[];
  requireAdmin?: boolean;
  children?: ReactNode;
}

export default function ProtectedRoute({ requireRoles, requireAdmin, children }: Props) {
  const { user, loading, roles, isAdmin, isPending, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Se o usuário está logado mas ainda não foi aprovado pela coordenação (sem roles)
  if (isPending || roles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-card/70 backdrop-blur-2xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center">
            <MoviLogo size="md" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Acesso em Análise
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Olá, <strong className="text-foreground">{user.email}</strong>! Seu cadastro foi recebido e está aguardando a aprovação e definição de cargo pela equipe da coordenação.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-muted-foreground/80 leading-relaxed">
            Assim que seu acesso for ativado por um coordenador, você terá acesso completo às funcionalidades da sua função.
          </div>

          <Button
            variant="outline"
            onClick={signOut}
            className="w-full h-11 rounded-xl border-white/10 text-xs gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut className="w-4 h-4" /> Desconectar da Conta
          </Button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireRoles && !requireRoles.some((r) => roles.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

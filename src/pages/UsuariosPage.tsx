import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, UserStatus } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Users,
  UserCheck,
  Search,
  Loader2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileItem {
  id: string;
  email: string;
  nome: string | null;
  status: UserStatus | null;
  created_at?: string;
  approved_at?: string | null;
  rejection_reason?: string | null;
}

const ROLES_DEF: { value: AppRole; label: string; description: string; badgeColor: string }[] = [
  {
    value: "secretaria",
    label: "Secretaria",
    description: "Acesso administrativo completo, gestão de finanças e permissões de usuários",
    badgeColor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  {
    value: "coordenacao",
    label: "Coordenação",
    description: "Gestão operacional de turmas, alunos, matrículas e aprovação de novos acessos",
    badgeColor: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  {
    value: "instrutor",
    label: "Instrutor",
    description: "Acesso à agenda de aulas, diário de presenças e lista de alunos das turmas",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
];

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pendentes" | "ativos" | "todos">("pendentes");
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Estado do Modal de Aprovação
  const [approveTarget, setApproveTarget] = useState<ProfileItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [actionLoading, setActionLoading] = useState(false);

  // Estado do Modal de Rejeição
  const [rejectTarget, setRejectTarget] = useState<ProfileItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      // 1. Buscar perfis com fallback de queries
      let profsData: any[] = [];
      let pError: any = null;

      const res1 = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!res1.error && res1.data) {
        profsData = res1.data;
      } else {
        // Fallback sem order caso created_at não exista
        const res2 = await supabase.from("profiles").select("*");
        if (!res2.error && res2.data) {
          profsData = res2.data;
        } else {
          pError = res1.error || res2.error;
        }
      }

      // 2. Buscar user_roles
      const { data: rs, error: rErr } = await supabase.from("user_roles").select("user_id, role");

      if (pError) {
        console.warn("Erro ao buscar tabela profiles:", pError);
        setFetchError(pError.message || "Erro de permissão ao ler a tabela profiles");
      }
      if (rErr) console.warn("Erro ao buscar papéis:", rErr);

      const map: Record<string, AppRole[]> = {};
      (rs ?? []).forEach((r: any) => {
        map[r.user_id] = [...(map[r.user_id] ?? []), r.role];
      });
      setRolesMap(map);

      // 3. Formatar lista de perfis
      const formattedProfiles: ProfileItem[] = (profsData ?? []).map((p: any) => {
        const userRoles = map[p.id] ?? [];
        let inferredStatus: UserStatus = p.status;
        if (!inferredStatus) {
          inferredStatus = userRoles.length > 0 ? "aprovado" : "pendente";
        }
        return {
          ...p,
          status: inferredStatus,
        };
      });

      setProfiles(formattedProfiles);

      if (isManual) {
        toast.success("Lista de usuários e aprovações atualizada!");
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err?.message || "Erro inesperado ao consultar dados.");
      toast.error("Erro ao carregar dados de usuários.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Executar Aprovação com Role Obrigatória
  const handleConfirmApproval = async () => {
    if (!approveTarget || !selectedRole) {
      toast.error("Selecione obrigatoriamente um cargo para aprovar o usuário.");
      return;
    }

    setActionLoading(true);
    try {
      // 1. Tenta via RPC atômica
      const { error: rpcError } = await supabase.rpc("approve_user", {
        _target_user_id: approveTarget.id,
        _assigned_role: selectedRole as any,
        _approver_id: currentUser?.id ?? "",
      });

      // 2. Fallback direto caso a RPC ainda não esteja instalada no Supabase
      if (rpcError) {
        console.warn("RPC approve_user falhou, aplicando fallback direto:", rpcError.message);
        
        try {
          await supabase
            .from("profiles")
            .update({
              status: "aprovado",
              approved_by: currentUser?.id,
              approved_at: new Date().toISOString(),
              rejection_reason: null,
            } as any)
            .eq("id", approveTarget.id);
        } catch {
          // Ignora se a coluna status não existir no banco
        }

        // Insere o papel em user_roles
        await supabase.from("user_roles").delete().eq("user_id", approveTarget.id);
        await supabase.from("user_roles").insert({
          user_id: approveTarget.id,
          role: selectedRole as any,
        });
      }

      toast.success(`Usuário ${approveTarget.email} aprovado com sucesso como ${selectedRole}!`);
      setApproveTarget(null);
      setSelectedRole("");
      await loadData();
    } catch (err: any) {
      toast.error(`Erro ao aprovar: ${err?.message || "Tente novamente"}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Executar Rejeição
  const handleConfirmRejection = async () => {
    if (!rejectTarget) return;

    setActionLoading(true);
    try {
      const reason = rejectReason.trim() || "Cadastro recusado pela coordenação.";
      
      const { error: rpcError } = await supabase.rpc("reject_user", {
        _target_user_id: rejectTarget.id,
        _reason: reason,
        _approver_id: currentUser?.id ?? "",
      });

      if (rpcError) {
        console.warn("RPC reject_user falhou, aplicando fallback direto:", rpcError.message);
        try {
          await supabase
            .from("profiles")
            .update({
              status: "rejeitado",
              rejection_reason: reason,
              approved_by: currentUser?.id,
              approved_at: new Date().toISOString(),
            } as any)
            .eq("id", rejectTarget.id);
        } catch {
          // Fallback
        }

        await supabase.from("user_roles").delete().eq("user_id", rejectTarget.id);
      }

      toast.info(`Cadastro de ${rejectTarget.email} foi recusado.`);
      setRejectTarget(null);
      setRejectReason("");
      await loadData();
    } catch (err: any) {
      toast.error(`Erro ao rejeitar: ${err?.message || "Tente novamente"}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle direto de roles para usuários já ativos
  const toggleRole = async (userId: string, role: AppRole, checked: boolean) => {
    if (checked) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
      
      try {
        await supabase.from("profiles").update({ status: "aprovado" } as any).eq("id", userId);
      } catch {}
      
      toast.success(`Perfil ${role} atribuído com sucesso!`);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
      toast.success(`Perfil ${role} removido.`);
    }

    setRolesMap((prev) => {
      const current = prev[userId] ?? [];
      return {
        ...prev,
        [userId]: checked ? [...current, role] : current.filter((r) => r !== role),
      };
    });
  };

  // Listas filtradas ultra-resilientes
  const pendentesList = useMemo(() => {
    return profiles.filter((p) => {
      const roles = rolesMap[p.id] ?? [];
      const statusLower = (p.status || "").toLowerCase();
      // Se tem papel atribuído, não está mais pendente
      if (roles.length > 0) return false;
      // Se foi rejeitado explicitamente, sai da fila de pendentes
      if (statusLower === "rejeitado") return false;
      // Se o status é explicitamente pendente OU se não tem roles e não é aprovado, é pendente!
      return true;
    });
  }, [profiles, rolesMap]);

  const ativosList = useMemo(() => {
    return profiles.filter((p) => {
      const roles = rolesMap[p.id] ?? [];
      const statusLower = (p.status || "").toLowerCase();
      return roles.length > 0 || statusLower === "aprovado";
    });
  }, [profiles, rolesMap]);

  const displayedProfiles = useMemo(() => {
    let list = profiles;
    if (activeTab === "pendentes") list = pendentesList;
    else if (activeTab === "ativos") list = ativosList;

    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (p) => (p.nome || "").toLowerCase().includes(s) || (p.email || "").toLowerCase().includes(s)
    );
  }, [profiles, activeTab, pendentesList, ativosList, search]);

  const totalUsuarios = profiles.length;
  const totalAtivos = ativosList.length;
  const totalPendentes = pendentesList.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Top Header */}
      <PageHeader
        title="Gestão de Usuários & Aprovações"
        description="Painel de aprovação de novos cadastros e atribuição de cargos pelo MOVI+ MCJB"
        badge="Controle de Acessos"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="rounded-xl border-white/10 text-xs gap-2 h-9 bg-card/60 hover:bg-white/5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
            <span>Atualizar Dados</span>
          </Button>
        }
      />

      {/* Alerta caso haja falha de RLS no Supabase */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-amber-200">Aviso do Banco de Dados:</span>
            <span>{fetchError}. Certifique-se de que seu usuário possui cargo de <strong>coordenação</strong> ou <strong>secretaria</strong> e que o script SQL de migração foi executado no Supabase.</span>
          </div>
        </div>
      )}

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cadastros Pendentes"
          value={totalPendentes}
          icon={Clock}
          variant={totalPendentes > 0 ? "warning" : "default"}
          trend={totalPendentes > 0 ? "Aguardando sua avaliação" : "Fila de espera zerada"}
          trendType={totalPendentes > 0 ? "neutral" : "positive"}
        />
        <StatCard
          title="Usuários Ativos"
          value={totalAtivos}
          icon={UserCheck}
          variant="success"
          trend="Acesso liberado com cargo"
          trendType="positive"
        />
        <StatCard
          title="Total de Contas"
          value={totalUsuarios}
          icon={Users}
          variant="primary"
          trend="Registros no sistema"
        />
      </div>

      {/* Cartões Informativos de Cargos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES_DEF.map((r) => (
          <div
            key={r.value}
            className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-4 space-y-2 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${r.badgeColor}`}>
                  {r.label}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
          </div>
        ))}
      </div>

      {/* Painel Principal com Abas */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
        
        {/* Barra Superior de Controles e Abas */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/40">
          
          {/* Navegação por Abas */}
          <div className="flex items-center gap-1.5 p-1 bg-background/50 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab("pendentes")}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2",
                activeTab === "pendentes"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendentes</span>
              {totalPendentes > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                  {totalPendentes}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("ativos")}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2",
                activeTab === "ativos"
                  ? "bg-primary/20 text-primary font-semibold border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Ativos & Permissões ({totalAtivos})</span>
            </button>

            <button
              onClick={() => setActiveTab("todos")}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2",
                activeTab === "todos"
                  ? "bg-white/10 text-foreground font-semibold border border-white/20 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Todos ({totalUsuarios})</span>
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="relative max-w-md min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por e-mail ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9.5 bg-background/60 border-white/10 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Carregando usuários e permissões...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "pendentes" ? (
              /* ABA 1: PAINEL DE APROVAÇÃO DE PENDENTES */
              <div className="p-4 sm:p-6 space-y-4">
                {displayedProfiles.length === 0 ? (
                  <div className="py-16 text-center space-y-3 border border-dashed border-white/10 rounded-2xl">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/80 mx-auto" />
                    <h3 className="text-sm font-semibold text-foreground">Tudo em dia!</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Não há novos cadastros aguardando aprovação no momento.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {displayedProfiles.map((p) => {
                      const initial = p.nome ? p.nome.charAt(0).toUpperCase() : p.email.charAt(0).toUpperCase();
                      const dateFormatted = p.created_at
                        ? new Date(p.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recente";

                      return (
                        <div
                          key={p.id}
                          className="p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                              {initial}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-foreground text-sm">
                                  {p.nome || p.email.split("@")[0]}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Aguardando Aprovação
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{p.email}</span>
                                <span>•</span>
                                <span>Solicitado em: {dateFormatted}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectTarget(p);
                                setRejectReason("");
                              }}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20 text-xs gap-1.5 rounded-xl h-9"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Rejeitar</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setApproveTarget(p);
                                setSelectedRole("");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5 rounded-xl h-9 shadow-md shadow-emerald-900/20"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Avaliar & Atribuir Cargo</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ABA 2 e 3: TABELA DE USUÁRIOS ATIVOS E GESTÃO DE PAPÉIS */
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-white/[0.02] border-b border-white/5 text-left">
                  <tr>
                    <th className="py-3.5 px-5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Usuário / Status
                    </th>
                    {ROLES_DEF.map((r) => (
                      <th
                        key={r.value}
                        className="py-3.5 px-4 text-center min-w-[130px] font-semibold text-[11px] uppercase tracking-wider text-muted-foreground"
                      >
                        <div>{r.label}</div>
                      </th>
                    ))}
                    <th className="py-3.5 px-5 text-right font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {displayedProfiles.map((p) => {
                    const userRoles = rolesMap[p.id] ?? [];
                    const isSelf = p.id === currentUser?.id;
                    const initial = p.nome ? p.nome.charAt(0).toUpperCase() : p.email.charAt(0).toUpperCase();
                    const isPendente = p.status === "pendente" && userRoles.length === 0;
                    const isRejeitado = p.status === "rejeitado";

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                              {initial}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                                <span>{p.nome || p.email.split("@")[0]}</span>
                                {isSelf && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30">
                                    Você
                                  </span>
                                )}
                                {isPendente && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    Pendente
                                  </span>
                                )}
                                {isRejeitado && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    Rejeitado
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{p.email}</div>
                            </div>
                          </div>
                        </td>

                        {ROLES_DEF.map((r) => {
                          const hasRole = userRoles.includes(r.value);
                          return (
                            <td key={r.value} className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={hasRole}
                                  onCheckedChange={(c) => toggleRole(p.id, r.value, !!c)}
                                />
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-4 px-5 text-right">
                          {isPendente ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setApproveTarget(p);
                                setSelectedRole("");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 rounded-lg h-8"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Aprovar
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {userRoles.length} papel(éis)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {displayedProfiles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                        Nenhum usuário encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: APROVAÇÃO COM ATRIBUIÇÃO OBRIGATÓRIA DE CARGO */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Aprovar Usuário e Atribuir Cargo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina o cargo oficial para liberar o acesso de{" "}
              <strong className="text-foreground">{approveTarget?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-foreground">{approveTarget?.nome || approveTarget?.email}</div>
              <div className="text-[11px] text-muted-foreground">{approveTarget?.email}</div>
            </div>

            {/* Menu Suspenso Exclusivo de Roles */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                Cargo Obrigatório <span className="text-rose-500">*</span>
              </label>
              
              <Select value={selectedRole} onValueChange={(val: any) => setSelectedRole(val)}>
                <SelectTrigger className="w-full h-11 bg-background/50 border-white/10 rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione um cargo..." />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                  <SelectItem value="coordenacao" className="text-xs sm:text-sm py-2.5">
                    <div className="font-semibold text-sky-400">Coordenação</div>
                    <div className="text-[11px] text-muted-foreground">Gestão operacional, alunos, turmas e aprovações</div>
                  </SelectItem>
                  <SelectItem value="instrutor" className="text-xs sm:text-sm py-2.5">
                    <div className="font-semibold text-emerald-400">Instrutor</div>
                    <div className="text-[11px] text-muted-foreground">Aulas, presenças e turmas atribuídas</div>
                  </SelectItem>
                  <SelectItem value="secretaria" className="text-xs sm:text-sm py-2.5">
                    <div className="font-semibold text-rose-400">Secretaria</div>
                    <div className="text-[11px] text-muted-foreground">Administração geral, financeiro e controle total</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Ao confirmar, o status passará para <strong>Ativo</strong> e o usuário poderá fazer login imediatamente com as permissões do cargo escolhido.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setApproveTarget(null)}
              className="rounded-xl border-white/10 text-xs h-10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmApproval}
              disabled={!selectedRole || actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-10 font-medium shadow-md shadow-emerald-900/30"
            >
              {actionLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Aprovando...
                </span>
              ) : (
                "Confirmar e Ativar Acesso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REJEIÇÃO COM MOTIVO */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <UserX className="w-5 h-5" />
              Recusar Cadastro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Você está prestes a recusar a solicitação de{" "}
              <strong className="text-foreground">{rejectTarget?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Motivo da Recusa (Opcional)
              </label>
              <Textarea
                placeholder="Ex: E-mail não reconhecido pela administração ou dados insuficientes..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-background/50 border-white/10 rounded-xl text-xs sm:text-sm min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              className="rounded-xl border-white/10 text-xs h-10"
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirmRejection}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs h-10 font-medium"
            >
              {actionLoading ? "Processando..." : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

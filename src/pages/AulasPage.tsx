import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import DataTable, { FilterConfig } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, BookOpen, CheckCircle, Clock, Calendar, AlertCircle,
  ClipboardCheck, UserCog, Dumbbell, MapPin, LayoutGrid, List
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateId, STORES, type Turma, type Instrutor, type Modalidade } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDateToBR } from "@/lib/utils";

const DIAS_SEMANA_ORDEM = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface Aula {
  id: string;
  id_turma: string;
  id_instrutor: string | null;
  data_aula: string;
  horario_inicio: string;
  horario_fim: string;
  status_aula: string;
  observacoes: string;
  created_at?: string;
}

const emptyAula = (): Aula => ({
  id: generateId(),
  id_turma: "",
  id_instrutor: null,
  data_aula: new Date().toISOString().split("T")[0],
  horario_inicio: "08:00",
  horario_fim: "09:00",
  status_aula: "AGENDADA",
  observacoes: "",
});

async function getAulas(): Promise<Aula[]> {
  const { data, error } = await supabase
    .from("aulas" as any)
    .select("*")
    .order("data_aula", { ascending: false });
  if (error) { console.error("[getAulas]", error); return []; }
  return (data as Aula[]) || [];
}

async function saveAula(aula: Aula, isEdit: boolean): Promise<void> {
  const payload = {
    ...aula,
    id_instrutor: aula.id_instrutor || null,
    horario_inicio: aula.horario_inicio || null,
    horario_fim: aula.horario_fim || null,
    observacoes: aula.observacoes || null,
  };
  if (isEdit) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("aulas" as any).update(rest).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("aulas" as any).insert(payload);
    if (error) throw error;
  }
}

async function deleteAula(id: string): Promise<void> {
  const { error } = await supabase.from("aulas" as any).delete().eq("id", id);
  if (error) throw error;
}

export default function AulasPage() {
  const { user, isInstrutor, isAdmin, instrutorId: authInstrutorId, especialidades: authEspecialidades } = useAuth();
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: instrutores } = useTable<Instrutor>(STORES.INSTRUTORES);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Aula | null>(null);
  const [form, setForm] = useState<Aula>(emptyAula());
  const [viewTab, setViewTab] = useState<"grade" | "historico">("grade");
  const [filterInstrutor, setFilterInstrutor] = useState<string>("ALL");
  const [filterModalidade, setFilterModalidade] = useState<string>("ALL");
  const { toast } = useToast();

  // Identifica o instrutor logado caso seja perfil instrutor
  const currentInstrutor = useMemo(() => {
    if (!isInstrutor && isAdmin) return null;
    if (authInstrutorId) {
      const found = instrutores.find(i => i.id === authInstrutorId || i.user_id === user?.id);
      if (found) return found;
    }
    if (user?.id) {
      const found = instrutores.find(i => i.user_id === user.id);
      if (found) return found;
    }
    if (user?.email) {
      const found = instrutores.find(i => i.email?.toLowerCase() === user.email?.toLowerCase());
      if (found) return found;
    }
    return null;
  }, [isInstrutor, isAdmin, authInstrutorId, user, instrutores]);

  // Modalidades lecionadas pelo instrutor logado (para filtro simplificado)
  const instructorModalidades = useMemo(() => {
    if (!isInstrutor || isAdmin) {
      return modalidades;
    }
    const specs = currentInstrutor?.especialidades || authEspecialidades || [];
    const modIds = currentInstrutor?.id_modalidades || [];

    return modalidades.filter(m => {
      return modIds.includes(m.id) || specs.includes(m.nome_modalidade);
    });
  }, [isInstrutor, isAdmin, modalidades, currentInstrutor, authEspecialidades]);

  // Función utilitária para verificar se a turma está atribuída ao instrutor por ID direto ou vínculo
  const isTurmaAssignedToInstrutor = useMemo(() => {
    return (turma: Turma | undefined) => {
      if (!turma || !turma.id_instrutor) return false;
      
      // 1. Matched por ID direto do instrutor ou do usuário
      if (currentInstrutor) {
        if (turma.id_instrutor === currentInstrutor.id) return true;
        if (currentInstrutor.user_id && turma.id_instrutor === currentInstrutor.user_id) return true;
      }
      if (authInstrutorId && turma.id_instrutor === authInstrutorId) return true;
      if (user?.id && turma.id_instrutor === user.id) return true;

      // 2. Busca o registro do instrutor vinculado à turma para conferir se pertence ao usuário logado
      const targetInst = instrutores.find(i => i.id === turma.id_instrutor || i.user_id === turma.id_instrutor);
      if (targetInst) {
        if (user?.id && targetInst.user_id === user.id) return true;
        if (user?.email && targetInst.email?.toLowerCase() === user.email.toLowerCase()) return true;
        if (authInstrutorId && targetInst.id === authInstrutorId) return true;
      }

      return false;
    };
  }, [currentInstrutor, authInstrutorId, user, instrutores]);

  // Função utilitária para verificar se a aula está atribuída ao instrutor
  const isAulaAssignedToInstrutor = useMemo(() => {
    return (aula: Aula | undefined, turma: Turma | undefined) => {
      if (aula?.id_instrutor) {
        if (currentInstrutor) {
          if (aula.id_instrutor === currentInstrutor.id) return true;
          if (currentInstrutor.user_id && aula.id_instrutor === currentInstrutor.user_id) return true;
        }
        if (authInstrutorId && aula.id_instrutor === authInstrutorId) return true;
        if (user?.id && aula.id_instrutor === user.id) return true;

        const targetInst = instrutores.find(i => i.id === aula.id_instrutor || i.user_id === aula.id_instrutor);
        if (targetInst) {
          if (user?.id && targetInst.user_id === user.id) return true;
          if (user?.email && targetInst.email?.toLowerCase() === user.email.toLowerCase()) return true;
          if (authInstrutorId && targetInst.id === authInstrutorId) return true;
        }
      }
      if (turma) {
        return isTurmaAssignedToInstrutor(turma);
      }
      return false;
    };
  }, [currentInstrutor, authInstrutorId, user, instrutores, isTurmaAssignedToInstrutor]);

  useEffect(() => {
    if (currentInstrutor) {
      setFilterInstrutor(currentInstrutor.id);
    }
  }, [currentInstrutor]);

  const reload = async () => {
    setLoading(true);
    const data = await getAulas();
    setAulas(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  // Turmas filtradas para a grade semanal (apenas turmas efetivamente atribuídas ao instrutor)
  const filteredTurmas = useMemo(() => {
    return turmas.filter(t => {
      let matchInst = true;
      if (isInstrutor && !isAdmin) {
        matchInst = isTurmaAssignedToInstrutor(t);
      } else if (filterInstrutor !== "ALL") {
        const targetInst = instrutores.find(i => i.id === filterInstrutor);
        matchInst = t.id_instrutor === filterInstrutor || (targetInst?.user_id && t.id_instrutor === targetInst.user_id);
      }

      let matchMod = true;
      if (filterModalidade !== "ALL") {
        matchMod = t.id_modalidade === filterModalidade;
      }

      return matchInst && matchMod && t.status_turma === "ATIVA";
    });
  }, [turmas, isInstrutor, isAdmin, isTurmaAssignedToInstrutor, filterInstrutor, filterModalidade, instrutores]);

  // Aulas filtradas para o histórico
  const filteredAulas = useMemo(() => {
    return aulas.filter(a => {
      const turma = turmas.find(t => t.id === a.id_turma);
      let matchInst = true;
      if (isInstrutor && !isAdmin) {
        matchInst = isAulaAssignedToInstrutor(a, turma);
      } else if (filterInstrutor !== "ALL") {
        const targetInst = instrutores.find(i => i.id === filterInstrutor);
        matchInst = a.id_instrutor === filterInstrutor ||
                    (targetInst?.user_id && a.id_instrutor === targetInst.user_id) ||
                    turma?.id_instrutor === filterInstrutor ||
                    (targetInst?.user_id && turma?.id_instrutor === targetInst.user_id);
      }

      let matchMod = true;
      if (filterModalidade !== "ALL" && turma) {
        matchMod = turma.id_modalidade === filterModalidade;
      }

      return matchInst && matchMod;
    });
  }, [aulas, turmas, isInstrutor, isAdmin, isAulaAssignedToInstrutor, filterInstrutor, filterModalidade, instrutores]);

  // KPIs
  const total = filteredAulas.length;
  const agendadas = filteredAulas.filter(a => a.status_aula === "AGENDADA").length;
  const realizadas = filteredAulas.filter(a => a.status_aula === "REALIZADA").length;
  const canceladas = filteredAulas.filter(a => a.status_aula === "CANCELADA").length;

  const handleNew = () => { setEditingItem(null); setForm(emptyAula()); setOpen(true); };
  const handleEdit = (item: Aula) => { setEditingItem(item); setForm({ ...item }); setOpen(true); };
  const handleDelete = async (item: Aula) => {
    try {
      await deleteAula(item.id);
      await reload();
      toast({ title: "Aula removida." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const handleConcluirAula = async (aula: Aula) => {
    try {
      await saveAula({ ...aula, status_aula: "REALIZADA" }, true);
      await reload();
      toast({ title: "Aula marcada como Realizada!" });
    } catch (e: any) {
      toast({ title: "Erro ao concluir aula", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!form.id_turma || !form.data_aula) {
      toast({ title: "Selecione turma e data da aula", variant: "destructive" });
      return;
    }
    try {
      const selectedTurma = turmas.find(t => t.id === form.id_turma);
      const payload = {
        ...form,
        id_instrutor: form.id_instrutor || selectedTurma?.id_instrutor || null,
      };
      await saveAula(payload, !!editingItem);
      await reload();
      setOpen(false);
      setForm(emptyAula());
      toast({ title: editingItem ? "Aula atualizada!" : "Aula agendada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const set = (k: keyof Aula, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status_aula",
      label: "Status",
      options: [
        { label: "Agendada", value: "AGENDADA" },
        { label: "Realizada", value: "REALIZADA" },
        { label: "Cancelada", value: "CANCELADA" },
        { label: "Reposição", value: "REPOSICAO" },
      ],
    },
    {
      key: "id_turma",
      label: "Turma",
      options: turmas.map(t => ({ label: t.nome_turma, value: t.id })),
    },
  ], [turmas]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Top Header */}
      <PageHeader
        title="Agenda e Grade de Aulas"
        description="Grade horária semanal fixa, histórico de aulas ministradas e registro de chamadas do MCJB"
        badge={viewTab === "grade" ? `${filteredTurmas.length} Turmas na Grade` : `${total} Aulas no Histórico`}
        action={
          <div className="flex items-center gap-2">
            <Link to="/presencas">
              <Button size="sm" variant="outline" className="rounded-xl border-white/10 text-xs gap-1.5 h-9 bg-card/60 hover:bg-white/5 text-emerald-400">
                <ClipboardCheck className="w-4 h-4" />
                <span>Diário de Presenças</span>
              </Button>
            </Link>
            {isAdmin && (
              <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2 h-9 text-xs">
                <Plus className="w-4 h-4" />
                <span>Agendar Aula Extra</span>
              </Button>
            )}
          </div>
        }
      />

      {/* BANNER DO INSTRUTOR */}
      {currentInstrutor && (
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-foreground block">
                Visualizando grade do Prof. {currentInstrutor.nome_completo}
              </span>
              <span className="text-muted-foreground">
                Especialidades: {(currentInstrutor.especialidades || []).join(", ") || "Geral"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS SUPERIORES E SELETOR DE ABAS */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Abas */}
        <div className="flex items-center gap-1.5 p-1 bg-background/50 border border-white/10 rounded-xl">
          <button
            onClick={() => setViewTab("grade")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
              viewTab === "grade"
                ? "bg-primary/20 text-primary font-semibold border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grade Semanal Fixa</span>
          </button>

          <button
            onClick={() => setViewTab("historico")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
              viewTab === "historico"
                ? "bg-primary/20 text-primary font-semibold border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Histórico de Aulas</span>
          </button>
        </div>

        {/* Filtros por Instrutor e Modalidade */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {!currentInstrutor && (
            <div className="min-w-[180px]">
              <Select value={filterInstrutor} onValueChange={setFilterInstrutor}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl h-9 text-xs">
                  <SelectValue placeholder="Instrutor..." />
                </SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10 max-h-56">
                  <SelectItem value="ALL" className="text-xs font-semibold">Todos os Instrutores</SelectItem>
                  {instrutores.filter(i => i.ativo).map(i => (
                    <SelectItem key={i.id} value={i.id} className="text-xs">
                      {i.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-[180px]">
            <Select value={filterModalidade} onValueChange={setFilterModalidade}>
              <SelectTrigger className="bg-background/60 border-white/10 rounded-xl h-9 text-xs">
                <SelectValue placeholder="Modalidade..." />
              </SelectTrigger>
              <SelectContent className="bg-card/95 border-white/10 max-h-56">
                <SelectItem value="ALL" className="text-xs font-semibold">Todas as Modalidades</SelectItem>
                {instructorModalidades.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.nome_modalidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ABA 1: GRADE SEMANAL FIXA AGRUPADA POR DIA DA SEMANA */}
      {viewTab === "grade" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DIAS_SEMANA_ORDEM.map(dia => {
              const turmasDoDia = filteredTurmas.filter(t => (t.dias_semana || []).includes(dia));

              return (
                <div
                  key={dia}
                  className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-4 shadow-lg space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-foreground text-sm">{dia}</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                        {turmasDoDia.length} {turmasDoDia.length === 1 ? "aula" : "aulas"}
                      </span>
                    </div>

                    {turmasDoDia.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center italic">
                        Sem turmas programadas
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {turmasDoDia.map(turma => {
                          const mod = modalidades.find(m => m.id === turma.id_modalidade);
                          const inst = instrutores.find(i => i.id === turma.id_instrutor);
                          const horarioTexto = turma.horario_inicio
                            ? `${turma.horario_inicio.slice(0, 5)} - ${turma.horario_fim?.slice(0, 5) || '?'}`
                            : "Horário livre";

                          return (
                            <div
                              key={turma.id}
                              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all space-y-2 group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                                    {mod?.nome_modalidade || "Modalidade"}
                                  </span>
                                  <h4 className="text-xs font-bold text-foreground">{turma.nome_turma}</h4>
                                </div>
                                <span className="font-mono text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                                  {horarioTexto}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-white/5">
                                <span className="flex items-center gap-1 truncate max-w-[130px]">
                                  <UserCog className="w-3 h-3 text-emerald-400 shrink-0" />
                                  {inst ? inst.nome_completo : "Sem instrutor"}
                                </span>
                                {(!isInstrutor || isAdmin || isTurmaAssignedToInstrutor(turma)) && (
                                  <Link to={`/presencas?turma=${turma.id}`}>
                                    <span className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 text-[10px]">
                                      <ClipboardCheck className="w-3 h-3" /> Fazer Chamada
                                    </span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ABA 2: HISTÓRICO DE AULAS REGISTRADAS */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Mini KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total de Aulas" value={total} icon={BookOpen} variant="primary" />
            <StatCard title="Aulas Agendadas" value={agendadas} icon={Clock} variant="info" trend="Previstas" />
            <StatCard title="Aulas Realizadas" value={realizadas} icon={CheckCircle} variant="success" trend="Ministradas" trendType="positive" />
            <StatCard title="Aulas Canceladas" value={canceladas} icon={AlertCircle} variant="warning" trend="Reposição" trendType={canceladas > 0 ? "negative" : "neutral"} />
          </div>

          {/* Tabela de Aulas */}
          <DataTable
            data={filteredAulas}
            searchKeys={["data_aula", "id_turma", "status_aula"]}
            searchPlaceholder="Buscar por data ou turma..."
            filters={filters}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
            exportFilename="aulas_movimais"
            customActions={aula => {
              const turma = turmas.find(t => t.id === aula.id_turma);
              const isMine = !isInstrutor || isAdmin || isAulaAssignedToInstrutor(aula, turma);
              return (
                <div className="flex items-center gap-1.5">
                  {isMine && (
                    <Link to={`/presencas?turma=${aula.id_turma}&data=${aula.data_aula}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30 rounded-lg gap-1"
                        title="Ver ou fazer chamada desta aula"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Chamada</span>
                      </Button>
                    </Link>
                  )}
                  {aula.status_aula === "AGENDADA" && isMine && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border-sky-500/30 rounded-lg gap-1"
                      onClick={() => handleConcluirAula(aula)}
                      title="Marcar aula como realizada"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Concluir</span>
                    </Button>
                  )}
                </div>
              );
            }}
            columns={[
              {
                key: "data_aula",
                label: "Data da Aula",
                render: a => (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{formatDateToBR(a.data_aula)}</span>
                  </div>
                ),
              },
              {
                key: "id_turma",
                label: "Turma",
                render: a => {
                  const turma = turmas.find(t => t.id === a.id_turma);
                  return <span className="font-medium text-foreground">{turma?.nome_turma || a.id_turma}</span>;
                },
              },
              {
                key: "horario_inicio",
                label: "Horário",
                render: a => (
                  <span className="text-xs font-mono text-muted-foreground">
                    {a.horario_inicio ? `${a.horario_inicio.slice(0, 5)} às ${a.horario_fim ? a.horario_fim.slice(0, 5) : '?'}` : "—"}
                  </span>
                ),
              },
              {
                key: "id_instrutor",
                label: "Instrutor Responsável",
                render: a => {
                  const inst = instrutores.find(i => i.id === a.id_instrutor);
                  return (
                    <span className="text-xs text-muted-foreground">
                      {inst?.nome_completo || "Não atribuído"}
                    </span>
                  );
                },
              },
              {
                key: "status_aula",
                label: "Status",
                render: a => <StatusBadge status={a.status_aula} />,
              },
            ]}
          />
        </div>
      )}

      {/* Modal de Criação / Edição de Aula */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center justify-between">
              <span>{editingItem ? "Editar Aula" : "Agendar Aula Extra / Reposição"}</span>
              {form.data_aula && (
                <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                  {formatDateToBR(form.data_aula)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Turma *</Label>
              <Select value={form.id_turma} onValueChange={v => set("id_turma", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione a turma..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome_turma}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Data da Aula *</Label>
                {form.data_aula && (
                  <span className="text-[10px] text-muted-foreground font-mono">{formatDateToBR(form.data_aula)}</span>
                )}
              </div>
              <Input type="date" value={form.data_aula} onChange={e => set("data_aula", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Instrutor</Label>
              <Select value={form.id_instrutor || ""} onValueChange={v => set("id_instrutor", v || null)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {instrutores.filter(i => i.ativo).map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Horário de Início</Label>
              <Input type="time" value={form.horario_inicio} onChange={e => set("horario_inicio", e.target.value)} className="bg-background/60 border-white/10 rounded-xl font-mono text-xs" />
            </div>

            <div>
              <Label className="text-xs">Horário de Término</Label>
              <Input type="time" value={form.horario_fim} onChange={e => set("horario_fim", e.target.value)} className="bg-background/60 border-white/10 rounded-xl font-mono text-xs" />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">Status da Aula</Label>
              <Select value={form.status_aula} onValueChange={v => set("status_aula", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {["AGENDADA","REALIZADA","CANCELADA","REPOSICAO"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">Observações do Treino</Label>
              <Input value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Conteúdo planejado, materiais necessários..." className="bg-background/60 border-white/10 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Salvar Aula"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

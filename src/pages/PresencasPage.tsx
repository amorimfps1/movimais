import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, XCircle, ClipboardCheck, Loader2, Users, Search,
  Sparkles, Calendar, Clock, MapPin, Dumbbell, UserCog, Check, Filter, ChevronRight, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateId, STORES, type Turma, type Aluno, type Matricula, type Presenca, type Instrutor, type Modalidade, type Aula } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDateToBR } from "@/lib/utils";

const DIAS_SEMANA_MAP = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface PresencaRow {
  aluno: Aluno;
  matricula: Matricula;
  presenca: boolean;
  existingId: string | null;
}

export default function PresencasPage() {
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isInstrutor, instrutorId: authInstrutorId, especialidades: authEspecialidades } = useAuth();

  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: instrutores } = useTable<Instrutor>(STORES.INSTRUTORES);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);
  const { data: aulas, reload: reloadAulas } = useTable<Aula>(STORES.AULAS);

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

  // Função utilitária para verificar se a turma está atribuída ao instrutor por ID direto
  const isTurmaAssignedToInstrutor = useMemo(() => {
    return (turma: Turma | undefined) => {
      if (!turma || !turma.id_instrutor) return false;
      if (currentInstrutor && (turma.id_instrutor === currentInstrutor.id || turma.id_instrutor === currentInstrutor.user_id)) {
        return true;
      }
      if (authInstrutorId && turma.id_instrutor === authInstrutorId) {
        return true;
      }
      if (user?.id && turma.id_instrutor === user.id) {
        return true;
      }

      const targetInst = instrutores.find(i => i.id === turma.id_instrutor || i.user_id === turma.id_instrutor);
      if (targetInst) {
        if (user?.id && targetInst.user_id === user.id) return true;
        if (user?.email && targetInst.email?.toLowerCase() === user.email.toLowerCase()) return true;
        if (authInstrutorId && targetInst.id === authInstrutorId) return true;
      }

      return false;
    };
  }, [currentInstrutor, authInstrutorId, user, instrutores]);

  // Verifica se a turma corresponde à especialidade/modalidade do instrutor ou à sua atribuição
  const isTurmaInInstructorSpecialties = useMemo(() => {
    return (turma: Turma | undefined) => {
      if (!turma) return false;

      // Atribuição direta
      if (isTurmaAssignedToInstrutor(turma)) return true;

      // Busca por modalidade / especialidade lecionada
      const modOfTurma = modalidades.find(m => m.id === turma.id_modalidade);
      const modName = modOfTurma?.nome_modalidade;

      if (currentInstrutor?.id_modalidades?.length && turma.id_modalidade) {
        if (currentInstrutor.id_modalidades.includes(turma.id_modalidade)) return true;
      }
      if (currentInstrutor?.especialidades?.length && modName) {
        if (currentInstrutor.especialidades.includes(modName)) return true;
      }
      if (authEspecialidades?.length && modName) {
        if (authEspecialidades.includes(modName)) return true;
      }

      return false;
    };
  }, [isTurmaAssignedToInstrutor, modalidades, currentInstrutor, authEspecialidades]);

  // Filtros de visualização
  const [filterInstrutor, setFilterInstrutor] = useState<string>("ALL");
  const [filterModalidade, setFilterModalidade] = useState<string>("ALL");

  // Estado da chamada
  const [idTurma, setIdTurma] = useState(() => searchParams.get("turma") || "");
  const [dataAula, setDataAula] = useState(() => searchParams.get("data") || new Date().toISOString().split("T")[0]);
  const [searchAluno, setSearchAluno] = useState("");
  const [rows, setRows] = useState<PresencaRow[]>([]);
  const [loadingChamada, setLoadingChamada] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chamadaAberta, setChamadaAberta] = useState(false);
  const { toast } = useToast();

  // Dia da semana calculado da data selecionada
  const diaSemanaSelecionado = useMemo(() => {
    if (!dataAula) return "";
    const [ano, mes, dia] = dataAula.split("-").map(Number);
    const dateObj = new Date(ano, mes - 1, dia);
    return DIAS_SEMANA_MAP[dateObj.getDay()];
  }, [dataAula]);

  const diaSemanaHoje = useMemo(() => {
    return DIAS_SEMANA_MAP[new Date().getDay()];
  }, []);

  // Define filtro padrão do instrutor logado
  useEffect(() => {
    if (currentInstrutor) {
      setFilterInstrutor(currentInstrutor.id);
    }
  }, [currentInstrutor]);

  // Se veio parâmetro de turma na URL, abre automaticamente
  useEffect(() => {
    const turmaParam = searchParams.get("turma");
    if (turmaParam && turmas.length > 0 && matriculas.length > 0) {
      setIdTurma(turmaParam);
      abrirChamadaTurma(turmaParam, dataAula);
    }
  }, [searchParams, turmas.length, matriculas.length]);

  const setHoje = () => setDataAula(new Date().toISOString().split("T")[0]);
  const setOntem = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDataAula(d.toISOString().split("T")[0]);
  };

  // Turmas filtradas para a Grade do Dia
  const turmasDoDia = useMemo(() => {
    return turmas.filter(t => {
      // Verifica se a turma acontece no dia da semana selecionado
      const temDia = (t.dias_semana || []).includes(diaSemanaSelecionado);
      
      // Filtro por Instrutor
      let matchInstrutor = true;
      if (isInstrutor && !isAdmin) {
        matchInstrutor = isTurmaAssignedToInstrutor(t);
      } else if (filterInstrutor !== "ALL") {
        const targetInst = instrutores.find(i => i.id === filterInstrutor);
        matchInstrutor = t.id_instrutor === filterInstrutor || (targetInst?.user_id && t.id_instrutor === targetInst.user_id);
      }

      // Filtro por Modalidade
      let matchModalidade = true;
      if (filterModalidade !== "ALL") {
        matchModalidade = t.id_modalidade === filterModalidade;
      }

      return temDia && matchInstrutor && matchModalidade;
    });
  }, [turmas, diaSemanaSelecionado, isInstrutor, isAdmin, isTurmaAssignedToInstrutor, filterInstrutor, filterModalidade, instrutores]);

  // Lista de todas as turmas filtradas (geral)
  const turmasDisponiveis = useMemo(() => {
    if (isInstrutor && !isAdmin) {
      return turmas.filter(t => isTurmaAssignedToInstrutor(t));
    }
    if (filterInstrutor !== "ALL") {
      const targetInst = instrutores.find(i => i.id === filterInstrutor);
      return turmas.filter(t => t.id_instrutor === filterInstrutor || (targetInst?.user_id && t.id_instrutor === targetInst.user_id));
    }
    return turmas;
  }, [turmas, isInstrutor, isAdmin, isTurmaAssignedToInstrutor, filterInstrutor, instrutores]);

  // Abrir lista de chamada
  const abrirChamadaTurma = async (targetTurmaId: string, targetData: string) => {
    if (!targetTurmaId || !targetData) {
      toast({ title: "Selecione a turma e a data da aula", variant: "destructive" });
      return;
    }

    // Trava de Segurança: Instrutores só podem abrir chamadas de turmas atribuídas a eles
    const targetTurma = turmas.find(t => t.id === targetTurmaId);
    if (isInstrutor && !isAdmin) {
      const isMine = isTurmaAssignedToInstrutor(targetTurma);
      if (!isMine) {
        toast({
          title: "Acesso Negado",
          description: "Você só tem permissão para fazer a chamada de turmas/aulas atribuídas a você.",
          variant: "destructive",
        });
        setChamadaAberta(false);
        setRows([]);
        return;
      }
    }

    setIdTurma(targetTurmaId);
    setDataAula(targetData);
    setLoadingChamada(true);

    try {
      // Alunos com matrícula ativa e liberada nesta turma (ou experimental)
      const matriculasTurma = matriculas.filter(m => {
        if (m.id_turma !== targetTurmaId) return false;
        if (m.status_matricula === "ATIVA" && m.liberado_para_aula) return true;
        if (m.status_matricula === "EXPERIMENTAL" && targetTurma?.permite_experimental) return true;
        return false;
      });

      // Busca presenças já existentes para turma + data
      const { data: existentes } = await supabase
        .from("presencas" as any)
        .select("*")
        .eq("id_turma", targetTurmaId)
        .eq("data_aula", targetData);

      const presencasExistentes = (existentes || []) as Presenca[];

      const chamada: PresencaRow[] = matriculasTurma.map(m => {
        const aluno = alunos.find(a => a.id === m.id_aluno);
        const existente = presencasExistentes.find(p => p.id_matricula === m.id);
        return {
          aluno: aluno!,
          matricula: m,
          presenca: existente ? !!existente.presenca : true, // Padrão: presente
          existingId: existente?.id || null,
        };
      }).filter(r => r.aluno);

      setRows(chamada);
      setChamadaAberta(true);
    } catch (e: any) {
      toast({ title: "Erro ao abrir chamada", description: e.message, variant: "destructive" });
    } finally {
      setLoadingChamada(false);
    }
  };

  const togglePresenca = (matriculaId: string) => {
    setRows(prev => prev.map(r => r.matricula.id === matriculaId ? { ...r, presenca: !r.presenca } : r));
  };

  const marcarTodos = (presenca: boolean) => {
    setRows(prev => prev.map(r => ({ ...r, presenca })));
  };

  const inverterSelecao = () => {
    setRows(prev => prev.map(r => ({ ...r, presenca: !r.presenca })));
  };

  const salvarChamada = async () => {
    if (!idTurma || !dataAula) return;

    // Trava de Segurança: Instrutores só podem salvar chamadas de turmas atribuídas a eles
    const selectedTurma = turmas.find(t => t.id === idTurma);
    if (isInstrutor && !isAdmin) {
      const isMine = isTurmaAssignedToInstrutor(selectedTurma);
      if (!isMine) {
        toast({
          title: "Acesso Negado",
          description: "Você não possui permissão para salvar a chamada desta turma.",
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);

    try {
      // 1. Salvar registros de presenças individuais
      for (const row of rows) {
        if (row.existingId) {
          await supabase.from("presencas" as any).update({ presenca: row.presenca }).eq("id", row.existingId);
        } else {
          const payload: Presenca = {
            id: generateId(),
            data_aula: dataAula,
            id_turma: idTurma,
            id_matricula: row.matricula.id,
            id_aluno: row.aluno.id,
            presenca: row.presenca,
            tipo_registro: "MANUAL",
          };
          await supabase.from("presencas" as any).insert(payload);
        }
      }

      // 2. Garantir registro de aula realizada na tabela aulas
      const { data: aulaExistente } = await supabase
        .from("aulas" as any)
        .select("id")
        .eq("id_turma", idTurma)
        .eq("data_aula", dataAula)
        .maybeSingle();

      if (aulaExistente) {
        await supabase
          .from("aulas" as any)
          .update({
            status_aula: "REALIZADA",
            id_instrutor: selectedTurma?.id_instrutor || currentInstrutor?.id || null,
          })
          .eq("id", aulaExistente.id);
      } else {
        await supabase.from("aulas" as any).insert({
          id: generateId(),
          id_turma: idTurma,
          id_instrutor: selectedTurma?.id_instrutor || currentInstrutor?.id || null,
          data_aula: dataAula,
          horario_inicio: selectedTurma?.horario_inicio || "08:00:00",
          horario_fim: selectedTurma?.horario_fim || "09:00:00",
          status_aula: "REALIZADA",
          observacoes: `Chamada realizada em ${formatDateToBR(dataAula)} (${rows.filter(r => r.presenca).length}/${rows.length} presentes)`,
        });
      }

      await reloadAulas();
      toast({ title: "✅ Chamada salva e aula registrada com sucesso!" });
      await abrirChamadaTurma(idTurma, dataAula);
    } catch (e: any) {
      toast({ title: "Erro ao salvar chamada", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const presentes = rows.filter(r => r.presenca).length;
  const ausentes = rows.length - presentes;
  const pctPresenca = rows.length > 0 ? Math.round((presentes / rows.length) * 100) : 0;

  const filteredRows = useMemo(() => {
    if (!searchAluno) return rows;
    const s = searchAluno.toLowerCase();
    return rows.filter(r => r.aluno.nome_completo.toLowerCase().includes(s));
  }, [rows, searchAluno]);

  const turmaSelecionada = turmas.find(t => t.id === idTurma);
  const modSelecionada = modalidades.find(m => m.id === turmaSelecionada?.id_modalidade);
  const instSelecionado = instrutores.find(i => i.id === turmaSelecionada?.id_instrutor);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Top Header */}
      <PageHeader
        title="Diário de Chamada & Presenças"
        description="Chamada no dia da aula, controle de frequência e separação por instrutor do MCJB"
        badge="Diário de Classe"
      />

      {/* BANNER DO INSTRUTOR LOGADO */}
      {currentInstrutor && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-card/80 to-card/60 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground text-sm">
                  Olá, Prof. {currentInstrutor.nome_completo}!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instrutor Titular
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span>Suas especialidades:</span>
                {(currentInstrutor.especialidades || []).map((sp, idx) => (
                  <span key={idx} className="font-semibold text-emerald-400">
                    {sp}{idx < (currentInstrutor.especialidades?.length || 0) - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground sm:text-right">
            <span>Hoje é <strong>{diaSemanaHoje}</strong></span>
          </div>
        </div>
      )}

      {/* BARRA DE SELEÇÃO DE DATA E FILTROS DE INSTRUTOR/MODALIDADE */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          {/* Seletor de Data */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data da Aula *
              </Label>
              <div className="flex items-center gap-1 text-[11px]">
                <button onClick={setHoje} className="text-primary hover:underline font-medium">Hoje</button>
                <span className="text-muted-foreground">&bull;</span>
                <button onClick={setOntem} className="text-muted-foreground hover:text-foreground">Ontem</button>
              </div>
            </div>
            <Input
              type="date"
              value={dataAula}
              onChange={e => setDataAula(e.target.value)}
              className="bg-background/60 border-white/10 rounded-xl h-10 text-xs sm:text-sm font-mono"
            />
          </div>

          {/* Dia da Semana Identificado */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Dia da Grade
            </Label>
            <div className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2 text-xs font-semibold text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{diaSemanaSelecionado} ({formatDateToBR(dataAula)})</span>
            </div>
          </div>

          {/* Filtro por Instrutor (Para coordenação/secretaria) */}
          {!currentInstrutor && (
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Filtrar por Instrutor
              </Label>
              <Select value={filterInstrutor} onValueChange={setFilterInstrutor}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Todos os Instrutores" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10 max-h-56">
                  <SelectItem value="ALL" className="text-xs font-semibold">Todos os Instrutores</SelectItem>
                  {instrutores.filter(i => i.ativo).map(i => {
                    const specs = (i.especialidades || []).join(", ");
                    return (
                      <SelectItem key={i.id} value={i.id} className="text-xs">
                        {i.nome_completo} {specs ? `(${specs})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro por Modalidade */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Filtrar por Modalidade
            </Label>
            <Select value={filterModalidade} onValueChange={setFilterModalidade}>
              <SelectTrigger className="bg-background/60 border-white/10 rounded-xl h-10 text-xs">
                <SelectValue placeholder="Todas as Modalidades" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 border-white/10 max-h-56">
                <SelectItem value="ALL" className="text-xs font-semibold">Todas as Modalidades</SelectItem>
                {instructorModalidades.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.nome_modalidade} ({m.area || "Geral"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: GRADE DE TURMAS DO DIA (ACESSO RÁPIDO À CHAMADA) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Grade de Aulas de {diaSemanaSelecionado} ({formatDateToBR(dataAula)})
            </h3>
            <p className="text-xs text-muted-foreground">
              Turmas com aula programada para este dia da semana na grade horária fixa
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            {turmasDoDia.length} {turmasDoDia.length === 1 ? "turma programada" : "turmas programadas"}
          </span>
        </div>

        {turmasDoDia.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card/40 p-8 text-center text-muted-foreground text-xs space-y-2">
            <Calendar className="w-8 h-8 opacity-30 mx-auto" />
            <p className="font-semibold text-foreground/80">Nenhuma turma programada para {diaSemanaSelecionado}</p>
            <p className="max-w-md mx-auto">
              Verifique os filtros selecionados ou use o seletor manual abaixo para abrir a chamada de qualquer turma.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmasDoDia.map(turma => {
              const mod = modalidades.find(m => m.id === turma.id_modalidade);
              const inst = instrutores.find(i => i.id === turma.id_instrutor);
              const matriculados = matriculas.filter(m => m.id_turma === turma.id && ((m.status_matricula === "ATIVA" && m.liberado_para_aula) || (m.status_matricula === "EXPERIMENTAL" && turma.permite_experimental))).length;
              const isSelected = idTurma === turma.id && chamadaAberta;
              const horarioTexto = turma.horario_inicio
                ? `${turma.horario_inicio.slice(0, 5)} às ${turma.horario_fim?.slice(0, 5) || '?'}`
                : "Horário livre";

              // Verifica se a aula de hoje já foi realizada
              const aulaHoje = aulas.find(a => a.id_turma === turma.id && a.data_aula === dataAula);
              const realizadaHoje = aulaHoje?.status_aula === "REALIZADA";

              return (
                <div
                  key={turma.id}
                  className={`
                    p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 shadow-lg
                    ${isSelected
                      ? "border-primary bg-primary/10 shadow-primary/10"
                      : "border-white/10 bg-card/60 hover:border-white/20"
                    }
                  `}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                          {mod?.nome_modalidade || "Modalidade"}
                        </span>
                        <h4 className="text-base font-bold text-foreground mt-0.5">{turma.nome_turma}</h4>
                        <p className="text-xs text-muted-foreground">Faixa: {turma.faixa_etaria || "Livre"}</p>
                      </div>

                      {realizadaHoje ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Realizada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                          Pendente
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                          <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                          {horarioTexto}
                        </span>
                        {turma.sala && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            {turma.sala}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1 truncate">
                          <UserCog className="w-3 h-3 text-emerald-400 shrink-0" />
                          {inst?.nome_completo || "Sem instrutor"}
                        </span>
                        <span className="text-foreground font-semibold">
                          {matriculados} alunos
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => abrirChamadaTurma(turma.id, dataAula)}
                    disabled={loadingChamada && idTurma === turma.id}
                    className={`
                      w-full rounded-xl text-xs gap-1.5 h-9 font-medium shadow-md
                      ${isSelected ? "bg-primary text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}
                    `}
                  >
                    {loadingChamada && idTurma === turma.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ClipboardCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{isSelected ? "Chamada em Aberto" : "Fazer Chamada Desta Turma"}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: SELETOR MANUAL CASO PRECISE ABRIR OUTRA TURMA OU REPOSIÇÃO */}
      <div className="p-4 rounded-2xl border border-white/5 bg-card/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground block">Abrir chamada de outra turma ou reposição:</span>
          <span>Selecione manualmente caso a aula não esteja na grade do dia de hoje.</span>
        </div>
        <div className="flex items-center gap-2 min-w-[260px]">
          <Select value={idTurma} onValueChange={(val) => abrirChamadaTurma(val, dataAula)}>
            <SelectTrigger className="bg-background/60 border-white/10 rounded-xl h-9 text-xs">
              <SelectValue placeholder="Escolha outra turma..." />
            </SelectTrigger>
            <SelectContent className="bg-card/95 border-white/10 max-h-56">
              {turmasDisponiveis.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.nome_turma} ({t.dias_semana?.join(", ") || "Sem grade"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SEÇÃO 3: DIÁRIO DE CHAMADA ABERTO */}
      {chamadaAberta && (
        <div className="space-y-5 animate-in fade-in duration-300 pt-2">
          
          {/* Faixa de Métricas da Chamada & Ações em Lote */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground">{turmaSelecionada?.nome_turma}</h3>
                <span className="text-xs text-muted-foreground">&bull; {modSelecionada?.nome_modalidade}</span>
                <span className="text-xs text-muted-foreground">&bull; Aula de {formatDateToBR(dataAula)} ({diaSemanaSelecionado})</span>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
                <span>Instrutor: <strong>{instSelecionado?.nome_completo || "Não atribuído"}</strong></span>
                {turmaSelecionada?.horario_inicio && (
                  <span>&bull; Horário: {turmaSelecionada.horario_inicio.slice(0, 5)} às {turmaSelecionada.horario_fim?.slice(0, 5)}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {presentes} Presentes
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5" />
                  {ausentes} Ausentes
                </span>
                <span className="text-xs font-medium text-muted-foreground ml-2">
                  Taxa de Frequência: <strong className="text-foreground">{pctPresenca}%</strong>
                </span>
              </div>
            </div>

            {/* Ações em Lote & Salvar Chamada */}
            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={() => marcarTodos(true)} className="rounded-xl border-white/10 text-xs hover:bg-emerald-500/10 hover:text-emerald-300">
                Todos Presentes
              </Button>
              <Button size="sm" variant="outline" onClick={() => marcarTodos(false)} className="rounded-xl border-white/10 text-xs hover:bg-rose-500/10 hover:text-rose-300">
                Todos Ausentes
              </Button>
              <Button size="sm" variant="outline" onClick={inverterSelecao} className="rounded-xl border-white/10 text-xs">
                Inverter
              </Button>
              <Button
                size="sm"
                onClick={salvarChamada}
                disabled={saving || rows.length === 0}
                className="rounded-xl shadow-md shadow-primary/20 text-xs gap-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Salvar Chamada & Concluir Aula</span>
              </Button>
            </div>
          </div>

          {/* Busca Rápida de Aluno */}
          {rows.length > 6 && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Filtrar aluno na lista..."
                value={searchAluno}
                onChange={e => setSearchAluno(e.target.value)}
                className="pl-9 pr-8 bg-background/60 border-white/10 rounded-xl text-xs h-9"
              />
              {searchAluno && (
                <button
                  onClick={() => setSearchAluno("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Grid de Alunos para Marcação Tátil */}
          {filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card/40 p-12 text-center text-muted-foreground text-xs space-y-2">
              <Users className="w-8 h-8 opacity-30 mx-auto" />
              <p className="text-sm font-semibold text-foreground/80">Nenhum aluno encontrado</p>
              <p>Não há matrículas ativas vinculadas a esta turma.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredRows.map((row) => {
                const initial = row.aluno.nome_completo ? row.aluno.nome_completo.charAt(0).toUpperCase() : "A";
                return (
                  <button
                    key={row.matricula.id}
                    onClick={() => togglePresenca(row.matricula.id)}
                    className={`
                      p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-sm select-none
                      ${row.presenca
                        ? "bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20 shadow-emerald-500/5"
                        : "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 shadow-rose-500/5"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                          row.presenca
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{row.aluno.nome_completo}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">Matrícula #{row.matricula.id}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {row.presenca ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

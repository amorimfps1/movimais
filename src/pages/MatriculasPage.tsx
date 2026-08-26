import { useState, useMemo, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { FilterConfig } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, GraduationCap, DollarSign, AlertCircle, CheckCircle, Calendar, ShieldAlert, Eye } from "lucide-react";
import { create, update, remove, generateId, STORES, type Matricula, type Aluno, type Modalidade, type Turma } from "@/lib/store";
import { formatDateToBR } from "@/lib/utils";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";
import { calcularDataFimPrevista, obterDescricaoPlano, isMatriculaTrancada, isMatriculaInadimplente } from "@/lib/matriculaUtils";

const emptyMatricula = (): Matricula => {
  const dataInicio = new Date().toISOString().split("T")[0];
  const tipoPlano = "TRIMESTRAL";
  return {
    id: generateId(),
    id_aluno: "",
    id_modalidade: "",
    id_turma: "",
    tipo_matricula: "NORMAL",
    tipo_plano: tipoPlano,
    data_inicio: dataInicio,
    data_fim_prevista: calcularDataFimPrevista(dataInicio, tipoPlano, "PENDENTE_LIBERACAO"),
    status_matricula: "PENDENTE_LIBERACAO",
    valor_final: 0,
    forma_pagamento: "PIX",
    liberado_para_aula: false,
    data_criacao: dataInicio,
    observacoes: "",
  };
};

export default function MatriculasPage() {
  const { data: matriculas, reload } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  
  const [open, setOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Matricula | null>(null);
  const [editingItem, setEditingItem] = useState<Matricula | null>(null);
  const [form, setForm] = useState<Matricula>(emptyMatricula());
  const { toast } = useToast();

  // Maps de busca O(1) para otimizar renderização da tabela
  const alunosMap = useMemo(() => new Map(alunos.map(a => [a.id, a])), [alunos]);
  const modalidadesMap = useMemo(() => new Map(modalidades.map(m => [m.id, m])), [modalidades]);
  const turmasMap = useMemo(() => new Map(turmas.map(t => [t.id, t])), [turmas]);

  // KPIs Otimizadas com useMemo
  const { totalMatriculas, ativas, pendentesLiberacao, receitaEstimadaMensal, liberadosCount } = useMemo(() => {
    const total = matriculas.length;
    const ativ = matriculas.filter(m => m.status_matricula === "ATIVA").length;
    const pend = matriculas.filter(m => m.status_matricula === "PENDENTE_LIBERACAO").length;
    const rec = matriculas
      .filter(m => m.status_matricula === "ATIVA")
      .reduce((sum, m) => sum + (Number(m.valor_final) || 0), 0);
    const lib = matriculas.filter(m => m.liberado_para_aula).length;
    return {
      totalMatriculas: total,
      ativas: ativ,
      pendentesLiberacao: pend,
      receitaEstimadaMensal: rec,
      liberadosCount: lib,
    };
  }, [matriculas]);

  // Otimização de Seletores
  const alunoSelectOptions = useMemo(() => (
    alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)
  ), [alunos]);

  const modalidadeSelectOptions = useMemo(() => (
    modalidades.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_modalidade}</SelectItem>)
  ), [modalidades]);

  const turmaSelectOptions = useMemo(() => (
    turmas
      .filter(t => !form.id_modalidade || t.id_modalidade === form.id_modalidade)
      .map(t => <SelectItem key={t.id} value={t.id}>{t.nome_turma}</SelectItem>)
  ), [turmas, form.id_modalidade]);

  const handleNew = useCallback(() => {
    setEditingItem(null);
    setForm(emptyMatricula());
    setOpen(true);
  }, []);

  const handleEdit = useCallback((item: Matricula) => {
    setEditingItem(item);
    const tipoPlano = item.tipo_plano || "TRIMESTRAL";
    const dataFimCalculada = calcularDataFimPrevista(item.data_inicio, tipoPlano, item.status_matricula);
    setForm({
      ...item,
      tipo_plano: tipoPlano,
      data_fim_prevista: item.data_fim_prevista || dataFimCalculada,
    });
    setOpen(true);
  }, []);

  const handleDelete = useCallback(async (item: Matricula) => {
    try {
      await remove(STORES.MATRICULAS, item.id);
      await reload();
      toast({ title: "Matrícula removida." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  }, [reload, toast]);

  const handleToggleLiberacao = useCallback(async (item: Matricula) => {
    try {
      const updated = {
        ...item,
        liberado_para_aula: !item.liberado_para_aula,
        status_matricula: !item.liberado_para_aula ? "ATIVA" : item.status_matricula,
      };
      await update(STORES.MATRICULAS, updated);
      await reload();
      toast({
        title: updated.liberado_para_aula ? "Aluno liberado para as aulas!" : "Liberação revogada.",
      });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    }
  }, [reload, toast]);

  const handleSave = useCallback(async () => {
    if (!form.id_aluno) {
      toast({ title: "Selecione o aluno", variant: "destructive" });
      return;
    }
    try {
      const tipoPlano = form.tipo_plano || "TRIMESTRAL";
      const dataFim = form.data_fim_prevista || calcularDataFimPrevista(form.data_inicio, tipoPlano, form.status_matricula);

      const payload = {
        ...form,
        tipo_plano: tipoPlano,
        data_fim_prevista: dataFim,
        id_modalidade: form.id_modalidade || null as any,
        id_turma: form.id_turma || null as any,
      };
      if (editingItem) {
        await update(STORES.MATRICULAS, payload);
        toast({ title: "Matrícula atualizada com sucesso!" });
      } else {
        await create(STORES.MATRICULAS, payload);
        toast({ title: "Matrícula criada com sucesso!" });
      }
      await reload();
      setOpen(false);
      setForm(emptyMatricula());
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  }, [editingItem, form, reload, toast]);

  const set = useCallback((k: keyof Matricula, v: any) => {
    setForm(prev => {
      const updated = { ...prev, [k]: v };
      if (k === "data_inicio" || k === "tipo_plano" || k === "status_matricula") {
        updated.data_fim_prevista = calcularDataFimPrevista(
          updated.data_inicio,
          updated.tipo_plano || "TRIMESTRAL",
          updated.status_matricula
        );
      }
      return updated;
    });
  }, []);

  const handleModalidadeChange = useCallback((modId: string) => {
    const mod = modalidadesMap.get(modId);
    setForm(prev => ({
      ...prev,
      id_modalidade: modId,
      valor_final: prev.valor_final === 0 && mod ? mod.valor_padrao : prev.valor_final,
    }));
  }, [modalidadesMap]);

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status_matricula",
      label: "Status",
      options: [
        { label: "Ativa", value: "ATIVA" },
        { label: "Pendente Liberação", value: "PENDENTE_LIBERACAO" },
        { label: "Suspensa (30d)", value: "SUSPENSA_30_DIAS" },
        { label: "Trancada Justificada", value: "TRANCADA_JUSTIFICADA" },
        { label: "Inadimplente", value: "BLOQUEADA_INADIMPLENCIA" },
        { label: "Cancelada", value: "CANCELADA" },
      ],
    },
    {
      key: "tipo_plano",
      label: "Plano",
      options: [
        { label: "Mensal", value: "MENSAL" },
        { label: "Trimestral", value: "TRIMESTRAL" },
        { label: "Anual", value: "ANUAL" },
      ],
    },
    {
      key: "tipo_matricula",
      label: "Categoria",
      options: [
        { label: "Normal", value: "NORMAL" },
        { label: "Bolsa", value: "BOLSA" },
        { label: "Desconto Especial", value: "DESCONTO_ESPECIAL" },
        { label: "Associado MCJB", value: "ASSOCIADO_MCJB" },
        { label: "Cortesia", value: "CORTESIA" },
      ],
    },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <PageHeader
        title="Matrículas"
        description="Gestão de inscrições ativas, planos (Mensal, Trimestral, Anual), valores e controle de liberação de aulas"
        badge={`${totalMatriculas} Matrículas`}
        action={
          <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
            <Plus className="w-4 h-4" />
            <span>Nova Matrícula</span>
          </Button>
        }
      />

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Matrículas Ativas"
          value={ativas}
          icon={GraduationCap}
          variant="success"
          trend={`${totalMatriculas} no histórico`}
          trendType="positive"
        />
        <StatCard
          title="Receita Mensal Estimada"
          value={`R$ ${receitaEstimadaMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="primary"
          trend="Baseada nas matrículas ativas"
        />
        <StatCard
          title="Pendentes de Liberação"
          value={pendentesLiberacao}
          icon={AlertCircle}
          variant="warning"
          trend="Aguardando liberação da secretaria"
          trendType="neutral"
        />
        <StatCard
          title="Liberados p/ Aula"
          value={matriculas.filter(m => m.liberado_para_aula).length}
          icon={CheckCircle}
          variant="info"
          trend="Com acesso confirmado"
        />
      </div>

      {/* Tabela de Matrículas */}
      <DataTable
        data={matriculas}
        searchKeys={["id", "id_aluno", "tipo_matricula", "tipo_plano"]}
        searchPlaceholder="Buscar por ID, aluno, plano..."
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={item => setViewItem(item)}
        exportFilename="matriculas_movimais"
        customActions={m => (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg"
              onClick={() => setViewItem(m)}
              title="Visualizar detalhes da matrícula"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 px-2.5 text-xs rounded-lg gap-1.5 ${m.liberado_para_aula ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"}`}
              onClick={() => handleToggleLiberacao(m)}
              title={m.liberado_para_aula ? "Clique para revogar liberação" : "Clique para liberar acesso"}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{m.liberado_para_aula ? "Liberado" : "Bloqueado"}</span>
            </Button>
          </div>
        )}
        columns={[
          {
            key: "id_aluno",
            label: "Aluno Matriculado",
            render: m => {
              const aluno = alunosMap.get(m.id_aluno);
              const initial = aluno?.nome_completo ? aluno.nome_completo.charAt(0).toUpperCase() : "M";
              return (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{aluno?.nome_completo || m.id_aluno}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">Matrícula #{m.id}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "id_modalidade",
            label: "Modalidade / Turma",
            render: m => {
              const mod = modalidadesMap.get(m.id_modalidade);
              const tur = turmasMap.get(m.id_turma);
              return (
                <div>
                  <p className="text-xs font-medium text-foreground">{mod?.nome_modalidade || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{tur?.nome_turma || "Sem turma definida"}</p>
                </div>
              );
            },
          },
          {
            key: "tipo_plano",
            label: "Plano",
            render: m => (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span className="text-xs font-medium text-foreground">
                  {m.tipo_plano ? m.tipo_plano.toUpperCase() : "TRIMESTRAL"}
                </span>
              </div>
            ),
          },
          {
            key: "tipo_matricula",
            label: "Categoria",
            render: m => <span className="text-xs text-muted-foreground capitalize">{m.tipo_matricula?.replace(/_/g, " ").toLowerCase()}</span>,
          },
          {
            key: "valor_final",
            label: "Valor Mensal",
            render: m => <span className="text-xs font-semibold text-foreground">R$ {Number(m.valor_final || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>,
          },
          {
            key: "data_inicio",
            label: "Vigência",
            render: m => {
              const dataFimCalculada = m.data_fim_prevista || calcularDataFimPrevista(m.data_inicio, m.tipo_plano || "TRIMESTRAL", m.status_matricula);
              const estaTrancada = isMatriculaTrancada(m.status_matricula);
              const estaInadimplente = isMatriculaInadimplente(m.status_matricula);
              return (
                <div className="space-y-0.5">
                  <div className="text-[11px] text-muted-foreground">
                    Início: <span className="text-foreground">{formatDateToBR(m.data_inicio)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Fim: <span className="font-medium text-foreground">{formatDateToBR(dataFimCalculada)}</span>
                  </div>
                  {estaTrancada && (
                    <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.2">
                      +30d (Prorrogado)
                    </span>
                  )}
                  {estaInadimplente && (
                    <span className="inline-block text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1.5 py-0.2 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 inline" /> Bloqueado (Inadimplente)
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: "data_criacao",
            label: "Data Criação",
            render: m => <span className="text-xs text-muted-foreground">{formatDateToBR(m.data_criacao)}</span>,
          },
          {
            key: "status_matricula",
            label: "Status",
            render: m => <StatusBadge status={m.status_matricula} />,
          },
        ]}
      />

      {/* Modal de Visualização de Detalhes da Matrícula */}
      <Dialog open={!!viewItem} onOpenChange={open => { if (!open) setViewItem(null); }}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0">
                {alunosMap.get(viewItem?.id_aluno || "")?.nome_completo?.charAt(0).toUpperCase() || "M"}
              </div>
              <div>
                <p className="text-foreground">{alunosMap.get(viewItem?.id_aluno || "")?.nome_completo || viewItem?.id_aluno}</p>
                <p className="text-xs text-muted-foreground font-normal">
                  Criada em {formatDateToBR(viewItem?.data_criacao)}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {viewItem && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div>
                  <span className="text-muted-foreground block">Modalidade:</span>
                  <span className="text-foreground font-medium">{modalidadesMap.get(viewItem.id_modalidade)?.nome_modalidade || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Turma:</span>
                  <span className="text-foreground font-medium">{turmasMap.get(viewItem.id_turma)?.nome_turma || "Não definida"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Tipo de Plano:</span>
                  <span className="text-foreground font-medium uppercase">{viewItem.tipo_plano || "TRIMESTRAL"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Categoria:</span>
                  <span className="text-foreground font-medium capitalize">{viewItem.tipo_matricula?.replace(/_/g, " ").toLowerCase()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Data Início:</span>
                  <span className="text-foreground font-medium">{formatDateToBR(viewItem.data_inicio)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Data Fim Prevista:</span>
                  <span className="text-foreground font-medium">
                    {formatDateToBR(viewItem.data_fim_prevista || calcularDataFimPrevista(viewItem.data_inicio, viewItem.tipo_plano || "TRIMESTRAL", viewItem.status_matricula))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Valor Mensal:</span>
                  <span className="text-foreground font-semibold">R$ {Number(viewItem.valor_final || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Acesso às Aulas:</span>
                  <span className={viewItem.liberado_para_aula ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {viewItem.liberado_para_aula ? "Liberado" : "Bloqueado"}
                  </span>
                </div>
              </div>

              {viewItem.observacoes && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-muted-foreground block mb-1">Observações:</span>
                  <p className="text-foreground">{viewItem.observacoes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewItem(null)} className="rounded-xl border-white/10">
                  Fechar
                </Button>
                <Button size="sm" onClick={() => { const item = viewItem; setViewItem(null); handleEdit(item); }} className="rounded-xl">
                  Editar Matrícula
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Criação / Edição de Matrícula */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Matrícula" : "Cadastrar Nova Matrícula"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="sm:col-span-2">
              <Label className="text-xs font-medium">Aluno *</Label>
              <Select value={form.id_aluno} onValueChange={v => set("id_aluno", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione o aluno..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10 max-h-56">
                  {alunoSelectOptions}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Modalidade</Label>
              <Select value={form.id_modalidade} onValueChange={handleModalidadeChange}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {modalidadeSelectOptions}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Turma</Label>
              <Select value={form.id_turma} onValueChange={v => set("id_turma", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {turmaSelectOptions}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Tipo de Plano *</Label>
              <Select value={form.tipo_plano || "TRIMESTRAL"} onValueChange={v => set("tipo_plano", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  <SelectItem value="MENSAL">Mensal (1 mês)</SelectItem>
                  <SelectItem value="TRIMESTRAL">Trimestral (3 meses)</SelectItem>
                  <SelectItem value="ANUAL">Anual (12 meses)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Categoria da Matrícula</Label>
              <Select value={form.tipo_matricula} onValueChange={v => set("tipo_matricula", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {["NORMAL","BOLSA","DESCONTO_ESPECIAL","ASSOCIADO_MCJB","CORTESIA","EXPERIMENTAL_CONVERTIDA"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Valor Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_final}
                onChange={e => set("valor_final", Number(e.target.value))}
                className="bg-background/60 border-white/10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs font-medium">Data Fim Prevista (Calculada)</Label>
              <Input
                type="date"
                value={form.data_fim_prevista || calcularDataFimPrevista(form.data_inicio, form.tipo_plano || "TRIMESTRAL", form.status_matricula)}
                onChange={e => set("data_fim_prevista", e.target.value)}
                className="bg-background/60 border-white/10 rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {isMatriculaTrancada(form.status_matricula)
                  ? "⚡ Inclui +30 dias de extensão por trancamento por saúde"
                  : `⚡ Calculado automaticamente (${obterDescricaoPlano(form.tipo_plano)})`}
              </p>
            </div>

            <div>
              <Label className="text-xs font-medium">Status da Matrícula</Label>
              <Select value={form.status_matricula} onValueChange={v => set("status_matricula", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {["PENDENTE_LIBERACAO","ATIVA","SUSPENSA_30_DIAS","TRANCADA_JUSTIFICADA","BLOQUEADA_INADIMPLENCIA","EXPERIMENTAL","CANCELADA","CONCLUIDA"].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 mt-1">
              <div>
                <span className="text-xs font-medium text-foreground block">Liberado para Aulas</span>
                <span className="text-[11px] text-muted-foreground">Permite o aluno constar na chamada dos instrutores</span>
              </div>
              <Switch checked={form.liberado_para_aula} onCheckedChange={v => set("liberado_para_aula", v)} />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-medium">Observações</Label>
              <Input value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Condições de bolsa, datas especiais, justificativa de trancamento..." className="bg-background/60 border-white/10 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Efetivar Matrícula"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo } from "react";
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
import { Plus, GraduationCap, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { create, update, remove, generateId, STORES, type Matricula, type Aluno, type Modalidade, type Turma } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

const emptyMatricula = (): Matricula => ({
  id: generateId(), id_aluno: "", id_modalidade: "", id_turma: "",
  tipo_matricula: "NORMAL", data_inicio: new Date().toISOString().split("T")[0],
  data_fim_prevista: "", status_matricula: "PENDENTE_LIBERACAO",
  valor_final: 0, forma_pagamento: "PIX", liberado_para_aula: false,
  data_criacao: new Date().toISOString().split("T")[0], observacoes: "",
});

export default function MatriculasPage() {
  const { data: matriculas, reload } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Matricula | null>(null);
  const [form, setForm] = useState<Matricula>(emptyMatricula());
  const { toast } = useToast();

  // KPIs
  const totalMatriculas = matriculas.length;
  const ativas = matriculas.filter(m => m.status_matricula === "ATIVA").length;
  const pendentesLiberacao = matriculas.filter(m => m.status_matricula === "PENDENTE_LIBERACAO").length;
  const receitaEstimadaMensal = matriculas
    .filter(m => m.status_matricula === "ATIVA")
    .reduce((sum, m) => sum + (Number(m.valor_final) || 0), 0);

  const handleNew = () => {
    setEditingItem(null);
    setForm(emptyMatricula());
    setOpen(true);
  };

  const handleEdit = (item: Matricula) => {
    setEditingItem(item);
    setForm({ ...item });
    setOpen(true);
  };

  const handleDelete = async (item: Matricula) => {
    try {
      await remove(STORES.MATRICULAS, item.id);
      await reload();
      toast({ title: "Matrícula removida." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const handleToggleLiberacao = async (item: Matricula) => {
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
  };

  const handleSave = async () => {
    if (!form.id_aluno) {
      toast({ title: "Selecione o aluno", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        ...form,
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
  };

  const set = (k: keyof Matricula, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // Ao selecionar modalidade, sugerir o valor padrão
  const handleModalidadeChange = (modId: string) => {
    const mod = modalidades.find(m => m.id === modId);
    setForm(prev => ({
      ...prev,
      id_modalidade: modId,
      valor_final: prev.valor_final === 0 && mod ? mod.valor_padrao : prev.valor_final,
    }));
  };

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status_matricula",
      label: "Status",
      options: [
        { label: "Ativa", value: "ATIVA" },
        { label: "Pendente Liberação", value: "PENDENTE_LIBERACAO" },
        { label: "Suspensa (30d)", value: "SUSPENSA_30_DIAS" },
        { label: "Inadimplente", value: "BLOQUEADA_INADIMPLENCIA" },
        { label: "Cancelada", value: "CANCELADA" },
      ],
    },
    {
      key: "tipo_matricula",
      label: "Tipo",
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
        description="Gestão de inscrições ativas, planos, valores e controle de liberação de aulas"
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
        searchKeys={["id", "id_aluno", "tipo_matricula"]}
        searchPlaceholder="Buscar por ID, aluno ou plano..."
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        exportFilename="matriculas_movimais"
        customActions={m => (
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
        )}
        columns={[
          {
            key: "id_aluno",
            label: "Aluno Matriculado",
            render: m => {
              const aluno = alunos.find(a => a.id === m.id_aluno);
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
              const mod = modalidades.find(item => item.id === m.id_modalidade);
              const tur = turmas.find(t => t.id === m.id_turma);
              return (
                <div>
                  <p className="text-xs font-medium text-foreground">{mod?.nome_modalidade || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{tur?.nome_turma || "Sem turma definida"}</p>
                </div>
              );
            },
          },
          {
            key: "tipo_matricula",
            label: "Tipo de Plano",
            render: m => <span className="text-xs text-muted-foreground capitalize">{m.tipo_matricula?.replace(/_/g, " ").toLowerCase()}</span>,
          },
          {
            key: "valor_final",
            label: "Valor Mensal",
            render: m => <span className="text-xs font-semibold text-foreground">R$ {Number(m.valor_final || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>,
          },
          {
            key: "data_inicio",
            label: "Início",
            render: m => <span className="text-xs text-muted-foreground">{m.data_inicio || "—"}</span>,
          },
          {
            key: "status_matricula",
            label: "Status",
            render: m => <StatusBadge status={m.status_matricula} />,
          },
        ]}
      />

      {/* Modal de Criação / Edição de Matrícula */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Matrícula" : "Cadastrar Nova Matrícula"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Aluno *</Label>
              <Select value={form.id_aluno} onValueChange={v => set("id_aluno", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione o aluno..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10 max-h-56">
                  {alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Modalidade</Label>
              <Select value={form.id_modalidade} onValueChange={handleModalidadeChange}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {modalidades.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_modalidade}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Turma</Label>
              <Select value={form.id_turma} onValueChange={v => set("id_turma", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {turmas
                    .filter(t => !form.id_modalidade || t.id_modalidade === form.id_modalidade)
                    .map(t => <SelectItem key={t.id} value={t.id}>{t.nome_turma}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Tipo de Matrícula</Label>
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
              <Label className="text-xs">Valor Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_final}
                onChange={e => set("valor_final", Number(e.target.value))}
                className="bg-background/60 border-white/10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs">Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Status da Matrícula</Label>
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
              <Label className="text-xs">Observações</Label>
              <Input value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Condições de bolsa, datas especiais..." className="bg-background/60 border-white/10 rounded-xl" />
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

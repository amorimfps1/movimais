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
import { Plus, DollarSign, CheckCircle2, AlertTriangle, Clock, Receipt, Check } from "lucide-react";
import { create, update, remove, generateId, STORES, type Pagamento, type Aluno, type Matricula } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

const emptyPagamento = (): Pagamento => ({
  id: generateId(), id_matricula: "", id_aluno: "", tipo_lancamento: "MENSALIDADE",
  mes_referencia: new Date().getMonth() + 1, ano_referencia: new Date().getFullYear(),
  data_vencimento: new Date().toISOString().split("T")[0], valor_previsto: 0, valor_pago: 0, data_pagamento: "",
  status_pagamento: "PENDENTE", forma_pagamento: "PIX",
});

export default function PagamentosPage() {
  const { data: pagamentos, reload } = useTable<Pagamento>(STORES.PAGAMENTOS);
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pagamento | null>(null);
  const [form, setForm] = useState<Pagamento>(emptyPagamento());
  const { toast } = useToast();

  // KPIs Financeiros
  const totalRecebido = pagamentos
    .filter(p => p.status_pagamento === "PAGO")
    .reduce((sum, p) => sum + (Number(p.valor_pago) || Number(p.valor_previsto) || 0), 0);

  const totalPendente = pagamentos
    .filter(p => p.status_pagamento === "PENDENTE" || p.status_pagamento === "PREVISTO")
    .reduce((sum, p) => sum + (Number(p.valor_previsto) || 0), 0);

  const totalAtrasado = pagamentos
    .filter(p => p.status_pagamento === "ATRASADO")
    .reduce((sum, p) => sum + (Number(p.valor_previsto) || 0), 0);

  const taxaAdimplencia = pagamentos.length > 0
    ? Math.round((pagamentos.filter(p => p.status_pagamento === "PAGO").length / pagamentos.length) * 100)
    : 100;

  const handleNew = () => {
    setEditingItem(null);
    setForm(emptyPagamento());
    setOpen(true);
  };

  const handleEdit = (item: Pagamento) => {
    setEditingItem(item);
    setForm({ ...item });
    setOpen(true);
  };

  const handleDelete = async (item: Pagamento) => {
    try {
      await remove(STORES.PAGAMENTOS, item.id);
      await reload();
      toast({ title: "Lançamento financeiro removido." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  // Ação rápida: Dar baixa / Confirmar recebimento
  const handleDarBaixa = async (item: Pagamento) => {
    try {
      const updated: Pagamento = {
        ...item,
        status_pagamento: "PAGO",
        data_pagamento: new Date().toISOString().split("T")[0],
        valor_pago: item.valor_pago || item.valor_previsto || 0,
      };
      await update(STORES.PAGAMENTOS, updated);
      await reload();
      toast({
        title: "✅ Pagamento confirmado com sucesso!",
        description: `Recebimento de R$ ${Number(updated.valor_pago).toFixed(2)} liquidado no sistema.`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao dar baixa", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        id_aluno: form.id_aluno || null as any,
        id_matricula: form.id_matricula || null as any,
        data_vencimento: form.data_vencimento || null as any,
        data_pagamento: form.data_pagamento || null as any,
      };
      if (editingItem) {
        await update(STORES.PAGAMENTOS, payload);
        toast({ title: "Pagamento atualizado!" });
      } else {
        await create(STORES.PAGAMENTOS, payload);
        toast({ title: "Lançamento registrado com sucesso!" });
      }
      await reload();
      setOpen(false);
      setForm(emptyPagamento());
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const set = (k: keyof Pagamento, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status_pagamento",
      label: "Status",
      options: [
        { label: "Pago", value: "PAGO" },
        { label: "Pendente", value: "PENDENTE" },
        { label: "Atrasado", value: "ATRASADO" },
        { label: "Previsto", value: "PREVISTO" },
        { label: "Isento", value: "ISENTO" },
        { label: "Negociado", value: "NEGOCIADO" },
      ],
    },
    {
      key: "tipo_lancamento",
      label: "Tipo",
      options: [
        { label: "Mensalidade", value: "MENSALIDADE" },
        { label: "Taxa Matrícula", value: "TAXA_MATRICULA" },
        { label: "Material", value: "MATERIAL" },
        { label: "Reposição", value: "REPOSICAO" },
        { label: "Ajuste", value: "AJUSTE" },
      ],
    },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top Header */}
      <PageHeader
        title="Financeiro e Pagamentos"
        description="Controle de mensalidades, taxas de matrícula, recebimentos e inadimplência"
        badge={`${pagamentos.length} Lançamentos`}
        action={
          <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </Button>
        }
      />

      {/* Mini KPIs Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Recebido"
          value={`R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="success"
          trend="Confirmado em caixa"
          trendType="positive"
        />
        <StatCard
          title="A Receber (Pendente)"
          value={`R$ ${totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={Clock}
          variant="info"
          trend="Dentro do prazo"
        />
        <StatCard
          title="Vencido / Em Atraso"
          value={`R$ ${totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={AlertTriangle}
          variant="warning"
          trend="Cobrança necessária"
          trendType={totalAtrasado > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Taxa de Adimplência"
          value={`${taxaAdimplencia}%`}
          icon={CheckCircle2}
          variant="primary"
          trend="Índice de quitação"
        />
      </div>

      {/* Tabela de Pagamentos */}
      <DataTable
        data={pagamentos}
        searchKeys={["id", "id_aluno", "tipo_lancamento"]}
        searchPlaceholder="Buscar por aluno, tipo ou código..."
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        exportFilename="financeiro_movimais"
        customActions={pag => (
          pag.status_pagamento !== "PAGO" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30 rounded-lg gap-1.5"
              onClick={() => handleDarBaixa(pag)}
              title="Dar baixa e confirmar recebimento"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Dar Baixa</span>
            </Button>
          ) : null
        )}
        columns={[
          {
            key: "id_aluno",
            label: "Aluno / Pagador",
            render: p => {
              const aluno = alunos.find(a => a.id === p.id_aluno);
              const initial = aluno?.nome_completo ? aluno.nome_completo.charAt(0).toUpperCase() : "P";
              return (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{aluno?.nome_completo || p.id_aluno || "Aluno avulso"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">Ref: {p.mes_referencia}/{p.ano_referencia}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "tipo_lancamento",
            label: "Tipo",
            render: p => <span className="text-xs text-muted-foreground capitalize">{p.tipo_lancamento?.replace(/_/g, " ").toLowerCase()}</span>,
          },
          {
            key: "data_vencimento",
            label: "Vencimento",
            render: p => <span className="text-xs text-muted-foreground">{p.data_vencimento || "—"}</span>,
          },
          {
            key: "valor_previsto",
            label: "Valor Previsto",
            render: p => <span className="text-xs text-muted-foreground">R$ {Number(p.valor_previsto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>,
          },
          {
            key: "valor_pago",
            label: "Valor Pago",
            render: p => (
              <span className="text-xs font-semibold text-foreground">
                {p.valor_pago ? `R$ ${Number(p.valor_pago).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
              </span>
            ),
          },
          {
            key: "status_pagamento",
            label: "Status",
            render: p => <StatusBadge status={p.status_pagamento} />,
          },
        ]}
      />

      {/* Modal de Criação / Edição de Pagamento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Lançamento" : "Novo Lançamento Financeiro"}
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
              <Label className="text-xs">Matrícula (Opcional)</Label>
              <Select value={form.id_matricula} onValueChange={v => set("id_matricula", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {matriculas.map(m => <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Tipo de Lançamento</Label>
              <Select value={form.tipo_lancamento} onValueChange={v => set("tipo_lancamento", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {["MENSALIDADE", "TAXA_MATRICULA", "MATERIAL", "REPOSICAO", "MULTA", "DESCONTO", "AJUSTE"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Data de Vencimento</Label>
              <Input type="date" value={form.data_vencimento} onChange={e => set("data_vencimento", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Data do Pagamento</Label>
              <Input type="date" value={form.data_pagamento} onChange={e => set("data_pagamento", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Valor Previsto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_previsto}
                onChange={e => set("valor_previsto", Number(e.target.value))}
                className="bg-background/60 border-white/10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs">Valor Pago (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_pago}
                onChange={e => set("valor_pago", Number(e.target.value))}
                className="bg-background/60 border-white/10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs">Forma de Pagamento</Label>
              <Select value={form.forma_pagamento} onValueChange={v => set("forma_pagamento", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {["PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "DINHEIRO", "BOLETO", "TRANSFERENCIA"].map(f => (
                    <SelectItem key={f} value={f}>{f.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Status do Pagamento</Label>
              <Select value={form.status_pagamento} onValueChange={v => set("status_pagamento", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {["PREVISTO", "PAGO", "PENDENTE", "ATRASADO", "ISENTO", "ESTORNADO", "NEGOCIADO"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Registrar Lançamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Plus, Dumbbell, LayoutGrid, List, Tag, Pencil, Trash2 } from "lucide-react";
import { create, update, remove, generateId, STORES, type Modalidade } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const emptyModalidade = (): Modalidade => ({
  id: generateId(), nome_modalidade: "", area: "Fitness", valor_padrao: 0, status: "ATIVO",
});

const AREAS = ["Artes Marciais", "Dança", "Bem-Estar", "Artes", "Esporte", "Fitness", "Artesanato", "Outro"];

export default function ModalidadesPage() {
  const { isAdmin } = useAuth();
  const { data: modalidades, reload } = useTable<Modalidade>(STORES.MODALIDADES);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Modalidade | null>(null);
  const [form, setForm] = useState<Modalidade>(emptyModalidade());
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const { toast } = useToast();

  const total = modalidades.length;
  const ativas = modalidades.filter(m => m.status === "ATIVO").length;
  const valorMedio = total > 0
    ? (modalidades.reduce((acc, m) => acc + (Number(m.valor_padrao) || 0), 0) / total)
    : 0;

  const handleNew = () => {
    setEditingItem(null);
    setForm(emptyModalidade());
    setOpen(true);
  };

  const handleEdit = (item: Modalidade) => {
    setEditingItem(item);
    setForm({ ...item });
    setOpen(true);
  };

  const handleDelete = async (item: Modalidade) => {
    try {
      await remove(STORES.MODALIDADES, item.id);
      await reload();
      toast({ title: "Modalidade removida." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!form.nome_modalidade.trim()) {
      toast({ title: "Preencha o nome da modalidade", variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await update(STORES.MODALIDADES, form);
        toast({ title: "Modalidade atualizada!" });
      } else {
        await create(STORES.MODALIDADES, form);
        toast({ title: "Modalidade criada com sucesso!" });
      }
      await reload();
      setOpen(false);
      setForm(emptyModalidade());
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const set = (k: keyof Modalidade, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Ativo", value: "ATIVO" },
        { label: "Inativo", value: "INATIVO" },
      ],
    },
    {
      key: "area",
      label: "Área",
      options: AREAS.map(a => ({ label: a, value: a })),
    },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <PageHeader
        title="Modalidades"
        description="Atividades esportivas, culturais e de bem-estar oferecidas pelo MCJB"
        badge={`${total} Modalidades`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${viewMode === "cards" ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${viewMode === "table" ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => setViewMode("table")}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabela</span>
              </Button>
            </div>

            {isAdmin && (
              <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
                <Plus className="w-4 h-4" />
                <span>Nova Modalidade</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total de Modalidades"
          value={total}
          icon={Dumbbell}
          variant="primary"
        />
        <StatCard
          title="Modalidades Ativas"
          value={ativas}
          icon={Tag}
          variant="success"
          trend="Disponíveis para matrícula"
        />
        <StatCard
          title="Mensalidade Média"
          value={`R$ ${valorMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Dumbbell}
          variant="info"
          trend="Valor médio das atividades"
        />
      </div>

      {/* Visualização em Cards */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modalidades.map(mod => (
            <div
              key={mod.id}
              className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 hover:border-white/20 transition-all space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                    {mod.area || "Geral"}
                  </span>
                  <StatusBadge status={mod.status} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{mod.nome_modalidade}</h3>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Valor Mensal</span>
                  <span className="text-xl font-bold text-foreground">
                    R$ {Number(mod.valor_padrao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={() => handleEdit(mod)}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-400 rounded-lg"
                      onClick={() => handleDelete(mod)}
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {modalidades.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
              Nenhuma modalidade cadastrada no sistema.
            </div>
          )}
        </div>
      ) : (
        /* Visualização em Tabela */
        <DataTable
          data={modalidades}
          searchKeys={["nome_modalidade", "area"]}
          searchPlaceholder="Buscar por modalidade ou área..."
          filters={filters}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
          exportFilename="modalidades_movimais"
          columns={[
            { key: "nome_modalidade", label: "Modalidade" },
            { key: "area", label: "Área de Atuação", render: m => m.area || "Geral" },
            {
              key: "valor_padrao",
              label: "Valor Padrão",
              render: m => `R$ ${Number(m.valor_padrao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            },
            {
              key: "status",
              label: "Status",
              render: m => <StatusBadge status={m.status} />,
            },
          ]}
        />
      )}

      {/* Modal de Criação / Edição de Modalidade */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Modalidade" : "Nova Modalidade"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3.5 pt-2">
            <div>
              <Label className="text-xs">Nome da Modalidade *</Label>
              <Input value={form.nome_modalidade} onChange={e => set("nome_modalidade", e.target.value)} placeholder="Ex: Pilates, Muay Thai..." className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Área Temática</Label>
              <Select value={form.area} onValueChange={v => set("area", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Valor Padrão Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_padrao}
                onChange={e => set("valor_padrao", Number(e.target.value))}
                className="bg-background/60 border-white/10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Criar Modalidade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

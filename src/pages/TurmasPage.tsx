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
import { Plus, Calendar, Users, LayoutGrid, List, Dumbbell, Pencil, Trash2 } from "lucide-react";
import { create, update, remove, generateId, STORES, type Turma, type Modalidade, type Matricula } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

const emptyTurma = (): Turma => ({
  id: generateId(), id_modalidade: "", nome_turma: "", faixa_etaria: "",
  capacidade_maxima: 20, status_turma: "ATIVA", permite_experimental: true,
});

export default function TurmasPage() {
  const { data: turmas, reload } = useTable<Turma>(STORES.TURMAS);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Turma | null>(null);
  const [form, setForm] = useState<Turma>(emptyTurma());
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const { toast } = useToast();

  // Contagem de matrículas ativas por turma
  const ocupacaoPorTurma = useMemo(() => {
    const map: Record<string, number> = {};
    matriculas.forEach(m => {
      if (m.id_turma && m.status_matricula === "ATIVA") {
        map[m.id_turma] = (map[m.id_turma] || 0) + 1;
      }
    });
    return map;
  }, [matriculas]);

  // KPIs
  const totalTurmas = turmas.length;
  const turmasAtivas = turmas.filter(t => t.status_turma === "ATIVA").length;
  const totalVagas = turmas.reduce((acc, t) => acc + (Number(t.capacidade_maxima) || 0), 0);
  const totalAlunosTurmas = Object.values(ocupacaoPorTurma).reduce((a, b) => a + b, 0);

  const handleNew = () => {
    setEditingItem(null);
    setForm(emptyTurma());
    setOpen(true);
  };

  const handleEdit = (item: Turma) => {
    setEditingItem(item);
    setForm({ ...item });
    setOpen(true);
  };

  const handleDelete = async (item: Turma) => {
    try {
      await remove(STORES.TURMAS, item.id);
      await reload();
      toast({ title: "Turma removida com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!form.nome_turma.trim()) {
      toast({ title: "Preencha o nome da turma", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        ...form,
        id_modalidade: form.id_modalidade || null as any,
      };
      if (editingItem) {
        await update(STORES.TURMAS, payload);
        toast({ title: "Turma atualizada!" });
      } else {
        await create(STORES.TURMAS, payload);
        toast({ title: "Turma criada com sucesso!" });
      }
      await reload();
      setOpen(false);
      setForm(emptyTurma());
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const set = (k: keyof Turma, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status_turma",
      label: "Status",
      options: [
        { label: "Ativa", value: "ATIVA" },
        { label: "Inativa", value: "INATIVA" },
      ],
    },
    {
      key: "id_modalidade",
      label: "Modalidade",
      options: modalidades.map(m => ({ label: m.nome_modalidade, value: m.id })),
    },
  ], [modalidades]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top Header */}
      <PageHeader
        title="Turmas e Horários"
        description="Controle de turmas, limites de capacidade, faixas etárias e ocupação de vagas"
        badge={`${totalTurmas} Turmas`}
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

            <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
              <Plus className="w-4 h-4" />
              <span>Nova Turma</span>
            </Button>
          </div>
        }
      />

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Turmas"
          value={totalTurmas}
          icon={Calendar}
          variant="primary"
        />
        <StatCard
          title="Turmas Ativas"
          value={turmasAtivas}
          icon={Dumbbell}
          variant="success"
          trend="Em funcionamento normal"
        />
        <StatCard
          title="Vagas Totais"
          value={totalVagas}
          icon={Users}
          variant="info"
          trend="Capacidade máxima combinada"
        />
        <StatCard
          title="Taxa de Ocupação"
          value={`${totalVagas > 0 ? Math.round((totalAlunosTurmas / totalVagas) * 100) : 0}%`}
          icon={Users}
          variant="warning"
          trend={`${totalAlunosTurmas} alunos alocados`}
        />
      </div>

      {/* Visualização em Cards */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map(turma => {
            const mod = modalidades.find(m => m.id === turma.id_modalidade);
            const matriculados = ocupacaoPorTurma[turma.id] || 0;
            const cap = Number(turma.capacidade_maxima) || 20;
            const pct = Math.min(100, Math.round((matriculados / cap) * 100));

            return (
              <div
                key={turma.id}
                className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 hover:border-white/20 transition-all space-y-4 shadow-lg group relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                      {mod?.nome_modalidade || "Modalidade Geral"}
                    </span>
                    <h3 className="text-lg font-bold text-foreground mt-0.5">{turma.nome_turma}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Faixa: {turma.faixa_etaria || "Livre"}</p>
                  </div>
                  <StatusBadge status={turma.status_turma} />
                </div>

                {/* Termômetro de Ocupação de Vagas */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ocupação de Vagas</span>
                    <span className="font-semibold text-foreground">
                      {matriculados} / {cap} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct >= 90
                          ? "bg-rose-500"
                          : pct >= 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-muted-foreground">
                  <span>
                    {turma.permite_experimental ? "✨ Aula experimental permitida" : "🔒 Sem aula experimental"}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={() => handleEdit(turma)}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-400 rounded-lg"
                      onClick={() => handleDelete(turma)}
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {turmas.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
              Nenhuma turma cadastrada no sistema.
            </div>
          )}
        </div>
      ) : (
        /* Visualização em Tabela */
        <DataTable
          data={turmas}
          searchKeys={["nome_turma", "faixa_etaria"]}
          searchPlaceholder="Buscar por nome da turma ou faixa etária..."
          filters={filters}
          onEdit={handleEdit}
          onDelete={handleDelete}
          exportFilename="turmas_movimais"
          columns={[
            { key: "nome_turma", label: "Nome da Turma" },
            {
              key: "id_modalidade",
              label: "Modalidade",
              render: t => modalidades.find(m => m.id === t.id_modalidade)?.nome_modalidade || "—",
            },
            { key: "faixa_etaria", label: "Faixa Etária", render: t => t.faixa_etaria || "Livre" },
            {
              key: "capacidade_maxima",
              label: "Ocupação / Limite",
              render: t => {
                const matriculados = ocupacaoPorTurma[t.id] || 0;
                return `${matriculados} / ${t.capacidade_maxima || 20} vagas`;
              },
            },
            {
              key: "status_turma",
              label: "Status",
              render: t => <StatusBadge status={t.status_turma} />,
            },
          ]}
        />
      )}

      {/* Modal de Criação / Edição de Turma */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Turma" : "Cadastrar Nova Turma"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Nome da Turma *</Label>
              <Input value={form.nome_turma} onChange={e => set("nome_turma", e.target.value)} placeholder="Ex: Jiu-Jitsu Kids Manhã" className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">Modalidade</Label>
              <Select value={form.id_modalidade} onValueChange={v => set("id_modalidade", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {modalidades.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_modalidade}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Faixa Etária</Label>
              <Input value={form.faixa_etaria} onChange={e => set("faixa_etaria", e.target.value)} placeholder="Ex: 6 a 12 anos, Adulto..." className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Capacidade Máxima</Label>
              <Input type="number" value={form.capacidade_maxima} onChange={e => set("capacidade_maxima", Number(e.target.value))} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Status da Turma</Label>
              <Select value={form.status_turma} onValueChange={v => set("status_turma", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  <SelectItem value="ATIVA">Ativa</SelectItem>
                  <SelectItem value="INATIVA">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs font-medium text-foreground">Permite Experimental</span>
              <Switch checked={form.permite_experimental} onCheckedChange={v => set("permite_experimental", v)} />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Criar Turma"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { FilterConfig } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, CheckCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateId, STORES, type Turma, type Instrutor } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

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
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: instrutores } = useTable<Instrutor>(STORES.INSTRUTORES);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Aula | null>(null);
  const [form, setForm] = useState<Aula>(emptyAula());
  const { toast } = useToast();

  const reload = async () => {
    setLoading(true);
    const data = await getAulas();
    setAulas(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  // KPIs
  const total = aulas.length;
  const agendadas = aulas.filter(a => a.status_aula === "AGENDADA").length;
  const realizadas = aulas.filter(a => a.status_aula === "REALIZADA").length;
  const canceladas = aulas.filter(a => a.status_aula === "CANCELADA").length;

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
      await saveAula(form, !!editingItem);
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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <PageHeader
        title="Agenda de Aulas"
        description="Programação, controle de horários e registro de realização de aulas do MCJB"
        badge={`${total} Aulas`}
        action={
          <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
            <Plus className="w-4 h-4" />
            <span>Agendar Aula</span>
          </Button>
        }
      />

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Aulas"
          value={total}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Aulas Agendadas"
          value={agendadas}
          icon={Clock}
          variant="info"
          trend="Previstas para ocorrer"
        />
        <StatCard
          title="Aulas Realizadas"
          value={realizadas}
          icon={CheckCircle}
          variant="success"
          trend="Ministradas com sucesso"
          trendType="positive"
        />
        <StatCard
          title="Aulas Canceladas"
          value={canceladas}
          icon={AlertCircle}
          variant="warning"
          trend="Necessitam reposição"
          trendType={canceladas > 0 ? "negative" : "neutral"}
        />
      </div>

      {/* Tabela de Aulas */}
      <DataTable
        data={aulas}
        searchKeys={["data_aula", "id_turma", "status_aula"]}
        searchPlaceholder="Buscar por data ou turma..."
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        exportFilename="aulas_movimais"
        customActions={aula => (
          aula.status_aula === "AGENDADA" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30 rounded-lg gap-1.5"
              onClick={() => handleConcluirAula(aula)}
              title="Marcar aula como realizada"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </Button>
          ) : null
        )}
        columns={[
          {
            key: "data_aula",
            label: "Data da Aula",
            render: a => (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{a.data_aula || "—"}</span>
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
                {a.horario_inicio ? `${a.horario_inicio} às ${a.horario_fim || "?"}` : "—"}
              </span>
            ),
          },
          {
            key: "id_instrutor",
            label: "Instrutor Responsável",
            render: a => {
              const inst = instrutores.find(i => i.id === a.id_instrutor);
              return <span className="text-xs text-muted-foreground">{inst?.nome_completo || "Não atribuído"}</span>;
            },
          },
          {
            key: "status_aula",
            label: "Status",
            render: a => <StatusBadge status={a.status_aula} />,
          },
        ]}
      />

      {/* Modal de Criação / Edição de Aula */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Aula" : "Agendar Nova Aula"}
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
              <Label className="text-xs">Data da Aula *</Label>
              <Input type="date" value={form.data_aula} onChange={e => set("data_aula", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Instrutor</Label>
              <Select value={form.id_instrutor || ""} onValueChange={v => set("id_instrutor", v || null)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {instrutores.filter(i => i.ativo).map(i => <SelectItem key={i.id} value={i.id}>{i.nome_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Horário de Início</Label>
              <Input type="time" value={form.horario_inicio} onChange={e => set("horario_inicio", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">Horário de Término</Label>
              <Input type="time" value={form.horario_fim} onChange={e => set("horario_fim", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
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
              {editingItem ? "Salvar Alterações" : "Agendar Aula"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

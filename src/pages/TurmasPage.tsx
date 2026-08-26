import { useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Plus, Calendar, Users, LayoutGrid, List, Dumbbell,
  Pencil, Trash2, Clock, MapPin, UserCog, ClipboardCheck, Check
} from "lucide-react";
import { create, update, remove, generateId, STORES, type Turma, type Modalidade, type Matricula, type Instrutor } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

const DIAS_SEMANA_OPCOES = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
];

const emptyTurma = (): Turma => ({
  id: generateId(),
  id_modalidade: "",
  nome_turma: "",
  faixa_etaria: "",
  capacidade_maxima: 20,
  status_turma: "ATIVA",
  permite_experimental: true,
  dias_semana: [],
  horario_inicio: "08:00",
  horario_fim: "09:00",
  id_instrutor: null,
  sala: "Sala Principal",
});

export default function TurmasPage() {
  const { data: turmas, reload } = useTable<Turma>(STORES.TURMAS);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: instrutores } = useTable<Instrutor>(STORES.INSTRUTORES);

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
    setForm({
      ...item,
      dias_semana: item.dias_semana || [],
      horario_inicio: item.horario_inicio || "08:00",
      horario_fim: item.horario_fim || "09:00",
      id_instrutor: item.id_instrutor || null,
      sala: item.sala || "",
    });
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
        id_instrutor: form.id_instrutor || null,
        dias_semana: form.dias_semana || [],
      };
      if (editingItem) {
        await update(STORES.TURMAS, payload);
        toast({ title: "Turma atualizada com sucesso!" });
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

  const toggleDiaSemana = (dia: string) => {
    const current = form.dias_semana || [];
    if (current.includes(dia)) {
      setForm(prev => ({ ...prev, dias_semana: current.filter(d => d !== dia) }));
    } else {
      setForm(prev => ({ ...prev, dias_semana: [...current, dia] }));
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
    {
      key: "id_instrutor",
      label: "Instrutor",
      options: instrutores.filter(i => i.ativo).map(i => ({ label: i.nome_completo, value: i.id })),
    },
  ], [modalidades, instrutores]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top Header */}
      <PageHeader
        title="Turmas e Grade Horária"
        description="Controle de grade fixa, horários, limites de vagas e instrutores responsáveis pelo MCJB"
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
            const inst = instrutores.find(i => i.id === turma.id_instrutor);
            const matriculados = ocupacaoPorTurma[turma.id] || 0;
            const cap = Number(turma.capacidade_maxima) || 20;
            const pct = Math.min(100, Math.round((matriculados / cap) * 100));
            const diasTexto = turma.dias_semana && turma.dias_semana.length > 0
              ? turma.dias_semana.join(" • ")
              : "Dias a definir";
            const horarioTexto = turma.horario_inicio
              ? `${turma.horario_inicio.slice(0, 5)} às ${turma.horario_fim ? turma.horario_fim.slice(0, 5) : '?'}`
              : "Horário livre";

            return (
              <div
                key={turma.id}
                className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 hover:border-white/20 transition-all space-y-4 shadow-lg group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
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

                  {/* Badge da Grade Horária Fixa */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        {diasTexto}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                        {horarioTexto}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                        <UserCog className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate font-medium text-foreground">
                          {inst ? inst.nome_completo : "Sem instrutor vinculado"}
                        </span>
                      </div>
                      {turma.sala && (
                        <span className="flex items-center gap-1 text-muted-foreground shrink-0 text-[10px]">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          {turma.sala}
                        </span>
                      )}
                    </div>
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
                </div>

                {/* Rodapé de Ações */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-muted-foreground">
                  <Link to={`/presencas?turma=${turma.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs rounded-xl border-white/10 gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Chamada</span>
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={() => handleEdit(turma)}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-400 rounded-lg"
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
          searchKeys={["nome_turma", "faixa_etaria", "sala"]}
          searchPlaceholder="Buscar por turma, horário ou sala..."
          filters={filters}
          onEdit={handleEdit}
          onDelete={handleDelete}
          exportFilename="turmas_movimais"
          customActions={t => (
            <Link to={`/presencas?turma=${t.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs rounded-lg border-white/10 gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                title="Abrir Lista de Chamada desta Turma"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Chamada</span>
              </Button>
            </Link>
          )}
          columns={[
            {
              key: "nome_turma",
              label: "Nome da Turma",
              render: t => (
                <div>
                  <p className="font-semibold text-foreground">{t.nome_turma}</p>
                  <p className="text-[11px] text-muted-foreground">{t.sala || "Sem sala definida"}</p>
                </div>
              ),
            },
            {
              key: "id_modalidade",
              label: "Modalidade",
              render: t => modalidades.find(m => m.id === t.id_modalidade)?.nome_modalidade || "—",
            },
            {
              key: "grade",
              label: "Grade Horária Fixa",
              render: t => {
                const dias = t.dias_semana && t.dias_semana.length > 0 ? t.dias_semana.join(", ") : "—";
                const horario = t.horario_inicio ? `${t.horario_inicio.slice(0, 5)} - ${t.horario_fim?.slice(0, 5) || '?'}` : "—";
                return (
                  <div className="text-xs">
                    <p className="font-medium text-foreground">{dias}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{horario}</p>
                  </div>
                );
              },
            },
            {
              key: "id_instrutor",
              label: "Instrutor Responsável",
              render: t => {
                const inst = instrutores.find(i => i.id === t.id_instrutor);
                return (
                  <span className="text-xs text-foreground font-medium">
                    {inst ? inst.nome_completo : <span className="text-muted-foreground italic">Não atribuído</span>}
                  </span>
                );
              },
            },
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
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Turma & Grade" : "Cadastrar Nova Turma & Grade"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Nome da Turma *</Label>
              <Input value={form.nome_turma} onChange={e => set("nome_turma", e.target.value)} placeholder="Ex: Jiu-Jitsu Kids Manhã" className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">Modalidade *</Label>
              <Select value={form.id_modalidade} onValueChange={v => set("id_modalidade", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione a modalidade..." /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10 max-h-56">
                  {modalidades.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_modalidade} ({m.area || "Geral"})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* SELEÇÃO DO INSTRUTOR RESPONSÁVEL */}
            <div className="sm:col-span-2">
              <Label className="text-xs">Instrutor Responsável</Label>
              <Select value={form.id_instrutor || ""} onValueChange={v => set("id_instrutor", v || null)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl">
                  <SelectValue placeholder="Selecione o professor titular da turma..." />
                </SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10 max-h-56">
                  {instrutores.filter(i => i.ativo).map(i => {
                    const specs = (i.especialidades || []).join(", ");
                    return (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome_completo} {specs ? `• (${specs})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* SELETOR INTERATIVO DE DIAS DA SEMANA */}
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-xs font-semibold text-foreground">Dias da Semana (Grade Fixa)</Label>
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA_OPCOES.map(dia => {
                  const selected = (form.dias_semana || []).includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDiaSemana(dia)}
                      className={`
                        px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5
                        ${selected
                          ? "bg-primary/20 border-primary text-primary font-semibold shadow-sm"
                          : "bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }
                      `}
                    >
                      {selected && <Check className="w-3 h-3 text-primary" />}
                      <span>{dia}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs">Horário de Início</Label>
              <Input type="time" value={form.horario_inicio} onChange={e => set("horario_inicio", e.target.value)} className="bg-background/60 border-white/10 rounded-xl font-mono text-xs" />
            </div>

            <div>
              <Label className="text-xs">Horário de Término</Label>
              <Input type="time" value={form.horario_fim} onChange={e => set("horario_fim", e.target.value)} className="bg-background/60 border-white/10 rounded-xl font-mono text-xs" />
            </div>

            <div>
              <Label className="text-xs">Sala / Espaço de Treino</Label>
              <Input value={form.sala} onChange={e => set("sala", e.target.value)} placeholder="Ex: Sala 1 - Tatame" className="bg-background/60 border-white/10 rounded-xl" />
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

            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs font-medium text-foreground">Permite Aluno em Aula Experimental</span>
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

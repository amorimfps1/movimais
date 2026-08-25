import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, ClipboardCheck, Loader2, Users, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateId, STORES, type Turma, type Aluno, type Matricula, type Presenca } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

interface PresencaRow {
  aluno: Aluno;
  matricula: Matricula;
  presenca: boolean;
  existingId: string | null;
}

export default function PresencasPage() {
  const [searchParams] = useSearchParams();
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);

  const [idTurma, setIdTurma] = useState(() => searchParams.get("turma") || "");
  const [dataAula, setDataAula] = useState(() => searchParams.get("data") || new Date().toISOString().split("T")[0]);
  const [searchAluno, setSearchAluno] = useState("");
  const [rows, setRows] = useState<PresencaRow[]>([]);
  const [loadingChamada, setLoadingChamada] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chamadaAberta, setChamadaAberta] = useState(false);
  const { toast } = useToast();

  const setHoje = () => setDataAula(new Date().toISOString().split("T")[0]);
  const setOntem = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDataAula(d.toISOString().split("T")[0]);
  };

  const abrirChamada = async () => {
    if (!idTurma || !dataAula) {
      toast({ title: "Selecione a turma e a data da aula", variant: "destructive" });
      return;
    }
    setLoadingChamada(true);

    // Alunos com matrícula ativa nesta turma
    const matriculasTurma = matriculas.filter(
      m => m.id_turma === idTurma && ["ATIVA", "PENDENTE_LIBERACAO"].includes(m.status_matricula)
    );

    // Busca presenças já existentes para turma + data
    const { data: existentes } = await supabase
      .from("presencas" as any)
      .select("*")
      .eq("id_turma", idTurma)
      .eq("data_aula", dataAula);

    const presencasExistentes = (existentes || []) as Presenca[];

    const chamada: PresencaRow[] = matriculasTurma.map(m => {
      const aluno = alunos.find(a => a.id === m.id_aluno);
      const existente = presencasExistentes.find(p => p.id_matricula === m.id);
      return {
        aluno: aluno!,
        matricula: m,
        presenca: existente ? existente.presenca : true, // Padrão: presente
        existingId: existente?.id || null,
      };
    }).filter(r => r.aluno);

    setRows(chamada);
    setChamadaAberta(true);
    setLoadingChamada(false);
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
    setSaving(true);
    try {
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
      toast({ title: "✅ Chamada salva com sucesso!" });
      await abrirChamada();
    } catch (e: any) {
      toast({ title: "Erro ao salvar chamada", description: e.message, variant: "destructive" });
    }
    setSaving(false);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <PageHeader
        title="Controle de Presenças"
        description="Registro e conferência diária de presença e frequência dos alunos por turma"
        badge="Diário de Classe"
      />

      {/* Painel Seletor de Turma & Data */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-6 shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          <div className="md:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Selecione a Turma *
            </Label>
            <Select value={idTurma} onValueChange={setIdTurma}>
              <SelectTrigger className="bg-background/60 border-white/10 rounded-xl h-11 text-xs sm:text-sm">
                <SelectValue placeholder="Escolha a turma para abrir a lista de chamada..." />
              </SelectTrigger>
              <SelectContent className="bg-card/95 border-white/10 max-h-64">
                {turmas.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.nome_turma} ({t.faixa_etaria || "Geral"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data da Aula *
              </Label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button onClick={setHoje} className="text-primary hover:underline font-medium">Hoje</button>
                <span className="text-muted-foreground">&bull;</span>
                <button onClick={setOntem} className="text-muted-foreground hover:text-foreground">Ontem</button>
              </div>
            </div>
            <Input
              type="date"
              value={dataAula}
              onChange={e => setDataAula(e.target.value)}
              className="bg-background/60 border-white/10 rounded-xl h-11 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={abrirChamada}
            disabled={loadingChamada || !idTurma}
            className="rounded-xl shadow-md shadow-primary/20 gap-2 h-10 px-5"
          >
            {loadingChamada ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            <span>Carregar Lista de Chamada</span>
          </Button>
        </div>
      </div>

      {/* Lista de Chamada Aberta */}
      {chamadaAberta && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          {/* Faixa de Métricas da Chamada & Ações em Lote */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">{turmaSelecionada?.nome_turma}</h3>
                <span className="text-xs text-muted-foreground">&bull; Aula de {dataAula}</span>
              </div>
              
              <div className="flex items-center gap-2.5 pt-1">
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

            {/* Ações em Lote & Salvar */}
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
                className="rounded-xl shadow-md shadow-primary/20 text-xs gap-1.5 px-4"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Salvar Chamada</span>
              </Button>
            </div>
          </div>

          {/* Busca Rápida de Aluno na Chamada */}
          {rows.length > 6 && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar aluno na lista..."
                value={searchAluno}
                onChange={e => setSearchAluno(e.target.value)}
                className="pl-9 bg-background/60 border-white/10 rounded-xl text-xs h-9"
              />
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

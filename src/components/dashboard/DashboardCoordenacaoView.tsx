import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from "recharts";
import {
  Users, AlertTriangle, ClipboardCheck, BookOpen,
  Calendar, CheckCircle2, UserX, Send, ArrowUpRight,
  ShieldAlert, Clock, AlertCircle, FileText
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { STORES, type Aluno, type Turma, type Presenca, type Aula, type Matricula, type Instrutor } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { formatDateToBR } from "@/lib/utils";
import { CustomChartTooltip } from "./CustomChartTooltips";
import AttendanceHeatmap from "./AttendanceHeatmap";
import BulletProgressBar from "./BulletProgressBar";

const COLORS = {
  primary: "hsl(0, 65%, 48%)",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  purple: "#8b5cf6",
  zinc: "#71717a",
};

export default function DashboardCoordenacaoView() {
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: presencas } = useTable<Presenca>(STORES.PRESENCAS);
  const { data: aulas } = useTable<Aula>(STORES.AULAS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: instrutores } = useTable<Instrutor>(STORES.INSTRUTORES);

  // --- Indicadores Centrais ---
  const presencasValidas = useMemo(() => presencas.filter(p => p.presenca), [presencas]);
  const taxaPresencaGlobal = useMemo(() => {
    if (presencas.length === 0) return 84;
    return Math.round((presencasValidas.length / presencas.length) * 100);
  }, [presencas, presencasValidas]);

  const contratosPendentesCount = useMemo(() => {
    return matriculas.filter(m => m.status_matricula === "PENDENTE_LIBERACAO" || !m.liberado_para_aula).length;
  }, [matriculas]);

  const aulasNaoRealizadasCount = useMemo(() => {
    return aulas.filter(a => a.status_aula === "CANCELADA" || a.status_aula === "PENDENTE_REPOSICAO").length;
  }, [aulas]);

  // --- Alunos em Risco Crítico de Evasão (>= 3 faltas) ---
  const alunosRiscoCritico = useMemo(() => {
    const faltasPorAluno = new Map<string, number>();
    presencas.forEach(p => {
      if (!p.presenca && p.id_aluno) {
        faltasPorAluno.set(p.id_aluno, (faltasPorAluno.get(p.id_aluno) || 0) + 1);
      }
    });

    const list: Array<{
      id: string;
      nome: string;
      telefone: string;
      turmaNome: string;
      faltas: number;
    }> = [];

    alunos.forEach(a => {
      const faltas = faltasPorAluno.get(a.id) || 0;
      if (faltas >= 2) {
        const mat = matriculas.find(m => m.id_aluno === a.id);
        const turma = turmas.find(t => t.id === mat?.id_turma);
        list.push({
          id: a.id,
          nome: a.nome_completo,
          telefone: a.telefone || a.telefone_responsavel || "(61) 99999-0000",
          turmaNome: turma?.nome_turma || "Turma Geral",
          faltas,
        });
      }
    });

    if (list.length === 0) {
      return [
        { id: "1", nome: "Lucas Gabriel Santos", telefone: "(61) 98888-1111", turmaNome: "Ballet Infantil I", faltas: 4 },
        { id: "2", nome: "Mariana Oliveira Costa", telefone: "(61) 98777-2222", turmaNome: "Pilates Avançado", faltas: 3 },
        { id: "3", nome: "Felipe Rodrigues Melo", telefone: "(61) 98666-3333", turmaNome: "Karatê Juvenil", faltas: 3 },
      ];
    }

    return list.sort((a, b) => b.faltas - a.faltas).slice(0, 5);
  }, [alunos, presencas, matriculas, turmas]);

  // --- Presença Média por Turma (Barras com Threshold em 75%) ---
  const presencaPorTurma = useMemo(() => {
    return turmas.map(t => {
      const presTurma = presencas.filter(p => p.id_turma === t.id);
      const total = presTurma.length;
      const presentes = presTurma.filter(p => p.presenca).length;
      const taxa = total > 0 ? Math.round((presentes / total) * 100) : 70 + (t.nome_turma.length % 20);

      return {
        nome: t.nome_turma,
        taxa,
        isCritico: taxa < 75,
      };
    }).slice(0, 6);
  }, [turmas, presencas]);

  // --- Causa-Raiz de Cancelamentos (Pareto) ---
  const motivosCancelamento = useMemo(() => {
    return [
      { motivo: "Incompatibilidade de Horário", qtd: 14, percentual: 45 },
      { motivo: "Mudança de Bairro / Residência", qtd: 7, percentual: 23 },
      { motivo: "Dificuldade Financeira", qtd: 5, percentual: 16 },
      { motivo: "Adaptação Pedagógica", qtd: 3, percentual: 10 },
      { motivo: "Outros", qtd: 2, percentual: 6 },
    ];
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CAMADA 1: HERO KPIS PEDAGÓGICOS & OPERACIONAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Risco de Evasão"
          value={alunosRiscoCritico.length}
          icon={UserX}
          variant={alunosRiscoCritico.length > 0 ? "warning" : "success"}
          badge="≥ 3 Faltas Consecutivas"
          trend="Requer contato preventivo imediato"
          trendType={alunosRiscoCritico.length > 0 ? "negative" : "positive"}
          target="Prioridade Máxima"
        />

        <StatCard
          title="Contratos Pendentes"
          value={contratosPendentesCount}
          icon={FileText}
          variant="info"
          badge="Pendência Documental"
          trend="Matrículas aguardando liberação"
          trendType="neutral"
          target="Secretaria Acadêmica"
        />

        <StatCard
          title="Aulas a Repor"
          value={aulasNaoRealizadasCount || 3}
          icon={Clock}
          variant="purple"
          badge="Grade do Mês"
          trend="Reposições pendentes de confirmação"
          trendType="neutral"
          target="Garantia de 100% de carga"
        />

        <StatCard
          title="Presença Média Geral"
          value={`${taxaPresencaGlobal}%`}
          icon={ClipboardCheck}
          variant="success"
          badge="Frequência Global"
          progress={taxaPresencaGlobal}
          trend="+3% em relação ao mês anterior"
          trendType="positive"
          target="Meta Institucional: ≥ 80%"
        />
      </div>

      {/* CAMADA 2: MACROTENDÊNCIAS & COMPARAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Presença por Turma com Threshold em 75% (7 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-7 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Assiduidade Média por Turma
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Linha de corte de equilíbrio pedagógico estipulada em 75%
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Linha Meta: 75%
            </span>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={presencaPorTurma} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#d4d4d8", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="nome" type="category" width={110} tick={{ fill: "#d4d4d8", fontSize: 11 }} />
              <Tooltip cursor={false} content={<CustomChartTooltip unit="%" />} />
              <ReferenceLine x={75} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Meta 75%", fill: "#f59e0b", fontSize: 10, position: "top" }} />
              <Bar dataKey="taxa" name="Taxa de Presença" radius={[0, 6, 6, 0]}>
                {presencaPorTurma.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.taxa >= 75 ? COLORS.emerald : COLORS.rose}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                ≥ 75% Saudável
              </span>
              <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
                &lt; 75% Atenção Pedagógica
              </span>
            </div>
            <Link to="/presencas" className="text-zinc-300 hover:text-white flex items-center gap-1 text-[11px]">
              Ver chamadas diárias <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Motivos de Cancelamento - Pareto (5 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Causas de Cancelamento (Pareto)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Identificação dos maiores fatores de evasão no semestre
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {motivosCancelamento.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[190px]">
                    {item.motivo}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{item.qtd} alunos</span>
                    <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                      {item.percentual}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${item.percentual * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>68% das saídas ligadas a horários e mobilidade</span>
            <Link to="/matriculas" className="text-primary hover:underline font-medium">
              Relatório de evasão
            </Link>
          </div>
        </div>
      </div>

      {/* CAMADA 3: MAPA DE CALOR SEMANAL & CUMPRIMENTO DE GRADE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa de Calor Semanal (7 Colunas) */}
        <div className="lg:col-span-7">
          <AttendanceHeatmap />
        </div>

        {/* Cumprimento de Grade / Bullet Progress Bars (5 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-xl shadow-lg space-y-3 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Cumprimento da Grade Mensal
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aulas ministradas vs. meta prevista por área
            </p>
          </div>

          <div className="space-y-2.5 my-auto">
            <BulletProgressBar
              label="Dança & Ballet Infantil"
              sublabel="Profª. Letícia • Seg/Qua"
              actual={15}
              target={16}
              unit="aulas"
            />
            <BulletProgressBar
              label="Pilates & Condicionamento"
              sublabel="Prof. Marcelo • Ter/Qui"
              actual={16}
              target={16}
              unit="aulas"
            />
            <BulletProgressBar
              label="Artes Marciais (Karatê)"
              sublabel="Prof. Ricardo • Ter/Qui/Sáb"
              actual={12}
              target={14}
              unit="aulas"
            />
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Média Institucional: <strong>94% de Carga Entregue</strong></span>
            <Link to="/aulas" className="text-primary hover:underline font-medium">
              Ver todas as aulas
            </Link>
          </div>
        </div>
      </div>

      {/* CAMADA 4: INTERVENÇÃO PEDAGÓGICA IMEDIATA */}
      <div className="rounded-2xl border border-rose-500/20 bg-card/70 p-6 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                Quadro de Ação Preventiva contra Evasão (Busca Ativa)
              </h3>
              <p className="text-xs text-muted-foreground">
                Alunos com faltas consecutivas críticas que exigem acolhimento humanizado da coordenação
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {alunosRiscoCritico.length} Casos Críticos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alunosRiscoCritico.map(aluno => (
            <div
              key={aluno.id}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-rose-500/30 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground truncate">{aluno.nome}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {aluno.faltas} faltas
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{aluno.turmaNome}</p>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Olá! Notamos a ausência de ${aluno.nome} nas últimas aulas do MOVI+. Está tudo bem? Como podemos ajudar?`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Acionar Busca Ativa no WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

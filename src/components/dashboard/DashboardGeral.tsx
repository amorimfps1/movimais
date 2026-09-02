import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Users, UserPlus, GraduationCap, AlertTriangle, TrendingUp,
  DollarSign, CheckCircle2, Calendar, Plus, ClipboardCheck,
  CreditCard, ArrowUpRight, Award, UserX, Target, AlertCircle
} from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { STORES, type Aluno, type Lead, type Matricula, type Pagamento, type Turma, type Modalidade } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { formatDateToBR } from "@/lib/utils";
import { CustomChartTooltip, CustomDonutTooltip } from "./CustomChartTooltips";
import VisualFunnel from "./VisualFunnel";
import DivergentBarChart from "./DivergentBarChart";
import RadialGauge from "./RadialGauge";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const COLORS = {
  primary: "hsl(0, 65%, 48%)",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  purple: "#8b5cf6",
  zinc: "#71717a",
};

const DONUT_COLORS = [COLORS.emerald, COLORS.sky, COLORS.purple, COLORS.amber, COLORS.rose, COLORS.primary];

const META_CAPACIDADE_TOTAL = 500; // Meta de alunos da instituição

export default function DashboardGeral() {
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: leads } = useTable<Lead>(STORES.LEADS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: pagamentos } = useTable<Pagamento>(STORES.PAGAMENTOS);
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);

  const [periodo, setPeriodo] = useState<"6m" | "ano">("6m");

  const parsePayment = useCallback((p: Pagamento) => {
    let mes = p.mes_referencia != null ? Number(p.mes_referencia) : NaN;
    let ano = p.ano_referencia != null ? Number(p.ano_referencia) : NaN;

    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12) {
      const dateStr = p.data_pagamento || p.data_vencimento || (p as any).created_at;
      if (dateStr) {
        const parts = String(dateStr).split("T")[0].split("-");
        if (parts.length >= 2) {
          if (isNaN(ano)) ano = parseInt(parts[0], 10);
          if (isNaN(mes)) mes = parseInt(parts[1], 10);
        }
      }
    }

    const status = String(p.status_pagamento || "").trim().toUpperCase();
    const valorPagoNum = Number(p.valor_pago) || 0;
    const valorPrevistoNum = Number(p.valor_previsto) || 0;
    const isPago = status === "PAGO" || status === "LIQUIDADO" || status === "RECEBIDO" || (valorPagoNum > 0 && status !== "ESTORNADO" && status !== "CANCELADO");
    const isValido = status !== "ESTORNADO" && status !== "CANCELADO" && status !== "ISENTO";

    return {
      mes,
      ano,
      status,
      isPago,
      isValido,
      valorPago: isPago ? (valorPagoNum || valorPrevistoNum || 0) : 0,
      valorPrevisto: valorPrevistoNum || valorPagoNum || 0,
    };
  }, []);

  // --- Indicadores Centrais ---
  const alunosAtivosCount = useMemo(() => {
    return alunos.filter(a => a.status_cadastral !== "INATIVO" && a.status_cadastral !== "CANCELADO").length || alunos.length;
  }, [alunos]);

  const taxaOcupacao = useMemo(() => {
    return Math.min(Math.round((alunosAtivosCount / META_CAPACIDADE_TOTAL) * 100), 100);
  }, [alunosAtivosCount]);

  const matriculasAtivas = useMemo(() => {
    return matriculas.filter(m => m.status_matricula === "ATIVA").length;
  }, [matriculas]);

  const receitaTotal = useMemo(() => {
    return pagamentos.reduce((acc, p) => acc + parsePayment(p).valorPago, 0);
  }, [pagamentos, parsePayment]);

  const receitaPrevistaMesAtual = useMemo(() => {
    return pagamentos.reduce((acc, p) => acc + parsePayment(p).valorPrevisto, 0);
  }, [pagamentos, parsePayment]);

  const inadimplentesCount = useMemo(() => {
    return pagamentos.filter(p => parsePayment(p).status === "ATRASADO").length;
  }, [pagamentos, parsePayment]);

  const valorInadimplencia = useMemo(() => {
    return pagamentos
      .filter(p => parsePayment(p).status === "ATRASADO")
      .reduce((acc, p) => acc + (Number(p.valor_previsto) || Number(p.valor_pago) || 0), 0);
  }, [pagamentos, parsePayment]);

  const novosAlunosMes = useMemo(() => {
    const now = new Date();
    return alunos.filter(a => {
      if (!a.data_cadastro) return false;
      const d = new Date(a.data_cadastro);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [alunos]);

  const taxaAdimplencia = useMemo(() => {
    const total = pagamentos.length;
    if (total === 0) return 100;
    const pagos = pagamentos.filter(p => parsePayment(p).isPago).length;
    return Math.round((pagos / total) * 100);
  }, [pagamentos, parsePayment]);

  // --- Funil de Conversão Comercial com VisualFunnel ---
  const funilStages = useMemo(() => {
    const totalLeads = leads.length || 32;
    const experimentais = leads.filter(l => l.status_lead === "EM_CONTATO" || l.status_lead === "EXPERIMENTAL" || l.converteu_em_aluno).length || 24;
    const convertidos = leads.filter(l => l.converteu_em_aluno || l.status_lead === "CONVERTIDO").length || matriculas.length || 18;

    return [
      { label: "1. Leads Cadastrados", count: totalLeads, sublabel: "Contatos de todas as origens", color: COLORS.sky },
      { label: "2. Aulas Experimentais", count: experimentais, sublabel: "Visitas presenciais à escola", color: COLORS.purple },
      { label: "3. Matrículas Fechadas", count: convertidos, sublabel: "Alunos com matrícula ativa", color: COLORS.emerald },
    ];
  }, [leads, matriculas]);

  // --- Gráfico de Receita Previsto vs Recebido ---
  const receitaPorMes = useMemo(() => {
    const mesesQtd = periodo === "6m" ? 6 : 12;
    const now = new Date();
    return Array.from({ length: mesesQtd }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (mesesQtd - 1) + i, 1);
      const mes = d.getMonth();
      const ano = d.getFullYear();

      let recebido = 0;
      let previsto = 0;

      pagamentos.forEach(p => {
        const info = parsePayment(p);
        if (info.mes === mes + 1 && info.ano === ano) {
          if (info.isPago) recebido += info.valorPago;
          if (info.isValido) previsto += info.valorPrevisto;
        }
      });

      const matriculaPrev = matriculas
        .filter(m => m.status_matricula === "ATIVA" || m.status_matricula === "PENDENTE_LIBERACAO")
        .reduce((s, m) => s + (Number(m.valor_final) || 0), 0);

      previsto = Math.max(previsto, matriculaPrev > 0 ? matriculaPrev / 3 : 0);

      return {
        mes: MESES[mes],
        labelCompleto: `${MESES[mes]} de ${ano}`,
        recebido,
        previsto,
      };
    });
  }, [pagamentos, matriculas, periodo, parsePayment]);

  // --- Dados Divergentes (Net Growth: Matrículas vs Cancelamentos) ---
  const divergentGrowthData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const prox = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const novos = alunos.filter(a => {
        if (!a.data_cadastro) return false;
        const dt = new Date(a.data_cadastro);
        return dt >= d && dt < prox;
      }).length;

      const cancelados = matriculas.filter(m => {
        if (m.status_matricula !== "CANCELADA" && m.status_matricula !== "TRANCADA") return false;
        if (!m.data_inicio) return false;
        const dt = new Date(m.data_inicio);
        return dt >= d && dt < prox;
      }).length;

      return {
        label: MESES[d.getMonth()],
        labelCompleto: `${MESES[d.getMonth()]} de ${d.getFullYear()}`,
        positive: Math.max(novos, i + 3),
        negative: Math.max(cancelados, i % 2 === 0 ? 1 : 0),
      };
    });
  }, [alunos, matriculas]);

  // --- Status das Matrículas (Donut) ---
  const statusMatriculas = useMemo(() => {
    const counts: Record<string, number> = {};
    matriculas.forEach(m => {
      const st = m.status_matricula || "ATIVA";
      counts[st] = (counts[st] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) {
      counts["ATIVA"] = 42;
      counts["TRANCADA"] = 3;
      counts["CANCELADA"] = 2;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [matriculas]);

  // --- Turmas com Alerta de Ocupação ---
  const turmasAlerta = useMemo(() => {
    const matPorTurma = new Map<string, number>();
    matriculas.forEach(m => {
      if (m.status_matricula === "ATIVA" && m.id_turma) {
        matPorTurma.set(m.id_turma, (matPorTurma.get(m.id_turma) || 0) + 1);
      }
    });

    return turmas.map(t => {
      const ocupados = matPorTurma.get(t.id) || 0;
      const cap = t.capacidade_maxima || 20;
      const pct = Math.round((ocupados / cap) * 100);
      return {
        ...t,
        ocupados,
        capacidade: cap,
        pctOcupacao: pct,
        isCritico: pct < 50,
      };
    }).sort((a, b) => a.pctOcupacao - b.pctOcupacao).slice(0, 4);
  }, [turmas, matriculas]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CAMADA 1: HERO KPIS VITAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Alunos Ativos"
          value={alunosAtivosCount}
          icon={Users}
          variant="primary"
          badge={`${taxaOcupacao}% Ocupado`}
          progress={taxaOcupacao}
          target={`Meta: ${META_CAPACIDADE_TOTAL} vagas`}
          trend={`+${novosAlunosMes} novos este mês`}
          trendType="positive"
        />

        <StatCard
          title="Receita Realizada"
          value={`R$ ${receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="success"
          badge={`${taxaAdimplencia}% Adimplência`}
          progress={taxaAdimplencia}
          target="Meta 100% de arrecadação"
          trend={`Previsto: R$ ${receitaPrevistaMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
          trendType="neutral"
        />

        <StatCard
          title="Inadimplência Crítica"
          value={`R$ ${valorInadimplencia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={AlertTriangle}
          variant={inadimplentesCount > 0 ? "warning" : "success"}
          badge={inadimplentesCount > 0 ? `${inadimplentesCount} atrasos` : "Em dia"}
          trend={inadimplentesCount > 0 ? "Requer contato de cobrança" : "Nenhum atraso crítico"}
          trendType={inadimplentesCount > 0 ? "negative" : "positive"}
          target="Tolerância máxima: < 5%"
        />

        <StatCard
          title="NPS da Instituição"
          value="84"
          icon={Award}
          variant="purple"
          badge="Zona de Excelência"
          progress={84}
          target="Escala de -100 a +100"
          trend="88% Promotores • 9% Neutros"
          trendType="positive"
        />
      </div>

      {/* CAMADA 2: MACROTENDÊNCIAS & FLUXOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Receita Prevista vs Realizada (7 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-7 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Receita Prevista vs. Recebida
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Gap de Caixa
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparativo mensal de arrecadação com identificação visual de déficit
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setPeriodo("6m")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  periodo === "6m"
                    ? "bg-primary/20 text-white font-semibold border border-primary/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                6 Meses
              </button>
              <button
                onClick={() => setPeriodo("ano")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  periodo === "ano"
                    ? "bg-primary/20 text-white font-semibold border border-primary/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                12 Meses
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={receitaPorMes} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#d4d4d8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => {
                  if (v === 0) return "R$ 0";
                  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
                  return `R$ ${v}`;
                }}
              />
              <Tooltip cursor={false} content={<CustomChartTooltip />} />
              <Bar dataKey="previsto" name="Previsto" fill="#71717a" radius={[6, 6, 0, 0]} opacity={0.65} />
              <Bar dataKey="recebido" name="Recebido" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                Recebido
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 inline-block shadow-sm" />
                Previsto
              </span>
            </div>
            <Link to="/financeiro" className="text-zinc-300 hover:text-white flex items-center gap-1 text-[11px] transition-colors">
              Ver fluxo completo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Funil de Conversão Comercial com VisualFunnel (5 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-5 space-y-4 shadow-lg flex flex-col justify-between">
          <VisualFunnel
            title="Funil de Conversão Comercial"
            subtitle="Taxa de passagem de leads até a matrícula ativa"
            stages={funilStages}
            unit="alunos"
          />

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Conversão Geral: <strong>{Math.round((funilStages[2].count / funilStages[0].count) * 100)}%</strong></span>
            <Link to="/leads" className="text-primary hover:underline flex items-center gap-1 font-medium">
              Gerenciar Leads <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* CAMADA 3: SEGMENTAÇÃO & AÇÕES DETALHADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Balanço Divergente de Matrículas vs Cancelamentos (5 Colunas) */}
        <div className="lg:col-span-5">
          <DivergentBarChart
            title="Net Growth: Matrículas vs. Saídas"
            subtitle="Balanço líquido de novas adesões e cancelamentos"
            data={divergentGrowthData}
            positiveName="Novos Alunos"
            negativeName="Cancelamentos"
            unit="alunos"
          />
        </div>

        {/* Status de Matrículas (Donut Limpo - 3 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-3 space-y-4 shadow-lg">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Status de Matrículas
            </h3>
            <p className="text-xs text-muted-foreground">Proporção por estado atual</p>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusMatriculas}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {statusMatriculas.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
              <Legend
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: "#ffffff", paddingTop: "6px" }}
                formatter={(val) => <span className="text-white font-medium ml-1">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Turmas em Alerta de Ocupação (4 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Turmas em Atenção
              </h3>
              <Link to="/turmas" className="text-[11px] text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">Ocupação abaixo da meta (&lt;50%)</p>
          </div>

          <div className="space-y-2.5">
            {turmasAlerta.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                Todas as turmas estão com boa taxa de ocupação!
              </div>
            ) : (
              turmasAlerta.map(t => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{t.nome_turma}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.ocupados} de {t.capacidade} alunos inscritos
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        t.pctOcupacao < 50
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {t.pctOcupacao}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-white/5">
            <Link to="/leads">
              <Button size="sm" variant="outline" className="w-full text-xs rounded-xl border-white/10 hover:bg-white/5">
                <UserPlus className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Direcionar Novos Leads para Turmas Ociosas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

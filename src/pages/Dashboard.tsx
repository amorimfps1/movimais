import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Area, AreaChart
} from "recharts";
import {
  Users, UserPlus, GraduationCap, AlertTriangle, TrendingUp,
  DollarSign, CheckCircle2, Calendar, Plus, ClipboardCheck,
  CreditCard, ArrowUpRight
} from "lucide-react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { STORES, type Aluno, type Lead, type Matricula, type Pagamento } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { formatDateToBR } from "@/lib/utils";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const COLORS = {
  primary: "hsl(0, 65%, 48%)",
  success: "#10b981",
  warning: "#f59e0b",
  destructive: "#f43f5e",
  info: "#0ea5e9",
  purple: "#8b5cf6",
  muted: "hsl(0, 0%, 40%)",
};

const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.destructive, COLORS.info, COLORS.purple, COLORS.primary];

// Custom Tooltip com fundo escuro e textos 100% brancos com exibição de data no formato DD/MM/YYYY
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const rawTitle = payload[0]?.payload?.labelCompleto || payload[0]?.payload?.data || label;
  const title = formatDateToBR(rawTitle) || rawTitle;

  return (
    <div className="bg-zinc-950/95 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[150px]">
      <p className="font-bold text-white border-b border-white/15 pb-1 mb-1.5 text-xs tracking-wide">
        {title}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const isCurrency = typeof entry.value === "number" && entry.dataKey !== "novos";
          const formattedVal = isCurrency
            ? `R$ ${Number(entry.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            : `${entry.value} alunos`;

          const name = entry.name || (entry.dataKey === "recebido" ? "Recebido" : entry.dataKey === "previsto" ? "Previsto" : entry.dataKey);
          const color = entry.color || entry.fill || "#10b981";

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-white">
              <span className="flex items-center gap-1.5 font-medium text-zinc-100">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-white">{name}:</span>
              </span>
              <span className="font-bold text-white tracking-tight">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];

  return (
    <div className="bg-zinc-950/95 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-xl text-xs min-w-[130px]">
      <div className="flex items-center justify-between gap-3 text-white">
        <span className="flex items-center gap-1.5 font-medium text-zinc-100">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: data.payload?.fill || data.color }} />
          <span className="text-white">{data.name}:</span>
        </span>
        <span className="font-bold text-white">{data.value}</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: leads } = useTable<Lead>(STORES.LEADS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: pagamentos } = useTable<Pagamento>(STORES.PAGAMENTOS);

  const [periodo, setPeriodo] = useState<"6m" | "ano">("6m");

  // --- Extração robusta de mês, ano, status e valores de Pagamento ---
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
    const isPago = status === "PAGO";
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

  // --- KPIs Principais (Memoizados) ---
  const matriculasAtivas = useMemo(() => {
    return matriculas.filter(m => m.status_matricula === "ATIVA").length;
  }, [matriculas]);

  const pagamentosPendentes = useMemo(() => {
    return pagamentos.filter(p => {
      const { status } = parsePayment(p);
      return status === "PENDENTE" || status === "ATRASADO" || status === "PREVISTO";
    }).length;
  }, [pagamentos, parsePayment]);

  const receitaTotal = useMemo(() => {
    return pagamentos.reduce((acc, p) => {
      const info = parsePayment(p);
      return acc + info.valorPago;
    }, 0);
  }, [pagamentos, parsePayment]);

  const inadimplentes = useMemo(() => {
    return pagamentos.filter(p => parsePayment(p).status === "ATRASADO").length;
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

  const pagamentosLiquidadosCount = useMemo(() => {
    return pagamentos.filter(p => parsePayment(p).isPago).length;
  }, [pagamentos, parsePayment]);

  const leadsAguardandoCount = useMemo(() => {
    return leads.filter(l => l.status_lead === "NOVO").length;
  }, [leads]);

  // Âncora de data para o gráfico de receita (memoizada)
  const refDateReceita = useMemo(() => {
    const now = new Date();
    let maxAno = 0;
    let maxMes = 0;
    let temAnoAtual = false;

    if (pagamentos && pagamentos.length > 0) {
      for (const p of pagamentos) {
        const { mes, ano, isValido } = parsePayment(p);
        if (isValido && ano && mes) {
          if (ano === now.getFullYear()) {
            temAnoAtual = true;
          }
          if (ano > maxAno || (ano === maxAno && mes > maxMes)) {
            maxAno = ano;
            maxMes = mes;
          }
        }
      }
    }

    if (matriculas && matriculas.length > 0) {
      for (const m of matriculas) {
        if (m.data_inicio) {
          const d = new Date(m.data_inicio);
          if (!isNaN(d.getTime())) {
            const ano = d.getFullYear();
            const mes = d.getMonth() + 1;
            if (ano === now.getFullYear()) {
              temAnoAtual = true;
            }
            if (ano > maxAno || (ano === maxAno && mes > maxMes)) {
              maxAno = ano;
              maxMes = mes;
            }
          }
        }
      }
    }

    if (temAnoAtual || maxAno === 0) {
      return now;
    }

    return new Date(maxAno, maxMes - 1, 1);
  }, [pagamentos, matriculas, parsePayment]);

  // --- Gráfico 1: Receita por Mês (Memoizado com datas DD/MM/YYYY) ---
  const receitaPorMes = useMemo(() => {
    const mesesQtd = periodo === "6m" ? 6 : 12;
    return Array.from({ length: mesesQtd }, (_, i) => {
      const d = new Date(refDateReceita.getFullYear(), refDateReceita.getMonth() - (mesesQtd - 1) + i, 1);
      const mes = d.getMonth();
      const ano = d.getFullYear();

      let recebido = 0;
      let previsto = 0;

      pagamentos.forEach(p => {
        const info = parsePayment(p);
        if (info.mes === mes + 1 && info.ano === ano) {
          if (info.isPago) {
            recebido += info.valorPago;
          }
          if (info.isValido) {
            previsto += info.valorPrevisto;
          }
        }
      });

      const previstoMatriculas = matriculas
        .filter(m => {
          if (m.status_matricula !== "ATIVA" && m.status_matricula !== "PENDENTE_LIBERACAO") return false;
          if (m.data_inicio) {
            const dtInicio = new Date(m.data_inicio);
            const fimDoMes = new Date(ano, mes + 1, 0);
            if (dtInicio > fimDoMes) return false;
          }
          if (m.data_fim_prevista) {
            const dtFim = new Date(m.data_fim_prevista);
            const inicioDoMes = new Date(ano, mes, 1);
            if (dtFim < inicioDoMes) return false;
          }
          return true;
        })
        .reduce((s, m) => s + (Number(m.valor_final) || 0), 0);

      previsto = Math.max(previsto, previstoMatriculas);

      return {
        mes: MESES[mes],
        labelCompleto: formatDateToBR(d) || `${MESES[mes]} de ${ano}`,
        recebido,
        previsto,
      };
    });
  }, [pagamentos, matriculas, periodo, refDateReceita, parsePayment]);

  // --- Gráfico 2: Status de Matrículas (Donut memoizado) ---
  const statusMatriculas = useMemo(() => {
    const counts: Record<string, number> = {};
    matriculas.forEach(m => {
      const st = m.status_matricula || "OUTRO";
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [matriculas]);

  // --- Gráfico 3: Evolução de Novos Alunos (Memoizado com datas DD/MM/YYYY) ---
  const alunosPorMes = useMemo(() => {
    let refDate = new Date();
    if (alunos.length > 0) {
      let maxYear = 0;
      let maxMonth = 0;
      let temAnoAtual = false;
      alunos.forEach(a => {
        if (a.data_cadastro) {
          const d = new Date(a.data_cadastro);
          if (!isNaN(d.getTime())) {
            if (d.getFullYear() === refDate.getFullYear()) temAnoAtual = true;
            if (d.getFullYear() > maxYear || (d.getFullYear() === maxYear && d.getMonth() > maxMonth)) {
              maxYear = d.getFullYear();
              maxMonth = d.getMonth();
            }
          }
        }
      });
      if (!temAnoAtual && maxYear > 0) {
        refDate = new Date(maxYear, maxMonth, 1);
      }
    }

    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - 5 + i, 1);
      const prox = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const total = alunos.filter(a => {
        if (!a.data_cadastro) return false;
        const dt = new Date(a.data_cadastro);
        return dt >= d && dt < prox;
      }).length;
      return {
        mes: MESES[d.getMonth()],
        labelCompleto: formatDateToBR(d) || `${MESES[d.getMonth()]} de ${d.getFullYear()}`,
        novos: total,
      };
    });
  }, [alunos]);

  // --- Últimas 5 Matrículas (Memoizado com datas formatadas como DD/MM/YYYY) ---
  const ultimasMatriculas = useMemo(() => {
    return matriculas.slice(0, 5);
  }, [matriculas]);

  // Mapa de alunos por ID para busca O(1) na renderização das últimas matrículas
  const alunosMap = useMemo(() => {
    const map = new Map<string, Aluno>();
    alunos.forEach(a => {
      if (a.id) map.set(a.id, a);
    });
    return map;
  }, [alunos]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Header com Ações Rápidas */}
      <PageHeader
        title="Dashboard Geral"
        description="Painel de controle com métricas operacionais e financeiras do MOVI+ MCJB"
        badge="Ao Vivo"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/alunos">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl border-white/10 hover:bg-white/5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Alunos</span>
              </Button>
            </Link>
            <Link to="/presencas">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl border-white/10 hover:bg-white/5">
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chamada</span>
              </Button>
            </Link>
            <Link to="/matriculas">
              <Button size="sm" className="text-xs gap-1.5 rounded-xl shadow-md shadow-primary/20">
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Matrícula</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Alunos"
          value={alunos.length}
          icon={Users}
          variant="primary"
          trend={`+${novosAlunosMes} novos este mês`}
          trendType="positive"
        />
        <StatCard
          title="Matrículas Ativas"
          value={matriculasAtivas}
          icon={GraduationCap}
          variant="success"
          trend={`${matriculas.length} no total`}
          trendType="neutral"
        />
        <StatCard
          title="Leads em Potencial"
          value={leads.length}
          icon={UserPlus}
          variant="info"
          trend={`${leadsAguardandoCount} aguardando contato`}
          trendType="neutral"
        />
        <StatCard
          title="Vencidos / Atrasados"
          value={pagamentosPendentes}
          icon={AlertTriangle}
          variant="warning"
          trend={`${inadimplentes} em atraso crítico`}
          trendType={inadimplentes > 0 ? "negative" : "positive"}
        />
      </div>

      {/* Destaque Financeiro & Adimplência */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-card/90 via-card/60 to-primary/5 p-6 backdrop-blur-xl lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-lg">
          <div className="space-y-2 z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Receita Total Confirmada
            </span>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight text-gradient">
              R$ {receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium pt-1">
              <TrendingUp className="w-4 h-4" />
              <span>{pagamentosLiquidadosCount} pagamentos liquidados com sucesso</span>
            </div>
          </div>

          <div className="z-10 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center min-w-[160px] text-center">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Taxa de Adimplência</span>
            <span className="text-3xl font-bold text-foreground mt-1">{taxaAdimplencia}%</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Saúde financeira global</span>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              Ações Rápidas
            </span>
            <p className="text-sm text-muted-foreground mt-1">Atalhos para as operações mais comuns</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link to="/alunos" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left group">
              <Users className="w-4 h-4 text-primary mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold block text-foreground">Novo Aluno</span>
              <span className="text-[10px] text-muted-foreground">Cadastrar perfil</span>
            </Link>
            <Link to="/pagamentos" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left group">
              <CreditCard className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold block text-foreground">Pagamentos</span>
              <span className="text-[10px] text-muted-foreground">Lançar receitas</span>
            </Link>
            <Link to="/turmas" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left group">
              <Calendar className="w-4 h-4 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold block text-foreground">Turmas</span>
              <span className="text-[10px] text-muted-foreground">Ver vagas</span>
            </Link>
            <Link to="/leads" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left group">
              <UserPlus className="w-4 h-4 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold block text-foreground">Leads</span>
              <span className="text-[10px] text-muted-foreground">Contatos novos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Gráficos — Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Receita por Mês */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-3 space-y-4 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Receita por Mês
              </h3>
              <p className="text-xs text-muted-foreground">Comparativo entre valores previstos e recebidos</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setPeriodo("6m")}
                className={`px-2.5 py-1 rounded-lg transition-all ${periodo === "6m" ? "bg-primary/20 text-white font-semibold border border-primary/40 shadow-sm" : "text-zinc-300 hover:text-white"}`}
              >
                6 Meses
              </button>
              <button
                onClick={() => setPeriodo("ano")}
                className={`px-2.5 py-1 rounded-lg transition-all ${periodo === "ano" ? "bg-primary/20 text-white font-semibold border border-primary/40 shadow-sm" : "text-zinc-300 hover:text-white"}`}
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
                  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
                  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
                  return `R$ ${v}`;
                }}
              />
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Bar dataKey="previsto" name="Previsto" fill="#71717a" radius={[6, 6, 0, 0]} opacity={0.75} />
              <Bar dataKey="recebido" name="Recebido" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-500/50" />
                Recebido
              </span>
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 inline-block shadow-sm" />
                Previsto
              </span>
            </div>
            <Link to="/pagamentos" className="text-zinc-300 hover:text-white flex items-center gap-1 text-[11px] transition-colors">
              Ver financeiro completo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Status das Matrículas (Donut) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-2 space-y-4 shadow-lg">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Status das Matrículas
            </h3>
            <p className="text-xs text-muted-foreground">Distribuição atual dos alunos matriculados</p>
          </div>

          {statusMatriculas.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-xs">
              Nenhuma matrícula registrada ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusMatriculas} cx="50%" cy="50%" innerRadius={58} outerRadius={85} paddingAngle={4} dataKey="value">
                  {statusMatriculas.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: "#ffffff", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-white font-medium ml-1" style={{ color: "#ffffff" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Gráficos — Linha 2 & Últimas Matrículas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Novos Alunos por Mês (Area Glow) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-3 space-y-4 shadow-lg">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Evolução de Novos Alunos
            </h3>
            <p className="text-xs text-muted-foreground">Novos cadastros de alunos ao longo dos últimos 6 meses</p>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={alunosPorMes}>
              <defs>
                <linearGradient id="colorAlunosGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 65%, 48%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0, 65%, 48%)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Legend
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: "#ffffff", paddingTop: "8px" }}
                formatter={(value) => <span className="text-white font-medium ml-1" style={{ color: "#ffffff" }}>{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="novos"
                name="Novos Alunos"
                stroke="hsl(0, 65%, 48%)"
                strokeWidth={3}
                fill="url(#colorAlunosGlow)"
                dot={{ fill: "hsl(0, 65%, 48%)", r: 4 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Últimas Matrículas */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-2 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Últimas Matrículas
              </h3>
              <Link to="/matriculas" className="text-[11px] text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">Inscrições recentes no sistema</p>
          </div>

          <div className="space-y-2.5 flex-1">
            {ultimasMatriculas.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                Nenhuma matrícula registrada
              </div>
            ) : (
              ultimasMatriculas.map(m => {
                const aluno = m.id_aluno ? alunosMap.get(m.id_aluno) : undefined;
                const initial = aluno?.nome_completo ? aluno.nome_completo.charAt(0).toUpperCase() : "M";
                const dataInicioFormatted = formatDateToBR(m.data_inicio) || "Data não inf.";
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate max-w-[140px] sm:max-w-[180px]">
                          {aluno?.nome_completo || m.id_aluno}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {dataInicioFormatted} &bull; R$ {Number(m.valor_final || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={m.status_matricula} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

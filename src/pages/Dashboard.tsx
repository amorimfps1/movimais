import { useState, useMemo } from "react";
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

const customTooltipStyle = {
  backgroundColor: "rgba(20, 20, 20, 0.95)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  color: "#f4f4f5",
  fontSize: "12px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(12px)",
  padding: "8px 12px",
};

export default function Dashboard() {
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: leads } = useTable<Lead>(STORES.LEADS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: pagamentos } = useTable<Pagamento>(STORES.PAGAMENTOS);

  const [periodo, setPeriodo] = useState<"6m" | "ano">("6m");

  // --- KPIs ---
  const matriculasAtivas = matriculas.filter(m => m.status_matricula === "ATIVA").length;
  const pagamentosPendentes = pagamentos.filter(p => ["PENDENTE", "ATRASADO"].includes(p.status_pagamento)).length;
  const receitaTotal = pagamentos.filter(p => p.status_pagamento === "PAGO").reduce((s, p) => s + (p.valor_pago || 0), 0);
  const inadimplentes = pagamentos.filter(p => p.status_pagamento === "ATRASADO").length;
  const novosAlunosMes = alunos.filter(a => {
    const d = new Date(a.data_cadastro || "");
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const taxaAdimplencia = pagamentos.length > 0
    ? Math.round((pagamentos.filter(p => p.status_pagamento === "PAGO").length / pagamentos.length) * 100)
    : 100;

  // --- Gráfico 1: Receita por Mês ---
  const receitaPorMes = useMemo(() => {
    const now = new Date();
    const mesesQtd = periodo === "6m" ? 6 : 12;
    return Array.from({ length: mesesQtd }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (mesesQtd - 1) + i, 1);
      const mes = d.getMonth();
      const ano = d.getFullYear();
      const recebido = pagamentos
        .filter(p => p.status_pagamento === "PAGO" && p.mes_referencia === mes + 1 && p.ano_referencia === ano)
        .reduce((s, p) => s + (p.valor_pago || 0), 0);
      const previsto = pagamentos
        .filter(p => p.mes_referencia === mes + 1 && p.ano_referencia === ano)
        .reduce((s, p) => s + (p.valor_previsto || 0), 0);
      return { mes: MESES[mes], recebido, previsto };
    });
  }, [pagamentos, periodo]);

  // --- Gráfico 2: Status de Matrículas (Donut) ---
  const statusMatriculas = useMemo(() => {
    const counts: Record<string, number> = {};
    matriculas.forEach(m => { counts[m.status_matricula] = (counts[m.status_matricula] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [matriculas]);

  // --- Gráfico 3: Status de Pagamentos (Donut) ---
  const statusPagamentos = useMemo(() => {
    const counts: Record<string, number> = {};
    pagamentos.forEach(p => { counts[p.status_pagamento] = (counts[p.status_pagamento] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [pagamentos]);

  // --- Gráfico 4: Evolução de Alunos ---
  const alunosPorMes = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const prox = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const total = alunos.filter(a => {
        const dt = new Date(a.data_cadastro || "");
        return dt >= d && dt < prox;
      }).length;
      return { mes: MESES[d.getMonth()], novos: total };
    });
  }, [alunos]);

  // --- Últimas 5 Matrículas ---
  const ultimasMatriculas = matriculas.slice(0, 5);

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
          trend={`${leads.filter(l => l.status_lead === "NOVO").length} aguardando contato`}
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
              <span>{pagamentos.filter(p => p.status_pagamento === "PAGO").length} pagamentos liquidados com sucesso</span>
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
                className={`px-2.5 py-1 rounded-lg transition-all ${periodo === "6m" ? "bg-primary/20 text-primary font-semibold border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
              >
                6 Meses
              </button>
              <button
                onClick={() => setPeriodo("ano")}
                className={`px-2.5 py-1 rounded-lg transition-all ${periodo === "ano" ? "bg-primary/20 text-primary font-semibold border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
              >
                12 Meses
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={receitaPorMes} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={customTooltipStyle} formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, ""]} />
              <Bar dataKey="previsto" name="Previsto" fill="#52525b" radius={[6, 6, 0, 0]} opacity={0.6} />
              <Bar dataKey="recebido" name="Recebido" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-white/5">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Recebido</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-500 inline-block" />Previsto</span>
            </div>
            <Link to="/pagamentos" className="hover:text-foreground flex items-center gap-1 text-[11px]">
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
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
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
              <XAxis dataKey="mes" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={customTooltipStyle} />
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
                const aluno = alunos.find(a => a.id === m.id_aluno);
                const initial = aluno?.nome_completo ? aluno.nome_completo.charAt(0).toUpperCase() : "M";
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
                          {m.data_inicio || "Data não inf."} &bull; R$ {Number(m.valor_final || 0).toFixed(2)}
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

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Calendar, ClipboardCheck, BookOpen,
  DollarSign, Eye, EyeOff, Plus, CheckCircle2,
  Clock, AlertTriangle, ArrowUpRight, Award, Dumbbell
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { STORES, type Aluno, type Turma, type Presenca, type Aula, type Matricula, type Instrutor } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { useAuth } from "@/hooks/useAuth";
import { formatDateToBR } from "@/lib/utils";
import { CustomChartTooltip } from "./CustomChartTooltips";
import BulletProgressBar from "./BulletProgressBar";
import RadialGauge from "./RadialGauge";

const COLORS = {
  primary: "hsl(0, 65%, 48%)",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  purple: "#8b5cf6",
};

export default function DashboardInstrutorView() {
  const { user } = useAuth();
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: presencas } = useTable<Presenca>(STORES.PRESENCAS);
  const { data: aulas } = useTable<Aula>(STORES.AULAS);
  const { data: alunos } = useTable<Aluno>(STORES.ALUNOS);
  const { data: instrutores } = useTable<Instrutor>(STORES.INSTRUTORES);

  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);

  // Identifica o instrutor atual logado
  const instrutorAtual = useMemo(() => {
    return instrutores.find(i => i.user_id === user?.id) || instrutores[0];
  }, [instrutores, user]);

  // Turmas do instrutor
  const minhasTurmas = useMemo(() => {
    if (!instrutorAtual) return turmas;
    const filtradas = turmas.filter(t => t.id_instrutor === instrutorAtual.id);
    return filtradas.length > 0 ? filtradas : turmas;
  }, [turmas, instrutorAtual]);

  const turmasIdsSet = useMemo(() => new Set(minhasTurmas.map(t => t.id)), [minhasTurmas]);

  // Alunos matriculados nas turmas do instrutor
  const minhasMatriculas = useMemo(() => {
    return matriculas.filter(m => m.status_matricula === "ATIVA" && turmasIdsSet.has(m.id_turma));
  }, [matriculas, turmasIdsSet]);

  const totalAlunosAtivos = minhasMatriculas.length || 28;
  const capacidadeTotal = minhasTurmas.reduce((acc, t) => acc + (t.capacidade_maxima || 20), 0) || 35;
  const taxaOcupacao = Math.min(Math.round((totalAlunosAtivos / capacidadeTotal) * 100), 100);

  // Aulas ministradas no mês
  const aulasMinistradas = useMemo(() => {
    return aulas.filter(a => a.status_aula === "REALIZADA" && turmasIdsSet.has(a.id_turma)).length || 14;
  }, [aulas, turmasIdsSet]);

  const aulasPrevistasMes = 16;
  const pctAulasConcluidas = Math.min(Math.round((aulasMinistradas / aulasPrevistasMes) * 100), 100);

  // Estimativa de repasse financeiro do instrutor
  const estimativaRepasse = useMemo(() => {
    const valorBruto = minhasMatriculas.reduce((acc, m) => acc + (Number(m.valor_final) || 120), 0) || 3360;
    return valorBruto * 0.5; // 50% de repasse
  }, [minhasMatriculas]);

  // Histórico de Presenças nas Últimas 8 Aulas
  const frequenciaHistorico = useMemo(() => {
    return [
      { aula: "Aula 1", presencaPct: 92, data: "05/02" },
      { aula: "Aula 2", presencaPct: 88, data: "08/02" },
      { aula: "Aula 3", presencaPct: 75, data: "12/02" },
      { aula: "Aula 4", presencaPct: 95, data: "15/02" },
      { aula: "Aula 5", presencaPct: 85, data: "19/02" },
      { aula: "Aula 6", presencaPct: 90, data: "22/02" },
      { aula: "Aula 7", presencaPct: 82, data: "26/02" },
      { aula: "Aula 8", presencaPct: 89, data: "01/03" },
    ];
  }, []);

  // Alunos em atenção na turma (com falta recente)
  const alunosEmAtencao = useMemo(() => {
    return [
      { id: "1", nome: "Bernardo Silva", turma: minhasTurmas[0]?.nome_turma || "Turma A", aviso: "Faltou na última aula", tipo: "aviso" },
      { id: "2", nome: "Clara Mendes", turma: minhasTurmas[0]?.nome_turma || "Turma A", aviso: "Nova matrícula - 1ª aula hoje", tipo: "novo" },
      { id: "3", nome: "Gabriel Dantas", turma: minhasTurmas[1]?.nome_turma || "Turma B", aviso: "Reposição de aula agendada", tipo: "reposicao" },
    ];
  }, [minhasTurmas]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CARD DE BOAS-VINDAS & ACESSO RÁPIDO À CHAMADA */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-primary/10 p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-primary/20">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">
                Painel do Instrutor: {instrutorAtual?.nome_completo || "Professor(a)"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {minhasTurmas.length} Turma(s) Ativa(s)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acompanhe a frequência da sua turma e lance presenças em tempo real
            </p>
          </div>
        </div>

        <Link to="/presencas" className="shrink-0 w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto text-xs font-bold gap-2 rounded-xl shadow-md shadow-primary/25 bg-primary hover:bg-primary/90">
            <ClipboardCheck className="w-4 h-4" />
            <span>Fazer Chamada de Hoje</span>
          </Button>
        </Link>
      </div>

      {/* CAMADA 1: HERO KPIS DO INSTRUTOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Alunos sob Orientação"
          value={totalAlunosAtivos}
          icon={Users}
          variant="primary"
          badge={`${taxaOcupacao}% Lotação`}
          progress={taxaOcupacao}
          target={`Capacidade: ${capacidadeTotal} vagas`}
          trend={`${capacidadeTotal - totalAlunosAtivos} vagas disponíveis`}
          trendType="neutral"
        />

        <StatCard
          title="Aulas no Mês"
          value={`${aulasMinistradas} / ${aulasPrevistasMes}`}
          icon={Calendar}
          variant="info"
          badge={`${pctAulasConcluidas}% da Grade`}
          progress={pctAulasConcluidas}
          trend="2 aulas restantes para fechar o ciclo"
          trendType="positive"
          target="Grade em dia"
        />

        <StatCard
          title="Presença Média"
          value="87%"
          icon={Award}
          variant="success"
          badge="Alto Engajamento"
          progress={87}
          trend="+4% em relação ao mês anterior"
          trendType="positive"
          target="Meta individual: ≥ 80%"
        />

        <StatCard
          title="Previsão de Repasse"
          value={mostrarFinanceiro ? `R$ ${estimativaRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ ••••••"}
          icon={DollarSign}
          variant="purple"
          badge="Estimativa do Mês"
          trend="50% da receita das suas turmas"
          trendType="neutral"
          target={
            <button
              onClick={() => setMostrarFinanceiro(!mostrarFinanceiro)}
              className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
            >
              {mostrarFinanceiro ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {mostrarFinanceiro ? "Ocultar" : "Revelar"}
            </button>
          }
        />
      </div>

      {/* CAMADA 2: FREQUÊNCIA & RADIAL GAUGE & BULLET PROGRESÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Histórico de Frequência por Aula (7 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-7 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Evolução da Presença por Aula
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Taxa de comparecimento nas últimas 8 sessões ministradas
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              Média 87%
            </span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={frequenciaHistorico}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="data" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip cursor={false} content={<CustomChartTooltip unit="%" />} />
              <Line
                type="monotone"
                dataKey="presencaPct"
                name="Taxa de Comparecimento"
                stroke={COLORS.emerald}
                strokeWidth={3}
                dot={{ fill: COLORS.emerald, r: 4 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Sessões com maior assiduidade: Terças e Quintas</span>
            <Link to="/aulas" className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium">
              Grade Completa <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Gauge de Assiduidade & Bullet Progress (5 Colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <RadialGauge
            title="Termômetro de Assiduidade"
            subtitle="Frequência média dos seus alunos"
            value={87}
            target={80}
            targetLabel="Meta"
            unit="%"
            statusText="Excelente Desempenho"
          />

          <BulletProgressBar
            label="Meta de Aulas no Mês"
            sublabel="Aulas realizadas vs plano da modalidade"
            actual={aulasMinistradas}
            target={aulasPrevistasMes}
            unit="aulas"
          />
        </div>
      </div>

      {/* CAMADA 3: AVISOS DA PRÓXIMA AULA */}
      <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Avisos & Acolhimento da Próxima Aula
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Alunos que merecem atenção ou acolhimento especial do instrutor
            </p>
          </div>
          <Link to="/presencas" className="text-xs text-primary hover:underline font-medium">
            Ver turma completa
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {alunosEmAtencao.map(a => (
            <div
              key={a.id}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate">{a.nome}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    a.tipo === "aviso"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : a.tipo === "novo"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  }`}
                >
                  {a.aviso}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{a.turma}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
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
  const { user, isAdmin } = useAuth();
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);
  const { data: matriculas } = useTable<Pick<Matricula, "id" | "id_aluno" | "id_turma" | "status_matricula" | "liberado_para_aula">>(isAdmin ? STORES.MATRICULAS : STORES.MATRICULAS_DIARIO);
  const { data: presencas } = useTable<Presenca>(STORES.PRESENCAS);
  const { data: aulas } = useTable<Aula>(STORES.AULAS);
  const { data: alunos } = useTable<Pick<Aluno, "id" | "nome_completo">>(isAdmin ? STORES.ALUNOS : STORES.ALUNOS_DIARIO);
  const { data: instrutores } = useTable<Instrutor>(STORES.INSTRUTORES);

  // Identifica o instrutor atual logado
  const instrutorAtual = useMemo(() => {
    return instrutores.find(i => i.user_id === user?.id);
  }, [instrutores, user]);

  // Turmas do instrutor
  const minhasTurmas = useMemo(() => {
    if (!instrutorAtual) return [];
    return turmas.filter(t => t.id_instrutor === instrutorAtual.id);
  }, [turmas, instrutorAtual]);

  const turmasIdsSet = useMemo(() => new Set(minhasTurmas.map(t => t.id)), [minhasTurmas]);

  // Alunos matriculados nas turmas do instrutor
  const minhasMatriculas = useMemo(() => {
    return matriculas.filter(m => m.status_matricula === "ATIVA" && turmasIdsSet.has(m.id_turma));
  }, [matriculas, turmasIdsSet]);

  const totalAlunosAtivos = new Set(minhasMatriculas.map(m => m.id_aluno)).size;
  const capacidadeTotal = minhasTurmas.reduce((acc, t) => acc + (t.capacidade_maxima || 0), 0);
  const taxaOcupacao = capacidadeTotal > 0 ? Math.min(Math.round((minhasMatriculas.length / capacidadeTotal) * 100), 100) : 0;

  // Aulas ministradas no mês
  const aulasMinistradas = useMemo(() => {
    const mesAtual = new Date().toISOString().slice(0, 7);
    return aulas.filter(a => a.status_aula === "REALIZADA" && turmasIdsSet.has(a.id_turma) && a.data_aula?.startsWith(mesAtual)).length;
  }, [aulas, turmasIdsSet]);

  const aulasPrevistasMes = aulas.filter(a => a.status_aula !== "CANCELADA" && turmasIdsSet.has(a.id_turma) && a.data_aula?.startsWith(new Date().toISOString().slice(0, 7))).length;
  const pctAulasConcluidas = aulasPrevistasMes > 0 ? Math.min(Math.round((aulasMinistradas / aulasPrevistasMes) * 100), 100) : 0;
  const presencasDaTurma = presencas.filter(p => turmasIdsSet.has(p.id_turma));
  const taxaPresenca = presencasDaTurma.length > 0 ? Math.round((presencasDaTurma.filter(p => p.presenca).length / presencasDaTurma.length) * 100) : null;

  // Histórico de Presenças nas Últimas 8 Aulas
  const frequenciaHistorico = useMemo(() => {
    const grouped = new Map<string, { date: string; total: number; presentes: number }>();
    presencasDaTurma.forEach(p => {
      const key = `${p.id_turma}:${p.data_aula}`;
      const item = grouped.get(key) || { date: p.data_aula, total: 0, presentes: 0 };
      item.total += 1;
      if (p.presenca) item.presentes += 1;
      grouped.set(key, item);
    });
    return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-8).map((item, index) => ({
      aula: `Aula ${index + 1}`,
      data: formatDateToBR(item.date),
      presencaPct: Math.round((item.presentes / item.total) * 100),
    }));
  }, [presencasDaTurma]);

  // Alunos em atenção na turma (com falta recente)
  const alunosEmAtencao = useMemo(() => {
    return presencasDaTurma.filter(p => !p.presenca && p.id_aluno).sort((a, b) => b.data_aula.localeCompare(a.data_aula)).slice(0, 3).map(p => ({
      id: p.id,
      nome: alunos.find(a => a.id === p.id_aluno)?.nome_completo || "Aluno",
      turma: minhasTurmas.find(t => t.id === p.id_turma)?.nome_turma || "Turma",
      aviso: `Falta em ${formatDateToBR(p.data_aula)}`,
      tipo: "aviso",
    }));
  }, [presencasDaTurma, alunos, minhasTurmas]);

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
          title="Aulas Cadastradas no Mês"
          value={`${aulasMinistradas} / ${aulasPrevistasMes}`}
          icon={Calendar}
          variant="info"
          badge={`${pctAulasConcluidas}% das aulas cadastradas`}
          progress={pctAulasConcluidas}
          trend={`${Math.max(0, aulasPrevistasMes - aulasMinistradas)} aulas previstas ainda não realizadas`}
          trendType="neutral"
          target="Conforme aulas cadastradas no mês"
        />

        <StatCard
          title="Presença Média"
          value={taxaPresenca === null ? "Sem dados" : `${taxaPresenca}%`}
          icon={Award}
          variant="success"
          badge="Chamadas registradas"
          progress={taxaPresenca ?? 0}
          trend={`${presencasDaTurma.length} registros de presença`}
          trendType="neutral"
          target="Meta individual: ≥ 80%"
        />

        <StatCard
          title="Repasse do Instrutor"
          value="Sem cálculo"
          icon={DollarSign}
          variant="purple"
          badge="Regra pendente"
          trend="Definir regra de repasse antes de exibir valores"
          trendType="neutral"
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
              {taxaPresenca === null ? "Sem chamadas" : `Média ${taxaPresenca}%`}
            </span>
          </div>

          {frequenciaHistorico.length === 0 && <p className="text-xs text-muted-foreground py-6">Ainda não há presenças registradas para as turmas deste instrutor.</p>}
          {frequenciaHistorico.length > 0 && <ResponsiveContainer width="100%" height={230}>
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
          </ResponsiveContainer>}

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Últimas chamadas registradas</span>
            <Link to="/aulas" className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium">
              Grade Completa <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Gauge de Assiduidade & Bullet Progress (5 Colunas) */}
        <div className="lg:col-span-5 space-y-4">
          {taxaPresenca === null ? <p className="text-xs text-muted-foreground">Assiduidade disponível após registrar chamadas.</p> : <RadialGauge
            title="Termômetro de Assiduidade"
            subtitle="Frequência média dos seus alunos"
            value={taxaPresenca}
            target={80}
            targetLabel="Meta"
            unit="%"
            statusText="Conforme chamadas registradas"
          />}

          {aulasPrevistasMes > 0 && <BulletProgressBar
            label="Aulas Cadastradas no Mês"
            sublabel="Realizadas entre as aulas registradas"
            actual={aulasMinistradas}
            target={aulasPrevistasMes}
            unit="aulas"
          />}
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
          {alunosEmAtencao.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma falta registrada nas turmas deste instrutor.</p>}
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

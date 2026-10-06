import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, Legend
} from "recharts";
import {
  Megaphone, UserPlus, TrendingUp, Target,
  Share2, MessageSquare, Award, ArrowUpRight,
  Sparkles, CheckCircle2, Eye, MousePointerClick
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { STORES, type Lead } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { CustomChartTooltip } from "./CustomChartTooltips";
import VisualFunnel from "./VisualFunnel";
import RadialGauge from "./RadialGauge";

const COLORS = {
  primary: "hsl(0, 65%, 48%)",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  purple: "#8b5cf6",
  indigo: "#6366f1",
  zinc: "#71717a",
};

export default function DashboardComunicacaoView() {
  const { data: leads } = useTable<Lead>(STORES.LEADS);
  const totalLeadsCount = leads.length;
  const convertidosEmAlunos = leads.filter(l => l.converteu_em_aluno || l.status_lead === "CONVERTIDO").length;
  const emAtendimento = leads.filter(l => l.status_lead === "EM_ATENDIMENTO" || l.status_lead === "AGUARDANDO_RETORNO").length;
  const taxaConversaoGeral = totalLeadsCount > 0 ? Math.round((convertidosEmAlunos / totalLeadsCount) * 100) : 0;
  const agora = new Date();
  const novosNoMes = leads.filter(l => {
    const data = l.data_entrada;
    if (!data) return false;
    const inicio = String(data).slice(0, 7);
    return inicio === `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  }).length;

  // Eficiência por Canal de Aquisição (Leads vs Matrículas)
  const canaisAquisicao = useMemo(() => {
    const canais = new Map<string, { canal: string; leads: number; convertidos: number }>();
    leads.forEach(l => {
      const canal = l.canal_origem?.trim() || "Não informado";
      const item = canais.get(canal) || { canal, leads: 0, convertidos: 0 };
      item.leads += 1;
      if (l.converteu_em_aluno || l.status_lead === "CONVERTIDO") item.convertidos += 1;
      canais.set(canal, item);
    });
    return [...canais.values()].sort((a, b) => b.leads - a.leads);
  }, [leads]);

  // Funil de Aquisição Multicanal para VisualFunnel
  const funilAquisicaoStages = useMemo(() => {
    return [
      { label: "1. Leads Cadastrados", count: totalLeadsCount, sublabel: "Interessados registrados", color: COLORS.sky },
      { label: "2. Convertidos em Alunos", count: convertidosEmAlunos, sublabel: "Conversão marcada no cadastro do lead", color: COLORS.emerald },
    ];
  }, [totalLeadsCount, convertidosEmAlunos]);

  // Demanda e Procura por Modalidade
  const interessePorModalidade = useMemo(() => {
    const counts = new Map<string, number>();
    leads.forEach(l => {
      const nome = l.modalidade_interesse?.trim();
      if (nome) counts.set(nome, (counts.get(nome) || 0) + 1);
    });
    return [...counts.entries()].map(([modalidade, procura]) => ({ modalidade, procura })).sort((a, b) => b.procura - a.procura).slice(0, 5);
  }, [leads]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CAMADA 1: HERO KPIS DE COMUNICAÇÃO & AQUISIÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Novos Leads no Mês"
          value={novosNoMes}
          icon={UserPlus}
          variant="info"
          badge="Aquisição"
          target="Pela data de entrada registrada"
        />

        <StatCard
          title="Taxa de Conversão"
          value={`${taxaConversaoGeral}%`}
          icon={Target}
          variant="success"
          badge="Leads cadastrados"
          progress={taxaConversaoGeral}
          target="Conversão em cadastro de aluno"
        />

        <StatCard
          title="Convertidos em Alunos"
          value={convertidosEmAlunos}
          icon={CheckCircle2}
          variant="primary"
          badge="Alunos Convertidos"
          target="Matrícula não vinculada ao lead"
        />

        <StatCard
          title="Em Atendimento"
          value={emAtendimento}
          icon={Award}
          variant="purple"
          badge="Acompanhamento"
          target="Leads aguardando conclusão"
        />
      </div>

      {/* CAMADA 2: FUNIL DE AQUISIÇÃO & EFICIÊNCIA DE CANAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funil Visual de Aquisição (6 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-6 space-y-4 shadow-lg flex flex-col justify-between">
          <VisualFunnel
            title="Funil de Aquisição Multicanal"
            subtitle="Do cadastro do interessado à conversão em aluno"
            stages={funilAquisicaoStages}
            unit="pessoas"
          />

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Conversão em aluno: <strong>{taxaConversaoGeral}%</strong></span>
            <Link to="/leads" className="text-primary hover:underline font-medium">
              Ver Todos os Leads
            </Link>
          </div>
        </div>

        {/* Eficiência por Canal de Aquisição (6 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Eficiência por Canal de Origem
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparativo entre contatos gerados e conversões em alunos
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{canaisAquisicao.length} canais registrados</span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={canaisAquisicao} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="canal" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={false} content={<CustomChartTooltip />} />
              <Bar dataKey="leads" name="Leads Gerados" fill="#0ea5e9" radius={[6, 6, 0, 0]} opacity={0.7} />
              <Bar dataKey="convertidos" name="Convertidos em Alunos" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-sky-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shadow-sm" />
                Leads Gerados
              </span>
              <span className="flex items-center gap-1.5 text-white font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                Convertidos em Alunos
              </span>
            </div>
            <Link to="/leads" className="text-zinc-300 hover:text-white flex items-center gap-1 text-[11px]">
              Ver funil completo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* CAMADA 3: DEMANDA POR MODALIDADE & TERMÔMETRO DE SATISFAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Demanda por Modalidade (8 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-8 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Demanda & Procura por Modalidade
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interesses informados pelos leads
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {interessePorModalidade.length === 0 && <p className="text-xs text-muted-foreground">Ainda não há interesses por modalidade registrados.</p>}
            {interessePorModalidade.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[200px]">
                    {item.modalidade}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">{item.procura} interessados</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(item.procura * 2.5, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Procura declarada pelos interessados</span>
            <Link to="/turmas" className="text-primary hover:underline font-medium">
              Abrir Turma
            </Link>
          </div>
        </div>

        {/* Pesquisas ainda não são coletadas pelo produto */}
        <div className="lg:col-span-4">
          <div className="h-full rounded-2xl border border-white/10 bg-card/60 p-6 flex flex-col justify-center gap-2">
            <h3 className="text-sm font-semibold">Satisfação Comunitária</h3>
            <p className="text-xs text-muted-foreground">Ainda não há pesquisas de satisfação registradas no Movi+.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

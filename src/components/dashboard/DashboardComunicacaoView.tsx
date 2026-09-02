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
import { STORES, type Lead, type Matricula, type Modalidade } from "@/lib/store";
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
  const { data: matriculas } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);

  const totalLeadsCount = leads.length || 48;
  const matriculasConvertidas = leads.filter(l => l.converteu_em_aluno || l.status_lead === "CONVERTIDO").length || 19;
  const taxaConversaoGeral = Math.round((matriculasConvertidas / (totalLeadsCount || 1)) * 100);

  // Eficiência por Canal de Aquisição (Leads vs Matrículas)
  const canaisAquisicao = useMemo(() => {
    return [
      { canal: "Instagram", leads: 22, matriculas: 7, taxa: "32%" },
      { canal: "Indicação de Alunos", leads: 14, matriculas: 10, taxa: "71%" },
      { canal: "WhatsApp / Site", leads: 8, matriculas: 3, taxa: "38%" },
      { canal: "Eventos Comunitários", leads: 6, matriculas: 4, taxa: "67%" },
    ];
  }, []);

  // Funil de Aquisição Multicanal para VisualFunnel
  const funilAquisicaoStages = useMemo(() => {
    return [
      { label: "1. Alcance de Campanhas", count: 4260, sublabel: "Pessoas impactadas nas redes", color: COLORS.sky },
      { label: "2. Cliques no Link / Anúncios", count: 280, sublabel: "Visitas à página de inscrição", color: COLORS.indigo },
      { label: "3. Leads e Contatos Gerados", count: totalLeadsCount, sublabel: "Formulários e mensagens recebidas", color: COLORS.purple },
      { label: "4. Matrículas Concretizadas", count: matriculasConvertidas, sublabel: "Alunos com cadastro ativo", color: COLORS.emerald },
    ];
  }, [totalLeadsCount, matriculasConvertidas]);

  // Demanda e Procura por Modalidade
  const interessePorModalidade = useMemo(() => {
    return [
      { modalidade: "Dança / Ballet", procura: 38, vagasLivres: 8 },
      { modalidade: "Pilates", procura: 32, vagasLivres: 4 },
      { modalidade: "Karatê / Lutas", procura: 24, vagasLivres: 12 },
      { modalidade: "Música / Violão", procura: 18, vagasLivres: 15 },
      { modalidade: "Condicionamento", procura: 15, vagasLivres: 10 },
    ];
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CAMADA 1: HERO KPIS DE COMUNICAÇÃO & AQUISIÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Novos Leads no Mês"
          value={totalLeadsCount}
          icon={UserPlus}
          variant="info"
          badge="Aquisição"
          trend="+28% em relação ao mês anterior"
          trendType="positive"
          target="Meta do Mês: 50 contatos"
        />

        <StatCard
          title="Taxa de Conversão"
          value={`${taxaConversaoGeral}%`}
          icon={Target}
          variant="success"
          badge="Alta Eficiência"
          progress={taxaConversaoGeral}
          trend="Indicação é o canal líder (71% conv.)"
          trendType="positive"
          target="Benchmark: > 30%"
        />

        <StatCard
          title="Matrículas via Mídia"
          value={matriculasConvertidas}
          icon={CheckCircle2}
          variant="primary"
          badge="Alunos Convertidos"
          trend={`R$ ${(matriculasConvertidas * 120).toLocaleString("pt-BR")} em novas receitas`}
          trendType="positive"
          target="Retorno Imediato"
        />

        <StatCard
          title="Satisfação Comunitária"
          value="9.2 / 10"
          icon={Award}
          variant="purple"
          badge="Excelente Reputação"
          trend="Baseado em 84 avaliações do projeto"
          trendType="positive"
          target="Comunidade Engajada"
        />
      </div>

      {/* CAMADA 2: FUNIL DE AQUISIÇÃO & EFICIÊNCIA DE CANAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funil Visual de Aquisição (6 Colunas) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-6 space-y-4 shadow-lg flex flex-col justify-between">
          <VisualFunnel
            title="Funil de Aquisição Multicanal"
            subtitle="Do alcance das campanhas até a matrícula efetivada"
            stages={funilAquisicaoStages}
            unit="pessoas"
          />

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Conversão Lead ➡️ Matrícula: <strong>{taxaConversaoGeral}%</strong></span>
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
                Comparativo entre contatos gerados e matrículas fechadas
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              Top Canal: Indicação (71%)
            </span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={canaisAquisicao} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="canal" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={false} content={<CustomChartTooltip />} />
              <Bar dataKey="leads" name="Leads Gerados" fill="#0ea5e9" radius={[6, 6, 0, 0]} opacity={0.7} />
              <Bar dataKey="matriculas" name="Matrículas Fechadas" fill="#10b981" radius={[6, 6, 0, 0]} />
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
                Matrículas Fechadas
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
              Identificação de turmas com demanda reprimida vs vagas disponíveis
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {interessePorModalidade.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[200px]">
                    {item.modalidade}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">{item.procura} interessados</span>
                    <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {item.vagasLivres} vagas
                    </span>
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
            <span>Oportunidade: Abrir novas turmas de Dança & Pilates</span>
            <Link to="/turmas" className="text-primary hover:underline font-medium">
              Abrir Turma
            </Link>
          </div>
        </div>

        {/* Gauge de Satisfação / Reputação (4 Colunas) */}
        <div className="lg:col-span-4">
          <RadialGauge
            title="Termômetro de Reputação"
            subtitle="Avaliação da comunidade escolar"
            value={92}
            unit="%"
            target={85}
            targetLabel="Meta"
            statusText="Altíssima Satisfação"
          />
        </div>
      </div>
    </div>
  );
}

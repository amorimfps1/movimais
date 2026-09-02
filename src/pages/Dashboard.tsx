import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, GraduationCap,
  Dumbbell, Megaphone, Users, Plus, ClipboardCheck,
  CreditCard, Sparkles, Filter
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import DashboardGeral from "@/components/dashboard/DashboardGeral";
import DashboardFinanceiroView from "@/components/dashboard/DashboardFinanceiroView";
import DashboardCoordenacaoView from "@/components/dashboard/DashboardCoordenacaoView";
import DashboardInstrutorView from "@/components/dashboard/DashboardInstrutorView";
import DashboardComunicacaoView from "@/components/dashboard/DashboardComunicacaoView";

type DashboardTab = "geral" | "financeiro" | "coordenacao" | "instrutor" | "comunicacao";

const TABS: Array<{
  id: DashboardTab;
  label: string;
  sublabel: string;
  icon: any;
  badge?: string;
  color: string;
}> = [
  {
    id: "geral",
    label: "Geral",
    sublabel: "Visão 360° da Gestão",
    icon: LayoutDashboard,
    badge: "Principal",
    color: "text-primary",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    sublabel: "Fluxo de Caixa & Inadimplência",
    icon: TrendingUp,
    badge: "Controladoria",
    color: "text-emerald-400",
  },
  {
    id: "coordenacao",
    label: "Coordenação",
    sublabel: "Pedagógico & Retenção",
    icon: GraduationCap,
    badge: "Ação Rápida",
    color: "text-amber-400",
  },
  {
    id: "instrutor",
    label: "Instrutor",
    sublabel: "Turmas, Chamada & Repasse",
    icon: Dumbbell,
    badge: "Sala de Aula",
    color: "text-purple-400",
  },
  {
    id: "comunicacao",
    label: "Comunicação",
    sublabel: "Aquisição, Leads & NPS",
    icon: Megaphone,
    badge: "Marketing",
    color: "text-sky-400",
  },
];

export default function Dashboard() {
  const { roles, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("geral");

  // Define a aba inicial inteligente com base no perfil do usuário
  useEffect(() => {
    if (!isAdmin && roles.includes("instrutor") && !roles.includes("coordenacao") && !roles.includes("secretaria")) {
      setActiveTab("instrutor");
    } else if (roles.includes("coordenacao") && !roles.includes("secretaria") && !isAdmin) {
      setActiveTab("coordenacao");
    }
  }, [roles, isAdmin]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* CABEÇALHO COM AÇÕES RÁPIDAS */}
      <PageHeader
        title="Painel de Inteligência & KPIs"
        description="Centro de monitoramento operacional, pedagógico e financeiro do MOVI+ (~500 alunos)"
        badge="Ao Vivo"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/alunos">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl border-white/10 hover:bg-white/5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Alunos</span>
              </Button>
            </Link>
            <Link to="/presencas">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl border-white/10 hover:bg-white/5">
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Chamada</span>
              </Button>
            </Link>
            <Link to="/matriculas">
              <Button size="sm" className="text-xs gap-1.5 rounded-xl shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Matrícula</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* SELETOR DE PERFIS / TABS ANALÍTICAS */}
      <div className="p-1.5 rounded-2xl bg-card/60 border border-white/10 backdrop-blur-xl flex items-center gap-1.5 overflow-x-auto custom-scrollbar shadow-lg">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-300 shrink-0 text-left cursor-pointer ${
                isActive
                  ? "bg-white/10 text-white font-bold border border-white/20 shadow-md shadow-black/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-transform duration-300 ${
                  isActive ? "bg-white/15 scale-105" : "bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
              </div>
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs tracking-wide">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        isActive
                          ? "bg-primary/30 text-primary-foreground border border-primary/40"
                          : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-normal hidden md:block">
                  {tab.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* RENDERIZAÇÃO DO PAINEL ATIVO */}
      <div className="transition-all duration-300">
        {activeTab === "geral" && <DashboardGeral />}
        {activeTab === "financeiro" && <DashboardFinanceiroView />}
        {activeTab === "coordenacao" && <DashboardCoordenacaoView />}
        {activeTab === "instrutor" && <DashboardInstrutorView />}
        {activeTab === "comunicacao" && <DashboardComunicacaoView />}
      </div>
    </div>
  );
}

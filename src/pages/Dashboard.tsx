import { Users, UserPlus, GraduationCap, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { getAll, STORES, type Aluno, type Lead, type Matricula, type Pagamento } from "@/lib/store";
import StatusBadge from "@/components/StatusBadge";

export default function Dashboard() {
  const alunos = getAll<Aluno>(STORES.ALUNOS);
  const leads = getAll<Lead>(STORES.LEADS);
  const matriculas = getAll<Matricula>(STORES.MATRICULAS);
  const pagamentos = getAll<Pagamento>(STORES.PAGAMENTOS);

  const matriculasAtivas = matriculas.filter(m => m.status_matricula === "ATIVA").length;
  const pagamentosPendentes = pagamentos.filter(p => ["PENDENTE", "ATRASADO"].includes(p.status_pagamento)).length;
  const receitaMes = pagamentos
    .filter(p => p.status_pagamento === "PAGO")
    .reduce((sum, p) => sum + (p.valor_pago || 0), 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral do sistema MOVI+" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Alunos" value={alunos.length} icon={Users} variant="primary" />
        <StatCard title="Matrículas Ativas" value={matriculasAtivas} icon={GraduationCap} variant="success" />
        <StatCard title="Leads" value={leads.length} icon={UserPlus} variant="info" />
        <StatCard title="Pgtos Pendentes" value={pagamentosPendentes} icon={AlertTriangle} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Receita Total Recebida</h3>
          <p className="text-4xl font-bold text-gradient">
            R$ {receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-success text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Pagamentos confirmados</span>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Últimas Matrículas</h3>
          {matriculas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma matrícula registrada</p>
          ) : (
            <div className="space-y-3">
              {matriculas.slice(-5).reverse().map(m => {
                const aluno = alunos.find(a => a.id === m.id_aluno);
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{aluno?.nome_completo || "—"}</p>
                      <p className="text-xs text-muted-foreground">{m.data_inicio}</p>
                    </div>
                    <StatusBadge status={m.status_matricula} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

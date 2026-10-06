import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CreditCard, DollarSign, Receipt, ArrowUpRight } from "lucide-react";
import StatCard from "@/components/StatCard";
import { STORES, type Pagamento } from "@/lib/store";
import { useTable } from "@/hooks/useTable";

const moeda = (valor: number) => `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardFinanceiroView() {
  const { data: pagamentos, loading } = useTable<Pagamento>(STORES.PAGAMENTOS);
  const mesAtual = new Date().toISOString().slice(0, 7);

  const resumo = useMemo(() => {
    const pagos = pagamentos.filter(p => p.status_pagamento === "PAGO");
    const recebidosMes = pagos.filter(p => p.data_pagamento?.startsWith(mesAtual));
    const pendentes = pagamentos.filter(p => p.status_pagamento === "PENDENTE" || p.status_pagamento === "PREVISTO");
    const marcadosAtrasados = pagamentos.filter(p => p.status_pagamento === "ATRASADO");

    return {
      recebidoMes: recebidosMes.reduce((total, p) => total + (Number(p.valor_pago) || 0), 0),
      pendente: pendentes.reduce((total, p) => total + (Number(p.valor_previsto) || 0), 0),
      marcadoAtrasado: marcadosAtrasados.reduce((total, p) => total + (Number(p.valor_previsto) || 0), 0),
      pagamentosRecebidosMes: recebidosMes.length,
      semVinculo: pagamentos.filter(p => !p.id_matricula).length,
    };
  }, [pagamentos, mesAtual]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <p className="text-xs text-muted-foreground">
        Valores calculados a partir dos lançamentos registrados. A identificação automática de vencidos e a regra de repasse ainda dependem da consolidação financeira.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Recebido no mês"
          value={loading ? "Carregando" : moeda(resumo.recebidoMes)}
          icon={DollarSign}
          variant="success"
          badge="Data do pagamento"
          target={`${resumo.pagamentosRecebidosMes} lançamentos pagos no mês`}
        />
        <StatCard
          title="Pendente registrado"
          value={loading ? "Carregando" : moeda(resumo.pendente)}
          icon={CreditCard}
          variant="info"
          badge="Todos os períodos"
          target="Status pendente ou previsto"
        />
        <StatCard
          title="Marcado como atrasado"
          value={loading ? "Carregando" : moeda(resumo.marcadoAtrasado)}
          icon={AlertTriangle}
          variant={resumo.marcadoAtrasado > 0 ? "warning" : "default"}
          badge="Todos os períodos"
          target="O atraso ainda não é calculado pelo vencimento"
        />
        <StatCard
          title="Sem vínculo com matrícula"
          value={loading ? "Carregando" : resumo.semVinculo}
          icon={Receipt}
          variant={resumo.semVinculo > 0 ? "warning" : "default"}
          badge="Revisão necessária"
          target="Pode afetar relatórios por modalidade"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/60 p-6 space-y-3">
        <h3 className="text-sm font-semibold">Próximas ações financeiras</h3>
        <p className="text-xs text-muted-foreground">
          Revise os lançamentos sem matrícula e os pagamentos marcados como atrasados. A conciliação por competência e o repasse de instrutores serão exibidos após a definição das respectivas regras.
        </p>
        <div className="flex flex-wrap gap-4 text-xs">
          <Link to="/pagamentos" className="text-primary hover:underline inline-flex items-center gap-1">
            Abrir pagamentos <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link to="/financeiro" className="text-primary hover:underline inline-flex items-center gap-1">
            Abrir análise financeira <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

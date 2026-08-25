import { cn } from "@/lib/utils";

interface StatusConfig {
  label?: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const statusMap: Record<string, StatusConfig> = {
  // Positivos / Ativos
  ATIVO: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  ATIVA: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  CONVERTIDO: { label: "Convertido", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  PAGO: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  REALIZADA: { label: "Realizada", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },

  // Informativos / Em Progresso
  NOVO: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30", dot: "bg-sky-400" },
  EM_ATENDIMENTO: { label: "Em Atendimento", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
  AGUARDANDO_RETORNO: { label: "Aguardando Retorno", bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30", dot: "bg-indigo-400" },
  AGENDADA: { label: "Agendada", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
  EXPERIMENTAL: { label: "Experimental", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", dot: "bg-purple-400" },
  REPOSICAO: { label: "Reposição", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30", dot: "bg-cyan-400" },
  PREVISTO: { label: "Previsto", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },

  // Alertas / Pendentes
  PENDENTE: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
  PENDENTE_LIBERACAO: { label: "Pendente Liberação", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
  SUSPENSA_30_DIAS: { label: "Suspensa (30d)", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
  TRANCADA_JUSTIFICADA: { label: "Trancada", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-400" },
  NEGOCIADO: { label: "Negociado", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },

  // Negativos / Bloqueados / Inativos
  ATRASADO: { label: "Atrasado", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", dot: "bg-rose-400" },
  CANCELADA: { label: "Cancelada", bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
  CANCELADO: { label: "Cancelado", bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
  NAO_CONVERTIDO: { label: "Não Convertido", bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
  BLOQUEADA_INADIMPLENCIA: { label: "Inadimplente", bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/40", dot: "bg-rose-400" },
  INATIVO: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
  INATIVA: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
  ISENTO: { label: "Isento", bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30", dot: "bg-teal-400" },
  ESTORNADO: { label: "Estornado", bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
};

export default function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return null;

  const key = String(status).toUpperCase();
  const cfg = statusMap[key] || {
    label: status.replace(/_/g, " "),
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/20",
    dot: "bg-zinc-400",
  };

  const displayText = cfg.label || status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide border shadow-xs select-none",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 shadow-xs animate-pulse", cfg.dot)} />
      <span className="capitalize">{displayText}</span>
    </span>
  );
}

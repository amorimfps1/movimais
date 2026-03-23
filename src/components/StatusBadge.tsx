import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  ATIVO: "bg-success/15 text-success border-success/30",
  ATIVA: "bg-success/15 text-success border-success/30",
  CONVERTIDO: "bg-success/15 text-success border-success/30",
  PAGO: "bg-success/15 text-success border-success/30",
  NOVO: "bg-info/15 text-info border-info/30",
  EM_ATENDIMENTO: "bg-info/15 text-info border-info/30",
  PENDENTE: "bg-warning/15 text-warning border-warning/30",
  PENDENTE_LIBERACAO: "bg-warning/15 text-warning border-warning/30",
  ATRASADO: "bg-destructive/15 text-destructive border-destructive/30",
  CANCELADA: "bg-destructive/15 text-destructive border-destructive/30",
  CANCELADO: "bg-destructive/15 text-destructive border-destructive/30",
  NAO_CONVERTIDO: "bg-destructive/15 text-destructive border-destructive/30",
  INATIVO: "bg-muted text-muted-foreground border-border",
  BLOQUEADA_INADIMPLENCIA: "bg-destructive/15 text-destructive border-destructive/30",
  SUSPENSA_30_DIAS: "bg-warning/15 text-warning border-warning/30",
  EXPERIMENTAL: "bg-primary/15 text-primary border-primary/30",
};

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status] || "bg-secondary text-secondary-foreground border-border";
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", colorClass)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

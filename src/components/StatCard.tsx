import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

const variantClasses = {
  default: "bg-card border-border",
  primary: "bg-primary/10 border-primary/20",
  success: "bg-success/10 border-success/20",
  warning: "bg-warning/10 border-warning/20",
  info: "bg-info/10 border-info/20",
};

const iconVariants = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

export default function StatCard({ title, value, icon: Icon, trend, variant = "default" }: Props) {
  return (
    <div className={cn("glass-card p-5 flex items-start justify-between", variantClasses[variant])}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </div>
      <div className={cn("p-2.5 rounded-lg bg-background/50", iconVariants[variant])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

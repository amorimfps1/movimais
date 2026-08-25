import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  variant?: "default" | "primary" | "success" | "warning" | "info" | "purple";
  className?: string;
}

const variantStyles = {
  default: {
    card: "border-white/5 bg-card/60 hover:border-white/10",
    iconBg: "bg-white/5 text-muted-foreground",
    glow: "group-hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]",
  },
  primary: {
    card: "border-primary/20 bg-card/70 hover:border-primary/40",
    iconBg: "bg-primary/10 text-primary border border-primary/20",
    glow: "hover:shadow-[0_0_25px_rgba(220,38,38,0.12)]",
  },
  success: {
    card: "border-emerald-500/20 bg-card/70 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]",
  },
  warning: {
    card: "border-amber-500/20 bg-card/70 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.12)]",
  },
  info: {
    card: "border-sky-500/20 bg-card/70 hover:border-sky-500/40",
    iconBg: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(14,165,233,0.12)]",
  },
  purple: {
    card: "border-purple-500/20 bg-card/70 hover:border-purple-500/40",
    iconBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.12)]",
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendType = "neutral",
  variant = "default",
  className,
}: Props) {
  const cfg = variantStyles[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300",
        cfg.card,
        cfg.glow,
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground/95">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-1 flex items-center gap-1",
                trendType === "positive" && "text-emerald-400",
                trendType === "negative" && "text-rose-400",
                trendType === "neutral" && "text-muted-foreground"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm", cfg.iconBg)}>
          <Icon className="w-5 h-5 stroke-[1.8]" />
        </div>
      </div>
    </div>
  );
}

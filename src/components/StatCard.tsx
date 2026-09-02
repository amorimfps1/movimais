import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  variant?: "default" | "primary" | "success" | "warning" | "info" | "purple";
  badge?: string;
  subtitle?: string;
  progress?: number; // 0 to 100
  target?: ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    card: "border-white/5 bg-card/60 hover:border-white/10",
    iconBg: "bg-white/5 text-muted-foreground",
    glow: "group-hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]",
    progressBar: "bg-zinc-400",
  },
  primary: {
    card: "border-primary/20 bg-card/70 hover:border-primary/40",
    iconBg: "bg-primary/10 text-primary border border-primary/20",
    glow: "hover:shadow-[0_0_25px_rgba(220,38,38,0.12)]",
    progressBar: "bg-primary",
  },
  success: {
    card: "border-emerald-500/20 bg-card/70 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]",
    progressBar: "bg-emerald-500",
  },
  warning: {
    card: "border-amber-500/20 bg-card/70 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.12)]",
    progressBar: "bg-amber-500",
  },
  info: {
    card: "border-sky-500/20 bg-card/70 hover:border-sky-500/40",
    iconBg: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(14,165,233,0.12)]",
    progressBar: "bg-sky-500",
  },
  purple: {
    card: "border-purple-500/20 bg-card/70 hover:border-purple-500/40",
    iconBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.12)]",
    progressBar: "bg-purple-500",
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendType = "neutral",
  variant = "default",
  badge,
  subtitle,
  progress,
  target,
  className,
  onClick,
}: Props) {
  const cfg = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between",
        cfg.card,
        cfg.glow,
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {title}
            </p>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/10 text-foreground border border-white/10">
                {badge}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground/95 truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm", cfg.iconBg)}>
          <Icon className="w-5 h-5 stroke-[1.8]" />
        </div>
      </div>

      {(progress !== undefined || trend || target) && (
        <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Progresso / Meta</span>
                <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", cfg.progressBar)}
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
            {trend && (
              <p
                className={cn(
                  "font-medium flex items-center gap-1",
                  trendType === "positive" && "text-emerald-400",
                  trendType === "negative" && "text-rose-400",
                  trendType === "neutral" && "text-muted-foreground"
                )}
              >
                {trend}
              </p>
            )}
            {target && (
              <span className="text-[11px] text-zinc-400 font-medium ml-auto">
                {target}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

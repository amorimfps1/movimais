import { FC } from "react";
import { ArrowDown, TrendingDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FunnelStage {
  label: string;
  count: number;
  sublabel?: string;
  color?: string;
  icon?: any;
}

interface VisualFunnelProps {
  title?: string;
  subtitle?: string;
  stages: FunnelStage[];
  unit?: string;
  className?: string;
}

export const VisualFunnel: FC<VisualFunnelProps> = ({
  title,
  subtitle,
  stages,
  unit = "contatos",
  className,
}) => {
  if (!stages || stages.length === 0) return null;

  const maxVal = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className={cn("space-y-4", className)}>
      {(title || subtitle) && (
        <div>
          {title && (
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {stages.map((stage, idx) => {
          const pctOfMax = Math.max(Math.round((stage.count / maxVal) * 100), 12);
          const prevStage = idx > 0 ? stages[idx - 1] : null;
          const convRate = prevStage && prevStage.count > 0
            ? Math.round((stage.count / prevStage.count) * 100)
            : 100;
          const dropoffRate = 100 - convRate;

          const defaultColor =
            idx === 0
              ? "#0ea5e9" // Sky
              : idx === 1
              ? "#8b5cf6" // Purple
              : idx === 2
              ? "#10b981" // Emerald
              : "#f59e0b"; // Amber

          const stageColor = stage.color || defaultColor;

          return (
            <div key={idx} className="space-y-1 group">
              {/* Dropoff indicator between stages */}
              {prevStage && (
                <div className="flex items-center justify-between px-3 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-zinc-500" />
                    <span>Conversão: <strong className="text-emerald-400">{convRate}%</strong></span>
                  </div>
                  {dropoffRate > 0 && (
                    <span className="text-rose-400/90 flex items-center gap-0.5">
                      <TrendingDown className="w-2.5 h-2.5" />
                      Perda: -{dropoffRate}%
                    </span>
                  )}
                </div>
              )}

              {/* Stage Card */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 group-hover:border-white/15 transition-all space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: stageColor }}
                    />
                    <span className="font-semibold text-foreground">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {stage.count.toLocaleString("pt-BR")} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>
                    </span>
                    {idx === stages.length - 1 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Convertido
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-zinc-300 border border-white/10">
                        {Math.round((stage.count / (stages[0].count || 1)) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar with Gradient and Width Proportion */}
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-1.5"
                    style={{
                      width: `${pctOfMax}%`,
                      backgroundColor: stageColor,
                    }}
                  />
                </div>

                {stage.sublabel && (
                  <p className="text-[10px] text-muted-foreground">{stage.sublabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisualFunnel;


import { FC } from "react";
import { cn } from "@/lib/utils";

interface BulletProgressBarProps {
  label: string;
  sublabel?: string;
  actual: number; // Current value (e.g. 14 classes taught)
  target: number; // Target value (e.g. 16 classes planned)
  max?: number;
  unit?: string;
  badge?: string;
  className?: string;
}

export const BulletProgressBar: FC<BulletProgressBarProps> = ({
  label,
  sublabel,
  actual,
  target,
  max,
  unit = "aulas",
  badge,
  className,
}) => {
  const maxScale = max || Math.max(target * 1.2, actual * 1.1, 1);
  const actualPct = Math.min((actual / maxScale) * 100, 100);
  const targetPct = Math.min((target / maxScale) * 100, 100);
  const completionPct = Math.round((actual / (target || 1)) * 100);

  const isComplete = actual >= target;

  return (
    <div className={cn("p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-foreground">{label}</span>
          {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">
            {actual} / {target} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>
          </span>
          {badge ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-foreground border border-white/10">
              {badge}
            </span>
          ) : (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                isComplete
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-sky-500/20 text-sky-300 border-sky-500/30"
              )}
            >
              {completionPct}% Concluído
            </span>
          )}
        </div>
      </div>

      {/* Bullet Bar Container */}
      <div className="relative w-full h-4 rounded-lg bg-white/5 overflow-hidden flex items-center">
        {/* Qualitative Background Ranges */}
        <div className="absolute inset-0 flex">
          <div className="w-[60%] h-full bg-white/[0.03]" />
          <div className="w-[25%] h-full bg-white/[0.06]" />
          <div className="w-[15%] h-full bg-white/[0.09]" />
        </div>

        {/* Actual Progress Bar */}
        <div
          className={cn(
            "h-2.5 rounded-md transition-all duration-700 ease-out z-10 ml-0.5",
            isComplete ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-gradient-to-r from-sky-500 to-emerald-500"
          )}
          style={{ width: `${actualPct}%` }}
        />

        {/* Target Marker Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-amber-400 z-20 shadow-md shadow-amber-500/50 rounded-full"
          style={{ left: `${targetPct}%` }}
          title={`Meta Prevista: ${target} ${unit}`}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
        <span>0</span>
        <span className="text-amber-400 font-medium">Meta: {target} {unit}</span>
        <span>Max: {Math.round(maxScale)}</span>
      </div>
    </div>
  );
};

export default BulletProgressBar;


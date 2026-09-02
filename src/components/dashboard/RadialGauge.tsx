import React, { FC } from "react";
import { cn } from "@/lib/utils";

interface RadialGaugeProps {
  title?: string;
  subtitle?: string;
  value: number; // e.g. 84 or 87
  min?: number; // e.g. 0 or -100
  max?: number; // e.g. 100
  unit?: string; // e.g. "%" or "pts"
  target?: number; // e.g. 80
  targetLabel?: string;
  statusText?: string;
  thresholds?: {
    warning: number;
    success: number;
  };
  className?: string;
}

export const RadialGauge: FC<RadialGaugeProps> = ({
  title,
  subtitle,
  value,
  min = 0,
  max = 100,
  unit = "%",
  target,
  targetLabel = "Meta",
  statusText,
  thresholds = { warning: 70, success: 85 },
  className,
}) => {
  // Normalize value to 0..100%
  const clampedVal = Math.min(Math.max(value, min), max);
  const normalizedPct = ((clampedVal - min) / (max - min)) * 100;

  // Arc calculation for semi-circle (SVG path)
  const radius = 70;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle circumference
  const strokeDashoffset = circumference - (normalizedPct / 100) * circumference;

  // Semantic color based on thresholds
  let strokeColor = "#10b981"; // Emerald
  let badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

  if (clampedVal < thresholds.warning) {
    strokeColor = "#f43f5e"; // Rose
    badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
  } else if (clampedVal < thresholds.success) {
    strokeColor = "#f59e0b"; // Amber
    badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }

  return (
    <div className={cn("p-5 rounded-2xl bg-card/60 border border-white/10 backdrop-blur-xl shadow-lg flex flex-col justify-between items-center text-center relative overflow-hidden", className)}>
      {title && (
        <div className="w-full text-left mb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* SVG Semicircle Gauge */}
      <div className="relative flex items-center justify-center my-2">
        <svg width="180" height="110" viewBox="0 0 180 110" className="overflow-visible">
          {/* Background Track */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress Arc */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Metric Text */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {value}
            <span className="text-base font-normal text-muted-foreground ml-0.5">{unit}</span>
          </span>
          {statusText && (
            <span className={cn("mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", badgeColor)}>
              {statusText}
            </span>
          )}
        </div>
      </div>

      {/* Min / Max / Target Labels */}
      <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-white/5 px-2">
        <span>Min: {min}{unit}</span>
        {target !== undefined && (
          <span className="font-medium text-amber-400">
            {targetLabel}: {target}{unit}
          </span>
        )}
        <span>Max: {max}{unit}</span>
      </div>
    </div>
  );
};

export default RadialGauge;


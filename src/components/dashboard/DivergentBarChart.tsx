import { FC } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from "recharts";
import { CustomChartTooltip } from "./CustomChartTooltips";
import { cn } from "@/lib/utils";

export interface DivergentDataItem {
  label: string; // e.g. "Jan", "Fev"
  labelCompleto?: string;
  positive: number; // e.g. 18 new students or R$ 15.000 in revenue
  negative: number; // e.g. -4 cancellations or -R$ 7.500 in expenses
  net?: number;
}

interface DivergentBarChartProps {
  title?: string;
  subtitle?: string;
  data: DivergentDataItem[];
  positiveName?: string;
  negativeName?: string;
  unit?: string;
  isCurrency?: boolean;
  className?: string;
}

export const DivergentBarChart: FC<DivergentBarChartProps> = ({
  title,
  subtitle,
  data,
  positiveName = "Novas Entradas",
  negativeName = "Cancelamentos / Saídas",
  unit = "",
  isCurrency = false,
  className,
}) => {
  const chartData = data.map((d) => ({
    ...d,
    negativeVal: -Math.abs(d.negative),
    net: d.positive - Math.abs(d.negative),
  }));

  const formatTick = (v: number) => {
    if (isCurrency) {
      const absVal = Math.abs(v);
      if (absVal >= 1000) return `${v < 0 ? "-" : ""}R$ ${(absVal / 1000).toFixed(0)}k`;
      return `${v < 0 ? "-" : ""}R$ ${absVal}`;
    }
    return `${v}`;
  };

  return (
    <div className={cn("p-5 rounded-2xl bg-card/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-4", className)}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            {title && <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
              {positiveName}
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
              {negativeName}
            </span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={chartData} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatTick} />
          <Tooltip
            cursor={false}
            content={
              <CustomChartTooltip
                valueFormatter={(val: any, key: any) => {
                  const num = Number(val) || 0;
                  const abs = Math.abs(num);
                  if (isCurrency) {
                    return `${num < 0 ? "-" : "+"}R$ ${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                  }
                  return `${num < 0 ? "-" : "+"}${abs} ${unit}`;
                }}
              />
            }
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
          <Bar dataKey="positive" name={positiveName} fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="negativeVal" name={negativeName} fill="#f43f5e" radius={[0, 0, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DivergentBarChart;


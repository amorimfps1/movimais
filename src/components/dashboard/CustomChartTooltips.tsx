import { formatDateToBR } from "@/lib/utils";

interface TooltipPayloadItem {
  name?: string;
  dataKey?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: any;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  valueFormatter?: (value: any, key?: string) => string;
  unit?: string;
}

export const CustomChartTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
  unit,
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const rawTitle = payload[0]?.payload?.labelCompleto || payload[0]?.payload?.data || payload[0]?.payload?.nome || payload[0]?.payload?.nome_modalidade || label;
  const title = typeof rawTitle === "string" && rawTitle.includes("-") && !rawTitle.includes(" ") ? formatDateToBR(rawTitle) : rawTitle;

  return (
    <div className="bg-zinc-950/95 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[160px] z-50 animate-in fade-in zoom-in-95 duration-150">
      {title && (
        <p className="font-bold text-white border-b border-white/15 pb-1 mb-1.5 text-xs tracking-wide">
          {String(title)}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const val = entry.value;
          const key = entry.dataKey || "";
          let formattedVal = "";

          if (valueFormatter) {
            formattedVal = valueFormatter(val, key);
          } else if (typeof val === "number") {
            const isCurrency = key.toLowerCase().includes("receit") || key.toLowerCase().includes("valor") || key.toLowerCase().includes("pago") || key.toLowerCase().includes("previsto") || key.toLowerCase().includes("custo") || key.toLowerCase().includes("repasse");
            if (isCurrency) {
              formattedVal = `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else if (unit) {
              formattedVal = `${val} ${unit}`;
            } else {
              formattedVal = val.toLocaleString("pt-BR");
            }
          } else {
            formattedVal = String(val ?? "");
          }

          const name = entry.name || key;
          const color = entry.color || entry.fill || "#10b981";

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3 text-white">
              <span className="flex items-center gap-1.5 font-medium text-zinc-100">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-zinc-200">{name}:</span>
              </span>
              <span className="font-bold text-white tracking-tight">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CustomDonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const value = typeof item.value === "number" ? item.value.toLocaleString("pt-BR") : item.value;

  return (
    <div className="bg-zinc-950/95 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-xl text-xs min-w-[130px] z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between gap-3 text-white">
        <span className="flex items-center gap-1.5 font-medium text-zinc-100">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
            style={{ backgroundColor: item.payload?.fill || item.color || "#10b981" }}
          />
          <span className="text-zinc-200">{item.name}:</span>
        </span>
        <span className="font-bold text-white">{value}</span>
      </div>
    </div>
  );
};


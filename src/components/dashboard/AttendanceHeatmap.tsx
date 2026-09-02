import React, { FC, useState } from "react";
import { cn } from "@/lib/utils";

export interface HeatmapCell {
  day: string; // "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"
  shift: string; // "Manhã", "Tarde", "Noite"
  attendanceRate: number; // 0..100
  totalStudents: number;
  presentStudents: number;
}

interface AttendanceHeatmapProps {
  title?: string;
  subtitle?: string;
  data?: HeatmapCell[];
  className?: string;
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SHIFTS = ["Manhã", "Tarde", "Noite"];

export const AttendanceHeatmap: FC<AttendanceHeatmapProps> = ({
  title = "Mapa de Calor de Frequência Semanal",
  subtitle = "Distribuição da presença média por dia da semana e turno de aula",
  data,
  className,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Fallback mock data if not provided
  const cells: HeatmapCell[] = data || [
    { day: "Seg", shift: "Manhã", attendanceRate: 88, totalStudents: 45, presentStudents: 40 },
    { day: "Seg", shift: "Tarde", attendanceRate: 92, totalStudents: 60, presentStudents: 55 },
    { day: "Seg", shift: "Noite", attendanceRate: 85, totalStudents: 50, presentStudents: 42 },

    { day: "Ter", shift: "Manhã", attendanceRate: 95, totalStudents: 40, presentStudents: 38 },
    { day: "Ter", shift: "Tarde", attendanceRate: 90, totalStudents: 65, presentStudents: 58 },
    { day: "Ter", shift: "Noite", attendanceRate: 94, totalStudents: 55, presentStudents: 52 },

    { day: "Qua", shift: "Manhã", attendanceRate: 82, totalStudents: 45, presentStudents: 37 },
    { day: "Qua", shift: "Tarde", attendanceRate: 88, totalStudents: 60, presentStudents: 53 },
    { day: "Qua", shift: "Noite", attendanceRate: 86, totalStudents: 50, presentStudents: 43 },

    { day: "Qui", shift: "Manhã", attendanceRate: 91, totalStudents: 40, presentStudents: 36 },
    { day: "Qui", shift: "Tarde", attendanceRate: 93, totalStudents: 65, presentStudents: 60 },
    { day: "Qui", shift: "Noite", attendanceRate: 90, totalStudents: 55, presentStudents: 49 },

    { day: "Sex", shift: "Manhã", attendanceRate: 74, totalStudents: 45, presentStudents: 33 },
    { day: "Sex", shift: "Tarde", attendanceRate: 79, totalStudents: 60, presentStudents: 47 },
    { day: "Sex", shift: "Noite", attendanceRate: 68, totalStudents: 50, presentStudents: 34 },

    { day: "Sáb", shift: "Manhã", attendanceRate: 96, totalStudents: 70, presentStudents: 67 },
    { day: "Sáb", shift: "Tarde", attendanceRate: 84, totalStudents: 40, presentStudents: 34 },
    { day: "Sáb", shift: "Noite", attendanceRate: 50, totalStudents: 20, presentStudents: 10 },
  ];

  const getCell = (day: string, shift: string) => {
    return cells.find((c) => c.day === day && c.shift === shift) || {
      day,
      shift,
      attendanceRate: 80,
      totalStudents: 30,
      presentStudents: 24,
    };
  };

  const getCellColor = (rate: number) => {
    if (rate >= 90) return "bg-emerald-500/90 text-white font-bold";
    if (rate >= 80) return "bg-emerald-500/60 text-white font-semibold";
    if (rate >= 70) return "bg-amber-500/70 text-white font-semibold";
    return "bg-rose-500/80 text-white font-bold";
  };

  return (
    <div className={cn("p-5 rounded-2xl bg-card/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {/* Grid Matrix */}
      <div className="overflow-x-auto custom-scrollbar pb-1">
        <div className="min-w-[320px] space-y-1.5">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted-foreground">
            <div className="text-left text-[11px] font-normal pl-1">Turno</div>
            {DAYS.map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Rows for Shifts */}
          {SHIFTS.map((shift) => (
            <div key={shift} className="grid grid-cols-7 gap-1.5 items-center">
              <div className="text-[11px] font-medium text-muted-foreground truncate pl-1">
                {shift}
              </div>
              {DAYS.map((day) => {
                const cell = getCell(day, shift);
                return (
                  <div
                    key={`${day}-${shift}`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={cn(
                      "h-9 rounded-lg flex items-center justify-center text-xs transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg shadow-sm",
                      getCellColor(cell.attendanceRate)
                    )}
                  >
                    {cell.attendanceRate}%
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Hover Detail / Legend */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-[11px]">
        {hoveredCell ? (
          <div className="text-white font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {hoveredCell.day} ({hoveredCell.shift}): <strong>{hoveredCell.presentStudents} de {hoveredCell.totalStudents} alunos</strong> ({hoveredCell.attendanceRate}%)
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            Passe o mouse sobre os blocos para ver os detalhes
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-zinc-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-rose-500/80" /> &lt; 70%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-500/70" /> 70-79%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500/60" /> 80-89%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500/90" /> ≥ 90%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeatmap;


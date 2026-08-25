import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import {
  Pencil, Search, Trash2, Download, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown,
  X, Filter, SlidersHorizontal, Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  exportValue?: (item: T) => string | number;
  className?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  searchKeys?: string[];
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: (item: T) => React.ReactNode;
  exportFilename?: string;
  pageSizeDefault?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  headerSlot?: React.ReactNode;
}

type SortDirection = "asc" | "desc" | null;

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  searchKeys,
  searchPlaceholder = "Buscar registros...",
  filters = [],
  onEdit,
  onDelete,
  customActions,
  exportFilename = "exportacao",
  pageSizeDefault = 10,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Tente ajustar os filtros ou a busca para encontrar o que procura.",
  emptyAction,
  headerSlot,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  // Manipulação de Filtros
  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      if (value === "ALL" || !value) {
        delete next[filterKey];
      } else {
        next[filterKey] = value;
      }
      return next;
    });
    setPage(1);
  };

  const removeFilter = (filterKey: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[filterKey];
      return next;
    });
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch("");
    setActiveFilters({});
    setPage(1);
  };

  // Manipulação de Ordenação
  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(columnKey);
      setSortDirection("asc");
    }
  };

  // Filtragem
  const filtered = useMemo(() => {
    let result = [...data];

    // Busca textual
    if (search && searchKeys && searchKeys.length > 0) {
      const s = search.toLowerCase().trim();
      result = result.filter(item =>
        searchKeys.some(key => {
          const val = item[key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(s);
        })
      );
    }

    // Filtros dropdown ativos
    Object.entries(activeFilters).forEach(([fKey, fVal]) => {
      if (fVal) {
        result = result.filter(item => {
          const itemVal = item[fKey];
          if (typeof itemVal === "boolean") {
            return String(itemVal) === fVal;
          }
          return String(itemVal || "").toUpperCase() === fVal.toUpperCase();
        });
      }
    });

    // Ordenação
    if (sortKey && sortDirection) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const comp = String(valA).localeCompare(String(valB), "pt-BR", { numeric: true, sensitivity: "base" });
        return sortDirection === "asc" ? comp : -comp;
      });
    }

    return result;
  }, [data, search, searchKeys, activeFilters, sortKey, sortDirection]);

  // Paginação
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Exportação CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`);
    const rows = filtered.map(item => {
      return columns.map(c => {
        let val = c.exportValue ? c.exportValue(item) : item[c.key];
        if (val === null || val === undefined) val = "";
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${exportFilename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActions = !!(onEdit || onDelete || customActions);
  const hasActiveFilters = Object.keys(activeFilters).length > 0 || !!search;

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-300">
      
      {/* Barra de Filtros, Busca e Ações Superiores */}
      <div className="p-4 sm:p-5 border-b border-white/5 space-y-3.5 bg-card/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 flex-wrap">
          
          {/* Busca & Filtros Select */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px] flex-wrap">
            {searchKeys && searchKeys.length > 0 && (
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9.5 pr-8 bg-background/60 border-white/10 focus-visible:ring-primary/50 text-xs sm:text-sm h-9 rounded-xl"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                    title="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Dropdowns de Filtros Categóricos */}
            {filters.map((filter) => (
              <div key={filter.key} className="w-auto min-w-[140px]">
                <Select
                  value={activeFilters[filter.key] || "ALL"}
                  onValueChange={v => handleFilterChange(filter.key, v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/60 border-white/10 rounded-xl">
                    <div className="flex items-center gap-1.5 truncate">
                      <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{filter.label}:</span>
                      <SelectValue placeholder="Todos" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                    <SelectItem value="ALL" className="text-xs">Todos ({filter.label})</SelectItem>
                    {filter.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Botões de Ação na Direita */}
          <div className="flex items-center gap-2 shrink-0">
            {headerSlot}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="text-xs gap-1.5 bg-background/40 hover:bg-white/5 border-white/10 rounded-xl h-9 px-3.5"
              title="Exportar dados filtrados em planilha CSV"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        {/* Chips de Filtros Ativos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Filtros ativos:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px]">
                Busca: <strong>"{search}"</strong>
                <button onClick={() => { setSearch(""); setPage(1); }} className="hover:opacity-75 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {Object.entries(activeFilters).map(([fKey, fVal]) => {
              const filterDef = filters.find(f => f.key === fKey);
              const optDef = filterDef?.options.find(o => o.value === fVal);
              return (
                <span
                  key={fKey}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-foreground border border-white/10 text-[11px]"
                >
                  {filterDef?.label}: <strong>{optDef?.label || fVal}</strong>
                  <button onClick={() => removeFilter(fKey)} className="hover:text-destructive ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            <button
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground text-[11px] underline underline-offset-2 ml-1"
            >
              Limpar todos
            </button>

            <span className="text-muted-foreground/60 text-[11px] ml-auto">
              {filtered.length} de {data.length} registros
            </span>
          </div>
        )}
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent bg-white/[0.02]">
              {columns.map(col => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;
                return (
                  <TableHead
                    key={col.key}
                    onClick={() => canSort && handleSort(col.key)}
                    className={cn(
                      "text-[11px] uppercase tracking-wider text-muted-foreground font-semibold py-3.5 px-4 select-none",
                      canSort && "cursor-pointer hover:text-foreground transition-colors",
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {canSort && (
                        <span className="text-muted-foreground/70">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-70" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}

              {hasActions && (
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold w-28 text-right pr-5">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="text-center py-16"
                >
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground border border-white/10">
                      <Inbox className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-semibold text-foreground/90">{emptyTitle}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{emptyDescription}</p>
                    </div>
                    {emptyAction && <div className="pt-2">{emptyAction}</div>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, i) => (
                <TableRow
                  key={item.id || i}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "border-white/5 hover:bg-white/[0.04] transition-colors group",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={cn("py-3.5 px-4 text-xs sm:text-sm text-foreground/90", col.className)}
                    >
                      {col.render ? col.render(item) : String(item[col.key] ?? "—")}
                    </TableCell>
                  ))}

                  {hasActions && (
                    <TableCell className="text-right pr-4 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {customActions && customActions(item)}
                        
                        {onEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors"
                            onClick={() => onEdit(item)}
                            title="Editar registro"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            onClick={() => setDeletingItem(item)}
                            title="Excluir registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé de Paginação */}
      <div className="p-4 sm:p-5 border-t border-white/5 flex items-center justify-between flex-wrap gap-4 text-xs text-muted-foreground bg-card/40">
        <div className="flex items-center gap-2">
          <span>Exibir</span>
          <Select
            value={String(pageSize)}
            onValueChange={v => { setPageSize(Number(v)); setPage(1); }}
          >
            <SelectTrigger className="h-8 w-18 bg-background/60 border-white/10 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card/95 border-white/10">
              {[5, 10, 20, 50, 100].map(s => (
                <SelectItem key={s} value={String(s)} className="text-xs">{s} itens</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="hidden sm:inline">de <strong className="text-foreground font-semibold">{filtered.length}</strong> registros</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">
            Página <strong className="text-foreground font-semibold">{currentPage}</strong> de <strong className="text-foreground font-semibold">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/40 hover:bg-white/5 border-white/10 rounded-lg"
              disabled={currentPage === 1}
              onClick={() => setPage(1)}
              title="Primeira página"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/40 hover:bg-white/5 border-white/10 rounded-lg"
              disabled={currentPage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/40 hover:bg-white/5 border-white/10 rounded-lg"
              disabled={currentPage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              title="Próxima página"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/40 hover:bg-white/5 border-white/10 rounded-lg"
              disabled={currentPage === totalPages}
              onClick={() => setPage(totalPages)}
              title="Última página"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingItem} onOpenChange={open => { if (!open) setDeletingItem(null); }}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta ação não pode ser desfeita. O registro será permanentemente removido da base de dados do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={() => {
                if (deletingItem) {
                  onDelete?.(deletingItem);
                  setDeletingItem(null);
                }
              }}
            >
              Excluir Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

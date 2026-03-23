import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  searchKeys?: string[];
}

export default function DataTable<T extends Record<string, any>>({ data, columns, onRowClick, searchKeys }: Props<T>) {
  const [search, setSearch] = useState("");

  const filtered = search && searchKeys
    ? data.filter(item => searchKeys.some(key => String(item[key] || "").toLowerCase().includes(search.toLowerCase())))
    : data;

  return (
    <div className="glass-card overflow-hidden">
      {searchKeys && (
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border"
            />
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map(col => (
              <TableHead key={col.key} className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item, i) => (
              <TableRow
                key={i}
                onClick={() => onRowClick?.(item)}
                className="border-border cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                {columns.map(col => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(item) : String(item[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

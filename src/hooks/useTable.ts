import { useCallback, useEffect, useState, Dispatch, SetStateAction } from "react";
import { getAll } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseTableOptions {
  /** Ativa paginação server-side via LIMIT/OFFSET. Padrão: false */
  paginated?: boolean;
  /** Quantidade de registros por página. Padrão: 50 */
  pageSize?: number;
  /** Página inicial (zero-indexed). Padrão: 0 */
  initialPage?: number;
  /** Coluna de ordenação. Padrão: "created_at" */
  orderBy?: string;
  /** Ordem crescente? Padrão: false */
  orderAscending?: boolean;
  /** Filtros de igualdade simples aplicados via `.eq(key, value)` */
  filters?: Record<string, string | boolean | number | null>;
}

/** Retorno base — idêntico ao contrato original */
interface BaseReturn<T> {
  data: T[];
  loading: boolean;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<T[]>>;
}

/** Campos extras disponíveis apenas em modo paginado */
interface PaginatedExtras {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type UseTableReturn<T> = BaseReturn<T> & Partial<PaginatedExtras>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook utilitário para carregar dados de uma tabela Supabase.
 *
 * **Modo legado (sem paginação)** — retrocompatível com todos os usos existentes:
 * ```ts
 * const { data, loading, reload, setData } = useTable<Aluno>(STORES.ALUNOS);
 * ```
 *
 * **Modo paginado** — ativa LIMIT/OFFSET server-side:
 * ```ts
 * const { data, loading, reload, page, totalPages, nextPage, prevPage } =
 *   useTable<Aluno>(STORES.ALUNOS, { paginated: true, pageSize: 20 });
 * ```
 */
export function useTable<T>(
  table: string,
  options?: UseTableOptions,
): UseTableReturn<T> {
  const paginated = options?.paginated ?? false;
  const pageSize = options?.pageSize ?? 50;
  const orderBy = options?.orderBy ?? "created_at";
  const orderAscending = options?.orderAscending ?? false;
  const filters = options?.filters;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(options?.initialPage ?? 0);
  const [totalCount, setTotalCount] = useState(0);

  // ------------------------------------------------------------------
  // Modo legado — usa getAll (comportamento 100% idêntico ao original)
  // ------------------------------------------------------------------
  const reloadLegacy = useCallback(async () => {
    setLoading(true);
    const rows = await getAll<T>(table);
    setData(rows);
    setLoading(false);
  }, [table]);

  // ------------------------------------------------------------------
  // Modo paginado — usa supabase diretamente com range + count: "exact"
  // ------------------------------------------------------------------
  const reloadPaginated = useCallback(async () => {
    setLoading(true);
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from(table as any)
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order(orderBy, { ascending: orderAscending })
      .range(start, end);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      }
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error(`[useTable paginated ${table}]`, error);
    } else {
      setData((rows as T[]) ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [table, page, pageSize, orderBy, orderAscending, filters]);

  const reload = paginated ? reloadPaginated : reloadLegacy;

  useEffect(() => { reload(); }, [reload]);

  // ------------------------------------------------------------------
  // Retorno
  // ------------------------------------------------------------------
  const base: BaseReturn<T> = { data, loading, reload, setData };

  if (!paginated) {
    return base;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const extras: PaginatedExtras = {
    totalCount,
    page,
    pageSize,
    totalPages,
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage((p) => Math.max(p - 1, 0)),
    hasNextPage: page < totalPages - 1,
    hasPrevPage: page > 0,
  };

  return { ...base, ...extras };
}

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getAll } from "@/lib/store";
import { useTableLoadStatus } from "@/hooks/useTableLoadStatus";

export function useTable<T>(table: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const source = useId();
  const request = useRef(0);
  const status = useTableLoadStatus();
  const reportFailure = status?.reportFailure;
  const clearFailure = status?.clearFailure;
  const retryVersion = status?.retryVersion ?? 0;

  const reload = useCallback(async () => {
    const currentRequest = ++request.current;
    setLoading(true);
    try {
      const rows = await getAll<T>(table);
      if (currentRequest !== request.current) return;
      setData(rows);
      setError(null);
      clearFailure?.(source);
    } catch (cause) {
      if (currentRequest !== request.current) return;
      setData([]);
      setError(cause instanceof Error ? cause.message : "Falha ao carregar dados.");
      reportFailure?.(source, table);
    } finally {
      if (currentRequest === request.current) setLoading(false);
    }
  }, [table, source, reportFailure, clearFailure]);

  useEffect(() => { void reload(); }, [reload, retryVersion]);
  useEffect(() => () => {
    request.current += 1;
    clearFailure?.(source);
  }, [clearFailure, source]);

  return { data, loading, error, reload, setData };
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface TableFailure {
  source: string;
  table: string;
}

interface TableLoadStatus {
  failures: TableFailure[];
  retryVersion: number;
  reportFailure: (source: string, table: string) => void;
  clearFailure: (source: string) => void;
  retryAll: () => void;
}

const TableLoadContext = createContext<TableLoadStatus | null>(null);

export function TableLoadProvider({ children }: { children: ReactNode }) {
  const [failures, setFailures] = useState<TableFailure[]>([]);
  const [retryVersion, setRetryVersion] = useState(0);

  const reportFailure = useCallback((source: string, table: string) => {
    setFailures(previous => [
      ...previous.filter(item => item.source !== source),
      { source, table },
    ]);
  }, []);

  const clearFailure = useCallback((source: string) => {
    setFailures(previous => previous.some(item => item.source === source)
      ? previous.filter(item => item.source !== source)
      : previous);
  }, []);

  const retryAll = useCallback(() => setRetryVersion(version => version + 1), []);
  const value = useMemo(() => ({ failures, retryVersion, reportFailure, clearFailure, retryAll }),
    [failures, retryVersion, reportFailure, clearFailure, retryAll]);

  return <TableLoadContext.Provider value={value}>{children}</TableLoadContext.Provider>;
}

export function useTableLoadStatus() {
  return useContext(TableLoadContext);
}

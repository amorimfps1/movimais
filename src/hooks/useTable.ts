import { useCallback, useEffect, useState } from "react";
import { getAll } from "@/lib/store";

export function useTable<T>(table: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await getAll<T>(table);
    setData(rows);
    setLoading(false);
  }, [table]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, reload, setData };
}

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc" | null;
export type SortState<K extends string = string> = { key: K | null; dir: SortDir };

type Args<T, K extends string> = {
  rows: T[];
  defaultKey?: K;
  defaultDir?: SortDir;
  getValue: (row: T, key: K) => number | string | null | undefined;
};

export function useSort<T, K extends string>({
  rows,
  defaultKey,
  defaultDir,
  getValue,
}: Args<T, K>) {
  const [sort, setSort] = useState<SortState<K>>({
    key: defaultKey ?? null,
    dir: defaultKey ? (defaultDir ?? "desc") : null,
  });

  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return rows;
    const k = sort.key;
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = getValue(a, k);
      const bv = getValue(b, k);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * mul;
      }
      return String(av).localeCompare(String(bv)) * mul;
    });
  }, [rows, sort, getValue]);

  const onClick = (key: K) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      if (prev.dir === "asc") return { key: null, dir: null };
      return { key, dir: "desc" };
    });
  };

  return { sorted, sort, onClick };
}

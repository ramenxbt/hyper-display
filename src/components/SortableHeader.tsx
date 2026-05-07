import type { SortState } from "../hooks/useSort";

type Props<K extends string> = {
  label: string;
  sortKey: K;
  state: SortState<K>;
  onSort: (key: K) => void;
};

export function SortableHeader<K extends string>({
  label,
  sortKey,
  state,
  onSort,
}: Props<K>) {
  const active = state.key === sortKey && state.dir != null;
  const dir = active ? state.dir : null;
  return (
    <th
      className={`sortable ${active ? "sortable-active" : ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="sortable-inner">
        <span>{label}</span>
        <span className="sort-indicator" aria-hidden>
          {dir === "asc" ? "▲" : dir === "desc" ? "▼" : "↕"}
        </span>
      </span>
    </th>
  );
}

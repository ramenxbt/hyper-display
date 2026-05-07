type Props = {
  coins: { coin: string; count: number }[];
  selected: string | null;
  onSelect: (coin: string | null) => void;
};

export function CoinFilter({ coins, selected, onSelect }: Props) {
  if (coins.length === 0) return null;
  return (
    <div className="coin-filter">
      <button
        type="button"
        className={`pill ${selected == null ? "active" : ""}`}
        onClick={() => onSelect(null)}
      >
        All
        <span className="pill-count">
          {coins.reduce((acc, c) => acc + c.count, 0)}
        </span>
      </button>
      {coins.map(({ coin, count }) => (
        <button
          key={coin}
          type="button"
          className={`pill ${selected === coin ? "active" : ""}`}
          onClick={() => onSelect(selected === coin ? null : coin)}
        >
          {coin}
          <span className="pill-count">{count}</span>
        </button>
      ))}
    </div>
  );
}

export function coinCounts<T extends { coin: string }>(items: T[]): {
  coin: string;
  count: number;
}[] {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.coin, (m.get(it.coin) ?? 0) + 1);
  return [...m.entries()]
    .map(([coin, count]) => ({ coin, count }))
    .sort((a, b) => b.count - a.count);
}

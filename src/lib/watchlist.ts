const KEY = "hyper-display.watchlist";

export function loadWatchlist(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((c) => c.toUpperCase()));
  } catch {
    return new Set();
  }
}

export function saveWatchlist(set: Set<string>): void {
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function toggleCoinInWatchlist(set: Set<string>, coin: string): Set<string> {
  const next = new Set(set);
  const key = coin.toUpperCase();
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

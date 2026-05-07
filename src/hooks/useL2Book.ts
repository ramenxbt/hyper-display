import { useEffect, useState } from "react";
import { fetchL2Book, type L2Book } from "../lib/hl";

const REFRESH_MS = 1500;

export type L2BookState = {
  data: L2Book | null;
  error: string | null;
};

export function useL2Book(coin: string | null): L2BookState {
  const [data, setData] = useState<L2Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    if (!coin) return;
    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        const book = await fetchL2Book(coin, ctrl.signal);
        if (cancelled) return;
        setData(book);
        setError(null);
      } catch (err) {
        if (cancelled || ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    tick();
    const id = window.setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [coin]);

  return { data, error };
}

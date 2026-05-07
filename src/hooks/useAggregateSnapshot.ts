import { useEffect, useRef, useState } from "react";
import { fetchSnapshot, isValidAddress } from "../lib/hl";
import {
  aggregateSnapshots,
  type AggregateSnapshot,
  type WalletTag,
} from "../lib/aggregate";

export type AggregateState = {
  data: AggregateSnapshot | null;
  error: string | null;
  loading: boolean;
  lastUpdated: number | null;
};

export function useAggregateSnapshot(
  wallets: WalletTag[],
  intervalMs = 5000,
): AggregateState {
  const [data, setData] = useState<AggregateSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  // stable signature for the wallet set
  const key = wallets
    .map((w) => w.address.toLowerCase())
    .sort()
    .join(",");

  useEffect(() => {
    setData(null);
    setError(null);
    setLastUpdated(null);

    const valid = wallets.filter((w) => isValidAddress(w.address));
    if (valid.length === 0) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    let cancelled = false;

    const tick = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          valid.map(async (w) => ({
            wallet: w,
            snapshot: await fetchSnapshot(w.address.trim(), ctrl.signal),
          })),
        );
        if (cancelled) return;
        const aggregate = aggregateSnapshots(results);
        setData(aggregate);
        setError(null);
        setLastUpdated(aggregate.fetchedAt);
      } catch (e) {
        if (cancelled || ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tick();
    timer.current = window.setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      ctrl.abort();
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs]);

  return { data, error, loading, lastUpdated };
}

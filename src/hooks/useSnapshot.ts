import { useEffect, useRef, useState } from "react";
import { fetchSnapshot, isValidAddress, type Snapshot } from "../lib/hl";

export type SnapshotState = {
  data: Snapshot | null;
  error: string | null;
  loading: boolean;
  lastUpdated: number | null;
};

export function useSnapshot(address: string, intervalMs = 5000): SnapshotState {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    setLastUpdated(null);
    if (!isValidAddress(address)) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    let cancelled = false;

    const tick = async () => {
      setLoading(true);
      try {
        const snap = await fetchSnapshot(address.trim(), ctrl.signal);
        if (cancelled) return;
        setData(snap);
        setError(null);
        setLastUpdated(snap.fetchedAt);
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
  }, [address, intervalMs]);

  return { data, error, loading, lastUpdated };
}

import { useEffect, useState } from "react";
import { fetchMetaAndAssetCtxs } from "../lib/hl";

const REFRESH_MS = 60_000;

export type FundingRow = {
  coin: string;
  funding: number; // hourly decimal rate
  oraclePx: number;
  markPx: number;
  dayNtlVlm: number;
  openInterest: number;
};

export type FundingRatesState = {
  rows: FundingRow[];
  fetchedAt: number | null;
  error: string | null;
};

export function useFundingRates(): FundingRatesState {
  const [state, setState] = useState<FundingRatesState>({
    rows: [],
    fetchedAt: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        const [meta, ctxs] = await fetchMetaAndAssetCtxs(ctrl.signal);
        if (cancelled) return;
        const rows: FundingRow[] = meta.universe.map((m, i) => {
          const c = ctxs[i] ?? ({} as Partial<typeof ctxs[number]>);
          return {
            coin: m.name,
            funding: parseFloat(c.funding ?? "0"),
            oraclePx: parseFloat(c.oraclePx ?? "0"),
            markPx: parseFloat(c.markPx ?? "0"),
            dayNtlVlm: parseFloat(c.dayNtlVlm ?? "0"),
            openInterest: parseFloat(c.openInterest ?? "0"),
          };
        });
        setState({ rows, fetchedAt: Date.now(), error: null });
      } catch (err) {
        if (cancelled || ctrl.signal.aborted) return;
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    };

    tick();
    const id = window.setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, []);

  return state;
}

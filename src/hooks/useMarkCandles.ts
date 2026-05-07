import { useEffect, useRef, useState } from "react";
import { fetchCandleSnapshot, type Candle } from "../lib/hl";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 60_000;

export type CandleSeries = Record<string, [number, number][]>;

export function useMarkCandles(coins: string[]): CandleSeries {
  const [series, setSeries] = useState<CandleSeries>({});
  const prevKeyRef = useRef<string>("");
  const cacheRef = useRef<CandleSeries>({});

  // a stable key for the coin set so the effect doesn't re-fire on each render
  const key = [...coins].sort().join(",");

  useEffect(() => {
    if (!coins.length) {
      setSeries({});
      cacheRef.current = {};
      return;
    }
    prevKeyRef.current = key;

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      const end = Date.now();
      const start = end - ONE_DAY_MS;
      const results = await Promise.all(
        coins.map(async (coin) => {
          try {
            const candles = await fetchCandleSnapshot(
              coin,
              "1h",
              start,
              end,
              ctrl.signal,
            );
            return [coin, candlesToPoints(candles)] as const;
          } catch {
            return [coin, cacheRef.current[coin] ?? []] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: CandleSeries = {};
      for (const [coin, points] of results) next[coin] = points;
      cacheRef.current = next;
      setSeries(next);
    };

    tick();
    const id = window.setInterval(tick, REFRESH_MS);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [key, coins]);

  return series;
}

function candlesToPoints(candles: Candle[]): [number, number][] {
  return candles.map((c) => [c.t, parseFloat(c.c)]);
}

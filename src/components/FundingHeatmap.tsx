import { useMemo, useState } from "react";
import type { FundingRow } from "../hooks/useFundingRates";
import { fmtUsd } from "../lib/format";

type Props = {
  rows: FundingRow[];
  watchlist: Set<string>;
  onToggleWatch: (coin: string) => void;
};

type SortKey = "rate" | "abs" | "coin" | "vol" | "watch";

const HEAT_MAX = 0.0005; // 0.05% per hour pegged to full saturation

function rateColor(rate: number): { bg: string; fg: string } {
  const norm = Math.min(1, Math.abs(rate) / HEAT_MAX);
  if (rate === 0) {
    return { bg: "rgba(255,255,255,0.03)", fg: "var(--text-muted)" };
  }
  const alpha = 0.10 + norm * 0.45;
  if (rate > 0) {
    return {
      bg: `rgba(237, 112, 136, ${alpha.toFixed(3)})`,
      fg: norm > 0.5 ? "var(--text)" : "var(--short)",
    };
  }
  return {
    bg: `rgba(31, 166, 125, ${alpha.toFixed(3)})`,
    fg: norm > 0.5 ? "var(--text)" : "var(--long)",
  };
}

function fmtRate(rate: number): string {
  return `${(rate * 100).toFixed(4)}%`;
}

function fmtAnnual(rate: number): string {
  // simple compounded annual: (1 + r)^8760, but show linear approximation since rates are tiny
  const annual = rate * 24 * 365 * 100;
  return `${annual.toFixed(2)}% APR`;
}

export function FundingHeatmap({ rows, watchlist, onToggleWatch }: Props) {
  const [sort, setSort] = useState<SortKey>("abs");
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => r.coin.toLowerCase().includes(q))
      : rows;
    const arr = [...filtered];
    switch (sort) {
      case "rate":
        return arr.sort((a, b) => b.funding - a.funding);
      case "abs":
        return arr.sort(
          (a, b) => Math.abs(b.funding) - Math.abs(a.funding),
        );
      case "coin":
        return arr.sort((a, b) => a.coin.localeCompare(b.coin));
      case "vol":
        return arr.sort((a, b) => b.dayNtlVlm - a.dayNtlVlm);
      case "watch":
        return arr.sort((a, b) => {
          const aw = watchlist.has(a.coin.toUpperCase()) ? 0 : 1;
          const bw = watchlist.has(b.coin.toUpperCase()) ? 0 : 1;
          if (aw !== bw) return aw - bw;
          return Math.abs(b.funding) - Math.abs(a.funding);
        });
    }
  }, [rows, sort, query, watchlist]);

  if (!rows.length) {
    return (
      <div className="empty">
        <div>Loading funding rates…</div>
        <div className="hint">Pulling current 1H funding for every coin on Hyperliquid.</div>
      </div>
    );
  }

  const positives = rows.filter((r) => r.funding > 0).length;
  const negatives = rows.filter((r) => r.funding < 0).length;

  return (
    <>
      <div className="rates-toolbar">
        <input
          className="rates-search"
          placeholder="Search coin"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        <div className="rates-sort">
          <button
            type="button"
            className={`pill ${sort === "abs" ? "active" : ""}`}
            onClick={() => setSort("abs")}
          >
            |Rate|
          </button>
          <button
            type="button"
            className={`pill ${sort === "rate" ? "active" : ""}`}
            onClick={() => setSort("rate")}
          >
            Rate
          </button>
          <button
            type="button"
            className={`pill ${sort === "vol" ? "active" : ""}`}
            onClick={() => setSort("vol")}
          >
            Volume
          </button>
          <button
            type="button"
            className={`pill ${sort === "coin" ? "active" : ""}`}
            onClick={() => setSort("coin")}
          >
            Coin
          </button>
          <button
            type="button"
            className={`pill ${sort === "watch" ? "active" : ""}`}
            onClick={() => setSort("watch")}
          >
            Watching
          </button>
        </div>
        <div className="rates-summary">
          <span className="muted subtle">
            {positives} long-pays · {negatives} short-pays
          </span>
        </div>
      </div>
      <div className="rates-grid">
        {sorted.map((r) => {
          const { bg, fg } = rateColor(r.funding);
          const watched = watchlist.has(r.coin.toUpperCase());
          return (
            <div
              key={r.coin}
              className={`rate-tile ${watched ? "watched" : ""}`}
              style={{ background: bg, color: fg }}
              title={`${r.coin} · 1H ${fmtRate(r.funding)} · ${fmtAnnual(r.funding)} · 24H volume ${fmtUsd(r.dayNtlVlm)}`}
            >
              <button
                type="button"
                className="rate-star"
                onClick={() => onToggleWatch(r.coin)}
                title={watched ? "Remove from watchlist" : "Add to watchlist"}
              >
                {watched ? "★" : "☆"}
              </button>
              <span className="rate-coin">{r.coin}</span>
              <span className="rate-value mono">{fmtRate(r.funding)}</span>
              <span className="rate-apr mono">{fmtAnnual(r.funding)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

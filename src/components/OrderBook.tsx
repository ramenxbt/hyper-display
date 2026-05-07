import { useMemo, useState } from "react";
import { useL2Book } from "../hooks/useL2Book";
import { fmtPrice, fmtSize, fmtUsd } from "../lib/format";

type Props = {
  coins: string[];
  defaultCoin?: string;
};

const LEVELS = 15;

type RowVm = {
  px: number;
  sz: number;
  cum: number;
  cumPct: number;
  notional: number;
};

function buildLadder(levels: { px: string; sz: string }[]): RowVm[] {
  const rows = levels.slice(0, LEVELS).map((l) => ({
    px: parseFloat(l.px),
    sz: parseFloat(l.sz),
    cum: 0,
    cumPct: 0,
    notional: 0,
  }));
  let cum = 0;
  for (const r of rows) {
    cum += r.sz;
    r.cum = cum;
    r.notional = r.px * r.sz;
  }
  const max = rows.length > 0 ? rows[rows.length - 1].cum : 1;
  for (const r of rows) r.cumPct = max > 0 ? r.cum / max : 0;
  return rows;
}

export function OrderBook({ coins, defaultCoin }: Props) {
  const [coin, setCoin] = useState<string | null>(defaultCoin ?? coins[0] ?? null);
  const { data, error } = useL2Book(coin);

  const bids = useMemo(
    () => (data ? buildLadder(data.levels[0]) : []),
    [data],
  );
  const asks = useMemo(
    () => (data ? buildLadder(data.levels[1]) : []),
    [data],
  );

  const bestBid = bids[0]?.px ?? null;
  const bestAsk = asks[0]?.px ?? null;
  const spread =
    bestBid != null && bestAsk != null ? bestAsk - bestBid : null;
  const spreadBps =
    spread != null && bestBid && bestAsk
      ? (spread / ((bestBid + bestAsk) / 2)) * 10000
      : null;

  return (
    <>
      <div className="book-toolbar">
        <span className="k">Coin</span>
        <select
          className="rule-select"
          value={coin ?? ""}
          onChange={(e) => setCoin(e.target.value || null)}
        >
          {coins.length === 0 && <option value="">No coins</option>}
          {coins.length > 0 && !coin && <option value="">Select…</option>}
          {coins.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {bestBid != null && bestAsk != null && (
          <span className="muted subtle">
            Best{" "}
            <span className="long mono">{fmtPrice(bestBid)}</span>
            {" / "}
            <span className="short mono">{fmtPrice(bestAsk)}</span>
          </span>
        )}
        {spread != null && (
          <span className="muted subtle">
            Spread{" "}
            <span className="mono">{fmtPrice(spread)}</span>
            {spreadBps != null && (
              <span className="mono"> · {spreadBps.toFixed(2)} bps</span>
            )}
          </span>
        )}
      </div>
      {error && (
        <div className="empty">
          <div className="error">Could not load book.</div>
          <div className="hint mono">{error}</div>
        </div>
      )}
      {!coin && (
        <div className="empty">
          <div>Pick a coin to view its book.</div>
        </div>
      )}
      {coin && data && (
        <div className="book">
          <Side side="bids" rows={bids} />
          <Side side="asks" rows={asks} />
        </div>
      )}
    </>
  );
}

function Side({ side, rows }: { side: "bids" | "asks"; rows: RowVm[] }) {
  const isBid = side === "bids";
  return (
    <div className={`book-side book-${side}`}>
      <div className="book-head">
        <span>{isBid ? "Bids" : "Asks"}</span>
        <span>Size</span>
        <span>Cum</span>
        <span>Price</span>
        <span>USD</span>
      </div>
      <div className="book-body">
        {rows.map((r, i) => (
          <div key={`${r.px}-${i}`} className="book-row">
            <span
              className={`book-bar ${isBid ? "bid-bar" : "ask-bar"}`}
              style={{ width: `${r.cumPct * 100}%` }}
              aria-hidden
            />
            <span className="book-cell num" style={{ flex: 0.1 }}>
              {i + 1}
            </span>
            <span className="book-cell mono">{fmtSize(r.sz)}</span>
            <span className="book-cell mono muted">{fmtSize(r.cum)}</span>
            <span className={`book-cell mono ${isBid ? "long" : "short"}`}>
              {fmtPrice(r.px)}
            </span>
            <span className="book-cell mono muted">{fmtUsd(r.notional)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

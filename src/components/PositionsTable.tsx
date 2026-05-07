import { useMemo } from "react";
import type { AssetPosition, AllMids } from "../lib/hl";
import {
  fmtPrice,
  fmtSignedUsd,
  fmtSize,
  fmtUsd,
  fmtSignedPct,
} from "../lib/format";

type Props = {
  positions: AssetPosition[];
  mids: AllMids;
};

export function PositionsTable({ positions, mids }: Props) {
  const maxAbsPnl = useMemo(() => {
    let m = 0;
    for (const ap of positions) {
      const v = Math.abs(parseFloat(ap.position.unrealizedPnl));
      if (v > m) m = v;
    }
    return m;
  }, [positions]);

  if (!positions.length) {
    return <Empty />;
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Coin</th>
          <th>Side</th>
          <th>Size</th>
          <th>Position Value</th>
          <th>Entry</th>
          <th>Mark</th>
          <th>Liq</th>
          <th>Margin</th>
          <th>Unrealized PnL</th>
          <th>ROE</th>
          <th>Lev</th>
        </tr>
      </thead>
      <tbody>
        {positions.map(({ position: p }) => {
          const sz = parseFloat(p.szi);
          const isLong = sz > 0;
          const upnl = parseFloat(p.unrealizedPnl);
          const roe = parseFloat(p.returnOnEquity);
          const mark = mids[p.coin] ? parseFloat(mids[p.coin]) : null;
          const upnlClass = upnl > 0 ? "long" : upnl < 0 ? "short" : "";
          const roeClass = roe > 0 ? "long" : roe < 0 ? "short" : "";
          const pnlShare = maxAbsPnl > 0 ? Math.abs(upnl) / maxAbsPnl : 0;
          return (
            <tr key={p.coin}>
              <td>
                <span className="coin">{p.coin}</span>
              </td>
              <td>
                <span className={isLong ? "tag tag-long" : "tag tag-short"}>
                  {isLong ? "Long" : "Short"}
                </span>
              </td>
              <td className="mono">{fmtSize(Math.abs(sz))}</td>
              <td className="mono">{fmtUsd(p.positionValue)}</td>
              <td className="mono">{p.entryPx ? fmtPrice(p.entryPx) : "—"}</td>
              <td className="mono">{mark != null ? fmtPrice(mark) : "—"}</td>
              <td className="mono muted">
                {p.liquidationPx ? fmtPrice(p.liquidationPx) : "—"}
              </td>
              <td className="mono">{fmtUsd(p.marginUsed)}</td>
              <td className={`mono pnl-cell ${upnlClass}`}>
                <PnlBar value={upnl} share={pnlShare} />
                <span>{fmtSignedUsd(upnl)}</span>
              </td>
              <td className={`mono ${roeClass}`}>{fmtSignedPct(roe)}</td>
              <td className="mono muted">
                {p.leverage.value}× {p.leverage.type === "isolated" ? "iso" : "x"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PnlBar({ value, share }: { value: number; share: number }) {
  if (!Number.isFinite(value) || share === 0) return null;
  const pct = Math.min(1, Math.max(0, share)) * 100;
  return (
    <span className="pnl-bar" aria-hidden>
      <span
        className={`pnl-bar-fill ${value >= 0 ? "long-fill" : "short-fill"}`}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

function Empty() {
  return (
    <div className="empty">
      <div>No open positions.</div>
      <div className="hint">
        When this wallet opens a perp position on Hyperliquid, it will show up here within a few seconds.
      </div>
    </div>
  );
}

import { useCallback, useMemo } from "react";
import type { AllMids } from "../lib/hl";
import {
  fmtPrice,
  fmtSignedUsd,
  fmtSize,
  fmtUsd,
  fmtSignedPct,
} from "../lib/format";
import { Sparkline } from "./Sparkline";
import type { CandleSeries } from "../hooks/useMarkCandles";
import type { TaggedAssetPosition } from "../lib/aggregate";
import { WalletChip } from "./WalletChip";
import { useSort } from "../hooks/useSort";
import { SortableHeader } from "./SortableHeader";
import type { PositionColumnVisibility } from "../lib/settings";

type Props = {
  positions: TaggedAssetPosition[];
  mids: AllMids;
  candles: CandleSeries;
  aggregate?: boolean;
  columns: PositionColumnVisibility;
};

type SortKey =
  | "coin"
  | "side"
  | "size"
  | "value"
  | "entry"
  | "mark"
  | "liq"
  | "margin"
  | "upnl"
  | "roe"
  | "lev";

export function PositionsTable({
  positions,
  mids,
  candles,
  aggregate,
  columns,
}: Props) {
  const maxAbsPnl = useMemo(() => {
    let m = 0;
    for (const ap of positions) {
      const v = Math.abs(parseFloat(ap.position.unrealizedPnl));
      if (v > m) m = v;
    }
    return m;
  }, [positions]);

  const getValue = useCallback(
    (ap: TaggedAssetPosition, key: SortKey): number | string | null => {
      const p = ap.position;
      switch (key) {
        case "coin":
          return p.coin;
        case "side":
          return parseFloat(p.szi) > 0 ? "long" : "short";
        case "size":
          return Math.abs(parseFloat(p.szi));
        case "value":
          return parseFloat(p.positionValue);
        case "entry":
          return p.entryPx ? parseFloat(p.entryPx) : null;
        case "mark":
          return mids[p.coin] ? parseFloat(mids[p.coin]) : null;
        case "liq":
          return p.liquidationPx ? parseFloat(p.liquidationPx) : null;
        case "margin":
          return parseFloat(p.marginUsed);
        case "upnl":
          return parseFloat(p.unrealizedPnl);
        case "roe":
          return parseFloat(p.returnOnEquity);
        case "lev":
          return p.leverage.value;
      }
    },
    [mids],
  );

  const { sorted, sort, onClick } = useSort<TaggedAssetPosition, SortKey>({
    rows: positions,
    defaultKey: "value",
    defaultDir: "desc",
    getValue,
  });

  if (!positions.length) {
    return <Empty />;
  }
  return (
    <table className="table">
      <thead>
        <tr>
          {aggregate && <th>Wallet</th>}
          <SortableHeader<SortKey> label="Coin" sortKey="coin" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Side" sortKey="side" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Size" sortKey="size" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Position Value" sortKey="value" state={sort} onSort={onClick} />
          {columns.entry && (
            <SortableHeader<SortKey> label="Entry" sortKey="entry" state={sort} onSort={onClick} />
          )}
          {columns.mark && (
            <SortableHeader<SortKey> label="Mark" sortKey="mark" state={sort} onSort={onClick} />
          )}
          {columns.spark24h && <th>24H</th>}
          {columns.liq && (
            <SortableHeader<SortKey> label="Liq" sortKey="liq" state={sort} onSort={onClick} />
          )}
          {columns.margin && (
            <SortableHeader<SortKey> label="Margin" sortKey="margin" state={sort} onSort={onClick} />
          )}
          <SortableHeader<SortKey> label="Unrealized PnL" sortKey="upnl" state={sort} onSort={onClick} />
          {columns.roe && (
            <SortableHeader<SortKey> label="ROE" sortKey="roe" state={sort} onSort={onClick} />
          )}
          {columns.lev && (
            <SortableHeader<SortKey> label="Lev" sortKey="lev" state={sort} onSort={onClick} />
          )}
        </tr>
      </thead>
      <tbody>
        {sorted.map((ap) => {
          const p = ap.position;
          const sz = parseFloat(p.szi);
          const isLong = sz > 0;
          const upnl = parseFloat(p.unrealizedPnl);
          const roe = parseFloat(p.returnOnEquity);
          const mark = mids[p.coin] ? parseFloat(mids[p.coin]) : null;
          const upnlClass = upnl > 0 ? "long" : upnl < 0 ? "short" : "";
          const roeClass = roe > 0 ? "long" : roe < 0 ? "short" : "";
          const pnlShare = maxAbsPnl > 0 ? Math.abs(upnl) / maxAbsPnl : 0;
          return (
            <tr key={`${ap.wallet?.address ?? "self"}:${p.coin}`}>
              {aggregate && (
                <td>
                  <WalletChip wallet={ap.wallet} />
                </td>
              )}
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
              {columns.entry && (
                <td className="mono">{p.entryPx ? fmtPrice(p.entryPx) : "—"}</td>
              )}
              {columns.mark && (
                <td className="mono">{mark != null ? fmtPrice(mark) : "—"}</td>
              )}
              {columns.spark24h && (
                <td className="position-spark">
                  <PositionSpark points={candles[p.coin]} />
                </td>
              )}
              {columns.liq && (
                <td className="mono muted">
                  {p.liquidationPx ? fmtPrice(p.liquidationPx) : "—"}
                </td>
              )}
              {columns.margin && (
                <td className="mono">{fmtUsd(p.marginUsed)}</td>
              )}
              <td className={`mono pnl-cell ${upnlClass}`}>
                <PnlBar value={upnl} share={pnlShare} />
                <span>{fmtSignedUsd(upnl)}</span>
              </td>
              {columns.roe && (
                <td className={`mono ${roeClass}`}>{fmtSignedPct(roe)}</td>
              )}
              {columns.lev && (
                <td className="mono muted">
                  {p.leverage.value}× {p.leverage.type === "isolated" ? "iso" : "x"}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PositionSpark({ points }: { points: [number, number][] | undefined }) {
  if (!points || points.length < 2) {
    return <span className="muted subtle">—</span>;
  }
  const start = points[0][1];
  const end = points[points.length - 1][1];
  const positive = end > start ? true : end < start ? false : undefined;
  return (
    <span className="position-spark-inner">
      <Sparkline
        points={points}
        width={84}
        height={22}
        positive={positive}
        showFill={false}
      />
    </span>
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

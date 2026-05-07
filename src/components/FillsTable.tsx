import { useMemo, useState } from "react";
import { fmtPrice, fmtSignedUsd, fmtSize, fmtUsd } from "../lib/format";
import { CoinFilter, coinCounts } from "./CoinFilter";
import { csvFilename, downloadCsv, rowsToCsv } from "../lib/csv";
import type { TaggedUserFill } from "../lib/aggregate";
import { WalletChip } from "./WalletChip";

type Props = { fills: TaggedUserFill[]; address: string; aggregate?: boolean };

const MAX_ROWS = 100;

function fmtFillTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function FillsTable({ fills, address, aggregate }: Props) {
  const [coin, setCoin] = useState<string | null>(null);
  const counts = useMemo(() => coinCounts(fills), [fills]);
  const filtered = useMemo(
    () => (coin ? fills.filter((f) => f.coin === coin) : fills),
    [fills, coin],
  );

  if (!fills.length) {
    return (
      <div className="empty">
        <div>No fills yet.</div>
        <div className="hint">Recent trades will stream in here as they execute.</div>
      </div>
    );
  }
  const rows = [...filtered].sort((a, b) => b.time - a.time).slice(0, MAX_ROWS);

  const onExport = () => {
    const csv = rowsToCsv(filtered, [
      { header: "time_iso", value: (f) => new Date(f.time).toISOString() },
      { header: "time_ms", value: (f) => f.time },
      { header: "coin", value: (f) => f.coin },
      { header: "side", value: (f) => (f.side === "B" ? "buy" : "sell") },
      { header: "direction", value: (f) => f.dir },
      { header: "size", value: (f) => f.sz },
      { header: "price", value: (f) => f.px },
      { header: "notional_usd", value: (f) => parseFloat(f.sz) * parseFloat(f.px) },
      { header: "fee", value: (f) => f.fee },
      { header: "fee_token", value: (f) => f.feeToken },
      { header: "closed_pnl", value: (f) => f.closedPnl },
      { header: "crossed", value: (f) => (f.crossed ? "true" : "false") },
      { header: "oid", value: (f) => f.oid },
      { header: "tid", value: (f) => f.tid },
      { header: "hash", value: (f) => f.hash },
    ]);
    downloadCsv(csvFilename("fills", address), csv);
  };

  return (
    <>
      <div className="table-toolbar">
        <CoinFilter coins={counts} selected={coin} onSelect={setCoin} />
        <button type="button" className="settings-btn" onClick={onExport}>
          Export CSV
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            {aggregate && <th>Wallet</th>}
            <th>Coin</th>
            <th>Side</th>
            <th>Direction</th>
            <th>Size</th>
            <th>Price</th>
            <th>Notional</th>
            <th>Fee</th>
            <th>Closed PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => {
            const isBuy = f.side === "B";
            const sz = parseFloat(f.sz);
            const px = parseFloat(f.px);
            const fee = parseFloat(f.fee);
            const pnl = parseFloat(f.closedPnl);
            const pnlClass = pnl > 0 ? "long" : pnl < 0 ? "short" : "muted";
            return (
              <tr key={`${f.wallet?.address ?? "self"}:${f.tid}-${f.hash}`}>
                <td className="mono muted">{fmtFillTime(f.time)}</td>
                {aggregate && (
                  <td>
                    <WalletChip wallet={f.wallet} />
                  </td>
                )}
                <td>
                  <span className="coin">{f.coin}</span>
                </td>
                <td>
                  <span className={isBuy ? "tag tag-long" : "tag tag-short"}>
                    {isBuy ? "Buy" : "Sell"}
                  </span>
                </td>
                <td className="muted">{f.dir}</td>
                <td className="mono">{fmtSize(sz)}</td>
                <td className="mono">{fmtPrice(px)}</td>
                <td className="mono">{fmtUsd(sz * px)}</td>
                <td className="mono muted">{fmtUsd(fee)}</td>
                <td className={`mono ${pnlClass}`}>
                  {pnl === 0 ? "—" : fmtSignedUsd(pnl)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

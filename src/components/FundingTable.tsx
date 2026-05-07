import type { FundingEntry } from "../lib/hl";
import { fmtSignedUsd, fmtSize } from "../lib/format";

type Props = { entries: FundingEntry[] };

const MAX_ROWS = 200;

function fmtFundingTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtRate(rate: string): string {
  const n = parseFloat(rate);
  if (!Number.isFinite(n)) return "—";
  // rate is per-hour; show as basis points with 4 decimals
  return `${(n * 100).toFixed(4)}%`;
}

export function FundingTable({ entries }: Props) {
  if (!entries.length) {
    return (
      <div className="empty">
        <div>No funding payments in the last 30 days.</div>
        <div className="hint">
          Funding accrues hourly while a perp position is open. Pay or receive depends on the funding rate sign and your direction.
        </div>
      </div>
    );
  }
  const rows = [...entries].sort((a, b) => b.time - a.time).slice(0, MAX_ROWS);

  let total = 0;
  for (const e of entries) total += parseFloat(e.delta.usdc);

  return (
    <>
      <div className="funding-summary">
        <span className="k">30D net funding</span>
        <span
          className={`v mono ${total > 0 ? "long" : total < 0 ? "short" : "muted"}`}
        >
          {fmtSignedUsd(total)}
        </span>
        <span className="muted subtle">{entries.length} payments</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Coin</th>
            <th>Side</th>
            <th>Position Size</th>
            <th>Rate (1H)</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const sz = parseFloat(e.delta.szi);
            const isLong = sz > 0;
            const usdc = parseFloat(e.delta.usdc);
            const cls = usdc > 0 ? "long" : usdc < 0 ? "short" : "muted";
            return (
              <tr key={`${e.time}-${e.delta.coin}-${e.hash}`}>
                <td className="mono muted">{fmtFundingTime(e.time)}</td>
                <td>
                  <span className="coin">{e.delta.coin}</span>
                </td>
                <td>
                  <span className={isLong ? "tag tag-long" : "tag tag-short"}>
                    {isLong ? "Long" : "Short"}
                  </span>
                </td>
                <td className="mono">{fmtSize(Math.abs(sz))}</td>
                <td className="mono muted">{fmtRate(e.delta.fundingRate)}</td>
                <td className={`mono ${cls}`}>{fmtSignedUsd(usdc)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

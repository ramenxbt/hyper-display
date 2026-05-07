import type { UserFill } from "../lib/hl";
import { fmtPrice, fmtSignedUsd, fmtSize, fmtUsd } from "../lib/format";

type Props = { fills: UserFill[] };

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

export function FillsTable({ fills }: Props) {
  if (!fills.length) {
    return (
      <div className="empty">
        <div>No fills yet.</div>
        <div className="hint">Recent trades will stream in here as they execute.</div>
      </div>
    );
  }
  const rows = [...fills].sort((a, b) => b.time - a.time).slice(0, MAX_ROWS);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Time</th>
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
            <tr key={`${f.tid}-${f.hash}`}>
              <td className="mono muted">{fmtFillTime(f.time)}</td>
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
  );
}

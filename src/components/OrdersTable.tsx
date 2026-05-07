import type { OpenOrder } from "../lib/hl";
import { fmtPrice, fmtSize, fmtUsd } from "../lib/format";

type Props = { orders: OpenOrder[] };

function fmtOrderTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function OrdersTable({ orders }: Props) {
  if (!orders.length) {
    return (
      <div className="empty">
        <div>No open orders.</div>
        <div className="hint">Resting limit orders and triggers will appear here while they live.</div>
      </div>
    );
  }
  const rows = [...orders].sort((a, b) => b.timestamp - a.timestamp);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Coin</th>
          <th>Type</th>
          <th>Side</th>
          <th>Size</th>
          <th>Filled</th>
          <th>Price</th>
          <th>Notional</th>
          <th>Reduce</th>
          <th>Placed</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => {
          const isBuy = o.side === "B";
          const sz = parseFloat(o.sz);
          const orig = parseFloat(o.origSz);
          const filled = orig - sz;
          const px = parseFloat(o.limitPx);
          const notional = px * sz;
          return (
            <tr key={o.oid}>
              <td>
                <span className="coin">{o.coin}</span>
              </td>
              <td className="muted">{o.orderType ?? "Limit"}</td>
              <td>
                <span className={isBuy ? "tag tag-long" : "tag tag-short"}>
                  {isBuy ? "Buy" : "Sell"}
                </span>
              </td>
              <td className="mono">{fmtSize(sz)}</td>
              <td className="mono muted">{filled > 0 ? fmtSize(filled) : "0"}</td>
              <td className="mono">{fmtPrice(px)}</td>
              <td className="mono">{fmtUsd(notional)}</td>
              <td className="muted">{o.reduceOnly ? "Yes" : "—"}</td>
              <td className="mono muted">{fmtOrderTime(o.timestamp)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

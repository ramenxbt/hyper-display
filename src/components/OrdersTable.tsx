import { useCallback } from "react";
import { fmtPrice, fmtSize, fmtUsd } from "../lib/format";
import type { TaggedOpenOrder } from "../lib/aggregate";
import { WalletChip } from "./WalletChip";
import { useSort } from "../hooks/useSort";
import { SortableHeader } from "./SortableHeader";

type Props = { orders: TaggedOpenOrder[]; aggregate?: boolean };

type SortKey =
  | "coin"
  | "type"
  | "side"
  | "size"
  | "filled"
  | "price"
  | "notional"
  | "reduce"
  | "placed";

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

export function OrdersTable({ orders, aggregate }: Props) {
  const getValue = useCallback(
    (o: TaggedOpenOrder, key: SortKey): number | string | null => {
      switch (key) {
        case "coin":
          return o.coin;
        case "type":
          return o.orderType ?? "Limit";
        case "side":
          return o.side === "B" ? "buy" : "sell";
        case "size":
          return parseFloat(o.sz);
        case "filled":
          return parseFloat(o.origSz) - parseFloat(o.sz);
        case "price":
          return parseFloat(o.limitPx);
        case "notional":
          return parseFloat(o.limitPx) * parseFloat(o.sz);
        case "reduce":
          return o.reduceOnly ? 1 : 0;
        case "placed":
          return o.timestamp;
      }
    },
    [],
  );

  const { sorted, sort, onClick } = useSort<TaggedOpenOrder, SortKey>({
    rows: orders,
    defaultKey: "placed",
    defaultDir: "desc",
    getValue,
  });

  if (!orders.length) {
    return (
      <div className="empty">
        <div>No open orders.</div>
        <div className="hint">Resting limit orders and triggers will appear here while they live.</div>
      </div>
    );
  }
  return (
    <table className="table">
      <thead>
        <tr>
          {aggregate && <th>Wallet</th>}
          <SortableHeader<SortKey> label="Coin" sortKey="coin" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Type" sortKey="type" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Side" sortKey="side" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Size" sortKey="size" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Filled" sortKey="filled" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Price" sortKey="price" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Notional" sortKey="notional" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Reduce" sortKey="reduce" state={sort} onSort={onClick} />
          <SortableHeader<SortKey> label="Placed" sortKey="placed" state={sort} onSort={onClick} />
        </tr>
      </thead>
      <tbody>
        {sorted.map((o) => {
          const isBuy = o.side === "B";
          const sz = parseFloat(o.sz);
          const orig = parseFloat(o.origSz);
          const filled = orig - sz;
          const px = parseFloat(o.limitPx);
          const notional = px * sz;
          return (
            <tr key={`${o.wallet?.address ?? "self"}:${o.oid}`}>
              {aggregate && (
                <td>
                  <WalletChip wallet={o.wallet} />
                </td>
              )}
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

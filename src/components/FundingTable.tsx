import { useCallback, useMemo, useState } from "react";
import { fmtSignedUsd, fmtSize } from "../lib/format";
import { CoinFilter, coinCounts } from "./CoinFilter";
import { csvFilename, downloadCsv, rowsToCsv } from "../lib/csv";
import type { TaggedFundingEntry } from "../lib/aggregate";
import { WalletChip } from "./WalletChip";
import { useSort } from "../hooks/useSort";
import { SortableHeader } from "./SortableHeader";

type Props = {
  entries: TaggedFundingEntry[];
  address: string;
  aggregate?: boolean;
};

type SortKey = "time" | "coin" | "side" | "size" | "rate" | "usdc";

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
  return `${(n * 100).toFixed(4)}%`;
}

export function FundingTable({ entries, address, aggregate }: Props) {
  const [coin, setCoin] = useState<string | null>(null);

  const counts = useMemo(
    () => coinCounts(entries.map((e) => ({ coin: e.delta.coin }))),
    [entries],
  );

  const filtered = useMemo(
    () => (coin ? entries.filter((e) => e.delta.coin === coin) : entries),
    [entries, coin],
  );

  const total = useMemo(
    () => filtered.reduce((acc, e) => acc + parseFloat(e.delta.usdc), 0),
    [filtered],
  );

  const getValue = useCallback(
    (e: TaggedFundingEntry, key: SortKey): number | string | null => {
      switch (key) {
        case "time":
          return e.time;
        case "coin":
          return e.delta.coin;
        case "side":
          return parseFloat(e.delta.szi) > 0 ? "long" : "short";
        case "size":
          return Math.abs(parseFloat(e.delta.szi));
        case "rate":
          return parseFloat(e.delta.fundingRate);
        case "usdc":
          return parseFloat(e.delta.usdc);
      }
    },
    [],
  );

  const { sorted, sort, onClick } = useSort<TaggedFundingEntry, SortKey>({
    rows: filtered,
    defaultKey: "time",
    defaultDir: "desc",
    getValue,
  });

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

  const rows = sorted.slice(0, MAX_ROWS);

  const onExport = () => {
    const csv = rowsToCsv(filtered, [
      { header: "time_iso", value: (e) => new Date(e.time).toISOString() },
      { header: "time_ms", value: (e) => e.time },
      { header: "coin", value: (e) => e.delta.coin },
      {
        header: "side",
        value: (e) => (parseFloat(e.delta.szi) > 0 ? "long" : "short"),
      },
      { header: "size", value: (e) => e.delta.szi },
      { header: "funding_rate_1h", value: (e) => e.delta.fundingRate },
      { header: "usdc", value: (e) => e.delta.usdc },
      { header: "n_samples", value: (e) => e.delta.nSamples ?? "" },
      { header: "hash", value: (e) => e.hash },
    ]);
    downloadCsv(csvFilename("funding", address), csv);
  };

  return (
    <>
      <div className="funding-summary">
        <span className="k">{coin ? `${coin} net (30D)` : "30D net funding"}</span>
        <span
          className={`v mono ${total > 0 ? "long" : total < 0 ? "short" : "muted"}`}
        >
          {fmtSignedUsd(total)}
        </span>
        <span className="muted subtle">{filtered.length} payments</span>
      </div>
      <div className="table-toolbar">
        <CoinFilter coins={counts} selected={coin} onSelect={setCoin} />
        <button type="button" className="settings-btn" onClick={onExport}>
          Export CSV
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <SortableHeader<SortKey> label="Time" sortKey="time" state={sort} onSort={onClick} />
            {aggregate && <th>Wallet</th>}
            <SortableHeader<SortKey> label="Coin" sortKey="coin" state={sort} onSort={onClick} />
            <SortableHeader<SortKey> label="Side" sortKey="side" state={sort} onSort={onClick} />
            <SortableHeader<SortKey> label="Position Size" sortKey="size" state={sort} onSort={onClick} />
            <SortableHeader<SortKey> label="Rate (1H)" sortKey="rate" state={sort} onSort={onClick} />
            <SortableHeader<SortKey> label="Payment" sortKey="usdc" state={sort} onSort={onClick} />
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const sz = parseFloat(e.delta.szi);
            const isLong = sz > 0;
            const usdc = parseFloat(e.delta.usdc);
            const cls = usdc > 0 ? "long" : usdc < 0 ? "short" : "muted";
            return (
              <tr
                key={`${e.wallet?.address ?? "self"}:${e.time}-${e.delta.coin}-${e.hash}`}
              >
                <td className="mono muted">{fmtFundingTime(e.time)}</td>
                {aggregate && (
                  <td>
                    <WalletChip wallet={e.wallet} />
                  </td>
                )}
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

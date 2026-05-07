import { useEffect, useState } from "react";
import { fetchSpotState, isValidAddress, type SpotBalance } from "../lib/hl";
import { fmtSize, fmtUsd } from "../lib/format";

const REFRESH_MS = 8000;

type Props = { addresses: string[] };

type Row = SpotBalance & { wallet: string };

export function SpotTable({ addresses }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const key = addresses.slice().sort().join(",");

  useEffect(() => {
    setRows([]);
    setError(null);
    setLoaded(false);
    if (addresses.length === 0) return;

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        const results = await Promise.all(
          addresses
            .filter((a) => isValidAddress(a))
            .map(async (addr) => {
              const state = await fetchSpotState(addr, ctrl.signal);
              return state.balances.map((b) => ({ ...b, wallet: addr }));
            }),
        );
        if (cancelled) return;
        setRows(results.flat());
        setError(null);
        setLoaded(true);
      } catch (err) {
        if (cancelled || ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoaded(true);
      }
    };

    tick();
    const id = window.setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!loaded) {
    return (
      <div className="empty">
        <div>Loading spot balances…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty">
        <div className="error">Could not load spot state.</div>
        <div className="hint mono">{error}</div>
      </div>
    );
  }

  const visible = rows.filter((r) => parseFloat(r.total) !== 0);
  if (visible.length === 0) {
    return (
      <div className="empty">
        <div>No spot balances.</div>
        <div className="hint">
          Spot balances will appear here when this wallet holds Hyperliquid spot tokens.
        </div>
      </div>
    );
  }

  const sorted = [...visible].sort(
    (a, b) => parseFloat(b.total) - parseFloat(a.total),
  );

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Coin</th>
          <th>Balance</th>
          <th>Available</th>
          <th>On hold</th>
          <th>Entry notional</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((b) => {
          const total = parseFloat(b.total);
          const hold = parseFloat(b.hold);
          const available = total - hold;
          const entry = b.entryNtl ? parseFloat(b.entryNtl) : null;
          return (
            <tr key={`${b.wallet}:${b.coin}:${b.token}`}>
              <td>
                <span className="coin">{b.coin}</span>
              </td>
              <td className="mono">{fmtSize(total)}</td>
              <td className="mono">{fmtSize(available)}</td>
              <td className="mono muted">{fmtSize(hold)}</td>
              <td className="mono muted">
                {entry != null ? fmtUsd(entry) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

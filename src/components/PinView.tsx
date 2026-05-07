import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { fetchSnapshot, isValidAddress, type AssetPosition } from "../lib/hl";
import {
  fmtPrice,
  fmtSignedPct,
  fmtSignedUsd,
  fmtSize,
  fmtUsd,
} from "../lib/format";
import { Sparkline } from "./Sparkline";
import { fetchCandleSnapshot } from "../lib/hl";

const REFRESH_MS = 5000;
const CANDLE_REFRESH_MS = 60000;

type Props = { coin: string; wallet: string };

export function PinView({ coin, wallet }: Props) {
  const [data, setData] = useState<AssetPosition | null>(null);
  const [mark, setMark] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candles, setCandles] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!isValidAddress(wallet)) {
      setError("Invalid wallet address.");
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        const snap = await fetchSnapshot(wallet, ctrl.signal);
        if (cancelled) return;
        const ap = snap.state.assetPositions.find(
          (p) => p.position.coin === coin,
        );
        setData(ap ?? null);
        const m = snap.mids[coin];
        if (m) setMark(parseFloat(m));
        setError(null);
      } catch (err) {
        if (cancelled || ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    tick();
    const id = window.setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [wallet, coin]);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const tick = async () => {
      try {
        const end = Date.now();
        const start = end - 24 * 60 * 60 * 1000;
        const cs = await fetchCandleSnapshot(coin, "1h", start, end, ctrl.signal);
        if (cancelled) return;
        setCandles(cs.map((c) => [c.t, parseFloat(c.c)]));
      } catch {
        // ignore
      }
    };
    tick();
    const id = window.setInterval(tick, CANDLE_REFRESH_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [coin]);

  const startDrag = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest("button, input, a")) return;
    getCurrentWindow().startDragging().catch(() => {});
  };

  const close = () => {
    getCurrentWindow().close().catch(() => {});
  };

  if (error) {
    return (
      <div className="pin" onMouseDown={startDrag} data-tauri-drag-region>
        <div className="pin-head">
          <span className="pin-coin">{coin}</span>
          <button className="pin-close" type="button" onClick={close}>
            ✕
          </button>
        </div>
        <div className="empty">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pin" onMouseDown={startDrag} data-tauri-drag-region>
        <div className="pin-head">
          <span className="pin-coin">{coin}</span>
          <button className="pin-close" type="button" onClick={close}>
            ✕
          </button>
        </div>
        <div className="pin-body muted">
          {wallet ? "Loading…" : "Awaiting wallet…"}
        </div>
      </div>
    );
  }

  const p = data.position;
  const sz = parseFloat(p.szi);
  const isLong = sz > 0;
  const upnl = parseFloat(p.unrealizedPnl);
  const roe = parseFloat(p.returnOnEquity);
  const liq = p.liquidationPx ? parseFloat(p.liquidationPx) : null;
  const upnlClass = upnl > 0 ? "long" : upnl < 0 ? "short" : "muted";
  const roeClass = roe > 0 ? "long" : roe < 0 ? "short" : "muted";
  const liqDistance =
    liq != null && mark != null
      ? (Math.abs(mark - liq) / mark) * 100
      : null;

  const positive = candles && candles.length >= 2
    ? candles[candles.length - 1][1] > candles[0][1]
    : undefined;

  return (
    <div className="pin" onMouseDown={startDrag} data-tauri-drag-region>
      <div className="pin-head">
        <span className="pin-coin">{p.coin}</span>
        <span className={isLong ? "tag tag-long" : "tag tag-short"}>
          {isLong ? "Long" : "Short"}
        </span>
        <span className="muted subtle mono pin-size">
          {fmtSize(Math.abs(sz))}
        </span>
        <button className="pin-close" type="button" onClick={close} title="Close">
          ✕
        </button>
      </div>
      <div className="pin-stats">
        <Stat label="uPnL" value={fmtSignedUsd(upnl)} valueClass={upnlClass} />
        <Stat label="ROE" value={fmtSignedPct(roe)} valueClass={roeClass} />
        <Stat label="Mark" value={mark != null ? fmtPrice(mark) : "—"} />
        <Stat
          label="Liq"
          value={liq != null ? fmtPrice(liq) : "—"}
          valueClass="muted"
          hint={liqDistance != null ? `${liqDistance.toFixed(2)}% away` : undefined}
        />
        <Stat label="Notional" value={fmtUsd(p.positionValue)} />
        <Stat
          label="Lev"
          value={`${p.leverage.value}× ${p.leverage.type === "isolated" ? "iso" : "x"}`}
          valueClass="muted"
        />
      </div>
      {candles && (
        <div className="pin-spark">
          <Sparkline points={candles} width={272} height={36} positive={positive} />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
  hint,
}: {
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
}) {
  return (
    <div className="pin-stat">
      <span className="k">{label}</span>
      <span className={`v mono ${valueClass ?? ""}`}>{value}</span>
      {hint && <span className="pin-stat-hint subtle">{hint}</span>}
    </div>
  );
}

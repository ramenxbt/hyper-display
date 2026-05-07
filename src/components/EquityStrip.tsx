import { useEffect, useMemo, useRef, useState } from "react";
import {
  frameByKey,
  type PortfolioFrameKey,
  type PortfolioHistory,
} from "../lib/hl";
import { Sparkline } from "./Sparkline";
import { fmtSignedPct, fmtSignedUsd } from "../lib/format";

type Props = {
  portfolio: PortfolioHistory | undefined;
  showSecondary?: boolean;
};

type Series = "equity" | "pnl";

const FRAMES: { key: PortfolioFrameKey; label: string }[] = [
  { key: "day", label: "24H" },
  { key: "week", label: "7D" },
  { key: "month", label: "30D" },
  { key: "allTime", label: "All" },
];

export function EquityStrip({ portfolio, showSecondary = true }: Props) {
  const [active, setActive] = useState<PortfolioFrameKey>("day");
  const [series, setSeries] = useState<Series>("equity");
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(640);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(160, Math.floor(e.contentRect.width));
        setChartW(w);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const frame = frameByKey(portfolio, active);
    const equity: [number, number][] = (frame?.accountValueHistory ?? []).map(
      ([t, v]) => [t, parseFloat(v)],
    );
    const pnl: [number, number][] = (frame?.pnlHistory ?? []).map(
      ([t, v]) => [t, parseFloat(v)],
    );

    const primary = series === "equity" ? equity : pnl;
    const secondary = series === "equity" ? pnl : equity;

    if (primary.length < 2) {
      return { primary, secondary, deltaUsd: null, deltaPct: null };
    }

    const startVal = primary[0][1];
    const endVal = primary[primary.length - 1][1];
    const deltaUsd = endVal - startVal;
    const denom = series === "equity" ? Math.abs(startVal) : Math.abs(equity[0]?.[1] ?? 0);
    const deltaPct = denom !== 0 ? deltaUsd / denom : 0;

    return { primary, secondary, deltaUsd, deltaPct };
  }, [portfolio, active, series]);

  const positive =
    data.deltaUsd == null
      ? undefined
      : data.deltaUsd > 0
        ? true
        : data.deltaUsd < 0
          ? false
          : undefined;
  const valueClass =
    data.deltaUsd == null
      ? ""
      : data.deltaUsd > 0
        ? "long"
        : data.deltaUsd < 0
          ? "short"
          : "muted";

  return (
    <div className="equity">
      <div className="equity-meta">
        <div className="equity-row">
          <div className="equity-frames">
            {FRAMES.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`pill ${active === f.key ? "active" : ""}`}
                onClick={() => setActive(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="equity-series">
            <button
              type="button"
              className={`pill ${series === "equity" ? "active" : ""}`}
              onClick={() => setSeries("equity")}
              title="Account value over time"
            >
              Equity
            </button>
            <button
              type="button"
              className={`pill ${series === "pnl" ? "active" : ""}`}
              onClick={() => setSeries("pnl")}
              title="Cumulative PnL over time"
            >
              PnL
            </button>
          </div>
        </div>
        <div className="equity-pnl">
          <span className="k">
            {series === "equity" ? "Equity Δ" : "PnL Δ"}
          </span>
          <span className={`v mono ${valueClass}`}>
            {data.deltaUsd == null ? "—" : fmtSignedUsd(data.deltaUsd)}
          </span>
          <span className={`pct mono ${valueClass}`}>
            {data.deltaPct == null ? "" : fmtSignedPct(data.deltaPct)}
          </span>
        </div>
      </div>
      <div className="equity-chart" ref={containerRef}>
        <Sparkline
          points={data.primary}
          secondaryPoints={showSecondary ? data.secondary : undefined}
          width={chartW}
          height={64}
          positive={positive}
        />
      </div>
    </div>
  );
}

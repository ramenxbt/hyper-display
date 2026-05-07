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
};

const FRAMES: { key: PortfolioFrameKey; label: string }[] = [
  { key: "day", label: "24H" },
  { key: "week", label: "7D" },
  { key: "month", label: "30D" },
  { key: "allTime", label: "All" },
];

export function EquityStrip({ portfolio }: Props) {
  const [active, setActive] = useState<PortfolioFrameKey>("day");
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
    const history = frame?.accountValueHistory ?? [];
    const points: [number, number][] = history.map(([t, v]) => [t, parseFloat(v)]);
    if (points.length < 2)
      return { points, startVal: null, endVal: null, deltaUsd: null, deltaPct: null };
    const startVal = points[0][1];
    const endVal = points[points.length - 1][1];
    const deltaUsd = endVal - startVal;
    const deltaPct = startVal !== 0 ? deltaUsd / Math.abs(startVal) : 0;
    return { points, startVal, endVal, deltaUsd, deltaPct };
  }, [portfolio, active]);

  const positive =
    data.deltaUsd == null ? undefined : data.deltaUsd > 0 ? true : data.deltaUsd < 0 ? false : undefined;
  const valueClass =
    data.deltaUsd == null ? "" : data.deltaUsd > 0 ? "long" : data.deltaUsd < 0 ? "short" : "muted";

  return (
    <div className="equity">
      <div className="equity-meta">
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
        <div className="equity-pnl">
          <span className="k">PnL</span>
          <span className={`v mono ${valueClass}`}>
            {data.deltaUsd == null ? "—" : fmtSignedUsd(data.deltaUsd)}
          </span>
          <span className={`pct mono ${valueClass}`}>
            {data.deltaPct == null ? "" : fmtSignedPct(data.deltaPct)}
          </span>
        </div>
      </div>
      <div className="equity-chart" ref={containerRef}>
        <Sparkline points={data.points} width={chartW} height={64} positive={positive} />
      </div>
    </div>
  );
}

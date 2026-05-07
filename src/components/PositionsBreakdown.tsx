import { useMemo } from "react";
import type { TaggedAssetPosition, TaggedUserFill } from "../lib/aggregate";
import { Donut } from "./Donut";
import { fmtSignedUsd } from "../lib/format";

type Props = {
  positions: TaggedAssetPosition[];
  fills: TaggedUserFill[];
};

export function PositionsBreakdown({ positions, fills }: Props) {
  const totals = useMemo(() => {
    let totalUpnl = 0;
    let totalRealized = 0;
    const upnlByCoin: Record<string, number> = {};
    const realizedByCoin: Record<string, number> = {};

    for (const ap of positions) {
      const upnl = parseFloat(ap.position.unrealizedPnl);
      totalUpnl += upnl;
      upnlByCoin[ap.position.coin] =
        (upnlByCoin[ap.position.coin] ?? 0) + upnl;
    }

    for (const f of fills) {
      const pnl = parseFloat(f.closedPnl);
      if (!Number.isFinite(pnl) || pnl === 0) continue;
      totalRealized += pnl;
      realizedByCoin[f.coin] = (realizedByCoin[f.coin] ?? 0) + pnl;
    }

    const upnlSlices = Object.entries(upnlByCoin)
      .filter(([, v]) => v !== 0)
      .map(([coin, v]) => ({ label: coin, value: v }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const realizedSlices = Object.entries(realizedByCoin)
      .filter(([, v]) => v !== 0)
      .map(([coin, v]) => ({ label: coin, value: v }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return {
      totalUpnl,
      totalRealized,
      upnlSlices,
      realizedSlices,
    };
  }, [positions, fills]);

  if (positions.length === 0) return null;

  const realizedClass =
    totals.totalRealized > 0 ? "long" : totals.totalRealized < 0 ? "short" : "";
  const upnlClass =
    totals.totalUpnl > 0 ? "long" : totals.totalUpnl < 0 ? "short" : "";

  return (
    <div className="breakdown">
      <BreakdownCard
        title="Realized PnL"
        centerLabel="Net"
        centerValue={fmtSignedUsd(totals.totalRealized)}
        slices={totals.realizedSlices}
        emptyHint="No closed trades in the recent fills window."
        valueClass={realizedClass}
      />
      <BreakdownCard
        title="Unrealized PnL"
        centerLabel="Net"
        centerValue={fmtSignedUsd(totals.totalUpnl)}
        slices={totals.upnlSlices}
        emptyHint="No open positions with non-zero PnL."
        valueClass={upnlClass}
      />
    </div>
  );
}

function BreakdownCard({
  title,
  centerLabel,
  centerValue,
  slices,
  emptyHint,
  valueClass,
}: {
  title: string;
  centerLabel: string;
  centerValue: string;
  slices: { label: string; value: number }[];
  emptyHint: string;
  valueClass: string;
}) {
  const colored = slices.map((s) => ({
    label: s.label,
    value: s.value,
    color: s.value >= 0 ? "var(--long)" : "var(--short)",
  }));
  const total = slices.reduce((acc, s) => acc + Math.abs(s.value), 0);
  return (
    <div className="breakdown-card">
      <div className="breakdown-head">
        <span className="k">{title}</span>
        <span className={`mono ${valueClass}`}>{centerValue}</span>
      </div>
      <div className="breakdown-body">
        {slices.length === 0 ? (
          <div className="breakdown-empty muted subtle">{emptyHint}</div>
        ) : (
          <>
            <Donut
              slices={colored}
              centerLabel={centerLabel}
              centerValue={centerValue}
            />
            <Legend slices={slices} total={total} />
          </>
        )}
      </div>
    </div>
  );
}

function Legend({
  slices,
  total,
}: {
  slices: { label: string; value: number }[];
  total: number;
}) {
  const max = Math.min(slices.length, 6);
  return (
    <div className="donut-legend">
      {slices.slice(0, max).map((s) => {
        const frac = total > 0 ? Math.abs(s.value) / total : 0;
        const cls = s.value > 0 ? "long" : s.value < 0 ? "short" : "muted";
        return (
          <div key={s.label} className="legend-row">
            <span
              className="donut-swatch"
              style={{
                background: s.value >= 0 ? "var(--long)" : "var(--short)",
              }}
            />
            <span className="legend-label">{s.label}</span>
            <span className={`legend-value mono ${cls}`}>
              {fmtSignedUsd(s.value)}
            </span>
            <span className="legend-pct mono subtle">
              {(frac * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
      {slices.length > max && (
        <div className="legend-row legend-more">
          <span className="muted subtle">+ {slices.length - max} more</span>
        </div>
      )}
    </div>
  );
}

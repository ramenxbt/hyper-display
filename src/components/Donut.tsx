import { useMemo, useState } from "react";

export type DonutSlice = {
  label: string;
  value: number; // can be negative; magnitude is what's drawn
  color?: string;
};

type Props = {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
};

const PALETTE = [
  "#97fce4",
  "#5fd6bb",
  "#43c4d3",
  "#5b9df5",
  "#a89cf5",
  "#f0a3d6",
  "#f5a524",
  "#ed7088",
  "#1fa67d",
  "#9a9faa",
];

export function Donut({
  slices,
  size = 96,
  thickness = 14,
  centerLabel,
  centerValue,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const computed = useMemo(() => {
    const total = slices.reduce((acc, s) => acc + Math.abs(s.value), 0);
    if (total === 0) return [];
    let acc = 0;
    return slices.map((s, i) => {
      const frac = Math.abs(s.value) / total;
      const dash = c * frac;
      const offset = -c * acc;
      acc += frac;
      return {
        ...s,
        color: s.color ?? PALETTE[i % PALETTE.length],
        dash,
        offset,
        frac,
      };
    });
  }, [slices, c]);

  if (computed.length === 0) {
    return (
      <div className="donut empty" style={{ width: size, height: size }}>
        <span className="muted subtle">no data</span>
      </div>
    );
  }

  const hovered = hover != null ? computed[hover] : null;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={thickness}
        />
        {computed.map((s, i) => (
          <circle
            key={s.label + i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${c - s.dash}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={hover == null || hover === i ? 1 : 0.35}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((v) => (v === i ? null : v))}
            style={{ transition: "opacity 120ms" }}
          />
        ))}
      </svg>
      <div className="donut-center">
        {hovered ? (
          <>
            <span className="donut-label">{hovered.label}</span>
            <span className="donut-value">
              {(hovered.frac * 100).toFixed(1)}%
            </span>
          </>
        ) : (
          <>
            {centerLabel && <span className="donut-label">{centerLabel}</span>}
            {centerValue && <span className="donut-value">{centerValue}</span>}
          </>
        )}
      </div>
    </div>
  );
}

export function PaletteSwatch({ index }: { index: number }) {
  return (
    <span
      className="donut-swatch"
      style={{ background: PALETTE[index % PALETTE.length] }}
    />
  );
}

export function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

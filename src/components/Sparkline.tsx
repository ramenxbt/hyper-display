import { useMemo } from "react";

type Props = {
  points: [number, number][];
  width?: number;
  height?: number;
  positive?: boolean;
  showFill?: boolean;
};

export function Sparkline({
  points,
  width = 320,
  height = 56,
  positive,
  showFill = true,
}: Props) {
  const path = useMemo(() => buildPath(points, width, height), [points, width, height]);

  if (!path) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="sparkline empty"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="rgba(255,255,255,0.06)"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  const stroke = positive == null ? "var(--mint)" : positive ? "var(--long)" : "var(--short)";
  const fillId = `spark-fill-${positive ?? "neutral"}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="sparkline"
    >
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showFill && (
        <path d={`${path.line} L ${width},${height} L 0,${height} Z`} fill={`url(#${fillId})`} />
      )}
      <path d={path.line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {path.last && (
        <circle cx={path.last.x} cy={path.last.y} r="2.5" fill={stroke} />
      )}
    </svg>
  );
}

function buildPath(
  points: [number, number][],
  width: number,
  height: number,
): { line: string; last: { x: number; y: number } | null } | null {
  if (!points || points.length < 2) return null;

  const xs = points.map(([t]) => t);
  const ys = points.map(([, v]) => v);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  const pad = 4;
  const w = width;
  const h = height - pad * 2;

  const projected = points.map(([t, v]) => {
    const x = ((t - minX) / xRange) * w;
    const y = pad + (1 - (v - minY) / yRange) * h;
    return { x, y };
  });

  let line = `M ${projected[0].x.toFixed(2)},${projected[0].y.toFixed(2)}`;
  for (let i = 1; i < projected.length; i++) {
    line += ` L ${projected[i].x.toFixed(2)},${projected[i].y.toFixed(2)}`;
  }

  return {
    line,
    last: projected[projected.length - 1],
  };
}

"use client";

import * as React from "react";

/** Shared SVG pattern defs for the diagonal-hatch fill used across these
 * charts (mirrors the striped-segment look from the bklit.com reference). */
function HatchDefs({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      <pattern
        id={`${idPrefix}-hatch`}
        width={6}
        height={6}
        patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse"
      >
        <line x1={0} y1={0} x2={0} y2={6} stroke="var(--color-foreground)" strokeWidth={1.4} strokeOpacity={0.55} />
      </pattern>
      <linearGradient id={`${idPrefix}-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.28} />
        <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

/** Smooth, glowing wave/area chart in the bklit hero-card style — a single
 * soft line with a faint gradient fill beneath it. */
export function SoftAreaWave({
  values,
  height = 180,
  strokeOpacity = 0.85,
}: {
  values: number[];
  height?: number;
  strokeOpacity?: number;
}) {
  const width = 600;
  const id = React.useId().replace(/[:]/g, "");

  const path = React.useMemo(() => {
    if (values.length < 2) return { line: "", area: "" };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = height * 0.18;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return [x, y] as const;
    });

    function smoothPath(pts: readonly (readonly [number, number])[]) {
      if (pts.length < 2) return "";
      let d = `M ${pts[0][0]},${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
      }
      return d;
    }

    const line = smoothPath(points);
    const area = `${line} L ${width},${height} L 0,${height} Z`;
    return { line, area };
  }, [values, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <HatchDefs idPrefix={id} />
      <path d={path.area} fill={`url(#${id}-fade)`} stroke="none" />
      <path
        d={path.line}
        fill="none"
        stroke="var(--color-foreground)"
        strokeOpacity={strokeOpacity}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Concentric multi-ring radial progress, bklit-style, with a big centered
 * number + label. Each ring represents one series normalized 0-1. */
export function RadialProgress({
  value,
  label,
  rings,
  size = 200,
}: {
  value: string;
  label: string;
  rings: { pct: number }[];
  size?: number;
}) {
  const center = size / 2;
  const strokeWidth = 6;
  const gap = 5;
  const outerRadius = center - strokeWidth;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((r, i) => {
          const radius = outerRadius - i * (strokeWidth + gap);
          if (radius <= 0) return null;
          const circumference = 2 * Math.PI * radius;
          const dash = Math.max(0, Math.min(1, r.pct)) * circumference;
          return (
            <g key={i}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="var(--color-foreground)"
                strokeOpacity={0.08}
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="var(--color-foreground)"
                strokeOpacity={0.35 + i * 0.18}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

/** Donut chart with alternating solid / diagonal-hatch segments and a
 * centered total, matching the bklit "100 Total" reference widget. */
export function HatchedDonut({
  segments,
  total,
  totalLabel,
  size = 200,
}: {
  segments: { label: string; value: number; hatched?: boolean }[];
  total: string;
  totalLabel: string;
  size?: number;
}) {
  const id = React.useId().replace(/[:]/g, "");
  const center = size / 2;
  const strokeWidth = size * 0.14;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const fraction = seg.value / sum;
    const dash = fraction * circumference;
    const arc = {
      ...seg,
      dash,
      gap: circumference - dash,
      rotation: (offset / sum) * 360,
      key: i,
    };
    offset += seg.value;
    return arc;
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <HatchDefs idPrefix={id} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-foreground)" strokeOpacity={0.08} strokeWidth={strokeWidth} />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={a.hatched ? `url(#${id}-hatch)` : "var(--color-foreground)"}
            strokeOpacity={a.hatched ? 1 : 0.75 - a.key * 0.12}
            strokeWidth={strokeWidth}
            strokeDasharray={`${a.dash} ${a.gap}`}
            transform={`rotate(${a.rotation} ${center} ${center})`}
          />
        ))}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{total}</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">{totalLabel}</span>
      </div>
    </div>
  );
}

/** Bar chart with dashed gridlines and alternating solid / diagonal-hatch
 * bars, matching the bklit monthly-bars reference widget. */
export function HatchedBarChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number; hatchedValue?: number }[];
  height?: number;
}) {
  const id = React.useId().replace(/[:]/g, "");
  const width = 600;
  const paddingBottom = 24;
  const paddingTop = 8;
  const max = Math.max(...data.map((d) => Math.max(d.value, d.hatchedValue ?? 0)), 1);
  const groupWidth = width / data.length;
  const barWidth = Math.min(18, groupWidth * 0.26);
  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <HatchDefs idPrefix={id} />
      {Array.from({ length: gridLines }).map((_, i) => {
        const y = paddingTop + ((height - paddingTop - paddingBottom) / (gridLines - 1)) * i;
        return (
          <line
            key={i}
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            stroke="var(--color-foreground)"
            strokeOpacity={0.08}
            strokeDasharray="3 4"
          />
        );
      })}
      {data.map((d, i) => {
        const cx = groupWidth * i + groupWidth / 2;
        const barH = ((height - paddingTop - paddingBottom) * d.value) / max;
        const hatchedH = d.hatchedValue
          ? ((height - paddingTop - paddingBottom) * d.hatchedValue) / max
          : 0;
        const baseY = height - paddingBottom;
        return (
          <g key={i}>
            <rect
              x={cx - barWidth - 2}
              y={baseY - barH}
              width={barWidth}
              height={barH}
              rx={2}
              fill="var(--color-foreground)"
              fillOpacity={0.85}
            />
            {d.hatchedValue !== undefined && (
              <rect
                x={cx + 2}
                y={baseY - hatchedH}
                width={barWidth}
                height={hatchedH}
                rx={2}
                fill={`url(#${id}-hatch)`}
              />
            )}
            <text
              x={cx}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              fill="var(--color-muted-foreground)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

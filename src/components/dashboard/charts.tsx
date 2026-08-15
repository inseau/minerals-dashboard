"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from "recharts";

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
  formatter?: (value: number | string, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && <div className="mb-1 font-medium text-popover-foreground">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
            {p.color && (
              <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
            )}
            <span>{p.name}:</span>
            <span className="font-medium text-popover-foreground tabular-nums">
              {formatter && p.value !== undefined ? formatter(p.value, p.name) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleLineChart({
  data,
  xKey,
  lines,
  height = 280,
  formatter,
  referenceLines,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  lines: { key: string; name: string; color?: string }[];
  height?: number;
  formatter?: (value: number | string, name?: string) => string;
  referenceLines?: { x?: number | string; label?: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) =>
            new Intl.NumberFormat("en-US", { notation: "compact" }).format(v as number)
          }
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {referenceLines?.map((rl, i) => (
          <ReferenceLine
            key={i}
            x={rl.x}
            stroke="var(--color-destructive)"
            strokeDasharray="4 3"
            label={{ value: rl.label, fontSize: 10, fill: "var(--color-destructive)", position: "top" }}
          />
        ))}
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleAreaChart({
  data,
  xKey,
  areaKey,
  name,
  height = 240,
  formatter,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  areaKey: string;
  name: string;
  height?: number;
  formatter?: (value: number | string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        <Area
          type="monotone"
          dataKey={areaKey}
          name={name}
          stroke="var(--color-chart-1)"
          fill="url(#areaFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RankBarChart({
  data,
  height = 320,
  formatter,
  color = "var(--color-chart-1)",
  colorFn,
}: {
  data: { label: string; value: number }[];
  height?: number;
  formatter?: (v: number) => string;
  color?: string;
  colorFn?: (d: { label: string; value: number }) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          tickFormatter={(v) =>
            new Intl.NumberFormat("en-US", { notation: "compact" }).format(v as number)
          }
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip
          content={
            <ChartTooltip formatter={(v) => (formatter ? formatter(Number(v)) : String(v))} />
          }
        />
        <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorFn ? colorFn(d) : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleScatterChart({
  data,
  xLabel,
  yLabel,
  height = 320,
  formatter,
}: {
  data: { x: number; y: number; label: string }[];
  xLabel: string;
  yLabel: string;
  height?: number;
  formatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          label={{ value: xLabel, position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--color-muted-foreground)" }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--color-muted-foreground)" }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { x: number; y: number; label: string };
            return (
              <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                <div className="mb-1 font-medium text-popover-foreground">{d.label}</div>
                <div className="text-muted-foreground">
                  {xLabel}: <span className="font-medium text-popover-foreground">{formatter ? formatter(d.x) : d.x}</span>
                </div>
                <div className="text-muted-foreground">
                  {yLabel}: <span className="font-medium text-popover-foreground">{formatter ? formatter(d.y) : d.y}</span>
                </div>
              </div>
            );
          }}
        />
        <Scatter data={data} fill="var(--color-chart-1)" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

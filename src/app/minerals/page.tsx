"use client";

import * as React from "react";
import { GemIcon } from "lucide-react";

import { useDashboard } from "@/lib/dashboard-context";
import { PageHeader, LoadingState, SectionCard, EmptyState } from "@/components/dashboard/common";
import { SimpleLineChart } from "@/components/dashboard/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatUSD, formatUSDExact, formatPercent, formatTonnes } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function MineralDetailPage() {
  const { data, loading, error } = useDashboard();
  const [selected, setSelected] = React.useState<string | null>(null);

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Mineral Analysis" description="Detailed single-mineral breakdown" />
        <LoadingState />
      </div>
    );
  }

  const { mineralSummaries, distributions, correlation, meta } = data;
  const mineral = selected ?? mineralSummaries[0]?.mineral;
  const summary = mineralSummaries.find((m) => m.mineral === mineral);
  const dist = distributions[mineral];

  const relatedCorr = correlation.strongest_mineral_price_pairs
    .filter((p) => p.mineral_a === mineral || p.mineral_b === mineral)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Mineral Analysis" description="Select a mineral for a full statistical breakdown." />
        <Select value={mineral} onValueChange={setSelected}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meta.minerals.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!summary ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <GemIcon className="size-5 text-primary" /> {summary.mineral}
            </div>
            {summary.is_rare_earth && <Badge>Rare earth</Badge>}
            <Badge variant="outline">{summary.end_use}</Badge>
            {summary.n_producers !== null && (
              <Badge variant="secondary">{summary.n_producers} producing countries</Badge>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
            <strong>Auto-generated insight:</strong> {summary.mineral} experienced a{" "}
            {formatPercent(summary.pct_change_full_period)} change in price over{" "}
            {meta.year_min}-{meta.year_max}, with its highest recorded value occurring in{" "}
            {summary.peak_year} ({formatUSDExact(summary.max_price)}/t) and its lowest in{" "}
            {summary.trough_year} ({formatUSDExact(summary.min_price)}/t). Its coefficient of
            variation over the period is {summary.cv_pct}%.
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Latest price" value={formatUSD(summary.latest_price) + "/t"} />
            <Stat label="Historical average" value={formatUSD(summary.mean_price) + "/t"} />
            <Stat label="Median" value={formatUSD(summary.median_price) + "/t"} />
            <Stat label="Std. deviation" value={formatUSD(summary.std_price)} />
            <Stat label="Minimum" value={formatUSD(summary.min_price) + "/t"} />
            <Stat label="Maximum" value={formatUSD(summary.max_price) + "/t"} />
            <Stat label="Q1 / Q3" value={`${formatUSD(summary.q1)} / ${formatUSD(summary.q3)}`} />
            <Stat label="IQR" value={formatUSD(summary.iqr)} />
            <Stat
              label="Full-period change"
              value={formatPercent(summary.pct_change_full_period)}
              positive={(summary.pct_change_full_period ?? 0) >= 0}
            />
            <Stat label="Avg. YoY change" value={formatPercent(summary.avg_yoy_change_pct)} />
            <Stat label="YoY volatility" value={`${summary.yoy_volatility_pct ?? "—"}%`} />
            <Stat
              label="Reserves (latest yr)"
              value={formatTonnes(summary.latest_reserves_tonnes)}
            />
            <Stat
              label="Years of reserves"
              value={summary.latest_years_of_reserves ? `${summary.latest_years_of_reserves}` : "—"}
            />
            <Stat label="Disruption events" value={String(summary.disruption_events)} />
            <Stat label="Export-control events" value={String(summary.export_control_events)} />
            <Stat label="Avg. supply-risk score" value={String(summary.avg_supply_risk_score)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard title="Historical price trend" className="lg:col-span-2">
              <SimpleLineChart
                data={summary.price_history.map((p) => ({ year: p.year, Price: p.price }))}
                xKey="year"
                lines={[{ key: "Price", name: "Price", color: "var(--color-chart-1)" }]}
                formatter={(v) => formatUSD(Number(v)) + "/t"}
                height={280}
              />
            </SectionCard>

            <SectionCard title="Distribution" description="Histogram of annual price observations.">
              {dist && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={dist.counts.map((c, i) => ({
                      bin: `${new Intl.NumberFormat("en-US", { notation: "compact" }).format(
                        dist.bin_edges[i]
                      )}`,
                      count: c,
                    }))}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="bin"
                      tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--color-border)" }}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={26}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine x={dist.median} stroke="var(--color-chart-3)" strokeDasharray="3 3" />
                    <Bar dataKey="count" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Mean {formatUSD(dist?.mean)} · Median {formatUSD(dist?.median)} · Std {formatUSD(dist?.std)}
              </p>
            </SectionCard>
          </div>

          <SectionCard
            title="Related correlations"
            description={`Mineral pairs whose annual global prices move together most closely with ${summary.mineral} (Pearson r on price level, ${meta.year_min}-${meta.year_max}).`}
          >
            {relatedCorr.length === 0 ? (
              <EmptyState message="No strongly correlated mineral pairs found for this mineral." />
            ) : (
              <div className="flex flex-col gap-1.5">
                {relatedCorr.map((p, i) => {
                  const other = p.mineral_a === mineral ? p.mineral_b : p.mineral_a;
                  return (
                    <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>{other}</span>
                      <Badge variant={p.pearson_r >= 0 ? "success" : "destructive"}>
                        r = {p.pearson_r}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-md border px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={
          "mt-0.5 text-sm font-semibold tabular-nums " +
          (positive === undefined ? "" : positive ? "text-success" : "text-destructive")
        }
      >
        {value}
      </p>
    </div>
  );
}

"use client";

import * as React from "react";

import { useDashboard } from "@/lib/dashboard-context";
import { useFilteredAnalytics } from "@/lib/use-filtered-analytics";
import { PageHeader, LoadingState, SectionCard, EmptyState } from "@/components/dashboard/common";
import { RankBarChart } from "@/components/dashboard/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUSD, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

const METRICS = [
  { key: "by_latest_price", label: "Highest recent price ($/t)", unit: "usd" },
  { key: "by_mean_price", label: "Highest average price ($/t)", unit: "usd" },
  { key: "by_pct_change_full_period", label: "Largest price change (%)", unit: "pct" },
  { key: "by_volatility_cv", label: "Highest volatility (CV %)", unit: "pct" },
  { key: "by_supply_risk", label: "Highest supply-risk score", unit: "num" },
  { key: "by_range", label: "Largest historical price range ($/t)", unit: "usd" },
] as const;

// Metrics not derivable client-side from raw records (or that only make sense
// on the full period) fall back to the full-dataset ranking when filters are
// active, with a note explaining why.
const FILTER_SCOPED: Record<string, boolean> = {
  by_latest_price: true,
  by_mean_price: true,
  by_pct_change_full_period: true,
  by_volatility_cv: true,
  by_range: true,
  by_supply_risk: false,
};

export default function RankingsPage() {
  const { data, loading, error, filtersActive } = useDashboard();
  const filtered = useFilteredAnalytics();
  const [metricKey, setMetricKey] = React.useState<(typeof METRICS)[number]["key"]>("by_pct_change_full_period");

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Mineral Ranking" description="Compare minerals across key metrics" />
        <LoadingState />
      </div>
    );
  }

  const { rankings } = data;
  const metric = METRICS.find((m) => m.key === metricKey)!;
  const useFiltered = filtersActive && filtered && FILTER_SCOPED[metricKey];

  const filteredMap: Record<string, { mineral: string; value: number }[] | undefined> = filtered
    ? {
        by_latest_price: filtered.rankings.by_latest_price,
        by_mean_price: filtered.rankings.by_mean_price,
        by_pct_change_full_period: filtered.rankings.by_pct_change,
        by_volatility_cv: filtered.rankings.by_volatility_cv,
        by_range: filtered.rankings.by_range,
      }
    : {};

  const rows = useFiltered ? filteredMap[metricKey] ?? [] : rankings[metricKey];
  const chartData = rows.map((r) => ({ label: r.mineral, value: r.value }));

  const formatValue = (v: number) =>
    metric.unit === "usd" ? formatUSD(v) : metric.unit === "pct" ? formatPercent(v) : v.toFixed(2);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PageHeader title="Mineral Ranking" description="Change the metric to re-rank all minerals." />
          {useFiltered && <Badge variant="secondary">Filtered</Badge>}
        </div>
        <Select value={metricKey} onValueChange={(v) => setMetricKey(v as typeof metricKey)}>
          <SelectTrigger className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRICS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtersActive && !FILTER_SCOPED[metricKey] && (
        <p className="text-xs text-muted-foreground">
          Supply-risk score is shown for the full dataset — it doesn&apos;t recompute from a filtered
          date range or country selection, since it&apos;s a per-mineral figure rather than a per-row one.
        </p>
      )}

      <SectionCard
        title={metric.label}
        description={useFiltered ? "Ranked over your current filter selection." : "All tracked minerals, ranked highest to lowest."}
      >
        {chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <RankBarChart
            data={chartData}
            height={Math.max(320, rows.length * 24)}
            formatter={formatValue}
            colorFn={(d) => (d.value >= 0 ? "var(--color-chart-1)" : "var(--color-destructive)")}
          />
        )}
      </SectionCard>

      <SectionCard title="Full ranking table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Mineral</TableHead>
              <TableHead className="text-right">{metric.label}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.mineral}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{r.mineral}</TableCell>
                <TableCell className="text-right tabular-nums">{formatValue(r.value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top gainers" description="Largest full-period price increase, full dataset.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mineral</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.top_gainers.map((r) => (
                <TableRow key={r.mineral}>
                  <TableCell className="font-medium">{r.mineral}</TableCell>
                  <TableCell className="text-right tabular-nums text-success">
                    {formatPercent(r.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard
          title="Smallest gainers"
          description={
            rankings.has_true_decliners
              ? "Smallest / most negative full-period price change, full dataset."
              : "No mineral declined over the full period in this dataset — these had the smallest gains."
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mineral</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.smallest_gainers.map((r) => (
                <TableRow key={r.mineral}>
                  <TableCell className="font-medium">{r.mineral}</TableCell>
                  <TableCell
                    className={
                      "text-right tabular-nums " + (r.value < 0 ? "text-destructive" : "text-muted-foreground")
                    }
                  >
                    {formatPercent(r.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </div>
    </div>
  );
}

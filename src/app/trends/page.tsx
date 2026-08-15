"use client";

import * as React from "react";

import { useDashboard } from "@/lib/dashboard-context";
import { useFilteredAnalytics } from "@/lib/use-filtered-analytics";
import { PageHeader, LoadingState, SectionCard, EmptyState } from "@/components/dashboard/common";
import { SimpleLineChart } from "@/components/dashboard/charts";
import { MultiSelectFilter } from "@/components/dashboard/multi-select-filter";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { formatUSD } from "@/lib/format";

// This page intentionally breaks from the dashboard's monochrome theme —
// distinct colors make it much easier to tell mineral lines apart here.
const TREND_COLORS = [
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fbbf24", // amber
  "#f472b6", // pink
  "#a78bfa", // violet
  "#fb923c", // orange
  "#22d3ee", // cyan
  "#a3e635", // lime
];

export default function TrendsPage() {
  const { data, loading, error, filters, filtersActive } = useDashboard();
  const filtered = useFilteredAnalytics();
  const [selected, setSelected] = React.useState<string[]>([]);

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Market Trends" description="Historical price trend analysis" />
        <LoadingState />
      </div>
    );
  }

  const { marketTrend, meta } = data;
  const [rangeStart, rangeEnd] = filters.yearRange;

  // Default the mineral comparison to whatever's picked in the global filter
  // bar; fall back to the first three minerals if nothing is selected there.
  const active = selected.length
    ? selected
    : filters.minerals.length
    ? filters.minerals
    : meta.minerals.slice(0, 3);

  const yearsInRange = marketTrend.overall.map((d) => d.year).filter((y) => y >= rangeStart && y <= rangeEnd);
  const mineralTrendData = yearsInRange.map((y) => {
    const row: Record<string, unknown> = { year: y };
    active.forEach((m) => {
      const series = marketTrend.by_mineral[m] ?? [];
      const point = series.find((p) => p.year === y);
      row[m] = point ? point.price_usd_per_tonne : null;
    });
    return row;
  });

  const reGroups = new Map<number, { re?: number; nonRe?: number }>();
  marketTrend.by_rare_earth_flag
    .filter((d) => d.year >= rangeStart && d.year <= rangeEnd)
    .forEach((d) => {
      const entry = reGroups.get(d.year) ?? {};
      if (d.is_rare_earth === 1) entry.re = d.price_usd_per_tonne;
      else entry.nonRe = d.price_usd_per_tonne;
      reGroups.set(d.year, entry);
    });
  const reData = Array.from(reGroups.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, v]) => ({ year, "Rare earth (avg)": v.re, "Non-rare-earth (avg)": v.nonRe }));

  const overallData = (filtersActive && filtered ? filtered.trend : marketTrend.overall).map((d) => ({
    year: d.year,
    "Avg. price": d.avg_price,
    "3-yr moving avg": d.ma_3yr,
  }));

  const firstYear = filtersActive ? rangeStart : meta.year_min;
  const lastYear = filtersActive ? rangeEnd : meta.year_max;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Market Trends"
        description="Historical price movement across the tracked minerals."
      />

      <Alert>
        <InfoIcon />
        <AlertTitle>Annual granularity</AlertTitle>
        <AlertDescription>{marketTrend.granularity_note}</AlertDescription>
      </Alert>

      <SectionCard
        title="Overall market trend"
        description={`Average price across ${filtersActive ? (filtered?.minerals.length ?? meta.n_minerals) : meta.n_minerals} minerals, ${firstYear}-${lastYear}, with a 3-year moving average.`}
      >
        <SimpleLineChart
          data={overallData}
          xKey="year"
          lines={[
            { key: "Avg. price", name: "Avg. price", color: TREND_COLORS[0] },
            { key: "3-yr moving avg", name: "3-yr moving avg", color: TREND_COLORS[2] },
          ]}
          formatter={(v) => formatUSD(Number(v)) + "/t"}
          height={300}
        />
      </SectionCard>

      <SectionCard
        title="Compare mineral trends"
        description="Pulls from the Mineral filter in the top bar if you've set one; otherwise defaults to the first three. Use the selector below to override just this chart."
        action={
          <MultiSelectFilter
            label="Minerals"
            options={meta.minerals}
            selected={selected}
            onChange={setSelected}
          />
        }
      >
        {active.length === 0 ? (
          <EmptyState message="Select at least one mineral to compare." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {active.map((m, i) => (
                <Badge
                  key={m}
                  variant="outline"
                  className="gap-1.5 border-transparent"
                  style={{ color: TREND_COLORS[i % TREND_COLORS.length] }}
                >
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ background: TREND_COLORS[i % TREND_COLORS.length] }}
                  />
                  {m}
                </Badge>
              ))}
            </div>
            <SimpleLineChart
              data={mineralTrendData}
              xKey="year"
              lines={active.map((m, i) => ({ key: m, name: m, color: TREND_COLORS[i % TREND_COLORS.length] }))}
              formatter={(v) => formatUSD(Number(v)) + "/t"}
              height={340}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Rare earth vs. non-rare-earth"
        description="Average annual price, grouped by is_rare_earth flag."
      >
        <SimpleLineChart
          data={reData}
          xKey="year"
          lines={[
            { key: "Rare earth (avg)", name: "Rare earth (avg)", color: TREND_COLORS[4] },
            { key: "Non-rare-earth (avg)", name: "Non-rare-earth (avg)", color: TREND_COLORS[1] },
          ]}
          formatter={(v) => formatUSD(Number(v)) + "/t"}
          height={280}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Note: this is a simple average across minerals with very different price scales (e.g.
          platinum-group metals vs. graphite), so it can be dominated by a few high-value minerals.
          Visit the Mineral Analysis page to inspect individual mineral series without this
          cross-scale averaging effect.
        </p>
      </SectionCard>
    </div>
  );
}

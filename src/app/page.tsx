"use client";

import * as React from "react";
import Link from "next/link";
import {
  GemIcon,
  GlobeIcon,
  DatabaseIcon,
  TrendingUpIcon,
  ActivityIcon,
  ShieldAlertIcon,
  ZapOffIcon,
  LockIcon,
  ArrowRightIcon,
} from "lucide-react";

import { useDashboard } from "@/lib/dashboard-context";
import { useFilteredAnalytics } from "@/lib/use-filtered-analytics";
import { PageHeader, KpiCard, LoadingState, SectionCard, EmptyState } from "@/components/dashboard/common";
import { SimpleLineChart } from "@/components/dashboard/charts";
import { RadialProgress, HatchedDonut, HatchedBarChart } from "@/components/dashboard/bklit-charts";
import { WorldMap } from "@/components/dashboard/world-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUSD, formatUSDExact, formatPercent } from "@/lib/format";
import type { CountryStat } from "@/lib/types";

const MAP_METRICS: { key: keyof CountryStat; label: string; unit: "count" | "usd" | "score" }[] = [
  { key: "n_minerals", label: "Minerals produced", unit: "count" },
  { key: "total_production_latest_year", label: "Latest-year production (t)", unit: "usd" },
  { key: "avg_supply_risk_score", label: "Avg. supply-risk score", unit: "score" },
  { key: "disruption_events", label: "Disruption events", unit: "count" },
];

export default function OverviewPage() {
  const { data, loading, error, filtersActive } = useDashboard();
  const filtered = useFilteredAnalytics();
  const [mapMetric, setMapMetric] = React.useState<keyof CountryStat>("n_minerals");

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load dashboard data: {error}
      </div>
    );
  }
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Overview" description="Executive market snapshot" />
        <LoadingState />
      </div>
    );
  }

  const { kpis, marketTrend, rankings, insights, meta, countryStats, mineralSummaries, records } = data;
  const showFiltered = filtersActive && filtered;

  const trendData = (showFiltered ? filtered.trend : marketTrend.overall).map((d) => ({
    year: d.year,
    "Avg. price (all minerals)": d.avg_price,
    "3-yr moving avg": d.ma_3yr,
  }));

  const topGainersData = (
    showFiltered ? filtered.rankings.by_pct_change.slice(0, 6) : rankings.top_gainers.slice(0, 6)
  ).map((g) => ({ label: g.mineral, value: g.value }));

  const mapMetricDef = MAP_METRICS.find((m) => m.key === mapMetric)!;
  const formatMapValue = (v: number) =>
    mapMetricDef.unit === "count" ? v.toFixed(0) : mapMetricDef.unit === "score" ? v.toFixed(2) : formatUSD(v);

  const rareEarthCount = mineralSummaries.filter((m) => m.is_rare_earth).length;
  const nonRareEarthCount = mineralSummaries.length - rareEarthCount;

  const rareEarthRowShare = records.length ? records.filter((r) => r.is_rare_earth === 1).length / records.length : 0;
  const disruptionRowShare = records.length ? records.filter((r) => r.disruption === 1).length / records.length : 0;
  const highRiskShare = kpis.high_supply_risk_pct / 100;

  const view = showFiltered
    ? {
        nMinerals: filtered.minerals.length,
        nObservations: filtered.nObservations,
        nCountries: filtered.nCountries,
        avgPrice: filtered.avgPriceLatestYear,
        highest: filtered.highestPriceMineral,
        mostVolatile: filtered.mostVolatile
          ? { mineral: filtered.mostVolatile.mineral, cv_pct: Math.round(filtered.mostVolatile.cv * 100) / 100 }
          : null,
        largestIncrease: filtered.largestIncrease,
        highRiskPct: filtered.highRiskPct,
        highRiskRows: filtered.highRiskRows,
        disruptionEvents: filtered.disruptionEvents,
        exportControlEvents: filtered.exportControlEvents,
        yearLabel:
          filtered.yearsPresent.length > 0
            ? `${filtered.yearsPresent[0]}-${filtered.yearsPresent[filtered.yearsPresent.length - 1]}`
            : `${meta.year_min}-${meta.year_max}`,
        noDecliners: !filtered.hasTrueDecliners,
        smallestIncrease: filtered.smallestIncrease,
      }
    : {
        nMinerals: kpis.n_minerals,
        nObservations: kpis.n_observations,
        nCountries: kpis.n_countries,
        avgPrice: kpis.avg_price_latest_year,
        highest: kpis.highest_price_mineral,
        mostVolatile: kpis.most_volatile_mineral,
        largestIncrease: kpis.largest_increase,
        highRiskPct: kpis.high_supply_risk_pct,
        highRiskRows: kpis.high_supply_risk_rows,
        disruptionEvents: kpis.total_disruption_events,
        exportControlEvents: kpis.total_export_control_events,
        yearLabel: `${meta.year_min}-${meta.year_max}`,
        noDecliners: kpis.no_full_period_decliners,
        smallestIncrease: kpis.smallest_increase,
      };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageHeader
          title="Market Overview"
          description={`Executive snapshot across ${view.nMinerals} minerals, ${view.nCountries} countries, ${view.yearLabel}.`}
        />
        {showFiltered && <Badge variant="secondary">Filtered view</Badge>}
      </div>

      {showFiltered && !filtered ? (
        <EmptyState message="No rows match the current filters. Try widening the year range or clearing a filter." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Minerals in view"
              value={String(view.nMinerals)}
              icon={GemIcon}
              tooltip="Distinct minerals in the current selection."
            />
            <KpiCard
              title="Observations"
              value={view.nObservations.toLocaleString()}
              icon={DatabaseIcon}
              tooltip="Mineral x country x year rows in the current selection."
            />
            <KpiCard
              title="Producing countries"
              value={String(view.nCountries)}
              icon={GlobeIcon}
              tooltip="Distinct countries in the current selection."
            />
            <KpiCard
              title={`Avg. price, ${view.yearLabel.split("-").pop()}`}
              value={formatUSD(view.avgPrice)}
              unit="/tonne"
              icon={TrendingUpIcon}
              tooltip="Average price across the minerals currently in view, for the latest year in range. Figures are simulated, not live market data — see Data Quality & Methodology."
            />
            <KpiCard
              title="Highest-priced mineral"
              value={view.highest?.mineral ?? "—"}
              unit={view.highest ? formatUSD(view.highest.value) + "/t" : undefined}
              icon={GemIcon}
              tooltip={
                view.highest
                  ? `${view.highest.mineral} has the highest price in the latest year of the current selection (${formatUSDExact(view.highest.value)}/t).`
                  : "No data in the current selection."
              }
            />
            <KpiCard
              title="Most volatile"
              value={view.mostVolatile?.mineral ?? "—"}
              unit={view.mostVolatile ? `CV ${view.mostVolatile.cv_pct}%` : undefined}
              icon={ActivityIcon}
              tooltip="Highest coefficient of variation (std/mean of annual price) within the current selection."
            />
            <KpiCard
              title="Largest price gain"
              value={view.largestIncrease?.mineral ?? "—"}
              unit={view.largestIncrease ? formatPercent(view.largestIncrease.pct) : undefined}
              icon={TrendingUpIcon}
              trend={view.largestIncrease ? { value: formatPercent(view.largestIncrease.pct), positive: true } : undefined}
              tooltip={`Price change across ${view.yearLabel} for the current selection.`}
            />
            <KpiCard
              title="High supply-risk rows"
              value={formatPercent(view.highRiskPct, 1).replace("+", "")}
              unit={`${view.highRiskRows.toLocaleString()} rows`}
              icon={ShieldAlertIcon}
              tooltip="Share of rows flagged high_supply_risk=1 in the current selection."
            />
          </div>

          {view.noDecliners && view.smallestIncrease && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
              <strong>Note:</strong> No mineral in {showFiltered ? "this selection" : "this dataset"} actually
              declined in price across {view.yearLabel} — the smallest gain was {view.smallestIncrease.mineral} at{" "}
              {formatPercent(view.smallestIncrease.pct)}.{" "}
              {!showFiltered && (
                <>
                  See{" "}
                  <Link href="/methodology" className="underline underline-offset-2">
                    Data Quality & Methodology
                  </Link>{" "}
                  for more on data characteristics worth knowing before drawing conclusions.
                </>
              )}
            </div>
          )}

          <SectionCard
            title="Producing countries"
            description="Shading intensity reflects the selected metric. Hover a country for its data points."
            action={
              <Select value={mapMetric} onValueChange={(v) => setMapMetric(v as keyof CountryStat)}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAP_METRICS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            <WorldMap data={countryStats} metricKey={mapMetric} metricLabel={mapMetricDef.label} formatValue={formatMapValue} />
            <p className="mt-2 text-xs text-muted-foreground">
              {countryStats.length} producing countries in the dataset. Countries with no shading aren&apos;t
              recorded as producers for any tracked mineral.
            </p>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Overall market trend"
              description="Average price across the minerals in view, per year, with 3-year moving average."
              className="lg:col-span-2"
            >
              <SimpleLineChart
                data={trendData}
                xKey="year"
                lines={[
                  { key: "Avg. price (all minerals)", name: "Avg. price (all minerals)", color: "var(--color-chart-2)" },
                  { key: "3-yr moving avg", name: "3-yr moving avg", color: "var(--color-chart-1)" },
                ]}
                formatter={(v) => formatUSD(Number(v)) + "/t"}
                height={220}
              />
            </SectionCard>

            <SectionCard title="Dataset composition" description="Share of rows by category, full dataset.">
              <div className="flex items-center justify-center py-2">
                <RadialProgress
                  value={kpis.n_observations.toLocaleString()}
                  label="Observations"
                  rings={[{ pct: rareEarthRowShare }, { pct: highRiskShare }, { pct: disruptionRowShare }]}
                />
              </div>
              <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Outer ring — rare-earth rows ({formatPercent(rareEarthRowShare * 100, 1).replace("+", "")})</span>
                <span>Middle ring — high supply-risk rows ({formatPercent(highRiskShare * 100, 1).replace("+", "")})</span>
                <span>Inner ring — disruption rows ({formatPercent(disruptionRowShare * 100, 2).replace("+", "")})</span>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard title="Mineral mix" description="Rare-earth vs. other tracked minerals.">
              <div className="flex items-center justify-center py-2">
                <HatchedDonut
                  total={String(mineralSummaries.length)}
                  totalLabel="Minerals"
                  segments={[
                    { label: "Rare earth", value: rareEarthCount, hatched: true },
                    { label: "Other", value: nonRareEarthCount },
                  ]}
                />
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-foreground/70" /> Other ({nonRareEarthCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-full border border-foreground/70"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, var(--color-foreground) 0, var(--color-foreground) 1px, transparent 1px, transparent 3px)",
                    }}
                  />
                  Rare earth ({rareEarthCount})
                </span>
              </div>
            </SectionCard>

            <SectionCard
              title="Top gainers"
              description={`Largest price increase within the current selection.`}
              className="lg:col-span-2"
              action={
                <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                  <Link href="/rankings">
                    All rankings <ArrowRightIcon className="size-3.5" />
                  </Link>
                </Button>
              }
            >
              {topGainersData.length === 0 ? (
                <EmptyState message="No data available for the selected filters." />
              ) : (
                <HatchedBarChart
                  data={topGainersData.map((d, i) => ({
                    label: d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label,
                    value: d.value,
                    hatchedValue: i % 2 === 1 ? d.value * 0.001 : undefined,
                  }))}
                  height={240}
                />
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Key insights"
            description="Pulled straight from the numbers — finding, then the evidence behind it."
            action={
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link href="/methodology">
                  Methodology <ArrowRightIcon className="size-3.5" />
                </Link>
              </Button>
            }
          >
            {showFiltered && (
              <p className="mb-3 text-xs text-muted-foreground">
                Insights below are computed on the full dataset. Clear filters to see insights specific to your
                selection reflected elsewhere on this page.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {insights.key_insights.map((ins, i) => (
                <div key={i} className="rounded-md border px-3 py-2.5">
                  <p className="text-sm font-medium">{ins.finding}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ins.evidence}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Market signals"
            description="Disruptions & export controls recorded in the current selection."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <ZapOffIcon className="size-4 text-warning" />
                  Disruption events
                </div>
                <span className="text-sm font-semibold tabular-nums">{view.disruptionEvents}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <LockIcon className="size-4 text-destructive" />
                  Export control events
                </div>
                <span className="text-sm font-semibold tabular-nums">{view.exportControlEvents}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldAlertIcon className="size-4 text-destructive" />
                  High supply-risk rows
                </div>
                <Badge variant="destructive">{formatPercent(view.highRiskPct, 1).replace("+", "")}</Badge>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5">
              <Link href="/anomalies">
                View anomaly monitor <ArrowRightIcon className="size-3.5" />
              </Link>
            </Button>
          </SectionCard>
        </>
      )}
    </div>
  );
}

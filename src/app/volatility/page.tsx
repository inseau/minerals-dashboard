"use client";

import { InfoIcon } from "lucide-react";

import { useDashboard } from "@/lib/dashboard-context";
import { useFilteredAnalytics } from "@/lib/use-filtered-analytics";
import { PageHeader, LoadingState, SectionCard, EmptyState } from "@/components/dashboard/common";
import { RankBarChart, SimpleLineChart } from "@/components/dashboard/charts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function VolatilityPage() {
  const { data, loading, error, filtersActive } = useDashboard();
  const filtered = useFilteredAnalytics();

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Volatility" description="Price dispersion analysis" />
        <LoadingState />
      </div>
    );
  }

  const { volatility } = data;
  const useFiltered = filtersActive && filtered;

  const rankingRows = useFiltered
    ? filtered.volatility.map((v) => ({ mineral: v.mineral, coefficient_of_variation_pct: v.cv }))
    : volatility.rankings.map((v) => ({ mineral: v.mineral, coefficient_of_variation_pct: v.coefficient_of_variation_pct }));

  const chartData = rankingRows.map((r) => ({
    label: r.mineral,
    value: r.coefficient_of_variation_pct ?? 0,
  }));

  const mostVolatileRows = useFiltered
    ? filtered.volatility.slice(0, 5)
    : volatility.most_volatile.map((v) => ({
        mineral: v.mineral,
        cv: v.coefficient_of_variation_pct,
        yoyStd: v.yoy_std_pct,
        maxMove: v.max_single_year_move_pct,
      }));
  const leastVolatileRows = useFiltered
    ? [...filtered.volatility].reverse().slice(0, 5)
    : volatility.least_volatile.map((v) => ({
        mineral: v.mineral,
        cv: v.coefficient_of_variation_pct,
        yoyStd: v.yoy_std_pct,
        maxMove: v.max_single_year_move_pct,
      }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <PageHeader title="Volatility" description="Statistical price dispersion across the tracked minerals." />
        {useFiltered && <Badge variant="secondary">Filtered</Badge>}
      </div>

      <Alert>
        <InfoIcon />
        <AlertTitle>Methodology</AlertTitle>
        <AlertDescription>{volatility.methodology}</AlertDescription>
      </Alert>

      <SectionCard
        title="Volatility ranking"
        description="Coefficient of variation (std / mean of annual price, %) — higher means more dispersed pricing."
      >
        {chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <RankBarChart
            data={chartData}
            height={Math.max(320, chartData.length * 22)}
            formatter={(v) => `${v.toFixed(1)}%`}
          />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Most volatile" description="Highest coefficient of variation.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mineral</TableHead>
                <TableHead className="text-right">CV %</TableHead>
                <TableHead className="text-right">Max 1-yr move</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostVolatileRows.map((r) => (
                <TableRow key={r.mineral}>
                  <TableCell className="font-medium">{r.mineral}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant="destructive">{r.cv?.toFixed(2) ?? "—"}%</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.maxMove?.toFixed(1) ?? "—"}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Least volatile" description="Lowest coefficient of variation.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mineral</TableHead>
                <TableHead className="text-right">CV %</TableHead>
                <TableHead className="text-right">Max 1-yr move</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leastVolatileRows.map((r) => (
                <TableRow key={r.mineral}>
                  <TableCell className="font-medium">{r.mineral}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant="success">{r.cv?.toFixed(2) ?? "—"}%</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.maxMove?.toFixed(1) ?? "—"}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </div>

      {!useFiltered && (
        <SectionCard
          title="Volatility over time"
          description="3-year rolling standard deviation of price for the 3 most- and 2 least-volatile minerals (full dataset)."
        >
          <SimpleLineChart
            data={(() => {
              const compareData = [...volatility.most_volatile.slice(0, 3), ...volatility.least_volatile.slice(0, 2)];
              const years = compareData[0]?.years ?? [];
              return years.map((y, i) => {
                const row: Record<string, unknown> = { year: y };
                compareData.forEach((c) => {
                  row[c.mineral] = c.rolling_std_3yr[i];
                });
                return row;
              });
            })()}
            xKey="year"
            lines={[...volatility.most_volatile.slice(0, 3), ...volatility.least_volatile.slice(0, 2)].map((c) => ({
              key: c.mineral,
              name: c.mineral,
            }))}
            height={300}
          />
        </SectionCard>
      )}
    </div>
  );
}


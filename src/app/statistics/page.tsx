"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { useDashboard } from "@/lib/dashboard-context";
import { PageHeader, LoadingState, SectionCard } from "@/components/dashboard/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/format";

export default function StatisticsPage() {
  const { data, loading, error } = useDashboard();

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Statistics" description="Descriptive & inferential analysis" />
        <LoadingState />
      </div>
    );
  }

  const { mineralSummaries, statisticalTests } = data;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Statistics"
        description="Descriptive statistics per mineral and formal hypothesis tests on the full dataset."
      />

      <SectionCard
        title="Descriptive statistics — price per mineral"
        description="Computed from the annual global price series (2015-2026) for each mineral."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mineral</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Mean</TableHead>
              <TableHead className="text-right">Median</TableHead>
              <TableHead className="text-right">Min</TableHead>
              <TableHead className="text-right">Max</TableHead>
              <TableHead className="text-right">Std dev</TableHead>
              <TableHead className="text-right">Q1</TableHead>
              <TableHead className="text-right">Q3</TableHead>
              <TableHead className="text-right">IQR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mineralSummaries.map((m) => (
              <TableRow key={m.mineral}>
                <TableCell className="font-medium">{m.mineral}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">12</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.mean_price)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.median_price)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.min_price)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.max_price)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.std_price)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.q1)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.q3)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSD(m.iqr)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title="Statistical tests"
        description="Tests were selected because they are directly justified by the data structure — not run merely for show. All computed on the full, unfiltered dataset."
      >
        <div className="flex flex-col gap-3">
          {statisticalTests.map((t) => (
            <div key={t.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t.name}</h3>
                <Badge
                  variant={t.significant ? "success" : "secondary"}
                  className="gap-1"
                >
                  {t.significant ? <CheckCircle2Icon className="size-3" /> : <XCircleIcon className="size-3" />}
                  {t.significant ? "Significant" : "Not significant"} (α={t.alpha})
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong className="text-foreground">Hypothesis:</strong> {t.hypothesis}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <span>
                  Statistic: <span className="font-medium tabular-nums">{t.statistic}</span>
                </span>
                <span>
                  p-value: <span className="font-medium tabular-nums">{t.p_value}</span>
                </span>
                {t.effect_size_rank_biserial !== undefined && (
                  <span>
                    Effect size (rank-biserial):{" "}
                    <span className="font-medium tabular-nums">{t.effect_size_rank_biserial}</span>
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm">{t.interpretation}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

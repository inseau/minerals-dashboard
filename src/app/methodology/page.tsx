"use client";

import { CheckCircle2Icon, AlertTriangleIcon } from "lucide-react";

import { useDashboard } from "@/lib/dashboard-context";
import { PageHeader, LoadingState, SectionCard } from "@/components/dashboard/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MethodologyPage() {
  const { data, loading, error } = useDashboard();

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Data Quality & Methodology" description="Source, cleaning, and limitations" />
        <LoadingState />
      </div>
    );
  }

  const { quality, dictionary, meta } = data;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Data Quality & Methodology"
        description="Everything below is derived directly from the source files — nothing is fabricated."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Data source" className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            <Row label="Source" value="Kaggle" />
            <Row label="Dataset" value="sergionefedov/critical-minerals-and-rare-earths-20152026" />
            <Row label="Period" value={`${meta.year_min}-${meta.year_max}`} />
            <Row label="Observations" value={meta.n_rows.toLocaleString()} />
            <Row label="Minerals" value={String(meta.n_minerals)} />
            <Row label="Countries" value={String(meta.n_countries)} />
          </dl>
          <Alert variant="warning" className="mt-4">
            <AlertTriangleIcon />
            <AlertTitle>Simulated data</AlertTitle>
            <AlertDescription>
              The source dictionary labels price, production, and reserves figures as &quot;Simulated&quot;.
              This dashboard treats them as realistic-but-synthetic data, not live market prices.
            </AlertDescription>
          </Alert>
        </SectionCard>

        <SectionCard title="Data quality score" className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-4">
            <span className="text-4xl font-semibold tabular-nums">{quality.data_quality_score}</span>
            <div className="flex-1">
              <Progress value={quality.data_quality_score} className="h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                out of 100 — penalized for duplicate rows and unexpected missing values only.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QualityStat label="Duplicate rows" value={quality.duplicate_rows} good={quality.duplicate_rows === 0} />
            <QualityStat label="Duplicate keys" value={quality.duplicate_keys} good={quality.duplicate_keys === 0} />
            <QualityStat
              label="Negative prices"
              value={quality.negative_or_zero_price_rows}
              good={quality.negative_or_zero_price_rows === 0}
            />
            <QualityStat
              label="Negative production"
              value={quality.negative_production_rows}
              good={quality.negative_production_rows === 0}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Missing values"
        description="By column. Only disruption_next_year has missing values, and it is expected (see below)."
      >
        {Object.keys(quality.missing_by_column).length === 0 ? (
          <p className="text-sm text-muted-foreground">No missing values found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead className="text-right">Missing count</TableHead>
                <TableHead className="text-right">Missing %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(quality.missing_by_column).map(([col, v]) => (
                <TableRow key={col}>
                  <TableCell className="font-medium">{col}</TableCell>
                  <TableCell className="text-right tabular-nums">{v.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{v.pct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{quality.disruption_next_year_missing_reason}</p>
      </SectionCard>

      <SectionCard title="Flagged patterns worth knowing" description="Detected, explained, and left un-deleted — not automatically dropped.">
        <div className="flex flex-col gap-3">
          <div className="rounded-md border px-3 py-2.5 text-sm">
            <strong>Production share consistency:</strong> {quality.production_share_deviation_note} (
            {quality.production_share_groups_off_5pct} of {quality.production_share_groups_checked} mineral-year
            groups deviate by more than 5 percentage points from 100%.)
          </div>
          <div className="rounded-md border px-3 py-2.5 text-sm">
            <strong>Rare-earth price uniformity:</strong> {quality.rare_earth_uniform_growth_note}
          </div>
          <div className="rounded-md border px-3 py-2.5 text-sm">
            <strong>Global pricing:</strong> price_usd_per_tonne is confirmed identical across all
            countries within a given mineral-year ({quality.price_is_global_per_mineral_year ? "verified" : "not verified"}
            ) — it&apos;s one global price per mineral per year, not a country-specific one.
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Transformations applied">
        <ul className="space-y-1.5 text-sm">
          {quality.transformations_applied.map((t, i) => (
            <li key={i} className="flex gap-2">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Data dictionary" description="Column-by-column profile computed from the actual data.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Missing %</TableHead>
              <TableHead className="text-right">Unique values</TableHead>
              {dictionary[0] &&
                Object.keys(dictionary[0])
                  .filter((k) => !["column", "dtype", "missing_pct", "unique_values"].includes(k))
                  .map((k) => <TableHead key={k}>{k}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dictionary.map((d) => (
              <TableRow key={d.column}>
                <TableCell className="font-medium">{d.column}</TableCell>
                <TableCell>
                  <Badge variant="outline">{d.dtype}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{d.missing_pct}%</TableCell>
                <TableCell className="text-right tabular-nums">{d.unique_values}</TableCell>
                {Object.keys(d)
                  .filter((k) => !["column", "dtype", "missing_pct", "unique_values"].includes(k))
                  .map((k) => (
                    <TableCell key={k} className="max-w-64 whitespace-normal text-xs text-muted-foreground">
                      {String(d[k] ?? "—")}
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Limitations">
        <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
          <li>Data is annual only, with no monthly or weekly breakdown — that caps how far moving averages and volatility windows can meaningfully go.</li>
          <li>No external event data (news, policy documents) is included, so anomalies and disruption flags cannot be attributed to specific real-world causes from this dataset alone.</li>
          <li>disruption_next_year is null for 2026 by construction, since no 2027 data exists yet to derive it from.</li>
          <li>Correlation and hypothesis-test results describe statistical association only, not causation.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-xs font-medium">{value}</dd>
    </div>
  );
}

function QualityStat({ label, value, good }: { label: string; value: number; good: boolean }) {
  return (
    <div className="rounded-md border px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={"mt-0.5 text-lg font-semibold tabular-nums " + (good ? "text-success" : "text-destructive")}>
        {value}
      </p>
    </div>
  );
}

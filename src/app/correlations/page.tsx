"use client";

import * as React from "react";

import { useDashboard } from "@/lib/dashboard-context";
import { PageHeader, LoadingState, SectionCard } from "@/components/dashboard/common";
import { SimpleScatterChart } from "@/components/dashboard/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CorrMatrix } from "@/lib/types";

const LABELS: Record<string, string> = {
  mine_production_tonnes: "Mine production",
  production_share_pct: "Production share %",
  reserves_tonnes: "Reserves",
  years_of_reserves: "Years of reserves",
  refined_share_pct: "Refined share %",
  price_usd_per_tonne: "Price / tonne",
  demand_growth_pct: "Demand growth %",
  hhi: "HHI (concentration)",
  top_country_share_pct: "Top country share %",
  supply_risk_score: "Supply risk score",
};

const GLOSSARY: { key: string; plain: string }[] = [
  { key: "hhi", plain: "Herfindahl-Hirschman Index — how concentrated production is among a few countries. Higher means fewer countries control most of the supply." },
  { key: "top_country_share_pct", plain: "The share of a mineral's total production held by its single biggest producing country." },
  { key: "supply_risk_score", plain: "A composite score built mostly from concentration measures (HHI, top-country share) — higher means supply sits with fewer producers." },
  { key: "years_of_reserves", plain: "Known reserves divided by current mine production — roughly how many years of supply remain at today's extraction rate." },
  { key: "refined_share_pct", plain: "The share of a mineral's supply that gets refined domestically rather than exported raw." },
  { key: "demand_growth_pct", plain: "Year-over-year change in demand for that mineral." },
];

function describePair(r: number, a: string, b: string): string {
  const strength = Math.abs(r) >= 0.8 ? "very strong" : Math.abs(r) >= 0.65 ? "strong" : "moderate";
  const direction = r >= 0 ? "rise together" : "move in opposite directions";
  return `${LABELS[a] ?? a} and ${LABELS[b] ?? b} ${direction} — a ${strength} relationship (r = ${r.toFixed(2)}).`;
}

function colorForR(r: number | null): string {
  if (r === null) return "var(--color-muted)";
  const abs = Math.min(1, Math.abs(r));
  const alpha = 0.12 + abs * 0.75;
  return r >= 0
    ? `color-mix(in oklch, var(--color-chart-1) ${alpha * 100}%, var(--color-card))`
    : `color-mix(in oklch, var(--color-destructive) ${alpha * 100}%, var(--color-card))`;
}

function Heatmap({ corr }: { corr: CorrMatrix }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="border-separate border-spacing-[3px] text-[11px]">
        <thead>
          <tr>
            <th className="w-32" />
            {corr.columns.map((c) => (
              <th key={c} className="max-w-16 rotate-0 px-1 pb-1 text-center align-bottom font-medium text-muted-foreground">
                <span className="block w-16 truncate" title={LABELS[c] ?? c}>
                  {LABELS[c] ?? c}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {corr.columns.map((rowVar, i) => (
            <tr key={rowVar}>
              <td className="w-32 truncate pr-2 text-right font-medium text-muted-foreground" title={LABELS[rowVar] ?? rowVar}>
                {LABELS[rowVar] ?? rowVar}
              </td>
              {corr.columns.map((colVar, j) => {
                const r = corr.matrix[i][j];
                return (
                  <Tooltip key={colVar}>
                    <TooltipTrigger asChild>
                      <td
                        className="size-10 cursor-default rounded-sm text-center align-middle tabular-nums"
                        style={{ background: colorForR(r) }}
                      >
                        {r !== null ? r.toFixed(2) : "—"}
                      </td>
                    </TooltipTrigger>
                    <TooltipContent>
                      {LABELS[rowVar] ?? rowVar} vs {LABELS[colVar] ?? colVar}: r = {r ?? "n/a"}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CorrelationsPage() {
  const { data, loading, error } = useDashboard();
  const [method, setMethod] = React.useState<"pearson" | "spearman">("pearson");
  const [varA, setVarA] = React.useState("hhi");
  const [varB, setVarB] = React.useState("supply_risk_score");

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Correlations" description="Relationships between numeric variables" />
        <LoadingState />
      </div>
    );
  }

  const { correlation, records } = data;
  const corr = correlation[method];

  const scatterData = records
    .filter((r) => r[varA as keyof typeof r] != null && r[varB as keyof typeof r] != null)
    .map((r) => ({
      x: Number(r[varA as keyof typeof r]),
      y: Number(r[varB as keyof typeof r]),
      label: `${r.mineral} (${r.country}, ${r.year})`,
    }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Correlations" description="How the numeric supply, price, and risk variables relate to each other." />

      <Alert>
        <InfoIcon />
        <AlertTitle>How to read this page</AlertTitle>
        <AlertDescription>
          Every number here is a correlation coefficient (r), running from -1 to +1. Close to +1 means two
          variables rise and fall together; close to -1 means one goes up as the other goes down; near 0
          means no real linear relationship. None of this means one variable *causes* the other — it just
          means they move together in this data.
        </AlertDescription>
      </Alert>

      <SectionCard title="Variable glossary" description="A few of these column names aren't self-explanatory — here's what they mean.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.key} className="rounded-md border px-3 py-2 text-xs">
              <span className="font-medium text-foreground">{LABELS[g.key] ?? g.key}: </span>
              <span className="text-muted-foreground">{g.plain}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Correlation matrix"
        description="Every variable against every other. Darker blue = stronger positive relationship, darker red = stronger negative. Hover a cell for the exact number."
        action={
          <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pearson">Pearson</SelectItem>
              <SelectItem value="spearman">Spearman</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <p className="mb-3 text-xs text-muted-foreground">
          {method === "pearson"
            ? "Pearson measures straight-line relationships — best when both variables scale linearly with each other."
            : "Spearman measures whether two variables move in the same rank order, even if the relationship isn't a straight line. Better when a variable is skewed, like price is here."}
        </p>
        <Heatmap corr={corr} />
      </SectionCard>

      <SectionCard
        title="Strongest associations (|r| ≥ 0.5, Pearson)"
        description="The variable pairs that move together most closely, across every mineral-country-year row."
      >
        <div className="flex flex-col gap-1.5">
          {correlation.strong_associations.map((p, i) => (
            <div key={i} className="rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  {LABELS[p.var_a] ?? p.var_a} <span className="text-muted-foreground">×</span> {LABELS[p.var_b] ?? p.var_b}
                </span>
                <Badge variant={p.pearson_r >= 0 ? "success" : "destructive"}>r = {p.pearson_r}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{describePair(p.pearson_r, p.var_a, p.var_b)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          HHI, top-country share, and the supply-risk score are the strongest trio here — that&apos;s
          expected, since the risk score is built largely from those two concentration measures. It&apos;s
          not an independent finding so much as the math working as designed.
        </p>
      </SectionCard>

      <SectionCard
        title="Scatter explorer"
        description="Pick any two variables to see the actual points behind a correlation number, at the mineral-country-year level."
        action={
          <div className="flex items-center gap-2">
            <Select value={varA} onValueChange={setVarA}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(LABELS).map((k) => (
                  <SelectItem key={k} value={k}>
                    {LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">vs</span>
            <Select value={varB} onValueChange={setVarB}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(LABELS).map((k) => (
                  <SelectItem key={k} value={k}>
                    {LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <SimpleScatterChart data={scatterData} xLabel={LABELS[varA] ?? varA} yLabel={LABELS[varB] ?? varB} height={360} />
        <p className="mt-2 text-xs text-muted-foreground">
          Each dot is one mineral, in one country, in one year. A tight diagonal line means a strong
          relationship; a scattered cloud means the two variables barely track each other.
        </p>
      </SectionCard>

      <SectionCard
        title="Strongest mineral-to-mineral price correlations"
        description="Which minerals' annual global prices rise and fall together, 2015-2026 — separate from the variable-level matrix above."
      >
        <div className="flex flex-col gap-1.5">
          {correlation.strongest_mineral_price_pairs.slice(0, 10).map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>
                {p.mineral_a} <span className="text-muted-foreground">×</span> {p.mineral_b}
              </span>
              <Badge variant={p.pearson_r >= 0 ? "success" : "destructive"}>r = {p.pearson_r}</Badge>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          With only 12 years of data per mineral, a handful of these pairs will look strongly correlated by
          chance alone — treat this as a starting point for a closer look, not a settled conclusion.
        </p>
      </SectionCard>
    </div>
  );
}

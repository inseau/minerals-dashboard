"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";

import { useDashboard } from "@/lib/dashboard-context";
import { useFilteredAnalytics } from "@/lib/use-filtered-analytics";
import { PageHeader, LoadingState, SectionCard, EmptyState } from "@/components/dashboard/common";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUSD } from "@/lib/format";

export default function AnomaliesPage() {
  const { data, loading, error, filtersActive } = useDashboard();
  const filtered = useFilteredAnalytics();
  const [severityFilter, setSeverityFilter] = React.useState<"all" | "high" | "moderate">("all");

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Anomaly Monitor" description="Unusual price movements" />
        <LoadingState />
      </div>
    );
  }

  const { meta } = data;
  const useFiltered = filtersActive && filtered;
  const anomalies = useFiltered ? filtered.anomalies : data.anomalies;
  const filteredList = severityFilter === "all" ? anomalies : anomalies.filter((a) => a.severity === severityFilter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <PageHeader
          title="Anomaly Monitor"
          description={`Unusual price observations across ${useFiltered ? filtered!.minerals.length : meta.n_minerals} minerals, ${meta.year_min}-${meta.year_max}.`}
        />
        {useFiltered && <Badge variant="secondary">Filtered</Badge>}
      </div>

      <Alert>
        <InfoIcon />
        <AlertTitle>Detection method</AlertTitle>
        <AlertDescription>
          Each mineral&apos;s own annual price series is checked against its IQR (1.5x rule) and z-score
          (|z| ≥ 2) bounds, computed independently per mineral. An anomaly here is a statistical outlier
          relative to that mineral&apos;s own historical range — it is not a claim that a specific
          real-world event caused the move, since no external event data is present in this dataset.
        </AlertDescription>
      </Alert>

      <SectionCard
        title={`${filteredList.length} anomal${filteredList.length === 1 ? "y" : "ies"} detected`}
        description="Sorted by absolute z-score (most unusual first)."
        action={
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as typeof severityFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="high">High only</SelectItem>
              <SelectItem value="moderate">Moderate only</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        {filteredList.length === 0 ? (
          <EmptyState message="No anomalies match the selected severity." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mineral</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Expected range</TableHead>
                <TableHead className="text-right">Z-score</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{a.mineral}</TableCell>
                  <TableCell>{a.year}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatUSD(a.value)}/t</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatUSD(a.expected_range[0])}–{formatUSD(a.expected_range[1])}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{a.z_score}</TableCell>
                  <TableCell>
                    <Badge variant={a.severity === "high" ? "destructive" : "warning"}>{a.severity}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.detection_method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}

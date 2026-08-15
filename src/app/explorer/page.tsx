"use client";

import * as React from "react";
import { ArrowUpIcon, ArrowDownIcon, DownloadIcon, ColumnsIcon } from "lucide-react";

import { useDashboard } from "@/lib/dashboard-context";
import { PageHeader, LoadingState, EmptyState } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { MasterRecord } from "@/lib/types";

const ALL_COLUMNS: { key: keyof MasterRecord; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "mineral", label: "Mineral" },
  { key: "country", label: "Country" },
  { key: "is_rare_earth", label: "Rare earth" },
  { key: "end_use", label: "End use" },
  { key: "mine_production_tonnes", label: "Production (t)" },
  { key: "production_share_pct", label: "Prod. share %" },
  { key: "reserves_tonnes", label: "Reserves (t)" },
  { key: "years_of_reserves", label: "Yrs of reserves" },
  { key: "refined_share_pct", label: "Refined share %" },
  { key: "top_country_share_pct", label: "Top country share %" },
  { key: "price_usd_per_tonne", label: "Price ($/t)" },
  { key: "demand_growth_pct", label: "Demand growth %" },
  { key: "hhi", label: "HHI" },
  { key: "export_control_active", label: "Export control" },
  { key: "disruption", label: "Disruption" },
  { key: "supply_risk_score", label: "Supply risk score" },
  { key: "high_supply_risk", label: "High risk" },
];

const DEFAULT_VISIBLE: (keyof MasterRecord)[] = [
  "year",
  "mineral",
  "country",
  "end_use",
  "price_usd_per_tonne",
  "mine_production_tonnes",
  "supply_risk_score",
  "high_supply_risk",
];

const PAGE_SIZE = 25;

export default function ExplorerPage() {
  const { data, loading, error, filteredRecords, filters } = useDashboard();
  const [visible, setVisible] = React.useState<(keyof MasterRecord)[]>(DEFAULT_VISIBLE);
  const [sortKey, setSortKey] = React.useState<keyof MasterRecord>("year");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(0);

  React.useEffect(() => setPage(0), [filters]);

  if (error) return <div className="text-sm text-destructive">Failed to load data: {error}</div>;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Data Explorer" description="Browse the underlying dataset" />
        <LoadingState />
      </div>
    );
  }

  const sorted = [...filteredRecords].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === "string" || typeof bv === "string") {
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    }
    return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const cols = ALL_COLUMNS.filter((c) => visible.includes(c.key));

  function toggleSort(key: keyof MasterRecord) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function exportCsv() {
    const header = cols.map((c) => c.label).join(",");
    const rows = sorted.map((r) => cols.map((c) => r[c.key]).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "critical_minerals_filtered.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Data Explorer"
          description={`${sorted.length.toLocaleString()} rows matching current filters (of ${data.meta.n_rows.toLocaleString()} total). Use the global filter bar above to narrow this down.`}
        />
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ColumnsIcon className="size-3.5" /> Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="max-h-72 space-y-0.5 overflow-y-auto scrollbar-thin">
                {ALL_COLUMNS.map((c) => (
                  <label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-xs hover:bg-accent"
                  >
                    <Checkbox
                      checked={visible.includes(c.key)}
                      onCheckedChange={(checked) =>
                        setVisible((v) => (checked ? [...v, c.key] : v.filter((k) => k !== c.key)))
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
            <DownloadIcon className="size-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {pageRows.length === 0 ? (
            <div className="p-6">
              <EmptyState />
            </div>
          ) : (
            <div className="max-h-[560px] overflow-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    {cols.map((c) => (
                      <TableHead
                        key={c.key}
                        className="cursor-pointer select-none"
                        onClick={() => toggleSort(c.key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {c.label}
                          {sortKey === c.key &&
                            (sortDir === "asc" ? (
                              <ArrowUpIcon className="size-3" />
                            ) : (
                              <ArrowDownIcon className="size-3" />
                            ))}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r, i) => (
                    <TableRow key={i}>
                      {cols.map((c) => (
                        <TableCell key={c.key} className="tabular-nums">
                          {renderCell(r, c.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function renderCell(r: MasterRecord, key: keyof MasterRecord) {
  const value = r[key];
  if (key === "is_rare_earth" || key === "export_control_active" || key === "disruption" || key === "high_supply_risk") {
    return value ? <Badge variant={key === "is_rare_earth" ? "secondary" : "warning"}>Yes</Badge> : <span className="text-muted-foreground">No</span>;
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  }
  return value ?? "—";
}

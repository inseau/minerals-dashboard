"use client";

import * as React from "react";
import { XIcon, SearchIcon, InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboard } from "@/lib/dashboard-context";
import { DEFAULT_FILTERS } from "@/lib/analytics";
import { MultiSelectFilter } from "./multi-select-filter";
import { ThemeToggle } from "@/components/theme-toggle";

export function FilterBar() {
  const { data, filters, setFilters, filteredRecords, filtersActive } = useDashboard();

  if (!data) return null;
  const { meta } = data;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-backdrop-blur:bg-background/60 md:px-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground" aria-label="How filters work">
            <InfoIcon className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          Pick a year range and/or mineral, country, or end-use to scope the dashboard. Overview,
          Trends, Rankings, Volatility, and Anomalies recalculate live from your selection; a
          &quot;Filtered&quot; badge shows where that&apos;s happening. Correlations and Statistics
          always run on the full dataset. Data Explorer always reflects your filters.
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-1.5">
        <Select
          value={String(filters.yearRange[0])}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, yearRange: [Number(v), f.yearRange[1]] }))
          }
        >
          <SelectTrigger size="sm" className="h-8 w-[84px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meta.years
              .filter((y) => y <= filters.yearRange[1])
              .map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">–</span>
        <Select
          value={String(filters.yearRange[1])}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, yearRange: [f.yearRange[0], Number(v)] }))
          }
        >
          <SelectTrigger size="sm" className="h-8 w-[84px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meta.years
              .filter((y) => y >= filters.yearRange[0])
              .map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <MultiSelectFilter
        label="Mineral"
        options={meta.minerals}
        selected={filters.minerals}
        onChange={(v) => setFilters((f) => ({ ...f, minerals: v }))}
      />
      <MultiSelectFilter
        label="Country"
        options={meta.countries}
        selected={filters.countries}
        onChange={(v) => setFilters((f) => ({ ...f, countries: v }))}
      />
      <MultiSelectFilter
        label="End use"
        options={meta.end_uses}
        selected={filters.endUses}
        onChange={(v) => setFilters((f) => ({ ...f, endUses: v }))}
      />

      <Select
        value={filters.rareEarthOnly}
        onValueChange={(v) =>
          setFilters((f) => ({ ...f, rareEarthOnly: v as typeof f.rareEarthOnly }))
        }
      >
        <SelectTrigger size="sm" className="h-8 w-[128px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All minerals</SelectItem>
          <SelectItem value="rare_earth">Rare earth only</SelectItem>
          <SelectItem value="non_rare_earth">Non-rare-earth</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search mineral or country..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="h-8 w-52 pl-7 text-xs"
        />
      </div>

      {filtersActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={() =>
            setFilters({ ...DEFAULT_FILTERS, yearRange: [meta.year_min, meta.year_max] })
          }
        >
          <XIcon className="size-3.5" />
          Reset
        </Button>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {filteredRecords.length.toLocaleString()} / {data.meta.n_rows.toLocaleString()} rows
        </span>
        <ThemeToggle />
      </div>
    </div>
  );
}

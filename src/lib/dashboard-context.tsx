"use client";

import * as React from "react";
import type {
  MasterRecord,
  Meta,
  QualityReport,
  DictionaryEntry,
  Kpis,
  MineralSummary,
  MarketTrend,
  Rankings,
  Correlation,
  Volatility,
  Anomaly,
  Distribution,
  StatTest,
  Insights,
  CountryStat,
} from "./types";
import { applyFilters, DEFAULT_FILTERS, type Filters } from "./analytics";

interface DashboardData {
  records: MasterRecord[];
  meta: Meta;
  quality: QualityReport;
  dictionary: DictionaryEntry[];
  kpis: Kpis;
  mineralSummaries: MineralSummary[];
  marketTrend: MarketTrend;
  rankings: Rankings;
  correlation: Correlation;
  volatility: Volatility;
  anomalies: Anomaly[];
  distributions: Record<string, Distribution>;
  statisticalTests: StatTest[];
  insights: Insights;
  countryStats: CountryStat[];
}

interface DashboardContextValue {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  filteredRecords: MasterRecord[];
  filtersActive: boolean;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

const FILES: Record<keyof DashboardData, string> = {
  records: "records.json",
  meta: "meta.json",
  quality: "quality.json",
  dictionary: "dictionary.json",
  kpis: "kpis.json",
  mineralSummaries: "mineral_summaries.json",
  marketTrend: "market_trend.json",
  rankings: "rankings.json",
  correlation: "correlation.json",
  volatility: "volatility.json",
  anomalies: "anomalies.json",
  distributions: "distributions.json",
  statisticalTests: "statistical_tests.json",
  insights: "insights.json",
  countryStats: "country_stats.json",
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const entries = Object.entries(FILES) as [keyof DashboardData, string][];
        const results = await Promise.all(
          entries.map(async ([, file]) => {
            const res = await fetch(`/data/${file}`);
            if (!res.ok) throw new Error(`Failed to load ${file}`);
            return res.json();
          })
        );
        if (cancelled) return;
        const obj = {} as DashboardData;
        entries.forEach(([key], i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj as any)[key] = results[i];
        });
        setData(obj);
        setFilters((f) => ({
          ...f,
          yearRange: [obj.meta.year_min, obj.meta.year_max],
        }));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = React.useMemo(() => {
    if (!data) return [];
    return applyFilters(data.records, filters);
  }, [data, filters]);

  const filtersActive = React.useMemo(() => {
    if (!data) return false;
    return (
      filters.minerals.length > 0 ||
      filters.countries.length > 0 ||
      filters.endUses.length > 0 ||
      filters.rareEarthOnly !== "all" ||
      filters.search.length > 0 ||
      filters.yearRange[0] !== data.meta.year_min ||
      filters.yearRange[1] !== data.meta.year_max
    );
  }, [data, filters]);

  const value: DashboardContextValue = {
    data,
    loading,
    error,
    filters,
    setFilters,
    filteredRecords,
    filtersActive,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

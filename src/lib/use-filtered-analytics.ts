"use client";

import * as React from "react";

import { useDashboard } from "@/lib/dashboard-context";
import {
  mean,
  stdDev,
  quantile,
  coefficientOfVariation,
  groupBy,
  priceSeries,
  iqrBounds,
} from "@/lib/analytics";
import type { Anomaly } from "@/lib/types";

export interface FilteredAnalytics {
  minerals: string[];
  yearsPresent: number[];
  nObservations: number;
  nCountries: number;
  avgPriceLatestYear: number | null;
  highestPriceMineral: { mineral: string; value: number } | null;
  lowestPriceMineral: { mineral: string; value: number } | null;
  mostVolatile: { mineral: string; cv: number } | null;
  leastVolatile: { mineral: string; cv: number } | null;
  largestIncrease: { mineral: string; pct: number } | null;
  smallestIncrease: { mineral: string; pct: number } | null;
  hasTrueDecliners: boolean;
  disruptionEvents: number;
  exportControlEvents: number;
  highRiskRows: number;
  highRiskPct: number;
  trend: { year: number; avg_price: number; ma_3yr: number }[];
  rankings: {
    by_latest_price: { mineral: string; value: number }[];
    by_mean_price: { mineral: string; value: number }[];
    by_pct_change: { mineral: string; value: number }[];
    by_volatility_cv: { mineral: string; value: number }[];
    by_range: { mineral: string; value: number }[];
  };
  volatility: {
    mineral: string;
    cv: number | null;
    yoyStd: number | null;
    iqr: number;
    maxMove: number | null;
  }[];
  anomalies: Anomaly[];
}

/** Recomputes the same statistics the Python pipeline produces, but scoped to
 * whatever the person currently has selected in the global filter bar. Used
 * only when filters are active; the unfiltered default view uses the
 * pre-computed JSON for speed and to match the validated full-dataset numbers
 * exactly. */
export function useFilteredAnalytics(): FilteredAnalytics | null {
  const { filteredRecords, data } = useDashboard();

  return React.useMemo(() => {
    if (!data || filteredRecords.length === 0) return null;

    const series = priceSeries(filteredRecords);
    const byMineral = groupBy(series, (s) => s.mineral);
    const minerals = Array.from(byMineral.keys()).sort();
    const years = Array.from(new Set(series.map((s) => s.year))).sort((a, b) => a - b);
    const firstYear = years[0];
    const lastYear = years[years.length - 1];

    const latestPrices = new Map<string, number>();
    const firstPrices = new Map<string, number>();
    const cvByMineral = new Map<string, number>();
    const pctChangeByMineral = new Map<string, number>();

    for (const [mineral, rows] of byMineral) {
      const sorted = [...rows].sort((a, b) => a.year - b.year);
      const prices = sorted.map((r) => r.price);
      const latest = sorted.find((r) => r.year === lastYear)?.price;
      const first = sorted.find((r) => r.year === firstYear)?.price;
      if (latest !== undefined) latestPrices.set(mineral, latest);
      if (first !== undefined) firstPrices.set(mineral, first);
      if (first !== undefined && latest !== undefined && first !== 0) {
        pctChangeByMineral.set(mineral, ((latest - first) / first) * 100);
      }
      const cv = coefficientOfVariation(prices);
      if (cv !== null) cvByMineral.set(mineral, cv);
    }

    function topEntry(map: Map<string, number>, dir: "max" | "min") {
      let best: [string, number] | null = null;
      for (const entry of map) {
        if (!best) best = entry;
        else if (dir === "max" ? entry[1] > best[1] : entry[1] < best[1]) best = entry;
      }
      return best;
    }

    const highest = topEntry(latestPrices, "max");
    const lowest = topEntry(latestPrices, "min");
    const mostVol = topEntry(cvByMineral, "max");
    const leastVol = topEntry(cvByMineral, "min");
    const largestInc = topEntry(pctChangeByMineral, "max");
    const smallestInc = topEntry(pctChangeByMineral, "min");

    // trend
    const byYear = groupBy(series, (s) => s.year);
    const trendRaw = years.map((y) => ({
      year: y,
      avg_price: mean((byYear.get(y) ?? []).map((s) => s.price)),
    }));
    const trend = trendRaw.map((d, i) => {
      const windowVals = trendRaw.slice(Math.max(0, i - 2), i + 1).map((t) => t.avg_price);
      return { year: d.year, avg_price: d.avg_price, ma_3yr: mean(windowVals) };
    });

    // rankings
    const meanPriceByMineral = new Map<string, number>();
    const rangeByMineral = new Map<string, number>();
    for (const [mineral, rows] of byMineral) {
      const prices = rows.map((r) => r.price);
      meanPriceByMineral.set(mineral, mean(prices));
      rangeByMineral.set(mineral, Math.max(...prices) - Math.min(...prices));
    }
    const toRankArray = (map: Map<string, number>) =>
      Array.from(map, ([mineral, value]) => ({ mineral, value })).sort((a, b) => b.value - a.value);

    const rankings = {
      by_latest_price: toRankArray(latestPrices),
      by_mean_price: toRankArray(meanPriceByMineral),
      by_pct_change: toRankArray(pctChangeByMineral),
      by_volatility_cv: toRankArray(cvByMineral),
      by_range: toRankArray(rangeByMineral),
    };

    // volatility detail
    const volatility = minerals.map((mineral) => {
      const rows = [...(byMineral.get(mineral) ?? [])].sort((a, b) => a.year - b.year);
      const prices = rows.map((r) => r.price);
      const yoy: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1]) yoy.push(((prices[i] - prices[i - 1]) / prices[i - 1]) * 100);
      }
      const q1 = quantile(prices, 0.25);
      const q3 = quantile(prices, 0.75);
      return {
        mineral,
        cv: cvByMineral.get(mineral) ?? null,
        yoyStd: yoy.length > 1 ? stdDev(yoy) : null,
        iqr: q3 - q1,
        maxMove: yoy.length ? Math.max(...yoy.map(Math.abs)) : null,
      };
    });

    // anomalies (per mineral, IQR + z-score on the filtered series)
    const anomalies: Anomaly[] = [];
    for (const [mineral, rows] of byMineral) {
      const sorted = [...rows].sort((a, b) => a.year - b.year);
      const prices = sorted.map((r) => r.price);
      if (prices.length < 3) continue;
      const [lower, upper] = iqrBounds(prices);
      const m = mean(prices);
      const sd = stdDev(prices);
      for (const row of sorted) {
        const z = sd ? (row.price - m) / sd : 0;
        const isIqr = row.price < lower || row.price > upper;
        const isZ = Math.abs(z) >= 2;
        if (isIqr || isZ) {
          anomalies.push({
            mineral,
            year: row.year,
            value: Math.round(row.price * 100) / 100,
            expected_range: [Math.round(lower * 100) / 100, Math.round(upper * 100) / 100],
            z_score: Math.round(z * 100) / 100,
            severity: isIqr && isZ ? "high" : "moderate",
            detection_method:
              isIqr && isZ ? "IQR (1.5x) + Z-score (|z|>=2)" : isIqr ? "IQR (1.5x)" : "Z-score (|z|>=2)",
          });
        }
      }
    }
    anomalies.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));

    const disruptionEvents = filteredRecords.reduce((s, r) => s + r.disruption, 0);
    const exportControlEvents = filteredRecords.reduce((s, r) => s + r.export_control_active, 0);
    const highRiskRows = filteredRecords.reduce((s, r) => s + r.high_supply_risk, 0);

    return {
      minerals,
      yearsPresent: years,
      nObservations: filteredRecords.length,
      nCountries: new Set(filteredRecords.map((r) => r.country)).size,
      avgPriceLatestYear: latestPrices.size ? mean(Array.from(latestPrices.values())) : null,
      highestPriceMineral: highest ? { mineral: highest[0], value: highest[1] } : null,
      lowestPriceMineral: lowest ? { mineral: lowest[0], value: lowest[1] } : null,
      mostVolatile: mostVol ? { mineral: mostVol[0], cv: mostVol[1] } : null,
      leastVolatile: leastVol ? { mineral: leastVol[0], cv: leastVol[1] } : null,
      largestIncrease: largestInc ? { mineral: largestInc[0], pct: largestInc[1] } : null,
      smallestIncrease: smallestInc ? { mineral: smallestInc[0], pct: smallestInc[1] } : null,
      hasTrueDecliners: smallestInc ? smallestInc[1] < 0 : false,
      disruptionEvents,
      exportControlEvents,
      highRiskRows,
      highRiskPct: filteredRecords.length ? (highRiskRows / filteredRecords.length) * 100 : 0,
      trend,
      rankings,
      volatility: volatility.sort((a, b) => (b.cv ?? 0) - (a.cv ?? 0)),
      anomalies,
    };
  }, [data, filteredRecords]);
}

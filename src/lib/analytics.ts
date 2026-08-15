import type { MasterRecord } from "./types";

export function mean(values: number[]): number {
  if (!values.length) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return NaN;
  const m = mean(values);
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function median(values: number[]): number {
  if (!values.length) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function quantile(values: number[], q: number): number {
  if (!values.length) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (s[base + 1] !== undefined) return s[base] + rest * (s[base + 1] - s[base]);
  return s[base];
}

export function coefficientOfVariation(values: number[]): number | null {
  const m = mean(values);
  if (!m) return null;
  return (stdDev(values) / m) * 100;
}

export function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 2) return null;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (!denom) return null;
  return num / denom;
}

export function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of arr) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export interface Filters {
  yearRange: [number, number];
  minerals: string[]; // empty = all
  countries: string[]; // empty = all
  endUses: string[]; // empty = all
  rareEarthOnly: "all" | "rare_earth" | "non_rare_earth";
  search: string;
}

export function applyFilters(records: MasterRecord[], f: Filters): MasterRecord[] {
  return records.filter((r) => {
    if (r.year < f.yearRange[0] || r.year > f.yearRange[1]) return false;
    if (f.minerals.length && !f.minerals.includes(r.mineral)) return false;
    if (f.countries.length && !f.countries.includes(r.country)) return false;
    if (f.endUses.length && !f.endUses.includes(r.end_use)) return false;
    if (f.rareEarthOnly === "rare_earth" && r.is_rare_earth !== 1) return false;
    if (f.rareEarthOnly === "non_rare_earth" && r.is_rare_earth !== 0) return false;
    if (f.search) {
      const s = f.search.toLowerCase();
      if (!r.mineral.toLowerCase().includes(s) && !r.country.toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });
}

export const DEFAULT_FILTERS: Filters = {
  yearRange: [2015, 2026],
  minerals: [],
  countries: [],
  endUses: [],
  rareEarthOnly: "all",
  search: "",
};

/** Global (non-country-duplicated) price series: one row per mineral-year. */
export function priceSeries(records: MasterRecord[]): { mineral: string; year: number; price: number; is_rare_earth: number; end_use: string }[] {
  const seen = new Set<string>();
  const out: { mineral: string; year: number; price: number; is_rare_earth: number; end_use: string }[] = [];
  for (const r of records) {
    const key = `${r.mineral}__${r.year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      mineral: r.mineral,
      year: r.year,
      price: r.price_usd_per_tonne,
      is_rare_earth: r.is_rare_earth,
      end_use: r.end_use,
    });
  }
  return out;
}

export function iqrBounds(values: number[]): [number, number] {
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  return [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
}

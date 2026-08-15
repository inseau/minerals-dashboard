export interface MasterRecord {
  year: number;
  mineral: string;
  country: string;
  is_rare_earth: number;
  end_use: string;
  mine_production_tonnes: number;
  production_share_pct: number;
  reserves_tonnes: number;
  years_of_reserves: number;
  refined_share_pct: number;
  top_country_share_pct: number;
  price_usd_per_tonne: number;
  demand_growth_pct: number;
  hhi: number;
  export_control_active: number;
  disruption: number;
  supply_risk_score: number;
  high_supply_risk: number;
  disruption_next_year: number | null;
}

export interface Meta {
  years: number[];
  minerals: string[];
  countries: string[];
  end_uses: string[];
  n_rows: number;
  n_minerals: number;
  n_countries: number;
  year_min: number;
  year_max: number;
}

export interface QualityReport {
  n_rows: number;
  n_cols: number;
  duplicate_rows: number;
  duplicate_keys: number;
  year_min: number;
  year_max: number;
  missing_by_column: Record<string, { count: number; pct: number }>;
  production_share_groups_checked: number;
  production_share_groups_off_5pct: number;
  production_share_deviation_note: string;
  price_is_global_per_mineral_year: boolean;
  negative_or_zero_price_rows: number;
  negative_production_rows: number;
  rare_earth_uniform_growth_note: string;
  disruption_next_year_missing_reason: string;
  data_quality_score: number;
  transformations_applied: string[];
}

export interface DictionaryEntry {
  column: string;
  dtype: string;
  missing_pct: number;
  unique_values: number;
  [key: string]: string | number | null;
}

export interface Kpis {
  n_minerals: number;
  n_observations: number;
  n_countries: number;
  year_range: [number, number];
  avg_price_latest_year: number;
  highest_price_mineral: { mineral: string; value: number };
  lowest_price_mineral: { mineral: string; value: number };
  most_volatile_mineral: { mineral: string; cv_pct: number };
  least_volatile_mineral: { mineral: string; cv_pct: number };
  largest_increase: { mineral: string; pct: number };
  no_full_period_decliners: boolean;
  smallest_increase: { mineral: string; pct: number };
  total_disruption_events: number;
  total_export_control_events: number;
  high_supply_risk_rows: number;
  high_supply_risk_pct: number;
}

export interface MineralSummary {
  mineral: string;
  is_rare_earth: boolean;
  end_use: string;
  latest_price: number;
  first_price: number;
  pct_change_full_period: number | null;
  mean_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  std_price: number;
  cv_pct: number | null;
  q1: number;
  q3: number;
  iqr: number;
  peak_year: number;
  trough_year: number;
  avg_yoy_change_pct: number | null;
  yoy_volatility_pct: number | null;
  n_producers: number | null;
  avg_top_country_share: number | null;
  disruption_events: number;
  export_control_events: number;
  avg_supply_risk_score: number;
  latest_reserves_tonnes: number;
  latest_years_of_reserves: number;
  price_history: { year: number; price: number }[];
}

export interface MarketTrend {
  granularity_note: string;
  overall: { year: number; avg_price: number; ma_3yr: number }[];
  by_rare_earth_flag: { year: number; is_rare_earth: number; price_usd_per_tonne: number }[];
  by_mineral: Record<string, { year: number; price_usd_per_tonne: number }[]>;
}

export interface RankEntry {
  mineral: string;
  value: number;
}

export interface Rankings {
  by_latest_price: RankEntry[];
  by_mean_price: RankEntry[];
  by_pct_change_full_period: RankEntry[];
  by_volatility_cv: RankEntry[];
  by_supply_risk: RankEntry[];
  by_range: RankEntry[];
  top_gainers: RankEntry[];
  smallest_gainers: RankEntry[];
  has_true_decliners: boolean;
}

export interface CorrMatrix {
  columns: string[];
  matrix: (number | null)[][];
}

export interface StrongPair {
  var_a: string;
  var_b: string;
  pearson_r: number;
}

export interface MineralPricePair {
  mineral_a: string;
  mineral_b: string;
  pearson_r: number;
}

export interface Correlation {
  pearson: CorrMatrix;
  spearman: CorrMatrix;
  strong_associations: StrongPair[];
  mineral_price_correlation: CorrMatrix;
  strongest_mineral_price_pairs: MineralPricePair[];
}

export interface VolatilityRow {
  mineral: string;
  std_dev: number;
  coefficient_of_variation_pct: number | null;
  yoy_std_pct: number | null;
  iqr: number;
  max_single_year_move_pct: number | null;
  rolling_std_3yr: (number | null)[];
  years: number[];
}

export interface Volatility {
  methodology: string;
  rankings: VolatilityRow[];
  most_volatile: VolatilityRow[];
  least_volatile: VolatilityRow[];
}

export interface Anomaly {
  mineral: string;
  year: number;
  value: number;
  expected_range: [number, number];
  z_score: number;
  severity: "high" | "moderate";
  detection_method: string;
}

export interface Distribution {
  counts: number[];
  bin_edges: number[];
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  std: number;
}

export interface StatTest {
  id: string;
  name: string;
  hypothesis: string;
  statistic: number;
  p_value: number;
  alpha: number;
  significant: boolean;
  effect_size_rank_biserial?: number;
  interpretation: string;
}

export interface InsightItem {
  finding: string;
  evidence: string;
  interpretation: string;
}

export interface Insights {
  key_insights: InsightItem[];
  market_signals: InsightItem[];
  risks_to_monitor: InsightItem[];
  opportunities: InsightItem[];
  recommended_investigation: InsightItem[];
}

export interface CountryStat {
  country: string;
  n_minerals: number;
  minerals: string[];
  total_production_latest_year: number;
  avg_supply_risk_score: number;
  high_supply_risk_rows: number;
  disruption_events: number;
  export_control_events: number;
  avg_production_share_pct: number;
}

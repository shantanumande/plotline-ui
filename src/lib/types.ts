export type Criteria = {
  localities: string[] | null;
  window_end: string | null;
  bhk: number[] | null;
  price_band: [number, number] | null;
  sqft_range: [number, number] | null;
  sale_cond: string[] | null;
  price_unit: "inr";
};

export type Health = {
  status: string;
  llm_mode: "live" | "replay" | "off";
  snapshot_sha256: string;
  logic_version: string;
  contract_version: string;
};

export type Meta = {
  localities: string[];
  bhk_values: number[];
  sale_conds: string[];
  first_month: string;
  latest_month: string;
  window_end_min: string;
  window_end_max: string;
  default_window_end: string;
  sales_per_month: { month: string; count: number }[];
  localities_active_by_month: { month: string; localities: string[] }[];
  snapshot_sha256: string;
  constants: {
    window_months: number;
    min_bucket_n: number;
    coverage_min_months: number;
    anomaly_pct: number;
    count_drop: number;
    flat_band_pct: number;
    l1_cap: number;
    l2_cap: number;
    l2_widen: (number | "drop")[];
    topology_parallel_min_localities: number;
    contract_version: string;
  };
  partial_months: string[];
};

export type TrendRecord = {
  month: string;
  region_key: string;
  listing_count: number;
  n_in_bucket: number;
  median_price: number | null;
  median_price_per_sqft: number | null;
  low_sample: boolean;
  pct_change_price_per_sqft: number | null;
};

export type SummaryStat = {
  start: number;
  end: number;
  change_pct: number;
  direction: "up" | "down" | "flat";
} | null;

export type AgentName =
  | "planner" | "scanner" | "aggregator" | "validator" | "anomaly" | "diagnostic" | "reporter";

export type TraceEvent = {
  i: number;
  agent: AgentName;
  kind: "step" | "decision" | "loop" | "warning" | "error";
  loop: "L1" | "L2" | null;
  msg: string;
  data: Record<string, unknown>;
};

export type AnomalyFlag = {
  month: string;
  region_key: "ALL";
  kind: "price_jump" | "count_drop";
  value: number;
  threshold: number;
  reason: string;
};

export type TrendReport = {
  status: "ok" | "error";
  error: { code: string; message: string } | null;
  criteria_in: Criteria | string;
  effective_criteria: Criteria | null;
  price_unit: "inr" | "lakh";
  records: TrendRecord[];
  summary: { n_rows: number; price: SummaryStat; price_per_sqft: SummaryStat } | null;
  coverage_score: number;
  anomaly_flags: AnomalyFlag[];
  diagnostics: { month: string; text: string; source: "llm" | "template" }[];
  trace: TraceEvent[];
  metadata: {
    contract_version: string;
    logic_version: string;
    snapshot_sha256: string;
    seed: number;
    llm_mode: string;
    topology: "parallel" | "consolidated";
    n_scanners: number;
    loops_enabled: boolean;
    loop_counters: { L1_repairs: number; L2_attempts: number };
    partial_last_month: boolean;
    llm: object | null;
  };
};

export type RunRequest = ({ criteria: Criteria } | { nl_query: string }) & {
  seed?: number;
  options?: { loops_enabled?: boolean; force_topology?: "parallel" | "consolidated" | null };
};

import type { Criteria, RunRequest, TraceEvent, TrendReport } from "./types";
import { formatINR, formatMonth, formatSaleCond, LAKH, windowMonths } from "./format";

export type FormState = {
  localities: string[]; // empty = all
  bhk: number | null;
  windowEnd: string;
  budgetOn: boolean;
  budget: [number, number]; // lakh, as typed (may be inverted)
  sqftOn: boolean;
  sqft: [number, number];
  saleConds: string[];
  seed: number;
  loops: boolean;
  topology: "auto" | "parallel" | "consolidated";
};

export const defaultForm = (windowEnd: string): FormState => ({
  localities: [],
  bhk: null,
  windowEnd,
  budgetOn: false,
  budget: [50, 120],
  sqftOn: false,
  sqft: [800, 1600],
  saleConds: [],
  seed: 0,
  loops: true,
  topology: "auto",
});

export function formToRequest(f: FormState, allLocalities: string[]): RunRequest {
  const all = f.localities.length === 0 || f.localities.length === allLocalities.length;
  const criteria: Criteria = {
    localities: all ? null : f.localities,
    window_end: f.windowEnd,
    bhk: f.bhk == null ? null : [f.bhk],
    price_band: f.budgetOn ? [Math.round(f.budget[0] * LAKH), Math.round(f.budget[1] * LAKH)] : null,
    sqft_range: f.sqftOn ? [f.sqft[0], f.sqft[1]] : null,
    sale_cond: f.saleConds.length ? f.saleConds : null,
    price_unit: "inr",
  };
  return { criteria, ...advanced(f) };
}

export function advanced(f: FormState) {
  return {
    seed: f.seed,
    options: {
      loops_enabled: f.loops,
      force_topology: f.topology === "auto" ? null : f.topology,
    },
  };
}

export function criteriaToForm(c: Criteria, base: FormState): FormState {
  return {
    ...base,
    localities: c.localities ?? [],
    bhk: c.bhk && c.bhk.length === 1 ? (c.bhk[0] ?? null) : null,
    windowEnd: c.window_end ?? base.windowEnd,
    budgetOn: !!c.price_band,
    budget: c.price_band ? [c.price_band[0] / LAKH, c.price_band[1] / LAKH] : base.budget,
    sqftOn: !!c.sqft_range,
    sqft: c.sqft_range ?? base.sqft,
    saleConds: c.sale_cond ?? [],
  };
}

export function criteriaChips(c: Criteria): string[] {
  const chips: string[] = [];
  chips.push(c.localities ? c.localities.join(", ") : "All localities");
  chips.push(c.bhk ? c.bhk.map((b) => `${b} BHK`).join(", ") : "Any BHK");
  if (c.window_end) {
    const w = windowMonths(c.window_end);
    chips.push(`${formatMonth(w[0])} – ${formatMonth(w[11])}`);
  }
  if (c.price_band) chips.push(`${formatINR(c.price_band[0])} – ${formatINR(c.price_band[1])}`);
  if (c.sqft_range) chips.push(`${c.sqft_range[0].toLocaleString("en-IN")}–${c.sqft_range[1].toLocaleString("en-IN")} sqft`);
  if (c.sale_cond) chips.push(c.sale_cond.map(formatSaleCond).join(", "));
  return chips;
}

export function requestLabel(r: RunRequest): string {
  if ("nl_query" in r) return `“${r.nl_query}”`;
  return criteriaChips(r.criteria).slice(0, 3).join(" · ");
}

const band = (b: unknown) =>
  Array.isArray(b) ? `${formatINR(b[0] as number)}–${formatINR(b[1] as number)}` : "none";
const sqft = (b: unknown) => (Array.isArray(b) ? `${b[0]}–${b[1]} sqft` : "none");

const FIELD_LABEL: Record<string, string> = {
  price_band: "budget",
  sqft_range: "size range",
  sale_cond: "sale types",
  localities: "localities",
  bhk: "BHK",
  window_end: "window",
};

/** Plain-language list of what changed between the request and what was analysed. */
export function explainChanges(report: TrendReport): string[] {
  const out: string[] = [];
  const cin = report.criteria_in;
  const eff = report.effective_criteria;
  const loops = report.trace.filter((t) => t.kind === "loop");
  const l1 = loops.filter((t) => t.loop === "L1");
  const l2 = loops.filter((t) => t.loop === "L2");

  for (const t of l1) out.push(describeL1(t));

  if (l2.length && eff) {
    const first = l2[0]!.data as { coverage_months?: number };
    const parts: string[] = [];
    if (typeof cin === "object") {
      if (JSON.stringify(cin.price_band) !== JSON.stringify(eff.price_band) && eff.price_band)
        parts.push(`the budget to ${band(eff.price_band)}`);
      if (JSON.stringify(cin.sqft_range) !== JSON.stringify(eff.sqft_range))
        parts.push(eff.sqft_range ? `the size range to ${sqft(eff.sqft_range)}` : "the size range (removed)");
      if (JSON.stringify(cin.sale_cond) !== JSON.stringify(eff.sale_cond))
        parts.push(eff.sale_cond ? `sale types to ${eff.sale_cond.map(formatSaleCond).join(", ")}` : "sale types (removed)");
    }
    const what = parts.length ? parts.join(" and ") : "the soft filters";
    out.push(
      `Only ${first.coverage_months ?? "?"} of 12 months had enough sales, so we widened ${what} (${l2.length} attempt${l2.length > 1 ? "s" : ""}).`,
    );
  }

  if (!loops.length && typeof cin === "object" && eff) {
    for (const k of Object.keys(FIELD_LABEL) as (keyof Criteria)[]) {
      if (JSON.stringify(cin[k]) !== JSON.stringify(eff[k])) {
        out.push(`The ${FIELD_LABEL[k]} was adjusted by the agents.`);
      }
    }
  }
  return out;
}

function describeL1(t: TraceEvent): string {
  const d = t.data as { issue?: string; before?: unknown; after?: unknown };
  if (d.issue === "band_inverted") {
    return `You entered the budget as ${band(d.before)}, so we swapped it to ${band(d.after)}.`;
  }
  return `We repaired an invalid filter: ${t.msg.replace(/^L1 fired:\s*/, "")}.`;
}

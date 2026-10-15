// Display-only formatting. No statistics are computed here.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const LAKH = 100000;
export const CRORE = 10000000;
const MINUS = "−";

export function formatINR(n: number | null | undefined, opts: { perSqft?: boolean | undefined } = {}): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (opts.perSqft) return `₹${Math.round(n).toLocaleString("en-IN")}/sqft`;
  const sign = n < 0 ? MINUS : "";
  const a = Math.abs(n);
  if (a >= CRORE) return `${sign}₹${(a / CRORE).toFixed(2)} Cr`;
  if (a >= LAKH) return `${sign}₹${(a / LAKH).toFixed(1)} L`;
  return `${sign}₹${Math.round(a).toLocaleString("en-IN")}`;
}

/** Lakh label for a band edge typed/held in INR, e.g. ₹70 L. */
export function formatLakh(inr: number): string {
  return formatINR(inr);
}

/** A fraction (−0.175) shown as a percent (−17.5 %). */
export function formatPct(fraction: number | null | undefined, digits = 1): string {
  if (fraction == null || Number.isNaN(fraction)) return "—";
  const v = fraction * 100;
  const s = v > 0 ? "+" : v < 0 ? MINUS : "";
  return `${s}${Math.abs(v).toFixed(digits)} %`;
}

/** A value already in percent (−2.24) shown as −2.24 %. */
export function formatPctPoints(pct: number | null | undefined, digits = 2): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const s = pct > 0 ? "+" : pct < 0 ? MINUS : "";
  return `${s}${Math.abs(pct).toFixed(digits)} %`;
}

export function formatMonth(m: string | null | undefined, short = false): string {
  if (!m) return "—";
  const [y = "", mo = ""] = m.split("-");
  const name = MONTHS[Number(mo) - 1] ?? mo;
  return short ? `${name} ’${y.slice(2)}` : `${name} ${y}`;
}

export function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

// Calendar helpers (month arithmetic, not statistics).
export const monthIndex = (m: string) => {
  const [y = 0, mo = 1] = m.split("-").map(Number);
  return y * 12 + (mo - 1);
};
export const monthFromIndex = (i: number) =>
  `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
export function windowMonths(end: string, n = 12): string[] {
  const e = monthIndex(end);
  return Array.from({ length: n }, (_, k) => monthFromIndex(e - (n - 1) + k));
}

// Sale conditions: plain labels for display. The dataset values (keys) are what the API sends and receives.
const SALE_COND: Record<string, { label: string; hint: string }> = {
  "Normal Sale": { label: "Normal sale", hint: "An ordinary sale between unrelated parties" },
  AbNormal: { label: "Distress sale", hint: "Unusual circumstances, such as a forced or foreclosure sale" },
  Family: { label: "Within family", hint: "Sold between family members" },
  AdjLand: { label: "Neighbouring plot", hint: "The buyer bought the adjoining land" },
  Partial: { label: "Under construction", hint: "The home wasn't finished at the time of sale" },
};
export const formatSaleCond = (v: string): string => SALE_COND[v]?.label ?? v;
export const saleCondHint = (v: string): string | undefined => SALE_COND[v]?.hint;

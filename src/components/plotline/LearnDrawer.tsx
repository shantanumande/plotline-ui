import type { Meta, TrendReport } from "@/lib/types";
import { formatINR, formatMonth, formatPct, formatPctPoints } from "@/lib/format";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function LearnDrawer({ open, onOpenChange, meta, report }: {
  open: boolean; onOpenChange: (v: boolean) => void; meta?: Meta; report: TrendReport | null;
}) {
  const c = meta?.constants;
  const pct = (f?: number) => (f == null ? "—" : formatPct(f, 0).replace("+", ""));
  const ok = report?.status === "ok" ? report : null;
  const lowRec = ok?.records.find((r) => r.region_key === "ALL" && r.low_sample && r.median_price_per_sqft != null);
  const psf = ok?.summary?.price_per_sqft;
  const firstFlag = ok?.anomaly_flags[0];
  const covered = ok ? Math.round(ok.coverage_score * (c?.window_months ?? 12)) : null;

  const cards: { t: string; b: string; ex?: string | null }[] = [
    { t: "Why the median, not the average", b: "Sort every sale by price and take the middle one. A single ₹2 Cr sale drags an average up, but it barely moves the median, so the median describes a typical home." },
    { t: "Why ₹ per sqft", b: "A 3 BHK costs more than a 1 BHK simply because it is bigger. Dividing by area compares homes of different sizes fairly, which is why ₹/sqft is the hero number." },
    {
      t: "First 3 months vs last 3 months",
      b: `We pool the sales from the first three and last three months of the window, so one noisy month can't dominate. Changes within ±${c?.flat_band_pct ?? "—"} % count as flat.`,
      ex: psf ? `In this report: ${formatINR(psf.start, { perSqft: true })} → ${formatINR(psf.end, { perSqft: true })}, ${formatPctPoints(psf.change_pct)} (${psf.direction}).` : null,
    },
    {
      t: "Low-sample months",
      b: `Fewer than ${c?.min_bucket_n ?? "—"} sales in a month means the median is fragile. These months are drawn hollow and dashed.`,
      ex: lowRec ? `In this report: ${formatMonth(lowRec.month)} had only ${lowRec.n_in_bucket} sale${lowRec.n_in_bucket === 1 ? "" : "s"}.` : null,
    },
    {
      t: "Coverage and widening",
      b: `We need ${c?.coverage_min_months ?? "—"} of ${c?.window_months ?? 12} months with enough sales. Otherwise the Validator agent widens the budget, size, or sale-condition filters (up to ${c?.l2_cap ?? "—"} times), but never your locality, BHK, or dates.`,
      ex: covered != null ? `In this report: ${covered} of ${c?.window_months ?? 12} months were covered after ${ok!.metadata.loop_counters.L2_attempts} widening attempt(s).` : null,
    },
    {
      t: "Anomalies",
      b: `A month-over-month ₹/sqft move beyond ±${pct(c?.anomaly_pct)}, or listings falling to ${pct(c?.count_drop)} of the previous month or less.`,
      ex: firstFlag ? `In this report: ${formatMonth(firstFlag.month)} — ${firstFlag.reason}.` : null,
    },
    { t: "About the data", b: `7,108 real Chennai sales from ${formatMonth(meta?.first_month)} to ${formatMonth(meta?.latest_month)} across 7 localities, frozen as a snapshot with a fixed hash. “Last year” means the year ending ${formatMonth(meta?.latest_month)}, not today.`, ex: meta ? `Snapshot ${meta.snapshot_sha256.slice(0, 16)}…` : null },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">How this works</SheetTitle>
          <SheetDescription>Seven short ideas for reading a housing trend honestly.</SheetDescription>
        </SheetHeader>
        <ol className="mt-6 space-y-4">
          {cards.map((card, i) => (
            <li key={card.t} className="panel p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl text-primary num">{i + 1}</span>
                <h3 className="text-lg font-medium">{card.t}</h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.b}</p>
              {card.ex && <p className="mt-2 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs text-accent-foreground num">{card.ex}</p>}
            </li>
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  );
}

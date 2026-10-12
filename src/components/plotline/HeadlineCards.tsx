import type { Meta, SummaryStat, TrendReport } from "@/lib/types";
import { formatCount, formatINR, formatPctPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DirectionBadge } from "./common";

function StatCard({ title, stat, perSqft, hero }: { title: string; stat: SummaryStat; perSqft?: boolean; hero?: boolean }) {
  return (
    <div className={cn("panel flex flex-col p-5", hero && "border-primary/40 ring-1 ring-primary/15 sm:col-span-2 lg:col-span-1")}>
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow">{title}</div>
        {stat && <DirectionBadge dir={stat.direction} />}
      </div>
      {stat ? (
        <>
          <div
            className={cn(
              "mt-3 font-serif num",
              hero ? "text-5xl" : "text-4xl",
              stat.direction === "up" ? "text-up" : stat.direction === "down" ? "text-down" : "text-foreground",
            )}
          >
            {formatPctPoints(stat.change_pct)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground num">
            {formatINR(stat.start, { perSqft })} → <span className="text-foreground">{formatINR(stat.end, { perSqft })}</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">first 3 vs last 3 months, pooled median</div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Not enough sales at the start or end of the window to compare.</p>
      )}
    </div>
  );
}

export function HeadlineCards({ report, meta }: { report: TrendReport; meta: Meta | undefined }) {
  const s = report.summary;
  const W = meta?.constants.window_months ?? 12;
  const need = meta?.constants.coverage_min_months ?? 9;
  const minN = meta?.constants.min_bucket_n ?? 5;
  const covered = Math.round(report.coverage_score * W);
  const low = covered < need;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.25fr_0.7fr_1fr]">
      <StatCard title="Median price" stat={s?.price ?? null} />
      <StatCard title="Median ₹ / sqft" stat={s?.price_per_sqft ?? null} perSqft hero />
      <div className="panel p-5">
        <div className="eyebrow">Sales analysed</div>
        <div className="mt-3 font-serif text-4xl num">{formatCount(s?.n_rows)}</div>
        <div className="mt-2 text-sm text-muted-foreground">recorded sales</div>
      </div>
      <div className="panel p-5">
        <div className="eyebrow">Coverage</div>
        <div className="relative mt-4" role="img" aria-label={`${covered} of ${W} months had at least ${minN} sales`}>
          <div className="flex gap-1">
            {Array.from({ length: W }, (_, i) => (
              <div key={i} className={cn("h-6 flex-1 rounded-sm", i < covered ? (low ? "bg-warn" : "bg-primary") : "bg-muted")} />
            ))}
          </div>
          <div className="absolute -bottom-1.5 -top-1.5 w-0.5 bg-foreground" style={{ left: `calc(${(need / W) * 100}% - 1px)` }} aria-hidden />
        </div>
        <div className="mt-3 text-sm num">
          {covered} of {W} months had ≥ {minN} sales
        </div>
        {low && <div className="mt-1 text-xs font-semibold text-warn">Low coverage (needs {need})</div>}
      </div>
    </div>
  );
}

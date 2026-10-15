import type { Meta, SummaryStat, TrendReport } from "@/lib/types";
import { formatCount, formatINR, formatMonth, formatPctPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DirectionBadge } from "./common";
import { recordIndex, reportMonths } from "./TrendChart";

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
              "mt-3 font-semibold tracking-tight num",
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
  const idx = recordIndex(report);
  const months = reportMonths(report).map((m) => ({ m, r: idx.get(`${m}|ALL`) }));
  // Bar heights are a display scale only, like the heatmap colours.
  const maxN = Math.max(minN, ...months.map((x) => x.r?.n_in_bucket ?? 0));
  const h = (n: number) => `${Math.max(8, (n / maxN) * 100)}%`;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.25fr_0.7fr_1fr]">
      <StatCard title="Median price" stat={s?.price ?? null} />
      <StatCard title="Median ₹ / sqft" stat={s?.price_per_sqft ?? null} perSqft hero />
      <div className="panel p-5">
        <div className="eyebrow">Sales analysed</div>
        <div className="mt-3 text-4xl font-semibold tracking-tight num">{formatCount(s?.n_rows)}</div>
        <div className="mt-2 text-sm text-muted-foreground">recorded sales</div>
      </div>
      <div className="panel p-5">
        <div className="eyebrow">Coverage</div>
        <div className="relative mt-3 flex h-12 items-end gap-1" role="img"
          aria-label={`${covered} of ${W} months had at least ${minN} sales`}>
          {months.map(({ m, r }) => {
            const n = r?.n_in_bucket ?? 0;
            return (
              <Tooltip key={m}>
                <TooltipTrigger asChild>
                  <div className="flex h-full flex-1 items-end" aria-hidden>
                    <div
                      className={cn("w-full rounded-sm", n === 0 ? "bg-muted" : r?.low_sample ? "bg-volume-low" : "bg-volume")}
                      style={{ height: n === 0 ? "8%" : h(n) }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="num">
                  {formatMonth(m)}: {formatCount(n)} sale{n === 1 ? "" : "s"}
                </TooltipContent>
              </Tooltip>
            );
          })}
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t-[1.5px] border-dashed border-foreground"
            style={{ bottom: `${(minN / maxN) * 100}%` }} aria-hidden />
        </div>
        <div className="mt-3 text-sm num">
          {covered} of {W} months had ≥ {minN} sales
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-volume" /> enough sales</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-volume-low" /> fewer than {minN}</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 border-t-[1.5px] border-dashed border-foreground" /> {minN}-sale line</span>
        </div>
        {low && <div className="mt-1 text-xs font-semibold text-warn">Low coverage (needs {need})</div>}
      </div>
    </div>
  );
}

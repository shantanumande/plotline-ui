import { useMemo, useState } from "react";
import type { Meta, TrendReport } from "@/lib/types";
import { formatINR, formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionTitle, TableToggle } from "./common";
import { recordIndex, reportMonths, reportRegions } from "./TrendChart";

export function Heatmap({ report, meta, onFocus }: { report: TrendReport; meta?: Meta; onFocus: (l: string) => void }) {
  const [table, setTable] = useState(false);
  const months = reportMonths(report);
  const regions = reportRegions(report, meta);
  const idx = useMemo(() => recordIndex(report), [report]);

  // Colour scale bounds (display only).
  let lo = Infinity, hi = -Infinity;
  regions.forEach((l) => months.forEach((m) => {
    const v = idx.get(`${m}|${l}`)?.median_price_per_sqft;
    if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v; }
  }));
  const t = (v: number) => (hi > lo ? (v - lo) / (hi - lo) : 0.5);

  return (
    <section className="panel p-5" aria-label="Locality comparison heatmap">
      <SectionTitle eyebrow="Locality comparison" title="Median ₹/sqft by month" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0.5 text-xs num">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card pr-2 text-left font-medium text-muted-foreground">Locality</th>
              {months.map((m) => <th key={m} className="px-1 py-1 font-medium text-muted-foreground">{formatMonth(m, true)}</th>)}
            </tr>
          </thead>
          <tbody>
            {regions.map((l) => (
              <tr key={l}>
                <th className="sticky left-0 bg-card pr-2 text-left font-normal">
                  <button type="button" onClick={() => onFocus(l)} className="whitespace-nowrap text-sm font-medium hover:text-primary hover:underline">
                    {l}
                  </button>
                </th>
                {months.map((m) => {
                  const r = idx.get(`${m}|${l}`);
                  const v = r?.median_price_per_sqft;
                  if (v == null)
                    return <td key={m} title="no sales" className="h-9 min-w-14 rounded bg-muted/40 text-center text-[10px] text-muted-foreground">{table ? "—" : ""}</td>;
                  const k = t(v);
                  return (
                    <td key={m} title={`${l}, ${formatMonth(m)}: ${formatINR(v, { perSqft: true })} · ${r!.n_in_bucket} sales${r!.low_sample ? " (low sample)" : ""}`}
                      className={cn("relative h-9 min-w-14 rounded text-center", r!.low_sample && "hatch")}
                      style={table ? undefined : { background: `color-mix(in oklch, var(--primary) ${Math.round(10 + k * 80)}%, var(--card))`, color: k > 0.55 ? "var(--primary-foreground)" : "var(--foreground)" }}>
                      <span className="relative">{Math.round(v).toLocaleString("en-IN")}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm hatch border" /> low sample</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-muted/40 border" /> no sales</span>
          <span>Click a locality to focus it in the chart.</span>
        </span>
        <TableToggle on={table} onChange={setTable} />
      </div>
    </section>
  );
}

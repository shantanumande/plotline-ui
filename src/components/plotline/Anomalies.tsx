import { Flag } from "lucide-react";
import type { Meta, TrendReport } from "@/lib/types";
import { formatMonth, formatPct } from "@/lib/format";
import { SectionTitle } from "./common";

export function Anomalies({ report, meta }: { report: TrendReport; meta?: Meta | undefined }) {
  const pct = meta?.constants.anomaly_pct ?? 0.12;
  return (
    <section className="panel p-5" aria-label="Anomalies and explanations">
      <SectionTitle eyebrow="Anomalies & explanations" title="Unusual months" />
      {report.anomaly_flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No unusual months: prices moved within ±{formatPct(pct, 0).replace("+", "")} month to month.
        </p>
      ) : (
        <ul className="divide-y">
          {report.anomaly_flags.map((a) => {
            const d = report.diagnostics.find((x) => x.month === a.month);
            const jump = a.kind === "price_jump";
            const scale = jump ? Math.max(Math.abs(a.value), a.threshold) * 1.15 : 1;
            return (
              <li key={`${a.month}-${a.kind}`} className="grid gap-2 py-3 sm:grid-cols-[110px_130px_1fr]">
                <div className="font-serif text-lg num">{formatMonth(a.month)}</div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold">
                    <Flag className="h-3 w-3 text-warn" /> {jump ? "Price jump" : "Listings drop"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 text-xs num">
                    <span className="w-48 shrink-0">
                      {jump
                        ? `${formatPct(a.value)} vs ±${formatPct(a.threshold, 0).replace("+", "")} threshold`
                        : `${formatPct(a.value, 0).replace("+", "")} of prior month vs ${formatPct(a.threshold, 0).replace("+", "")} floor`}
                    </span>
                    <div className="relative h-2 flex-1 rounded-full bg-muted" aria-hidden>
                      <div className="absolute inset-y-0 left-0 rounded-full bg-warn" style={{ width: `${(Math.abs(a.value) / scale) * 100}%` }} />
                      <div className="absolute -inset-y-1 w-0.5 bg-foreground" style={{ left: `${(a.threshold / scale) * 100}%` }} />
                    </div>
                  </div>
                  <p className="text-sm">
                    {d?.text ?? a.reason}
                    {d && <span className="ml-2 rounded bg-muted px-1 text-[10px] uppercase text-muted-foreground">{d.source === "llm" ? "AI" : "rule"}</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import { Info, Pencil, Wand2 } from "lucide-react";
import type { Criteria, TrendReport } from "@/lib/types";
import { criteriaChips, explainChanges } from "@/lib/criteria";
import { Button } from "@/components/ui/button";

export function AnalysedBanner({ report, onEdit }: { report: TrendReport; onEdit: (c: Criteria) => void }) {
  const eff = report.effective_criteria;
  const changes = explainChanges(report);
  const fromNl = typeof report.criteria_in === "string";
  return (
    <section aria-label="What we actually analysed" className="panel animate-rise p-5">
      <div className="eyebrow mb-2">What we actually analysed</div>
      {fromNl && (
        <p className="mb-3 font-serif text-lg italic text-muted-foreground">“{report.criteria_in as string}”</p>
      )}
      {eff && (
        <div className="flex flex-wrap items-center gap-1.5">
          {criteriaChips(eff).map((c) => (
            <span key={c} className="rounded-full border bg-muted px-2.5 py-0.5 text-sm num">{c}</span>
          ))}
          {fromNl && (
            <Button size="sm" variant="ghost" className="ml-1 h-7 text-primary" onClick={() => onEdit(eff)}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit these filters
            </Button>
          )}
        </div>
      )}
      {changes.length > 0 && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-accent-soft p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent-foreground">
            <Wand2 className="h-4 w-4" /> The agents adjusted your request
          </div>
          <ul className="space-y-1.5 text-sm">
            {changes.map((c) => <li key={c} className="num">• {c}</li>)}
          </ul>
        </div>
      )}
      {report.metadata.partial_last_month && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-warn" /> The last month in the data is only partially recorded.
        </p>
      )}
    </section>
  );
}

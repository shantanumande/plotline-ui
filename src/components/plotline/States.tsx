import { useEffect, useState } from "react";
import { AlertCircle, PlugZap, Play } from "lucide-react";
import type { Meta, TrendReport } from "@/lib/types";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineDiagram } from "./AgentsPanel";
import { TimelineScrubber } from "./TimelineScrubber";

const ERROR_COPY: Record<string, string> = {
  E_INVALID_CRITERIA: "These filters can't be repaired automatically.",
  E_NL_UNPARSEABLE: "We couldn't turn that sentence into filters. Try naming a locality, BHK, or budget.",
  E_LLM_OFF: "Plain-English search is off on this server. Use the filter builder.",
  E_REPLAY_MISS: "This question isn't in the recorded answer cache. Try one of the example questions.",
  E_SCHEMA: "The data snapshot failed its integrity check.",
  E_SNAPSHOT_HASH: "The data snapshot failed its integrity check.",
};

export function ErrorPanel({ report }: { report: TrendReport }) {
  const e = report.error;
  return (
    <section className="panel animate-rise border-down/30 p-5" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-down" />
        <div>
          <h2 className="text-xl font-medium">{(e && ERROR_COPY[e.code]) ?? "The analysis couldn't run."}</h2>
          {e && <p className="mt-1 text-sm text-muted-foreground">{e.message}</p>}
          {e && <p className="mt-2 font-mono text-xs text-muted-foreground">{e.code}</p>}
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ meta, onExample }: { meta?: Meta | undefined; onExample: () => void }) {
  return (
    <section className="panel animate-rise p-8 text-center sm:p-12">
      <div className="eyebrow mb-3">Chennai · 2004 – 2015</div>
      <h1 className="mx-auto max-w-xl text-4xl font-medium leading-tight sm:text-5xl">
        How have home prices moved?
      </h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Pick filters or ask a question to see a 12-month trend.
      </p>
      {meta && <div className="mx-auto mt-8 max-w-2xl text-left"><TimelineScrubber meta={meta} /></div>}
      <Button size="lg" className="mt-8" onClick={onExample}>
        <Play className="mr-1.5 h-4 w-4" /> Try an example
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">Adyar · 1 BHK · a deliberately muddled budget, so you can watch the agents repair it.</p>
    </section>
  );
}

export function LoadingState({ meta }: { meta?: Meta | undefined }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s < 6 ? s + 1 : s)), 220);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="panel overflow-x-auto p-5">
        <div className="eyebrow mb-2">Agents at work…</div>
        <PipelineDiagram meta={meta} activeStep={step} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
      <Skeleton className="h-[460px] rounded-xl" />
    </div>
  );
}

export function UnreachableBanner({ message, onRetry, onDemo }: { message: string; onRetry: () => void; onDemo: () => void }) {
  return (
    <section className="panel border-warn/50 bg-warn-soft/40 p-5" role="alert">
      <div className="flex items-start gap-3">
        <PlugZap className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-medium">Backend unreachable</h2>
          <p className="mt-1 break-words text-sm text-muted-foreground">{message}</p>
          <p className="mt-1 font-mono text-xs">Calling: {API_BASE}</p>
          <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>In the backend repo: <code className="font-mono">uv sync && uv run python -m plotline.api</code></li>
            <li>Allow this origin: <code className="font-mono">CORS_ORIGINS={typeof window !== "undefined" ? window.location.origin : "http://localhost:8080"}</code></li>
            <li>Here: <code className="font-mono">cp .env.example .env && npm run dev</code></li>
          </ol>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={onRetry}>Retry</Button>
            <Button size="sm" variant="outline" onClick={onDemo}>Use demo data</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NarrowHint({ report }: { report: TrendReport }) {
  const c = report.effective_criteria;
  const tips: string[] = [];
  if (c?.price_band) tips.push("the budget");
  if (c?.sqft_range) tips.push("the size range");
  if (c?.sale_cond) tips.push("the sale conditions");
  if (c?.bhk) tips.push("the BHK filter");
  if (c?.localities && c.localities.length < 3) tips.push("the locality list");
  return (
    <section className="panel border-warn/40 p-5">
      <h2 className="text-xl font-medium">Too few sales to show a trend</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {tips.length ? `Try loosening ${tips.join(", ")}, or move the window to a busier period.` : "Try moving the window to a busier period on the timeline."}
      </p>
    </section>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import type { Criteria, RunRequest, TrendReport } from "@/lib/types";
import { getHealth, getMeta, getUseMocks, NetworkError, runTrend, setUseMocks } from "@/lib/api";
import { criteriaToForm, defaultForm, requestLabel, type FormState } from "@/lib/criteria";
import { loadRecent, pushRecent, type RecentRun } from "@/lib/recent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { QueryRail } from "@/components/plotline/QueryRail";
import { AnalysedBanner } from "@/components/plotline/AnalysedBanner";
import { HeadlineCards } from "@/components/plotline/HeadlineCards";
import { TrendChart } from "@/components/plotline/TrendChart";
import { Heatmap } from "@/components/plotline/Heatmap";
import { Anomalies } from "@/components/plotline/Anomalies";
import { AgentsPanel } from "@/components/plotline/AgentsPanel";
import { ReproFooter } from "@/components/plotline/ReproFooter";
import { LearnDrawer } from "@/components/plotline/LearnDrawer";
import { ThemeToggle } from "@/components/plotline/ThemeToggle";
import { EmptyState, ErrorPanel, LoadingState, NarrowHint, UnreachableBanner } from "@/components/plotline/States";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plotline · Housing price trends" },
      { name: "description", content: "Explore 12-month housing price trends across seven Chennai localities, and learn how to read them." },
      { property: "og:title", content: "Plotline · Housing price trends" },
      { property: "og:description", content: "Median prices, ₹/sqft and the agent pipeline behind every number, for Chennai 2004–2015." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Plotline,
});

const EXAMPLE: RunRequest = {
  criteria: { localities: ["Adyar"], bhk: [1], window_end: "2010-12", price_band: [9000000, 7000000], price_unit: "inr", sqft_range: null, sale_cond: null },
};

function Plotline() {
  const [mocks, setMocks] = useState(true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setMocks(getUseMocks());
    setReady(true);
  }, []);

  const health = useQuery({ queryKey: ["health", mocks], queryFn: () => getHealth(mocks), enabled: ready, retry: false });
  const meta = useQuery({ queryKey: ["meta", mocks], queryFn: () => getMeta(mocks), enabled: ready, retry: false });

  const [form, setForm] = useState<FormState>(defaultForm("2015-02"));
  const [tab, setTab] = useState<"ask" | "build">("ask");
  const [nl, setNl] = useState("");
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [lastReq, setLastReq] = useState<RunRequest | null>(null);
  const [overlays, setOverlays] = useState<string[]>([]);
  const [learn, setLearn] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => setRecent(loadRecent()), []);
  useEffect(() => {
    if (meta.data) setForm((f) => ({ ...f, windowEnd: meta.data.default_window_end }));
  }, [meta.data]);
  useEffect(() => {
    if (health.data?.llm_mode === "off") setTab("build");
  }, [health.data]);

  const run = useMutation({
    mutationFn: (r: RunRequest) => runTrend(r, mocks),
    onSuccess: (_rep, r) => setRecent(pushRecent({ label: requestLabel(r), at: Date.now(), request: r })),
  });
  const doRun = (r: RunRequest) => {
    setLastReq(r);
    setOverlays([]);
    setMobileFilters(false);
    run.mutate(r);
  };
  const toggleMocks = (v: boolean) => {
    setUseMocks(v);
    setMocks(v);
    run.reset();
  };
  const report: TrendReport | null = run.data ?? null;
  const editFilters = (c: Criteria) => {
    setForm(criteriaToForm(c, form));
    setTab("build");
    setMobileFilters(true);
  };

  const netErr = [health.error, meta.error, run.error].find(Boolean) as Error | undefined;

  const rail = (
    <QueryRail meta={meta.data} health={health.data} form={form} setForm={setForm} tab={tab} setTab={setTab}
      nl={nl} setNl={setNl} loading={run.isPending} onRun={doRun} recent={recent} onLearn={() => setLearn(true)} />
  );

  const thin = report?.status === "ok" && (!report.summary || report.summary.n_rows === 0 ||
    (!report.summary.price && !report.summary.price_per_sqft));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
            <div className="font-serif text-xl font-semibold tracking-tight">Plotline</div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileFilters(true)}>
                <Filter className="mr-1.5 h-4 w-4" /> Filters
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="panel sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-5">{rail}</div>
          </aside>

          <main className="min-w-0 space-y-6">
            {netErr && (netErr instanceof NetworkError || !mocks) && !mocks ? (
              <UnreachableBanner
                message={netErr.message}
                onRetry={() => { health.refetch(); meta.refetch(); if (lastReq) run.mutate(lastReq); }}
                onDemo={() => toggleMocks(true)}
              />
            ) : null}

            {run.isPending ? (
              <LoadingState llmMode={health.data?.llm_mode} />
            ) : report ? (
              report.status === "error" ? (
                <>
                  <ErrorPanel report={report} />
                  <AgentsPanel key={JSON.stringify(lastReq)} report={report} meta={meta.data} />
                  <ReproFooter report={report} request={lastReq} />
                </>
              ) : (
                <>
                  <AnalysedBanner report={report} onEdit={editFilters} />
                  {thin && <NarrowHint report={report} />}
                  <HeadlineCards report={report} meta={meta.data} />
                  <TrendChart report={report} meta={meta.data} overlays={overlays} setOverlays={setOverlays} />
                  <Heatmap report={report} meta={meta.data}
                    onFocus={(l) => { setOverlays([l]); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                  <Anomalies report={report} meta={meta.data} />
                  <AgentsPanel key={JSON.stringify(lastReq)} report={report} meta={meta.data} />
                  <ReproFooter report={report} request={lastReq} />
                </>
              )
            ) : (
              <EmptyState meta={meta.data} onExample={() => doRun(EXAMPLE)} />
            )}

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
              <span>Every number on this page comes straight from the analysis service.</span>
              <label className="flex items-center gap-2">
                <Switch checked={mocks} onCheckedChange={toggleMocks} aria-label="Demo data" /> Demo data
              </label>
            </footer>
          </main>
        </div>

        <Sheet open={mobileFilters} onOpenChange={setMobileFilters}>
          <SheetContent side="top" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader><SheetTitle className="font-serif">Filters</SheetTitle></SheetHeader>
            <div className="mt-4">{rail}</div>
          </SheetContent>
        </Sheet>
        <LearnDrawer open={learn} onOpenChange={setLearn} meta={meta.data} report={report} />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

import { useMemo, useState } from "react";
import { ChevronDown, Clock, Sparkles, SlidersHorizontal } from "lucide-react";
import type { Health, Meta, RunRequest } from "@/lib/types";
import type { FormState } from "@/lib/criteria";
import { advanced, formToRequest } from "@/lib/criteria";
import type { RecentRun } from "@/lib/recent";
import { formatMonth, monthFromIndex, monthIndex, windowMonths } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Chip } from "./common";
import { TimelineScrubber } from "./TimelineScrubber";

const EXAMPLES = [
  "2 BHK flats in Adyar under 1 crore last year",
  "How did prices in Velachery and T Nagar move in 2012?",
  "3 BHK in Anna Nagar between 80 lakh and 1.5 crore, year ending March 2011",
  "Normal sales in Chrompet, 1200–1800 sqft, 2013",
];

export function QueryRail({
  meta,
  health,
  form,
  setForm,
  tab,
  setTab,
  nl,
  setNl,
  loading,
  onRun,
  recent,
}: {
  meta: Meta | undefined;
  health: Health | undefined;
  form: FormState;
  setForm: (f: FormState) => void;
  tab: "ask" | "build";
  setTab: (t: "ask" | "build") => void;
  nl: string;
  setNl: (s: string) => void;
  loading: boolean;
  onRun: (r: RunRequest) => void;
  recent: RecentRun[];
}) {
  const llmOff = health?.llm_mode === "off";
  const up = (p: Partial<FormState>) => setForm({ ...form, ...p });

  const submit = () => {
    if (!meta) return;
    if (tab === "ask") {
      if (!nl.trim()) return;
      onRun({ nl_query: nl.trim(), ...advanced(form) });
    } else onRun(formToRequest(form, meta.localities));
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "ask" | "build")}>
        <TabsList className="grid w-full grid-cols-2">
          {llmOff ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <TabsTrigger value="ask" disabled className="w-full">
                    <Sparkles className="mr-1.5 h-4 w-4" /> Ask
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent>Plain-English search is off on this server (LLM_MODE=off).</TooltipContent>
            </Tooltip>
          ) : (
            <TabsTrigger value="ask">
              <Sparkles className="mr-1.5 h-4 w-4" /> Ask
            </TabsTrigger>
          )}
          <TabsTrigger value="build">
            <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Build
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ask" className="mt-4 space-y-3">
          <Label htmlFor="nl" className="eyebrow">Ask in plain English</Label>
          <Textarea
            id="nl"
            rows={4}
            value={nl}
            onChange={(e) => setNl(e.target.value)}
            placeholder="e.g. 2 BHK flats in Adyar under 1 crore last year"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setNl(q)}
                className="rounded-lg border border-dashed bg-card px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="build" className="mt-4">
          {meta ? <BuildForm meta={meta} form={form} up={up} /> : <p className="text-sm text-muted-foreground">Loading filters…</p>}
        </TabsContent>
      </Tabs>

      <AdvancedSection form={form} up={up} />

      <Button size="lg" className="w-full" disabled={!meta || loading || (tab === "ask" && !nl.trim())} onClick={submit}>
        {loading ? "Analysing…" : "Analyse trend"}
      </Button>

      {recent.length > 0 && (
        <div>
          <div className="eyebrow mb-2 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Recent</div>
          <div className="flex flex-col gap-1.5">
            {recent.map((r) => (
              <button
                key={r.at}
                type="button"
                onClick={() => onRun(r.request)}
                disabled={loading}
                className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left text-xs hover:bg-accent"
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 text-muted-foreground num">
                  {new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="eyebrow">{label}</div>
      {children}
      {hint}
    </div>
  );
}

function BuildForm({ meta, form, up }: { meta: Meta; form: FormState; up: (p: Partial<FormState>) => void }) {
  const allSel = form.localities.length === 0;
  const toggleLoc = (l: string) => {
    const s = form.localities.includes(l) ? form.localities.filter((x) => x !== l) : [...form.localities, l];
    up({ localities: s.length === meta.localities.length ? [] : s });
  };

  const months = useMemo(() => {
    const out: string[] = [];
    for (let i = monthIndex(meta.window_end_max); i >= monthIndex(meta.window_end_min); i--) out.push(monthFromIndex(i));
    return out;
  }, [meta]);

  const silent = useMemo(() => {
    const win = new Set(windowMonths(form.windowEnd, meta.constants.window_months));
    const active = new Set<string>();
    meta.localities_active_by_month.forEach((m) => win.has(m.month) && m.localities.forEach((l) => active.add(l)));
    const sel = form.localities.length ? form.localities : meta.localities;
    return sel.filter((l) => !active.has(l));
  }, [form.windowEnd, form.localities, meta]);

  return (
    <div className="space-y-6">
      <Field label="Localities">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={allSel} onClick={() => up({ localities: [] })}>All</Chip>
          {meta.localities.map((l) => (
            <Chip key={l} active={!allSel && form.localities.includes(l)} onClick={() => toggleLoc(l)}>{l}</Chip>
          ))}
        </div>
      </Field>

      <Field label="BHK">
        <div role="group" aria-label="BHK" className="grid grid-cols-5 overflow-hidden rounded-lg border">
          {[...meta.bhk_values, null].map((b) => (
            <button
              key={String(b)}
              type="button"
              aria-pressed={form.bhk === b}
              onClick={() => up({ bhk: b })}
              className={`py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                form.bhk === b ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
              }`}
            >
              {b ?? "Any"}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Window ending"
        hint={
          silent.length > 0 && (
            <p className="rounded-md bg-warn-soft px-2.5 py-1.5 text-xs text-foreground">
              {silent.join(", ")} {silent.length > 1 ? "have" : "has"} no sales in this window.
            </p>
          )
        }
      >
        <select
          value={form.windowEnd}
          onChange={(e) => up({ windowEnd: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
          aria-label="Window ending month"
        >
          {months.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <p className="text-xs text-muted-foreground num">
          {formatMonth(windowMonths(form.windowEnd)[0])} – {formatMonth(form.windowEnd)} · drag the band to move
        </p>
        <TimelineScrubber meta={meta} windowEnd={form.windowEnd} onChange={(m) => up({ windowEnd: m })} />
      </Field>

      <OptionalRange
        label="Budget (₹ lakh)"
        on={form.budgetOn}
        setOn={(v) => up({ budgetOn: v })}
        value={form.budget}
        setValue={(v) => up({ budget: v })}
        min={20}
        max={250}
        step={1}
      />
      <OptionalRange
        label="Size (sqft)"
        on={form.sqftOn}
        setOn={(v) => up({ sqftOn: v })}
        value={form.sqft}
        setValue={(v) => up({ sqft: v })}
        min={500}
        max={2500}
        step={50}
      />

      <Field label="Sale condition (optional)">
        <div className="flex flex-wrap gap-1.5">
          {meta.sale_conds.map((s) => (
            <Chip
              key={s}
              active={form.saleConds.includes(s)}
              onClick={() =>
                up({ saleConds: form.saleConds.includes(s) ? form.saleConds.filter((x) => x !== s) : [...form.saleConds, s] })
              }
            >
              {s}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}

function OptionalRange({
  label, on, setOn, value, setValue, min, max, step,
}: {
  label: string; on: boolean; setOn: (v: boolean) => void; value: [number, number];
  setValue: (v: [number, number]) => void; min: number; max: number; step: number;
}) {
  const sorted: [number, number] = value[0] <= value[1] ? value : [value[1], value[0]];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <Switch checked={on} onCheckedChange={setOn} aria-label={`Use ${label}`} />
      </div>
      {on && (
        <div className="space-y-3">
          <Slider min={min} max={max} step={step} value={sorted} onValueChange={(v) => setValue([v[0], v[1]])} aria-label={label} />
          <div className="flex items-center gap-2">
            <Input type="number" className="h-8 num" value={value[0]} aria-label={`${label} from`} onChange={(e) => setValue([Number(e.target.value), value[1]])} />
            <span className="text-muted-foreground">–</span>
            <Input type="number" className="h-8 num" value={value[1]} aria-label={`${label} to`} onChange={(e) => setValue([value[0], Number(e.target.value)])} />
          </div>
        </div>
      )}
    </div>
  );
}

function AdvancedSection({ form, up }: { form: FormState; up: (p: Partial<FormState>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-dashed px-3 py-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground">
        Advanced (testing hooks)
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        <p className="text-xs text-muted-foreground">For reproducibility and testing. Results are deterministic for a given seed.</p>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="seed" className="text-sm">Seed</Label>
          <Input id="seed" type="number" className="h-8 w-24 num" value={form.seed} onChange={(e) => up({ seed: Math.trunc(Number(e.target.value) || 0) })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="loops" className="text-sm">Allow agent loops</Label>
          <Switch id="loops" checked={form.loops} onCheckedChange={(v) => up({ loops: v })} />
        </div>
        <div className="space-y-1.5">
          <div className="text-sm">Topology</div>
          <div className="flex gap-1.5">
            {(["auto", "parallel", "consolidated"] as const).map((t) => (
              <Chip key={t} active={form.topology === t} onClick={() => up({ topology: t })}>
                {t[0].toUpperCase() + t.slice(1)}
              </Chip>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

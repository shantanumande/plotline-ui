import { useState } from "react";
import { AlertTriangle, ChevronDown, CircleDot, GitBranch, Repeat, XCircle } from "lucide-react";
import type { Meta, TraceEvent, TrendReport } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AGENTS } from "./common";

const NODE_W = 104, GAP = 18, Y = 92, H = 40;
const nx = (i: number) => 10 + i * (NODE_W + GAP);
const cx = (i: number) => nx(i) + NODE_W / 2;

export function PipelineDiagram({ report, meta, activeStep }: { report?: TrendReport | undefined; meta?: Meta | undefined; activeStep?: number }) {
  const l1 = report?.metadata.loop_counters.L1_repairs ?? 0;
  const l2 = report?.metadata.loop_counters.L2_attempts ?? 0;
  const l1cap = meta?.constants.l1_cap ?? 2;
  const l2cap = meta?.constants.l2_cap ?? 3;
  const W = nx(6) + NODE_W + 10;
  const md = report?.metadata;
  return (
    <svg viewBox={`0 0 ${W} 230`} className="w-full min-w-[720px]" role="img"
      aria-label={`Agent pipeline. L1 repair loop fired ${l1} times; L2 widening loop fired ${l2} times.`}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--muted-foreground)" />
        </marker>
        <marker id="arrA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--primary)" />
        </marker>
      </defs>
      {/* L1: Aggregator -> Planner (above) */}
      <path d={`M ${cx(2)} ${Y} C ${cx(2)} 20, ${cx(0)} 20, ${cx(0)} ${Y - 2}`} fill="none"
        className={l1 ? "animate-pulse-once" : ""} style={{ stroke: l1 ? "var(--primary)" : "var(--muted-foreground)" }}
        strokeWidth={l1 ? 2.5 : 1.25} strokeDasharray={l1 ? undefined : "4 4"} markerEnd={`url(#${l1 ? "arrA" : "arr"})`} />
      <text x={cx(1)} y={30} textAnchor="middle" fontSize="11" fill={l1 ? "var(--primary)" : "var(--muted-foreground)"}>
        L1 · Repair invalid filters (max {l1cap})
      </text>
      {l1 > 0 && <Badge x={cx(1) + 112} y={22} n={l1} />}
      {/* L2: Validator -> Scanners (below) */}
      <path d={`M ${cx(3)} ${Y + H} C ${cx(3)} 210, ${cx(1)} 210, ${cx(1)} ${Y + H + 2}`} fill="none"
        className={l2 ? "animate-pulse-once" : ""} style={{ stroke: l2 ? "var(--primary)" : "var(--muted-foreground)" }}
        strokeWidth={l2 ? 2.5 : 1.25} strokeDasharray={l2 ? undefined : "4 4"} markerEnd={`url(#${l2 ? "arrA" : "arr"})`} />
      <text x={cx(2)} y={222} textAnchor="middle" fontSize="11" fill={l2 ? "var(--primary)" : "var(--muted-foreground)"}>
        L2 · Widen soft filters when coverage is low (max {l2cap})
      </text>
      {l2 > 0 && <Badge x={cx(2) + 160} y={214} n={l2} />}
      {AGENTS.map((a, i) => {
        const on = activeStep != null ? i <= activeStep : true;
        const cur = activeStep === i;
        return (
          <g key={a.key}>
            {i < 6 && <line x1={nx(i) + NODE_W} y1={Y + H / 2} x2={nx(i + 1) - 2} y2={Y + H / 2} stroke="var(--muted-foreground)" strokeWidth={1.25} markerEnd="url(#arr)" />}
            <rect x={nx(i)} y={Y} width={NODE_W} height={H} rx={10}
              style={{ fill: cur ? "var(--primary)" : on ? "var(--card)" : "var(--muted)", stroke: on ? "var(--primary)" : "var(--border)" }} strokeWidth={1.25}
              className="transition-all duration-300" />
            <text x={cx(i)} y={Y + 25} textAnchor="middle" fontSize="13" fontWeight={600}
              fill={cur ? "var(--primary-foreground)" : on ? "var(--foreground)" : "var(--muted-foreground)"}>{a.label}</text>
          </g>
        );
      })}
      {md && (
        <text x={cx(1)} y={Y + H + 18} textAnchor="middle" fontSize="10.5" fill="var(--muted-foreground)">
          {md.n_scanners} {md.topology} scanner{md.n_scanners > 1 ? "s" : ""}{md.topology === "parallel" ? ", one per locality" : ""}
        </text>
      )}
    </svg>
  );
}

function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y + 4} r={10} fill="var(--primary)" />
      <text x={x} y={y + 8} textAnchor="middle" fontSize="11" fontWeight={700} fill="var(--primary-foreground)">×{n}</text>
    </g>
  );
}

const KIND_ICON = { step: CircleDot, decision: GitBranch, loop: Repeat, warning: AlertTriangle, error: XCircle } as const;
const AGENT_COLOR: Record<string, string> = {
  planner: "var(--chart-1)", scanner: "var(--chart-2)", aggregator: "var(--chart-3)", validator: "var(--primary)",
  anomaly: "var(--warn)", diagnostic: "var(--chart-4)", reporter: "var(--chart-5)",
};

export function TraceTimeline({ trace }: { trace: TraceEvent[] }) {
  const [loopsOnly, setLoopsOnly] = useState(false);
  const rows = loopsOnly ? trace.filter((t) => t.kind === "loop") : trace;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="eyebrow">Trace · {trace.length} events</div>
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={loopsOnly} onCheckedChange={setLoopsOnly} /> Loops only
        </label>
      </div>
      <ol className="space-y-1">
        {rows.map((t) => <TraceRow key={t.i} t={t} />)}
      </ol>
    </div>
  );
}

function TraceRow({ t }: { t: TraceEvent }) {
  const [open, setOpen] = useState(false);
  const Icon = KIND_ICON[t.kind];
  const hasData = Object.keys(t.data ?? {}).length > 0;
  return (
    <li className={cn("rounded-md border px-2.5 py-1.5", t.kind === "loop" ? "border-primary/40 bg-accent-soft" : t.kind === "warning" ? "bg-warn-soft/60" : t.kind === "error" ? "border-destructive/40" : "bg-card")}>
      <button type="button" disabled={!hasData} onClick={() => setOpen(!open)} className="flex w-full items-start gap-2 text-left">
        <span className="mt-0.5 w-5 text-right font-mono text-[10px] text-muted-foreground">{t.i}</span>
        <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10px] font-semibold uppercase" style={{ background: `color-mix(in oklch, ${AGENT_COLOR[t.agent]} 18%, transparent)`, color: AGENT_COLOR[t.agent] }}>
          {t.agent}
        </span>
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.kind === "loop" ? "text-primary" : t.kind === "warning" ? "text-warn" : t.kind === "error" ? "text-destructive" : "text-muted-foreground")} aria-label={t.kind} />
        <span className="min-w-0 flex-1 break-words font-mono text-xs">{t.loop && <b className="text-primary">[{t.loop}] </b>}{t.msg}</span>
        {hasData && <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />}
      </button>
      {open && <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 font-mono text-[11px]">{JSON.stringify(t.data, null, 2)}</pre>}
    </li>
  );
}

export function AgentsPanel({ report, meta }: { report: TrendReport; meta?: Meta }) {
  const fired = report.metadata.loop_counters.L1_repairs + report.metadata.loop_counters.L2_attempts > 0;
  const [open, setOpen] = useState(fired || report.status === "error");
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="panel p-5">
      <CollapsibleTrigger className="flex w-full items-end justify-between text-left">
        <div>
          <div className="eyebrow mb-1">Behind the numbers</div>
          <h2 className="text-2xl font-medium">How the agents worked</h2>
        </div>
        <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-5">
        <div className="overflow-x-auto"><PipelineDiagram report={report} meta={meta} /></div>
        <TraceTimeline trace={report.trace} />
      </CollapsibleContent>
    </Collapsible>
  );
}

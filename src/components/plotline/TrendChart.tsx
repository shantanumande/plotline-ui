import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Meta, TrendRecord, TrendReport } from "@/lib/types";
import { formatCount, formatINR, formatMonth, formatPct, windowMonths } from "@/lib/format";
import { SectionTitle, TableToggle, Val } from "./common";
import { cn } from "@/lib/utils";

const LOC_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function reportMonths(report: TrendReport): string[] {
  const end = report.effective_criteria?.window_end;
  return end ? windowMonths(end) : [];
}
export function reportRegions(report: TrendReport, meta?: Meta): string[] {
  return report.effective_criteria?.localities ?? meta?.localities ?? [];
}
export function recordIndex(report: TrendReport) {
  const m = new Map<string, TrendRecord>();
  report.records.forEach((r) => m.set(`${r.month}|${r.region_key}`, r));
  return m;
}

const usePrefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function TrendChart({
  report, meta, overlays, setOverlays,
}: {
  report: TrendReport; meta?: Meta | undefined; overlays: string[]; setOverlays: (o: string[]) => void;
}) {
  const [metric, setMetric] = useState<"psf" | "price">("psf");
  const [table, setTable] = useState(false);
  const reduced = usePrefersReduced();
  const months = reportMonths(report);
  const regions = reportRegions(report, meta);
  const idx = useMemo(() => recordIndex(report), [report]);
  const key = metric === "psf" ? "median_price_per_sqft" : "median_price";
  const fmt = (v: number | null) => formatINR(v, { perSqft: metric === "psf" });
  const minN = meta?.constants.min_bucket_n ?? 5;

  const diag = useMemo(() => {
    const d = new Map<string, { text: string; source: string }[]>();
    report.diagnostics.forEach((x) => d.set(x.month, [...(d.get(x.month) ?? []), x]));
    return d;
  }, [report]);
  const flagged = new Set(report.anomaly_flags.map((a) => a.month));

  const data = months.map((m) => {
    const r = idx.get(`${m}|ALL`);
    const v = r ? r[key] : null;
    const row: Record<string, unknown> = {
      month: m, label: formatMonth(m, true), rec: r, all: v, allSolid: r?.low_sample ? null : v, listings: r?.listing_count ?? 0,
    };
    overlays.forEach((l) => (row[`loc_${l}`] = idx.get(`${m}|${l}`)?.[key] ?? null));
    return row;
  });

  const toggle = (l: string) => {
    if (overlays.includes(l)) setOverlays(overlays.filter((x) => x !== l));
    else if (overlays.length < 4) setOverlays([...overlays, l]);
  };

  const Dot = (p: { cx?: number; cy?: number; payload?: { rec?: TrendRecord; all: number | null } }) => {
    if (p.cx == null || p.cy == null || p.payload?.all == null) return <g />;
    const low = p.payload.rec?.low_sample;
    return (
      <circle cx={p.cx} cy={p.cy} r={low ? 4.5 : 3.5} strokeWidth={2}
        style={{ stroke: low ? "var(--warn)" : "var(--primary)", fill: low ? "var(--card)" : "var(--primary)" }} />
    );
  };

  const TooltipBody = ({ active, payload }: { active?: boolean; payload?: { payload: Record<string, unknown> }[] }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    const r = row.rec as TrendRecord | undefined;
    const m = row.month as string;
    return (
      <div className="max-w-xs rounded-lg border bg-popover p-3 text-xs shadow-soft">
        <div className="mb-1 font-semibold">{formatMonth(m)}</div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 num">
          <span className="text-muted-foreground">Median</span><span>{formatINR(r?.median_price)}</span>
          <span className="text-muted-foreground">₹/sqft</span><span>{formatINR(r?.median_price_per_sqft, { perSqft: true })}</span>
          <span className="text-muted-foreground">Listings</span><span>{formatCount(r?.listing_count)}</span>
          <span className="text-muted-foreground">MoM ₹/sqft</span><span>{formatPct(r?.pct_change_price_per_sqft)}</span>
          {overlays.map((l) => (
            <><span key={`k${l}`} className="text-muted-foreground">{l}</span><span key={`v${l}`}>{fmt(row[`loc_${l}`] as number | null)}</span></>
          ))}
        </div>
        {r?.median_price_per_sqft == null && <div className="mt-1.5 text-muted-foreground">No median: not enough sales.</div>}
        {r?.low_sample && r.median_price_per_sqft != null && (
          <div className="mt-1.5 font-medium text-warn">Only {r.n_in_bucket} sales — treat with caution</div>
        )}
        {diag.get(m)?.map((d) => (
          <div key={d.text} className="mt-1.5 border-t pt-1.5">
            ⚑ {d.text} <span className="ml-1 rounded bg-muted px-1 text-[10px] uppercase">{d.source === "llm" ? "AI" : "rule"}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="panel p-5" aria-label="Twelve-month trend chart">
      <SectionTitle
        eyebrow="12-month trend"
        title={metric === "psf" ? "Median price per sqft" : "Median sale price"}
        right={
          <div role="group" aria-label="Metric" className="flex overflow-hidden rounded-lg border text-sm">
            {(["psf", "price"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)}
                className={cn("px-3 py-1", metric === k ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
                {k === "psf" ? "₹ / sqft" : "Median price"}
              </button>
            ))}
          </div>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="mr-1 inline-flex items-center gap-1.5 font-semibold"><span className="h-0.5 w-5 bg-primary" /> All selected</span>
        {regions.map((l) => {
          const i = overlays.indexOf(l);
          return (
            <button key={l} type="button" aria-pressed={i >= 0} onClick={() => toggle(l)} disabled={i < 0 && overlays.length >= 4}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 disabled:opacity-40", i >= 0 ? "bg-muted" : "bg-card hover:bg-accent")}>
              <span className="h-2 w-2 rounded-full" style={{ background: i >= 0 ? LOC_COLORS[i] : "var(--border)" }} />{l}
            </button>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-warn" /> fewer than {minN} sales
        </span>
      </div>

      {table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm num">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-3">Month</th><th className="pr-3">Median</th><th className="pr-3">₹/sqft</th><th className="pr-3">Listings</th><th className="pr-3">In bucket</th><th>MoM</th>
            </tr></thead>
            <tbody>
              {months.map((m) => {
                const r = idx.get(`${m}|ALL`);
                return (
                  <tr key={m} className={cn("border-b last:border-0", r?.low_sample && "bg-warn-soft/50")}>
                    <td className="py-1.5 pr-3">{formatMonth(m)}</td>
                    <td className="pr-3"><Val v={r?.median_price}>{formatINR(r?.median_price)}</Val></td>
                    <td className="pr-3"><Val v={r?.median_price_per_sqft}>{formatINR(r?.median_price_per_sqft, { perSqft: true })}</Val></td>
                    <td className="pr-3">{formatCount(r?.listing_count)}</td>
                    <td className="pr-3">{formatCount(r?.n_in_bucket)}</td>
                    <td><Val v={r?.pct_change_price_per_sqft}>{formatPct(r?.pct_change_price_per_sqft)}</Val></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label="Line chart of the monthly median with listing counts below">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} syncId="trend" margin={{ top: 24, right: 12, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis width={78} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => fmt(v)} domain={["auto", "auto"]} />
                <Tooltip content={<TooltipBody />} cursor={{ stroke: "var(--border)" }} />
                {months.filter((m) => flagged.has(m)).map((m) => (
                  <ReferenceLine key={m} x={formatMonth(m, true)} stroke="var(--warn)" strokeDasharray="2 4"
                    label={{ value: "⚑", position: "top", fill: "var(--warn)", fontSize: 14 }} />
                ))}
                {overlays.map((l, i) => (
                  <Line key={l} dataKey={`loc_${l}`} stroke={LOC_COLORS[i]} strokeWidth={1.5} dot={{ r: 2 }} connectNulls={false}
                    isAnimationActive={!reduced} name={l} />
                ))}
                <Line dataKey="all" stroke="var(--primary)" strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.7}
                  dot={<Dot />} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={!reduced} />
                <Line dataKey="allSolid" stroke="var(--primary)" strokeWidth={3} dot={false} activeDot={false}
                  connectNulls={false} isAnimationActive={!reduced} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} syncId="trend" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                <XAxis dataKey="label" hide />
                <YAxis width={78} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false}
                  label={{ value: "listings", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip content={<TooltipBody />} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="listings" radius={[3, 3, 0, 0]} isAnimationActive={!reduced}>
                  {data.map((d) => (
                    <Cell key={d.month as string} fill={(d.rec as TrendRecord | undefined)?.low_sample ? "var(--warn)" : "var(--muted-foreground)"} fillOpacity={0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="mt-3 flex justify-end"><TableToggle on={table} onChange={setTable} /></div>
    </section>
  );
}

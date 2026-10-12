import { useRef, useState } from "react";
import type { Meta } from "@/lib/types";
import { formatMonth, monthFromIndex, monthIndex } from "@/lib/format";

export function TimelineScrubber({
  meta,
  windowEnd,
  onChange,
  height = 56,
}: {
  meta: Meta;
  windowEnd?: string;
  onChange?: (m: string) => void;
  height?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const data = meta.sales_per_month;
  const n = data.length;
  const W = 600;
  const bw = W / n;
  const maxCount = data.reduce((m, d) => (d.count > m ? d.count : m), 1); // scale only
  const first = monthIndex(meta.first_month);
  const endIdx = windowEnd ? monthIndex(windowEnd) - first : -1;
  const startIdx = endIdx - (meta.constants.window_months - 1);
  const minEnd = monthIndex(meta.window_end_min) - first;
  const maxEnd = monthIndex(meta.window_end_max) - first;

  const idxAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.floor(((clientX - r.left) / r.width) * n)));
  };
  const setFromX = (clientX: number) => {
    if (!onChange) return;
    const i = Math.max(minEnd, Math.min(maxEnd, idxAt(clientX)));
    onChange(monthFromIndex(first + i));
  };

  const h = hover != null ? data[hover] : null;
  const active = h ? meta.localities_active_by_month.find((x) => x.month === h.month) : null;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="block h-14 w-full touch-none select-none"
        role={onChange ? "slider" : "img"}
        aria-label="Sales per month across the dataset; the highlighted band is the selected 12-month window"
        aria-valuetext={windowEnd ? `Window ending ${formatMonth(windowEnd)}` : undefined}
        tabIndex={onChange ? 0 : -1}
        onKeyDown={(e) => {
          if (!onChange || !windowEnd) return;
          const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
          if (!d) return;
          e.preventDefault();
          const i = Math.max(minEnd, Math.min(maxEnd, endIdx + d));
          onChange(monthFromIndex(first + i));
        }}
        onPointerDown={(e) => {
          if (!onChange) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDrag(true);
          setFromX(e.clientX);
        }}
        onPointerMove={(e) => {
          setHover(idxAt(e.clientX));
          if (drag) setFromX(e.clientX);
        }}
        onPointerUp={() => setDrag(false)}
        onPointerLeave={() => {
          setHover(null);
          setDrag(false);
        }}
      >
        {endIdx >= 0 && (
          <rect
            x={startIdx * bw}
            y={0}
            width={meta.constants.window_months * bw}
            height={height}
            className="fill-primary/15 stroke-primary"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            rx={2}
          />
        )}
        {data.map((d, i) => {
          const bh = Math.max(1, (d.count / maxCount) * (height - 6));
          const inWin = i >= startIdx && i <= endIdx;
          return (
            <rect
              key={d.month}
              x={i * bw + bw * 0.15}
              width={bw * 0.7}
              y={height - bh}
              height={bh}
              className={inWin ? "fill-primary" : hover === i ? "fill-foreground/60" : "fill-muted-foreground/40"}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground num">
        <span>{formatMonth(meta.first_month)}</span>
        <span>{formatMonth(meta.latest_month)}</span>
      </div>
      {h && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 w-56 -translate-x-1/2 -translate-y-full rounded-md border bg-popover p-2 text-xs shadow-soft">
          <div className="font-semibold">{formatMonth(h.month)}</div>
          <div className="num">{h.count.toLocaleString("en-IN")} sales</div>
          <div className="text-muted-foreground">
            {active?.localities.length ? active.localities.join(", ") : "No localities with sales"}
          </div>
        </div>
      )}
    </div>
  );
}

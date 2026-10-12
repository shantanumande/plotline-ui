import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Val({ v, children, className }: { v: unknown; children?: ReactNode; className?: string }) {
  if (v == null || (typeof v === "number" && Number.isNaN(v))) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className={cn("cursor-help text-muted-foreground", className)}>—</span>
        </TooltipTrigger>
        <TooltipContent>not enough sales</TooltipContent>
      </Tooltip>
    );
  }
  return <span className={cn("num", className)}>{children}</span>;
}

export function DirectionBadge({ dir }: { dir: "up" | "down" | "flat" }) {
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : ArrowRight;
  const cls = dir === "up" ? "text-up bg-up/10" : dir === "down" ? "text-down bg-down/10" : "text-flat bg-muted";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {dir === "up" ? "Up" : dir === "down" ? "Down" : "Flat"}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h2 className="text-2xl font-medium">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  disabled,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

export function TableToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
    >
      {on ? "View as chart" : "View as table"}
    </button>
  );
}

export const AGENTS = [
  { key: "planner", label: "Planner" },
  { key: "scanner", label: "Scanners" },
  { key: "aggregator", label: "Aggregator" },
  { key: "validator", label: "Validator" },
  { key: "anomaly", label: "Anomaly" },
  { key: "diagnostic", label: "Diagnostic" },
  { key: "reporter", label: "Reporter" },
] as const;

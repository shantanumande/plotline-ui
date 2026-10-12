import { toast } from "sonner";
import { Copy, Download, Terminal } from "lucide-react";
import type { RunRequest, TrendReport } from "@/lib/types";
import { curlFor } from "@/lib/api";
import { Button } from "@/components/ui/button";

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error("Couldn't access the clipboard");
  }
}

export function ReproFooter({ report, request }: { report: TrendReport; request: RunRequest | null }) {
  const m = report.metadata;
  const items: [string, string][] = [
    ["seed", String(m.seed)],
    ["llm_mode", m.llm_mode],
    ["topology", m.topology],
    ["contract", m.contract_version],
    ["logic", m.logic_version],
    ["snapshot", m.snapshot_sha256.slice(0, 12)],
  ];
  const download = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `plotline-report-${m.snapshot_sha256.slice(0, 8)}-seed${m.seed}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <section className="panel p-5" aria-label="Reproducibility">
      <div className="eyebrow mb-1">Reproducibility</div>
      <p className="mb-3 font-serif text-lg">Anyone can re-run this exact result.</p>
      <dl className="mb-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
        {items.map(([k, v]) => (
          <div key={k}><dt className="inline text-muted-foreground">{k}: </dt><dd className="inline" title={k === "snapshot" ? m.snapshot_sha256 : undefined}>{v}</dd></div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={!request} onClick={() => request && copy(JSON.stringify(request, null, 2), "Request JSON")}>
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy request JSON
        </Button>
        <Button variant="outline" size="sm" onClick={download}><Download className="mr-1.5 h-3.5 w-3.5" /> Download report JSON</Button>
        <Button variant="outline" size="sm" disabled={!request} onClick={() => request && copy(curlFor(request), "curl command")}>
          <Terminal className="mr-1.5 h-3.5 w-3.5" /> Copy curl command
        </Button>
      </div>
    </section>
  );
}

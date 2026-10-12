import type { Criteria, Health, Meta, RunRequest, TrendReport } from "./types";
import metaRaw from "@/mocks/meta.json";
import healthMock from "@/mocks/health.json";
import reportLoops from "@/mocks/report_loops.json";
import reportError from "@/mocks/report_error.json";
import reportAll from "@/mocks/report_all.json";
import { monthFromIndex, monthIndex } from "./format";

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://127.0.0.1:8000";
const ENV_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
const MOCK_KEY = "plotline.useMocks";

export function getUseMocks(): boolean {
  if (typeof window === "undefined") return ENV_MOCKS;
  try {
    const v = window.localStorage.getItem(MOCK_KEY);
    if (v !== null) return v === "1";
  } catch {
    /* ignore */
  }
  return ENV_MOCKS;
}
export function setUseMocks(v: boolean) {
  try {
    window.localStorage.setItem(MOCK_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export class NetworkError extends Error {
  constructor(public url: string, cause: unknown) {
    super(`Could not reach ${url}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
}
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = API_BASE + path;
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new NetworkError(url, e);
  }
  if (res.status === 422) {
    const body = await res.text();
    throw new HttpError(422, `The request was malformed (HTTP 422). This is a frontend bug. ${body.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new HttpError(res.status, `The backend failed (HTTP ${res.status}). This is a backend bug.`);
  }
  return res.json() as Promise<T>;
}

// ---- mocks ----
type RawMeta = Omit<Meta, "localities_active_by_month"> & {
  localities_active_ranges: { from: string; to: string; localities: string[] }[];
};
function expandMeta(raw: RawMeta): Meta {
  const { localities_active_ranges, ...rest } = raw;
  const out: Meta["localities_active_by_month"] = [];
  for (let i = monthIndex(raw.first_month); i <= monthIndex(raw.latest_month); i++) {
    const m = monthFromIndex(i);
    const r = localities_active_ranges.find(
      (x) => monthIndex(x.from) <= i && i <= monthIndex(x.to),
    );
    out.push({ month: m, localities: r ? r.localities : [] });
  }
  return { ...rest, localities_active_by_month: out } as Meta;
}
const MOCK_META = expandMeta(metaRaw as unknown as RawMeta);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function pickMock(req: RunRequest): TrendReport {
  if ("criteria" in req) {
    const c = req.criteria;
    if (c.localities?.some((l) => !MOCK_META.localities.includes(l))) {
      return reportError as unknown as TrendReport;
    }
    const target = (reportLoops as unknown as TrendReport).criteria_in as Criteria;
    const keys: (keyof Criteria)[] = ["localities", "window_end", "bhk", "price_band", "sqft_range", "sale_cond"];
    if (keys.every((k) => same(c[k], target[k]))) return reportLoops as unknown as TrendReport;
  }
  return reportAll as unknown as TrendReport;
}

export async function getHealth(useMocks: boolean): Promise<Health> {
  if (useMocks) return healthMock as Health;
  return request<Health>("/api/health");
}
export async function getMeta(useMocks: boolean): Promise<Meta> {
  if (useMocks) return MOCK_META;
  return request<Meta>("/api/meta");
}
export async function runTrend(req: RunRequest, useMocks: boolean): Promise<TrendReport> {
  if (useMocks) {
    await delay(1400);
    return structuredClone(pickMock(req));
  }
  return request<TrendReport>("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
}

export function curlFor(req: RunRequest): string {
  return `curl -X POST ${API_BASE}/api/run -H 'Content-Type: application/json' -d '${JSON.stringify(req)}'`;
}

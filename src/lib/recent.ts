import type { RunRequest } from "./types";

export type RecentRun = { label: string; at: number; request: RunRequest };
const KEY = "plotline.recent";

export function loadRecent(): RecentRun[] {
  try {
    const v = window.localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as RecentRun[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(run: RecentRun): RecentRun[] {
  const list = [run, ...loadRecent().filter((r) => JSON.stringify(r.request) !== JSON.stringify(run.request))].slice(0, 5);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

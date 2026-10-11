import type { AppData, DayKey, SavingsEntry } from "./types";
import { addDays, addMonths, diffDays, monthKeyOf } from "./dates";
import { roundMoney, sum } from "./money";
import { spentIn } from "./stats";

/** Snapshots oldest to newest. Two on the same day keep the later edit. */
export function liveSavings(data: AppData): SavingsEntry[] {
  const byDay = new Map<DayKey, SavingsEntry>();
  for (const s of data.savings.filter((x) => !x.deleted).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))) byDay.set(s.date, s);
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export const currentSavings = (data: AppData): SavingsEntry | null => liveSavings(data).at(-1) ?? null;

/** Change versus the most recent snapshot on or before `days` ago. Null if we have no snapshot that old. */
export function changeOver(data: AppData, today: DayKey, days: number): number | null {
  const list = liveSavings(data);
  const now = list.at(-1);
  if (!now) return null;
  const cutoff = addDays(today, -days);
  const base = [...list].reverse().find((s) => s.date <= cutoff && s !== now);
  return base ? roundMoney(now.amount - base.amount) : null;
}

/** Change since the last snapshot before this one. */
export function lastChange(data: AppData): { delta: number; days: number } | null {
  const list = liveSavings(data);
  if (list.length < 2) return null;
  const [prev, now] = list.slice(-2);
  return { delta: roundMoney(now.amount - prev.amount), days: Math.max(1, diffDays(now.date, prev.date)) };
}

/** How many months of average spending the savings would cover. */
export function runwayMonths(data: AppData, today: DayKey): number | null {
  const now = currentSavings(data);
  if (!now) return null;
  const month = monthKeyOf(today);
  const totals = [1, 2, 3].map((n) => spentIn(data, addMonths(month, -n))).filter((v) => v > 0);
  const avg = totals.length ? sum(totals) / totals.length : spentIn(data, month) > 0 ? spentIn(data, month) : 0;
  return avg > 0 ? now.amount / avg : null;
}

export interface TargetProgress { pct: number; remaining: number; etaDays: number | null }

/** Progress toward the target, with a rough ETA from the last 90 days of growth. */
export function targetProgress(data: AppData, today: DayKey): TargetProgress | null {
  const target = data.settings.savingsTarget;
  const now = currentSavings(data);
  if (!(target > 0) || !now) return null;
  const remaining = Math.max(0, roundMoney(target - now.amount));
  const recent = liveSavings(data).filter((s) => diffDays(today, s.date) <= 90);
  let etaDays: number | null = null;
  if (remaining > 0 && recent.length >= 2) {
    const first = recent[0];
    const span = diffDays(now.date, first.date);
    const rate = span >= 14 ? (now.amount - first.amount) / span : 0;
    if (rate > 0) etaDays = Math.ceil(remaining / rate);
  }
  return { pct: Math.min(100, (now.amount / target) * 100), remaining, etaDays };
}

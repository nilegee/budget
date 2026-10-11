import type { DayKey, MonthKey } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const dayKey = (d: Date = new Date()): DayKey => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKeyOf = (d: Date | DayKey = new Date()): MonthKey =>
  typeof d === "string" ? d.slice(0, 7) : `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function parseDay(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function addMonths(key: MonthKey, n: number): MonthKey {
  const [y, m] = key.split("-").map(Number);
  return monthKeyOf(new Date(y, m - 1 + n, 1));
}

export function daysInMonth(key: MonthKey): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function dayOfMonth(key: DayKey): number {
  return Number(key.slice(8, 10));
}

export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((parseDay(a).getTime() - parseDay(b).getTime()) / 86_400_000);
}

/** ISO-ish week id (Monday start) used to hand out one streak freeze per week. */
export function weekId(key: DayKey): string {
  const d = parseDay(key);
  const dow = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - dow);
  return dayKey(d);
}

export function monthLabel(key: MonthKey, style: "long" | "short" = "long"): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", style === "long" ? { month: "long", year: "numeric" } : { month: "short" });
}

export function dayLabel(key: DayKey, today: DayKey = dayKey()): string {
  const diff = diffDays(today, key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return parseDay(key).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

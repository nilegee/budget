import type { AppData, Category, DayKey, Expense, Id, MonthKey } from "./types";
import { addMonths, dayOfMonth, daysInMonth, monthKeyOf } from "./dates";
import { roundMoney, sum } from "./money";

export const liveExpenses = (data: AppData) => data.expenses.filter((e) => !e.deleted);
export const liveCategories = (data: AppData) =>
  data.categories.filter((c) => !c.deleted).sort((a, b) => a.order - b.order);

export function expensesIn(data: AppData, month: MonthKey): Expense[] {
  return liveExpenses(data).filter((e) => e.date.startsWith(month));
}

export const spentIn = (data: AppData, month: MonthKey) => roundMoney(sum(expensesIn(data, month).map((e) => e.amount)));

/** Spend from day 1 through `upToDay` (inclusive) of a month. */
export function spentThroughDay(data: AppData, month: MonthKey, upToDay: number): number {
  return roundMoney(sum(expensesIn(data, month).filter((e) => dayOfMonth(e.date) <= upToDay).map((e) => e.amount)));
}

export function categoryTotals(data: AppData, month: MonthKey, upToDay = 31): Map<Id, number> {
  const out = new Map<Id, number>();
  for (const e of expensesIn(data, month)) {
    if (dayOfMonth(e.date) > upToDay) continue;
    out.set(e.categoryId, roundMoney((out.get(e.categoryId) ?? 0) + e.amount));
  }
  return out;
}

export interface PaceInfo {
  month: MonthKey;
  day: number; // day of month "today" is in (or last day for past months)
  days: number;
  budget: number;
  spent: number;
  pctUsed: number;
  expectedSoFar: number; // straight-line pace
  ratio: number; // spent / expectedSoFar (1 = exactly on pace)
  remaining: number;
  daysLeft: number; // including today
  safeToday: number; // what you can spend today and still land on budget
  projected: number; // where the month lands at the current rate
}

export function paceInfo(data: AppData, today: DayKey): PaceInfo {
  const month = monthKeyOf(today);
  const days = daysInMonth(month);
  const day = dayOfMonth(today);
  const budget = data.settings.monthlyBudget;
  const spent = spentIn(data, month);
  const spentBeforeToday = spentThroughDay(data, month, day - 1);
  const daysLeft = days - day + 1;
  const expectedSoFar = (budget * day) / days;
  return {
    month,
    day,
    days,
    budget,
    spent,
    pctUsed: budget > 0 ? (spent / budget) * 100 : 0,
    expectedSoFar,
    ratio: expectedSoFar > 0 ? spent / expectedSoFar : spent > 0 ? 2 : 0,
    remaining: roundMoney(budget - spent),
    daysLeft,
    safeToday: Math.max(0, roundMoney((budget - spentBeforeToday) / daysLeft)),
    projected: day > 0 ? roundMoney((spent / day) * days) : 0
  };
}

export interface CategoryDelta {
  category: Category;
  now: number;
  before: number;
  delta: number; // now - before
  deltaPct: number | null; // null when there was nothing before
}

/** Same-point-in-month comparison: through today's day-of-month in both months. */
export function categoryDeltas(data: AppData, today: DayKey): CategoryDelta[] {
  const month = monthKeyOf(today);
  const prev = addMonths(month, -1);
  const day = dayOfMonth(today);
  const now = categoryTotals(data, month, day);
  const before = categoryTotals(data, prev, day);
  return liveCategories(data).map((category) => {
    const n = now.get(category.id) ?? 0;
    const b = before.get(category.id) ?? 0;
    return { category, now: n, before: b, delta: roundMoney(n - b), deltaPct: b > 0 ? ((n - b) / b) * 100 : null };
  });
}

export interface VsLast {
  now: number;
  before: number;
  delta: number;
  deltaPct: number | null;
  winning: boolean;
}

export function vsLastMonth(data: AppData, today: DayKey): VsLast {
  const month = monthKeyOf(today);
  const day = dayOfMonth(today);
  const now = spentThroughDay(data, month, day);
  const before = spentThroughDay(data, addMonths(month, -1), day);
  const delta = roundMoney(now - before);
  return { now, before, delta, deltaPct: before > 0 ? (delta / before) * 100 : null, winning: before > 0 && now <= before };
}

/** Cumulative spend by day for charts. */
export function cumulativeByDay(data: AppData, month: MonthKey, upTo = daysInMonth(month)): number[] {
  const perDay = new Array<number>(daysInMonth(month)).fill(0);
  for (const e of expensesIn(data, month)) perDay[dayOfMonth(e.date) - 1] += e.amount;
  const out: number[] = [];
  let run = 0;
  for (let i = 0; i < upTo; i++) out.push((run += perDay[i]));
  return out.map(roundMoney);
}

export function topCategories(data: AppData, month: MonthKey, n: number) {
  const totals = categoryTotals(data, month);
  const total = sum([...totals.values()]);
  return liveCategories(data)
    .map((category) => ({ category, amount: totals.get(category.id) ?? 0, share: total > 0 ? ((totals.get(category.id) ?? 0) / total) * 100 : 0 }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export function knownMonths(data: AppData, today: DayKey): MonthKey[] {
  const set = new Set<MonthKey>([monthKeyOf(today)]);
  for (const e of liveExpenses(data)) set.add(monthKeyOf(e.date));
  return [...set].sort();
}

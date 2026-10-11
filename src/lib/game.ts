import type { AppData, DayKey, Mood, MonthKey } from "./types";
import { addDays, addMonths, daysInMonth, diffDays, monthKeyOf, weekId } from "./dates";
import { categoryDeltas, expensesIn, liveExpenses, paceInfo, spentIn, type PaceInfo } from "./stats";

/** Every day anyone in the household looked and logged (an expense or "no spend"). */
export function checkedInDays(data: AppData): Set<DayKey> {
  const days = new Set<DayKey>();
  for (const c of data.checkins) if (!c.deleted) days.add(c.date);
  for (const e of liveExpenses(data)) days.add(e.date);
  return days;
}

export interface Streak {
  count: number;
  /** True if today is already checked in. */
  doneToday: boolean;
  /** Days bridged by the weekly freeze, newest first. */
  frozen: DayKey[];
  /** Last day anything was logged. */
  lastDay: DayKey | null;
}

/**
 * Family streak: consecutive days with at least one check-in. Today only counts once done, but a
 * missing today never breaks the streak (you have until midnight). One missed day per week is
 * bridged automatically — the streak freeze — so a single slip doesn't wipe the habit.
 * Pure: derived from the data, nothing stored.
 */
export function computeStreak(data: AppData, today: DayKey): Streak {
  const days = checkedInDays(data);
  const doneToday = days.has(today);
  const frozen: DayKey[] = [];
  const usedWeeks = new Set<string>();
  let count = doneToday ? 1 : 0;
  let cursor = addDays(today, -1);
  const lastDay = [...days].filter((d) => d <= today).sort().pop() ?? null;
  for (let guard = 0; guard < 3650; guard++) {
    if (days.has(cursor)) {
      count++;
    } else {
      const wk = weekId(cursor);
      const canBridge = !usedWeeks.has(wk) && days.has(addDays(cursor, -1)) && count > 0;
      if (!canBridge) break;
      usedWeeks.add(wk);
      frozen.push(cursor);
    }
    cursor = addDays(cursor, -1);
  }
  return { count, doneToday, frozen, lastDay };
}

export interface MoodResult {
  mood: Mood;
  line: string;
  sub: string;
  /** A short Egyptian Arabic aside, shown beside the English line. */
  ar: string;
}

const LINES: Record<Mood, string[]> = {
  glowing: ["We're ahead of pace. Keep this going.", "This is what a good month feels like.", "Quietly crushing it."],
  content: ["Right on track. Steady wins.", "Nice and even. No drama.", "On pace. Keep it boring."],
  uneasy: ["Spending is running a little hot.", "A lighter day or two puts us back.", "Still fixable. Pick your next spend."],
  stressed: ["We're well past pace. Let's slow down.", "Big month. A few no-spend days would help.", "Time to pick what really matters."],
  sleepy: ["Nothing logged today yet.", "Quick check-in? Even 'no spend' counts.", "{name} is waiting. Tap in to keep the streak warm."],
  sad: ["It's {name}. I missed you.", "It's been quiet. Log what you remember.", "Hey, {name} here. Let's catch up."]
};

const AR: Record<Mood, string[]> = {
  glowing: ["ماشي حالك زي الفل", "عاش يا بطل"],
  content: ["على السكة", "ماشي بالعقل"],
  uneasy: ["هدّي شوية", "حاسب شوية"],
  stressed: ["على مهلك يا باشا", "كفاية كده النهارده"],
  sleepy: ["لسه ما سجلناش النهارده", "مستنيك"],
  sad: ["وحشتني، فينك؟", "غبت عليا"]
};

const pick = (arr: string[], seed: string) => arr[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % arr.length];

export function computeMood(data: AppData, today: DayKey, pace: PaceInfo = paceInfo(data, today)): MoodResult {
  const streak = computeStreak(data, today);
  const gap = streak.lastDay ? diffDays(today, streak.lastDay) : 1;
  let mood: Mood;
  if (!streak.doneToday && gap >= 2) mood = "sad";
  else if (!streak.doneToday && gap === 1) mood = "sleepy";
  else if (pace.budget > 0 && pace.pctUsed > 100) mood = "stressed";
  else if (pace.ratio <= 0.9) mood = "glowing";
  else if (pace.ratio <= 1.05) mood = "content";
  else if (pace.ratio <= 1.25) mood = "uneasy";
  else mood = "stressed";
  const sub =
    mood === "sad"
      ? `${gap >= 99 ? "No" : gap} day${gap === 1 ? "" : "s"} without a check-in`
      : mood === "sleepy"
        ? "Streak is safe until midnight"
        : pace.pctUsed > 100
          ? "Over budget this month"
          : `${Math.round(pace.pctUsed)}% of the month's budget used`;
  const name = data.settings.potName || "Fulus";
  return { mood, line: pick(LINES[mood], today + mood).replaceAll("{name}", name), sub, ar: pick(AR[mood], today + mood + "ar") };
}

/* ---------- monthly scoreboard ---------- */

export interface MonthReport {
  month: MonthKey;
  spent: number;
  budget: number;
  underBudget: boolean;
  savedVsBudget: number;
  prevSpent: number;
  beatLast: boolean;
  hasPrev: boolean;
  noSpendDays: number;
  categoryWins: { name: string; icon: string; pct: number }[];
  complete: boolean;
}

export function monthReport(data: AppData, month: MonthKey, today: DayKey): MonthReport {
  const complete = month < monthKeyOf(today);
  const spent = spentIn(data, month);
  const prev = addMonths(month, -1);
  const prevSpent = spentIn(data, prev);
  const lastDay = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
  const probe = complete ? lastDay : today;
  const wins = categoryDeltas(data, probe)
    .filter((d) => d.deltaPct !== null && d.deltaPct <= -15 && d.before >= 50)
    .map((d) => ({ name: d.category.name, icon: d.category.icon, pct: Math.round(Math.abs(d.deltaPct!)) }))
    .sort((a, b) => b.pct - a.pct);
  const noSpend = new Set(data.checkins.filter((c) => !c.deleted && c.kind === "nospend" && c.date.startsWith(month)).map((c) => c.date));
  const spendDays = new Set(expensesIn(data, month).map((e) => e.date));
  for (const d of spendDays) noSpend.delete(d);
  return {
    month,
    spent,
    budget: data.settings.monthlyBudget,
    underBudget: data.settings.monthlyBudget > 0 && spent <= data.settings.monthlyBudget,
    savedVsBudget: Math.max(0, data.settings.monthlyBudget - spent),
    prevSpent,
    hasPrev: prevSpent > 0,
    beatLast: prevSpent > 0 && spent < prevSpent,
    noSpendDays: noSpend.size,
    categoryWins: wins,
    complete
  };
}

/* ---------- badges (derived, never stored) ---------- */

export interface Badge {
  id: string;
  icon: string;
  title: string;
  hint: string;
  earned: boolean;
  /** 0–1 progress for locked badges. */
  progress: number;
  detail?: string;
}

export function computeBadges(data: AppData, today: DayKey): Badge[] {
  const best = longestStreak(data, today);
  const month = monthKeyOf(today);
  const prevMonths = [1, 2, 3, 4, 5, 6].map((n) => addMonths(month, -n));
  const completed = prevMonths.map((m) => monthReport(data, m, today)).filter((r) => r.spent > 0);
  const underCount = completed.filter((r) => r.underBudget).length;
  const beatCount = completed.filter((r) => r.beatLast).length;
  const nowReport = monthReport(data, month, today);
  const tracked = liveExpenses(data).length;
  const b = (id: string, icon: string, title: string, hint: string, value: number, goal: number, detail?: string): Badge => ({
    id,
    icon,
    title,
    hint,
    earned: value >= goal,
    progress: Math.min(1, value / goal),
    detail
  });
  return [
    b("first", "sprout", "First step", "Log your first expense", tracked, 1),
    b("streak3", "flame", "Warm streak", "3 days in a row", best, 3, `Best: ${best}`),
    b("streak7", "bolt", "Week keeper", "7 days in a row", best, 7, `Best: ${best}`),
    b("streak30", "trophy", "Month master", "30 days in a row", best, 30, `Best: ${best}`),
    b("nospend", "leaf", "Calm wallet", "5 no-spend days in a month", nowReport.noSpendDays, 5, `${nowReport.noSpendDays} this month`),
    b("under", "target", "On budget", "Finish a month under budget", underCount, 1),
    b("beat", "trend", "Beat last month", "Spend less than the month before", beatCount, 1),
    b("cut", "scissors", "Category cut", "Cut a category 15%+ vs last month", nowReport.categoryWins.length, 1, nowReport.categoryWins[0] ? `${nowReport.categoryWins[0].name} −${nowReport.categoryWins[0].pct}%` : undefined),
    b("hat", "gem", "Hat-trick", "Under budget 3 months running", underStreak(data, today), 3)
  ];
}

export function longestStreak(data: AppData, today: DayKey): number {
  const days = [...checkedInDays(data)].filter((d) => d <= today).sort();
  let best = 0;
  let run = 0;
  let prev: DayKey | null = null;
  for (const d of days) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return Math.max(best, computeStreak(data, today).count);
}

function underStreak(data: AppData, today: DayKey): number {
  let n = 0;
  let m = addMonths(monthKeyOf(today), -1);
  for (let i = 0; i < 12; i++, m = addMonths(m, -1)) {
    const r = monthReport(data, m, today);
    if (r.spent === 0 || !r.underBudget) break;
    n++;
  }
  return n;
}

/** Calendar cells for the month heat strip. */
export function monthCalendar(data: AppData, month: MonthKey, today: DayKey) {
  const days = checkedInDays(data);
  const noSpend = new Set(data.checkins.filter((c) => !c.deleted && c.kind === "nospend").map((c) => c.date));
  const n = daysInMonth(month);
  return Array.from({ length: n }, (_, i) => {
    const key = `${month}-${String(i + 1).padStart(2, "0")}`;
    return { key, day: i + 1, done: days.has(key), noSpend: noSpend.has(key), future: key > today, today: key === today };
  });
}


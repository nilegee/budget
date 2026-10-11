import type { AppData, DayKey } from "./types";
import { addMonths, monthKeyOf } from "./dates";
import { formatMoney, sum } from "./money";
import { categoryDeltas, expensesIn, liveCategories, paceInfo } from "./stats";

export interface Nudge {
  id: string;
  tone: "win" | "tip" | "warn";
  icon: string;
  title: string;
  body: string;
  categoryId?: string;
}

const money = (data: AppData, n: number) => formatMoney(n, data.settings.currency, { decimals: false });

/**
 * Behaviour-first nudges. Each one frames a number as a choice the family can still make:
 * a concrete amount, a concrete action, and what it adds up to over a year.
 */
export function buildNudges(data: AppData, today: DayKey, limit = 3): Nudge[] {
  const out: Nudge[] = [];
  const pace = paceInfo(data, today);
  const month = monthKeyOf(today);
  const deltas = categoryDeltas(data, today);

  // 1. Biggest category running hotter than last month: loss framing + a yearly anchor.
  const worst = deltas.filter((d) => d.delta > 40 && d.before > 0).sort((a, b) => b.delta - a.delta)[0];
  if (worst) {
    out.push({
      id: `hot-${worst.category.id}`,
      tone: "warn",
      icon: worst.category.icon,
      categoryId: worst.category.id,
      title: `${worst.category.name} is up ${money(data, worst.delta)} on last month`,
      body: `Same point last month: ${money(data, worst.before)}. If this becomes the new normal, that's about ${money(data, worst.delta * 12)} more a year.`
    });
  }

  // 2. Small leaks: lots of small purchases in one category.
  const leaks = liveCategories(data)
    .map((c) => {
      const rows = expensesIn(data, month).filter((e) => e.categoryId === c.id);
      return { c, count: rows.length, total: sum(rows.map((r) => r.amount)) };
    })
    .filter((r) => r.count >= 5 && r.total / r.count < 80)
    .sort((a, b) => b.total - a.total)[0];
  if (leaks) {
    out.push({
      id: `leak-${leaks.c.id}`,
      tone: "tip",
      icon: leaks.c.icon,
      categoryId: leaks.c.id,
      title: `${leaks.count} small ${leaks.c.name.toLowerCase()} buys = ${money(data, leaks.total)}`,
      body: `They feel tiny one by one. Skipping every third one saves about ${money(data, (leaks.total / 3) * 12)} a year.`
    });
  }

  // 3. Win: a category clearly down. Celebrate it, specifically.
  const best = deltas.filter((d) => d.deltaPct !== null && d.deltaPct <= -15 && d.before >= 50).sort((a, b) => a.delta - b.delta)[0];
  if (best) {
    out.push({
      id: `win-${best.category.id}`,
      tone: "win",
      icon: "party",
      categoryId: best.category.id,
      title: `${best.category.name} is down ${Math.round(Math.abs(best.deltaPct!))}%`,
      body: `You've spent ${money(data, Math.abs(best.delta))} less than at this point last month. That's the one to repeat.`
    });
  }

  // 4. Pace: give a number to act on today.
  if (pace.budget > 0 && pace.spent > 0) {
    if (pace.ratio > 1.1 && pace.pctUsed <= 100) {
      out.push({
        id: "pace-hot",
        tone: "warn",
        icon: "compass",
        title: `Today's safe spend is ${money(data, pace.safeToday)}`,
        body: `At this rate the month lands near ${money(data, pace.projected)} against a ${money(data, pace.budget)} budget. A couple of quiet days closes the gap.`
      });
    } else if (pace.ratio <= 0.9) {
      const goal = (pace.budget * data.settings.savingsGoalPct) / 100;
      const heading = Math.max(0, pace.budget - pace.projected);
      out.push({
        id: "pace-good",
        tone: "win",
        icon: "sun",
        title: `Heading to keep ${money(data, heading)}`,
        body: goal > 0 ? `Your goal is ${money(data, goal)}. ${heading >= goal ? "You're on track to hit it." : `${money(data, goal - heading)} to go.`}` : "Set a savings goal in More to give it a target."
      });
    }
  }

  // 5. Last month's shape, if there's nothing else to say.
  const prevTotal = sum(expensesIn(data, addMonths(month, -1)).map((e) => e.amount));
  if (!out.length && prevTotal > 0) {
    out.push({ id: "prev", tone: "tip", icon: "search", title: `Last month was ${money(data, prevTotal)}`, body: "Log a few days and I'll show where you're ahead or behind." });
  }
  if (!out.length) {
    out.push({ id: "start", tone: "tip", icon: "coin", title: "Log your first expense", body: "It takes five seconds. Everything else builds from there." });
  }
  return out.slice(0, limit);
}

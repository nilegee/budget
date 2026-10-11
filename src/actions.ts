import { signal } from "@preact/signals";
import { addExpense, data, deleteExpense, markNoSpend, restoreExpense, today, type ExpenseInput } from "./lib/store";
import { computeMood, computeStreak } from "./lib/game";
import { celebrate, showToast } from "./components/ui";
import { formatMoney } from "./lib/money";
import { sfxChime } from "./lib/sound";

/** Bumped on every check-in so the pot can squish happily. */
export const potPulse = signal(0);

const MILESTONES = new Set([3, 7, 14, 21, 30, 60, 100]);

/** Feedback after anything counts as a check-in: streak, comeback, milestones. */
function afterCheckin(before: { streak: number; sad: boolean }, lead: string, undo?: () => void) {
  const t = today.value;
  const now = computeStreak(data.value, t);
  const extended = now.count > before.streak;
  let msg = lead;
  if (before.sad) {
    msg = "Welcome back. Streak restarts today";
    sfxChime();
    celebrate(24);
  } else if (extended && MILESTONES.has(now.count)) {
    msg = `${now.count}-day streak! ${lead}`;
    sfxChime();
    celebrate(48);
  } else if (extended && now.count > 1) {
    msg = `${lead} · ${now.count} day streak`;
  }
  showToast(msg, undo ? { label: "Undo", run: undo } : undefined);
}

function snapshot() {
  const t = today.value;
  return { streak: computeStreak(data.value, t).count, sad: computeMood(data.value, t).mood === "sad" };
}

export function logExpense(input: ExpenseInput) {
  const before = snapshot();
  const e = addExpense(input);
  potPulse.value++;
  const cat = data.value.categories.find((c) => c.id === e.categoryId);
  afterCheckin(before, `Saved ${cat?.name ?? "expense"} ${formatMoney(e.amount, data.value.settings.currency, { decimals: false })}`, () => deleteExpense(e.id));
}

export function logNoSpend() {
  const before = snapshot();
  markNoSpend();
  potPulse.value++;
  afterCheckin(before, "No-spend day logged");
}

export function removeExpense(id: string) {
  deleteExpense(id);
  showToast("Expense deleted", { label: "Undo", run: () => restoreExpense(id) });
}

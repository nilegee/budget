import { describe, expect, it } from "vitest";
import { defaultData } from "../src/lib/defaults";
import type { AppData, CheckIn, Expense } from "../src/lib/types";
import { computeBadges, computeMood, computeStreak, monthReport } from "../src/lib/game";
import { categoryDeltas, paceInfo, vsLastMonth } from "../src/lib/stats";
import { buildNudges } from "../src/lib/insights";
import { applyRows, mergeById, rowsSince } from "../src/lib/merge";
import { fromLegacy, parseImport } from "../src/lib/migrate";
import { addDays } from "../src/lib/dates";

const T = "2026-10-15"; // a Thursday
const ts = "2026-10-01T00:00:00.000Z";

function fixture(): AppData {
  const d = defaultData();
  d.settings.monthlyBudget = 3100; // 100 per day in a 31-day month
  return d;
}
let n = 0;
const exp = (data: AppData, date: string, amount: number, catIndex = 0): Expense => {
  const e: Expense = { id: `e${n++}`, date, categoryId: data.categories[catIndex].id, amount, note: "", by: "p_me", createdAt: ts, updatedAt: ts };
  data.expenses.push(e);
  return e;
};
const nospend = (data: AppData, date: string): CheckIn => {
  const c: CheckIn = { id: `${date}:p_me`, date, by: "p_me", kind: "nospend", updatedAt: ts };
  data.checkins.push(c);
  return c;
};

describe("pace", () => {
  it("computes safe-to-spend and ratio", () => {
    const d = fixture();
    exp(d, "2026-10-10", 700); // 700 by day 15 vs expected 1500
    const p = paceInfo(d, T);
    expect(p.day).toBe(15);
    expect(p.expectedSoFar).toBeCloseTo(1500, 5);
    expect(p.ratio).toBeCloseTo(700 / 1500, 5);
    expect(p.daysLeft).toBe(17);
    expect(p.safeToday).toBeCloseTo((3100 - 700) / 17, 1);
  });
});

describe("streak", () => {
  it("counts consecutive days and does not break while today is open", () => {
    const d = fixture();
    for (const day of ["2026-10-12", "2026-10-13", "2026-10-14"]) nospend(d, day);
    const s = computeStreak(d, T);
    expect(s.count).toBe(3);
    expect(s.doneToday).toBe(false);
    nospend(d, T);
    expect(computeStreak(d, T).count).toBe(4);
  });
  it("bridges a single missed day once per week (freeze)", () => {
    const d = fixture();
    for (const day of ["2026-10-12", "2026-10-14", T]) nospend(d, day); // 13th missed
    const s = computeStreak(d, T);
    expect(s.count).toBe(3);
    expect(s.frozen).toEqual(["2026-10-13"]);
  });
  it("two misses in the same week break it", () => {
    const d = fixture();
    for (const day of ["2026-10-12", "2026-10-15"]) nospend(d, day); // 13th, 14th missed
    expect(computeStreak(d, T).count).toBe(1);
  });
  it("expenses count as check-ins", () => {
    const d = fixture();
    exp(d, T, 20);
    expect(computeStreak(d, T).count).toBe(1);
  });
});

describe("mood", () => {
  it("is sad after a full day with no check-in", () => {
    const d = fixture();
    exp(d, addDays(T, -3), 10);
    expect(computeMood(d, T).mood).toBe("sad");
  });
  it("is sleepy when yesterday was the last check-in", () => {
    const d = fixture();
    exp(d, addDays(T, -1), 10);
    expect(computeMood(d, T).mood).toBe("sleepy");
  });
  it("glows when well under pace, stressed when far over", () => {
    const d = fixture();
    exp(d, T, 500);
    expect(computeMood(d, T).mood).toBe("glowing");
    exp(d, T, 3000);
    expect(computeMood(d, T).mood).toBe("stressed");
  });
  it("recovers from sad once today is checked in", () => {
    const d = fixture();
    exp(d, addDays(T, -5), 10);
    expect(computeMood(d, T).mood).toBe("sad");
    nospend(d, T);
    expect(computeMood(d, T).mood).not.toBe("sad");
  });
});

describe("comparisons and nudges", () => {
  it("compares the same point in the month", () => {
    const d = fixture();
    exp(d, "2026-09-05", 400, 1);
    exp(d, "2026-09-20", 900, 1); // after day 15, must be ignored
    exp(d, "2026-10-05", 250, 1);
    const v = vsLastMonth(d, T);
    expect(v.before).toBe(400);
    expect(v.now).toBe(250);
    expect(v.winning).toBe(true);
    const cat = categoryDeltas(d, T).find((x) => x.category.id === d.categories[1].id)!;
    expect(cat.deltaPct).toBeCloseTo(-37.5, 5);
  });
  it("warns when a category is up and annualises it", () => {
    const d = fixture();
    exp(d, "2026-09-05", 200, 1);
    exp(d, "2026-10-05", 600, 1);
    const nudges = buildNudges(d, T);
    expect(nudges[0].tone).toBe("warn");
    expect(nudges[0].body).toContain("4,800");
  });
  it("always gives a starting nudge when empty", () => {
    expect(buildNudges(fixture(), T)[0].id).toBe("start");
  });
});

describe("month report and badges", () => {
  it("flags beat-last-month and under-budget for completed months", () => {
    const d = fixture();
    exp(d, "2026-08-10", 3000);
    exp(d, "2026-09-10", 2000);
    const r = monthReport(d, "2026-09", T);
    expect(r.complete).toBe(true);
    expect(r.beatLast).toBe(true);
    expect(r.underBudget).toBe(true);
    const badges = computeBadges(d, T);
    expect(badges.find((b) => b.id === "beat")!.earned).toBe(true);
    expect(badges.find((b) => b.id === "under")!.earned).toBe(true);
    expect(badges.find((b) => b.id === "streak30")!.earned).toBe(false);
  });
});

describe("merge / sync", () => {
  it("last write wins and tombstones stick", () => {
    const a: { id: string; updatedAt: string; v: number; deleted?: boolean } = { id: "x", updatedAt: "2026-10-01T10:00:00.000Z", v: 1 };
    const b: typeof a = { id: "x", updatedAt: "2026-10-01T11:00:00.000Z", v: 2 };
    expect(mergeById([a], [b])[0].v).toBe(2);
    expect(mergeById([b], [a])[0].v).toBe(2);
    const dead = { ...b, deleted: true };
    expect(mergeById([b], [dead])[0].deleted).toBe(true);
  });
  it("two fresh phones share default categories instead of duplicating", () => {
    const rows = rowsSince(defaultData(), "1970-01-01T00:00:00.000Z");
    expect(applyRows(defaultData(), rows).categories).toHaveLength(15);
  });
  it("a configured budget is not overwritten by a fresh phone's defaults", () => {
    const configured = defaultData();
    configured.settings = { ...configured.settings, monthlyBudget: 12000, updatedAt: "2026-10-05T00:00:00.000Z" };
    const merged = applyRows(configured, rowsSince(defaultData(), "1970-01-01T00:00:00.000Z"));
    expect(merged.settings.monthlyBudget).toBe(12000);
  });
  it("round-trips rows between two devices", () => {
    const phoneA = fixture();
    exp(phoneA, T, 42);
    const rows = rowsSince(phoneA, "1970-01-01T00:00:00.000Z");
    const phoneB = applyRows(defaultData(), rows);
    expect(phoneB.expenses.some((e) => e.amount === 42)).toBe(true);
    expect(phoneB.categories.length).toBe(phoneA.categories.length);
  });
});

describe("legacy import", () => {
  it("brings v1 data across", () => {
    const legacy = {
      settings: { currency: "AED", monthlyBudget: 5000 },
      categories: [{ id: "c1", name: "Groceries" }, { id: "c2", name: "Fuel" }],
      expenses: [{ id: "x1", date: "2026-10-02", categoryId: "c1", amount: 120.5, note: "weekly" }, { id: "bad", date: "nope", categoryId: "c1", amount: 5 }]
    };
    const out = fromLegacy(legacy)!;
    expect(out.expenses).toHaveLength(1);
    expect(out.categories[0].icon).toBe("cart");
    expect(out.settings.monthlyBudget).toBe(5000);
    expect(parseImport(JSON.stringify(legacy))!.expenses).toHaveLength(1);
    expect(parseImport("{not json")).toBeNull();
  });
});

import { changeOver, currentSavings, lastChange, liveSavings, runwayMonths, targetProgress } from "../src/lib/savings";
import { iconForName, iconFromEmoji } from "../src/lib/iconkeys";
import { normalizeData } from "../src/lib/migrate";
import type { SavingsEntry } from "../src/lib/types";

const sav = (d: AppData, date: string, amount: number, updatedAt = ts): SavingsEntry => {
  const s: SavingsEntry = { id: `s${n++}`, date, amount, by: "p_me", note: "", updatedAt };
  d.savings.push(s);
  return s;
};

describe("savings", () => {
  it("uses the latest snapshot and keeps the later edit when two share a day", () => {
    const d = fixture();
    sav(d, "2026-10-01", 10000, "2026-10-01T08:00:00.000Z");
    sav(d, "2026-10-01", 10500, "2026-10-01T09:00:00.000Z");
    sav(d, "2026-10-10", 12000);
    expect(liveSavings(d)).toHaveLength(2);
    expect(currentSavings(d)!.amount).toBe(12000);
    expect(lastChange(d)).toEqual({ delta: 1500, days: 9 });
  });
  it("measures change over a window only when a snapshot that old exists", () => {
    const d = fixture();
    sav(d, "2026-09-10", 9000);
    sav(d, "2026-10-14", 12000);
    expect(changeOver(d, T, 30)).toBe(3000);
    expect(changeOver(d, T, 90)).toBeNull();
  });
  it("converts savings to months of runway from past spending", () => {
    const d = fixture();
    exp(d, "2026-09-05", 3000);
    exp(d, "2026-08-05", 3000);
    sav(d, T, 15000);
    expect(runwayMonths(d, T)).toBeCloseTo(5, 5);
  });
  it("projects an ETA to the target from recent growth", () => {
    const d = fixture();
    d.settings.savingsTarget = 20000;
    sav(d, "2026-09-15", 10000);
    sav(d, T, 13000); // 30 days, +100/day
    const p = targetProgress(d, T)!;
    expect(p.pct).toBeCloseTo(65, 5);
    expect(p.remaining).toBe(7000);
    expect(p.etaDays).toBe(70);
  });
  it("has no ETA without growth or without a target", () => {
    const d = fixture();
    sav(d, T, 100);
    expect(targetProgress(d, T)).toBeNull();
    d.settings.savingsTarget = 500;
    expect(targetProgress(d, T)!.etaDays).toBeNull();
  });
});

describe("icons and older saves", () => {
  it("maps names and legacy emoji to icon keys", () => {
    expect(iconForName("Talabat deliveries")).toBe("bike");
    expect(iconForName("Zakat")).toBe("gift");
    expect(iconForName("Something odd")).toBe("grid");
    expect(iconFromEmoji("⛽")).toBe("fuel");
  });
  it("fills missing fields on an older save", () => {
    const old = { v: 2, settings: { currency: "AED", monthlyBudget: 100, savingsGoalPct: 10, people: [{ id: "p_me", name: "G", emoji: "🧔" }], updatedAt: ts, id: "settings" }, categories: [{ id: "c", name: "Fuel", emoji: "⛽", color: "#fff", order: 0, updatedAt: ts }], expenses: [] };
    const out = normalizeData(old);
    expect(out.categories[0].icon).toBe("fuel");
    expect(out.savings).toEqual([]);
    expect(out.settings.potName).toBe("Fulus");
    expect((out.settings.people[0] as { emoji?: string }).emoji).toBeUndefined();
  });
});

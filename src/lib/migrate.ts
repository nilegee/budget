import type { AppData } from "./types";
import { DEFAULT_STAMP, PALETTE, defaultCategoryId, defaultData, isDefaultCategoryName } from "./defaults";
import { iconForName, iconFromEmoji } from "./iconkeys";
import { newId, nowIso } from "./ids";

export const LEGACY_KEY = "familyBudgetApp.v1";

/** Import the v1 single-file app's data so nothing already logged is lost. */
export function fromLegacy(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { settings?: { currency?: string; monthlyBudget?: number }; categories?: { id?: string; name?: string }[]; expenses?: { id?: string; date?: string; categoryId?: string; amount?: number; note?: string; createdAt?: string }[] };
  const base = defaultData();
  const t = nowIso();
  const cats = (r.categories ?? []).filter((c) => c && typeof c.name === "string");
  if (!cats.length && !(r.expenses ?? []).length) return null;
  const idMap = new Map<string, string>();
  const categories = cats.map((c, i) => {
    const name = String(c.name).trim();
    // Default-named categories share ids across phones, so Mariem's phone merges instead of duplicating.
    const id = isDefaultCategoryName(name) ? defaultCategoryId(name) : String(c.id ?? newId("cat"));
    idMap.set(String(c.id ?? ""), id);
    return { id,
    name: name || "Untitled",
    icon: iconForName(name),
    color: PALETTE[i % PALETTE.length],
    order: i,
    updatedAt: isDefaultCategoryName(name) ? DEFAULT_STAMP : t };
  });
  const fallback = categories[0]?.id ?? "";
  const expenses = (r.expenses ?? [])
    .filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date)) && Number(e.amount) > 0)
    .map((e) => ({
      id: String(e.id ?? newId("exp")),
      date: String(e.date),
      categoryId: idMap.get(String(e.categoryId)) ?? fallback,
      amount: Math.round(Number(e.amount) * 100) / 100,
      note: String(e.note ?? ""),
      by: "p_me",
      createdAt: e.createdAt ?? t,
      updatedAt: e.createdAt ?? t
    }));
  return normalizeData({
    ...base,
    settings: {
      ...base.settings,
      currency: r.settings?.currency || base.settings.currency,
      monthlyBudget: Number(r.settings?.monthlyBudget) >= 0 ? Number(r.settings?.monthlyBudget) : base.settings.monthlyBudget
    },
    categories: categories.length ? categories : base.categories,
    expenses
  });
}

/** Fills anything an older save is missing so the rest of the app can rely on the shape. */
export function normalizeData(input: any): AppData {
  const base = defaultData();
  const settings = { ...base.settings, ...(input.settings ?? {}) };
  settings.people = (settings.people?.length ? settings.people : base.settings.people).map((p: any) => ({ id: p.id, name: p.name }));
  return {
    v: 2,
    settings,
    categories: (input.categories ?? []).map((c: any) => ({ ...c, icon: c.icon ?? iconFromEmoji(c.emoji) ?? iconForName(c.name ?? "") })),
    expenses: input.expenses ?? [],
    checkins: input.checkins ?? [],
    savings: input.savings ?? []
  };
}

/** Accepts v2 exports and v1 exports. */
export function parseImport(text: string): AppData | null {
  try {
    const json = JSON.parse(text);
    if (json && json.v === 2 && json.settings && Array.isArray(json.categories) && Array.isArray(json.expenses)) return normalizeData(json);
    return fromLegacy(json);
  } catch {
    return null;
  }
}

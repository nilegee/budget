import type { AppData, Category } from "./types";
import { iconForName } from "./iconkeys";

/** Vivid, distinguishable on both light and dark. */
export const PALETTE = [
  "#7c5cff", "#ff8a3d", "#17c3a8", "#ff5c8a", "#3d8bff",
  "#b44cff", "#12b5d6", "#f5b81c", "#e83e9a", "#5b5bf0",
  "#7ccc2f", "#ff6a3a", "#1f9bff", "#a855f7", "#64748b"
];

const DEFAULT_CATEGORIES: string[] = [
  "Food Deliveries", "Restaurant", "Groceries", "Transport", "Fuel", "Utilities", "Rent", "School",
  "Healthcare", "Entertainment", "Shopping", "Subscriptions", "Travel", "Gifts", "Other"
];

/**
 * Defaults use fixed ids and an old timestamp on purpose: two phones that both start from the
 * defaults then agree on every record, and any real edit (newer timestamp) always wins a sync.
 */
export const DEFAULT_STAMP = "2026-01-01T00:00:00.000Z";
export const defaultCategoryId = (name: string) => `cat_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
export const isDefaultCategoryName = (name: string) => DEFAULT_CATEGORIES.some((n) => n.toLowerCase() === name.trim().toLowerCase());

export function defaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((name, i) => ({
    id: defaultCategoryId(name), name, icon: iconForName(name), color: PALETTE[i % PALETTE.length], order: i, updatedAt: DEFAULT_STAMP
  }));
}

export function defaultData(): AppData {
  const t = DEFAULT_STAMP;
  return {
    v: 2,
    settings: {
      id: "settings",
      currency: "AED",
      monthlyBudget: 9000,
      savingsGoalPct: 10,
      potName: "Fulus",
      savingsTarget: 0,
      savingsTargetLabel: "",
      people: [
        { id: "p_me", name: "Ghassan" },
        { id: "p_mariem", name: "Mariem" }
      ],
      updatedAt: t
    },
    categories: defaultCategories(),
    expenses: [],
    checkins: [],
    savings: []
  };
}

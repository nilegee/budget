import type { AppData, Syncable } from "./types";

/** Last-write-wins per record. Tombstones win ties so deletes stick. */
export function mergeById<T extends Syncable>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of local) map.set(r.id, r);
  for (const r of remote) {
    const cur = map.get(r.id);
    if (!cur || r.updatedAt > cur.updatedAt || (r.updatedAt === cur.updatedAt && r.deleted && !cur.deleted)) map.set(r.id, r);
  }
  return [...map.values()];
}

export type RecordKind = "settings" | "category" | "expense" | "checkin" | "saving";
export interface Row { kind: RecordKind; id: string; data: unknown; updated_at: string; synced_at?: string }

export function applyRows(data: AppData, rows: Row[]): AppData {
  const by = { category: [] as AppData["categories"], expense: [] as AppData["expenses"], checkin: [] as AppData["checkins"], saving: [] as AppData["savings"] };
  let settings = data.settings;
  for (const row of rows) {
    if (row.kind === "settings") {
      const s = row.data as AppData["settings"];
      if (s.updatedAt > settings.updatedAt) settings = s;
    } else if (row.kind === "category") by.category.push(row.data as AppData["categories"][number]);
    else if (row.kind === "expense") by.expense.push(row.data as AppData["expenses"][number]);
    else if (row.kind === "checkin") by.checkin.push(row.data as AppData["checkins"][number]);
    else if (row.kind === "saving") by.saving.push(row.data as AppData["savings"][number]);
  }
  return {
    ...data,
    settings,
    categories: mergeById(data.categories, by.category),
    expenses: mergeById(data.expenses, by.expense),
    checkins: mergeById(data.checkins, by.checkin),
    savings: mergeById(data.savings, by.saving)
  };
}

/** Everything newer than `since`, as rows ready to upload. */
export function rowsSince(data: AppData, since: string): Row[] {
  const rows: Row[] = [];
  if (data.settings.updatedAt > since) rows.push({ kind: "settings", id: data.settings.id, data: data.settings, updated_at: data.settings.updatedAt });
  for (const c of data.categories) if (c.updatedAt > since) rows.push({ kind: "category", id: c.id, data: c, updated_at: c.updatedAt });
  for (const e of data.expenses) if (e.updatedAt > since) rows.push({ kind: "expense", id: e.id, data: e, updated_at: e.updatedAt });
  for (const k of data.checkins) if (k.updatedAt > since) rows.push({ kind: "checkin", id: k.id, data: k, updated_at: k.updatedAt });
  for (const v of data.savings) if (v.updatedAt > since) rows.push({ kind: "saving", id: v.id, data: v, updated_at: v.updatedAt });
  return rows;
}

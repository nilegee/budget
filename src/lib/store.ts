import { signal } from "@preact/signals";
import type { AccentKey, AppData, Category, CheckIn, DayKey, DeviceState, Expense, Id, Person, SavingsEntry, Settings } from "./types";
import { defaultData } from "./defaults";
import { LEGACY_KEY, fromLegacy, normalizeData, parseImport } from "./migrate";
import { dayKey } from "./dates";
import { newId, nowIso } from "./ids";
import { roundMoney } from "./money";
import { PALETTE } from "./defaults";
import { iconForName } from "./iconkeys";

const KEY = "fb.v2";
const DEVICE_KEY = "fb.device";
const EPOCH = "1970-01-01T00:00:00.000Z";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app still works in memory */
  }
}

function loadData(): AppData {
  const saved = read<AppData>(KEY);
  if (saved && saved.v === 2) return normalizeData(saved);
  const legacy = fromLegacy(read(LEGACY_KEY));
  return legacy ?? defaultData();
}

function loadDevice(): DeviceState {
  const saved = read<Partial<DeviceState>>(DEVICE_KEY) ?? {};
  return {
    me: saved.me ?? "p_me",
    onboarded: saved.onboarded ?? false,
    accent: saved.accent ?? "ocean",
    lastOpen: saved.lastOpen ?? null,
    sync: saved.sync ?? null,
    celebrated: saved.celebrated ?? [],
    syncSince: saved.syncSince ?? EPOCH,
    lastPushed: saved.lastPushed ?? EPOCH
  };
}

export const data = signal<AppData>(loadData());
export const device = signal<DeviceState>(loadDevice());
export const today = signal<DayKey>(dayKey());

/** The visit before this one, captured once so the UI can say "welcome back". */
export const previousVisit = device.value.lastOpen;
write(DEVICE_KEY, { ...device.value, lastOpen: nowIso() });

const mutateHooks = new Set<() => void>();
export const onMutate = (fn: () => void) => (mutateHooks.add(fn), () => mutateHooks.delete(fn));

function commit(next: AppData, notify = true) {
  data.value = next;
  write(KEY, next);
  if (notify) mutateHooks.forEach((fn) => fn());
}

export function setDevice(patch: Partial<DeviceState>) {
  device.value = { ...device.value, ...patch };
  write(DEVICE_KEY, device.value);
}

/** Used by sync: store merged remote data without echoing it back as a local edit. */
export const replaceData = (next: AppData) => commit(next, false);

export function refreshToday() {
  const t = dayKey();
  if (t !== today.value) today.value = t;
}

/* ---------- actions ---------- */

export interface ExpenseInput { date: DayKey; categoryId: Id; amount: number; note?: string; by?: Id }

export function addExpense(input: ExpenseInput): Expense {
  const t = nowIso();
  const expense: Expense = {
    id: newId("exp"),
    date: input.date,
    categoryId: input.categoryId,
    amount: roundMoney(input.amount),
    note: (input.note ?? "").trim(),
    by: input.by ?? device.value.me,
    createdAt: t,
    updatedAt: t
  };
  commit({ ...data.value, expenses: [...data.value.expenses, expense] });
  return expense;
}

export function updateExpense(id: Id, patch: Partial<ExpenseInput>) {
  const t = nowIso();
  commit({
    ...data.value,
    expenses: data.value.expenses.map((e) =>
      e.id === id ? { ...e, ...patch, amount: patch.amount !== undefined ? roundMoney(patch.amount) : e.amount, note: patch.note !== undefined ? patch.note.trim() : e.note, updatedAt: t } : e
    )
  });
}

export function deleteExpense(id: Id) {
  const t = nowIso();
  commit({ ...data.value, expenses: data.value.expenses.map((e) => (e.id === id ? { ...e, deleted: true, updatedAt: t } : e)) });
}

export function restoreExpense(id: Id) {
  const t = nowIso();
  commit({ ...data.value, expenses: data.value.expenses.map((e) => (e.id === id ? { ...e, deleted: false, updatedAt: t } : e)) });
}

export function markNoSpend(date: DayKey = today.value, by: Id = device.value.me) {
  const id = `${date}:${by}`;
  const t = nowIso();
  const entry: CheckIn = { id, date, by, kind: "nospend", updatedAt: t };
  const rest = data.value.checkins.filter((c) => c.id !== id);
  commit({ ...data.value, checkins: [...rest, entry] });
}

export function undoNoSpend(date: DayKey = today.value, by: Id = device.value.me) {
  const id = `${date}:${by}`;
  const t = nowIso();
  commit({ ...data.value, checkins: data.value.checkins.map((c) => (c.id === id ? { ...c, deleted: true, updatedAt: t } : c)) });
}

export function saveCategory(input: { id?: Id; name: string; icon?: string; color?: string }) {
  const t = nowIso();
  const name = input.name.trim();
  if (!name) return;
  if (input.id) {
    commit({
      ...data.value,
      categories: data.value.categories.map((c) =>
        c.id === input.id ? { ...c, name, icon: input.icon ?? c.icon, color: input.color ?? c.color, updatedAt: t } : c
      )
    });
  } else {
    const live = data.value.categories.filter((c) => !c.deleted);
    const category: Category = {
      id: newId("cat"),
      name,
      icon: input.icon || iconForName(name),
      color: input.color || PALETTE[live.length % PALETTE.length],
      order: live.length,
      updatedAt: t
    };
    commit({ ...data.value, categories: [...data.value.categories, category] });
  }
}

export function deleteCategory(id: Id) {
  const live = data.value.categories.filter((c) => !c.deleted);
  if (live.length <= 1) return false;
  const t = nowIso();
  commit({ ...data.value, categories: data.value.categories.map((c) => (c.id === id ? { ...c, deleted: true, updatedAt: t } : c)) });
  return true;
}

export function updateSettings(patch: Partial<Omit<Settings, "id" | "updatedAt">>) {
  commit({ ...data.value, settings: { ...data.value.settings, ...patch, updatedAt: nowIso() } });
}

export function updatePerson(id: Id, patch: Partial<Person>) {
  updateSettings({ people: data.value.settings.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}

export function setAccent(accent: AccentKey) {
  setDevice({ accent });
}

/* ---------- savings snapshots ---------- */

export function addSavings(input: { date: DayKey; amount: number; note?: string }): SavingsEntry {
  const t = nowIso();
  const entry: SavingsEntry = { id: newId("sav"), date: input.date, amount: roundMoney(input.amount), note: (input.note ?? "").trim(), by: device.value.me, updatedAt: t };
  commit({ ...data.value, savings: [...data.value.savings, entry] });
  return entry;
}

export function updateSavings(id: Id, patch: Partial<Pick<SavingsEntry, "date" | "amount" | "note">>) {
  const t = nowIso();
  commit({ ...data.value, savings: data.value.savings.map((s) => (s.id === id ? { ...s, ...patch, amount: patch.amount !== undefined ? roundMoney(patch.amount) : s.amount, updatedAt: t } : s)) });
}

export function deleteSavings(id: Id) {
  const t = nowIso();
  commit({ ...data.value, savings: data.value.savings.map((s) => (s.id === id ? { ...s, deleted: true, updatedAt: t } : s)) });
}

export function restoreSavings(id: Id) {
  const t = nowIso();
  commit({ ...data.value, savings: data.value.savings.map((s) => (s.id === id ? { ...s, deleted: false, updatedAt: t } : s)) });
}

export function exportJson(): string {
  return JSON.stringify(data.value, null, 2);
}

export function importJson(text: string): boolean {
  const parsed = parseImport(text);
  if (!parsed) return false;
  commit(parsed);
  return true;
}

export function resetAll() {
  commit(defaultData());
}

export function recentCategoryIds(limit = 6): Id[] {
  const counts = new Map<Id, number>();
  const cutoff = Date.now() - 90 * 86_400_000;
  for (const e of data.value.expenses) {
    if (e.deleted || new Date(e.createdAt).getTime() < cutoff) continue;
    counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}

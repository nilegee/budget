export type Id = string;
/** Local calendar day, YYYY-MM-DD. */
export type DayKey = string;
/** Local month, YYYY-MM. */
export type MonthKey = string;

export interface Syncable {
  id: Id;
  updatedAt: string; // ISO timestamp, last-write-wins
  deleted?: boolean; // tombstone so deletes sync too
}

export interface Category extends Syncable {
  name: string;
  /** Key into the custom icon set (see components/Icon.tsx). */
  icon: string;
  /** Legacy field from the emoji era; only read to pick an icon for old data. */
  emoji?: string;
  color: string;
  order: number;
  hidden?: boolean;
}

export interface Expense extends Syncable {
  date: DayKey;
  categoryId: Id;
  amount: number;
  note: string;
  by: Id; // person id
  createdAt: string;
}

/** A day someone told the app "I looked, this is where we are". Id is `${date}:${by}`. */
export interface CheckIn extends Syncable {
  date: DayKey;
  by: Id;
  kind: "nospend" | "expense";
}

export interface Person {
  id: Id;
  name: string;
}

export type AccentKey = "sunset" | "ocean" | "orchid" | "mint" | "gold";

/** A snapshot of the family's total savings on a given day. */
export interface SavingsEntry extends Syncable {
  date: DayKey;
  amount: number;
  by: Id;
  note: string;
}

export interface Settings extends Syncable {
  currency: string;
  monthlyBudget: number;
  /** Share of the budget the family wants to keep, 0–50. */
  savingsGoalPct: number;
  /** The mascot's name. */
  potName: string;
  /** Savings target in currency units, 0 = none. */
  savingsTarget: number;
  savingsTargetLabel: string;
  people: Person[];
}

export interface AppData {
  v: 2;
  settings: Settings;
  categories: Category[];
  expenses: Expense[];
  checkins: CheckIn[];
  savings: SavingsEntry[];
}

/** Per-device state that must NOT sync. */
export interface DeviceState {
  me: Id;
  /** Has this phone been through the welcome screen? */
  onboarded: boolean;
  /** Appearance is personal to each phone and never syncs. */
  accent: AccentKey;
  lastOpen: string | null; // ISO of the previous visit, before this one
  sync: SyncConfig | null;
  celebrated: string[]; // badge/win keys we've already celebrated here
  syncSince: string; // newest server stamp we've pulled
  lastPushed: string; // newest updatedAt we've pushed
}

export interface SyncConfig {
  url: string;
  anonKey: string;
  householdKey: string;
}

export type Mood = "glowing" | "content" | "uneasy" | "stressed" | "sleepy" | "sad";

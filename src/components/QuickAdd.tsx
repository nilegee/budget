import { signal } from "@preact/signals";
import { useState } from "preact/hooks";
import { data, device, recentCategoryIds, setDevice, today, updateExpense } from "../lib/store";
import { liveCategories } from "../lib/stats";
import { addDays, dayKey } from "../lib/dates";
import { logExpense, removeExpense } from "../actions";
import { Sheet } from "./ui";
import { Avatar, Icon } from "./Icon";
import { accentFor, accentOf } from "../lib/theme";
import { sfxClick } from "../lib/sound";

type SheetState = { mode: "add" } | { mode: "edit"; id: string } | null;
export const sheet = signal<SheetState>(null);
export const openAdd = () => (sheet.value = { mode: "add" });
export const openEdit = (id: string) => (sheet.value = { mode: "edit", id });
const close = () => (sheet.value = null);

export function QuickAddHost() {
  const s = sheet.value;
  if (!s) return null;
  return <QuickAdd key={s.mode === "edit" ? s.id : "new"} state={s} />;
}

function QuickAdd({ state }: { state: NonNullable<SheetState> }) {
  const d = data.value;
  const editing = state.mode === "edit" ? d.expenses.find((e) => e.id === state.id) : undefined;
  const cats = liveCategories(d);
  const recent = recentCategoryIds(8);
  const ordered = [...recent.map((id) => cats.find((c) => c.id === id)).filter((c) => !!c), ...cats.filter((c) => !recent.includes(c.id))] as typeof cats;

  const [amt, setAmt] = useState(editing ? String(editing.amount) : "");
  const [catId, setCatId] = useState(editing?.categoryId ?? ordered[0]?.id ?? "");
  const [date, setDate] = useState(editing?.date ?? today.value);
  const [note, setNote] = useState(editing?.note ?? "");
  const [showNote, setShowNote] = useState(!!editing?.note);
  const [by, setBy] = useState(editing?.by ?? device.value.me);

  const press = (k: string) => {
    sfxClick();
    navigator.vibrate?.(8);
    if (k === "back") return setAmt((a) => a.slice(0, -1));
    if (k === ".") return setAmt((a) => (a.includes(".") ? a : (a || "0") + "."));
    setAmt((a) => {
      const next = a === "0" ? k : a + k;
      const [i, f = ""] = next.split(".");
      return i.length > 7 || f.length > 2 ? a : next;
    });
  };

  const addPreset = (delta: number) => {
    sfxClick();
    navigator.vibrate?.(10);
    const curr = Number(amt) || 0;
    setAmt(String(curr + delta));
  };

  const value = Number(amt) || 0;
  const people = d.settings.people;
  const nextPerson = () => {
    navigator.vibrate?.(6);
    const i = people.findIndex((p) => p.id === by);
    setBy(people[(i + 1) % people.length].id);
  };
  const me = people.find((p) => p.id === by) ?? people[0];
  const yesterday = addDays(dayKey(), -1);

  const save = () => {
    if (value <= 0 || !catId) return;
    if (editing) {
      updateExpense(editing.id, { amount: value, categoryId: catId, date, note, by });
    } else {
      logExpense({ amount: value, categoryId: catId, date, note, by });
      setDevice({ me: by });
    }
    close();
  };

  return (
    <Sheet onClose={close} label={editing ? "Edit expense" : "Add expense"}>
      {/* Sleek tactile amount hero */}
      <div class="amount-display">
        <small class="amount-subtitle">{editing ? "Edit amount" : "Enter amount"}</small>
        <div class="amount-value-row">
          <span class="currency-tag">{d.settings.currency}</span>
          <b class={`amount-digits ${amt ? "" : "empty"}`}>
            {amt || "0"}
          </b>
        </div>
      </div>

      {/* Fast quick-increment chips */}
      <div class="quick-preset-row">
        {[5, 10, 20, 50, 100].map((inc) => (
          <button type="button" class="preset-pill" onClick={() => addPreset(inc)}>
            +{inc}
          </button>
        ))}
        {amt && (
          <button type="button" class="preset-pill clear-pill" onClick={() => setAmt("")}>
            Clear
          </button>
        )}
      </div>

      {/* Tactile Category Pill Grid with glow reflection */}
      <div class="cat-grid" role="radiogroup" aria-label="Category">
        {ordered.map((c) => (
          <button
            type="button"
            role="radio"
            aria-checked={c.id === catId}
            class="cat-tile"
            data-on={c.id === catId}
            style={{ "--cat": c.color }}
            onClick={() => {
              navigator.vibrate?.(6);
              setCatId(c.id);
            }}
          >
            <i class="cat-icon-wrap" aria-hidden="true"><Icon name={c.icon} size={26} /></i>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Meta context actions */}
      <div class="sheet-meta">
        <button type="button" class="pill" data-on={date === today.value} onClick={() => setDate(today.value)}>
          Today
        </button>
        <button type="button" class="pill" data-on={date === yesterday} onClick={() => setDate(yesterday)}>
          Yesterday
        </button>
        <label class="pill" data-on={date !== today.value && date !== yesterday} style={{ position: "relative" }}>
          <Icon name="calendar" size={18} /> {date !== today.value && date !== yesterday ? date.slice(5) : "Pick"}
          <input
            type="date"
            value={date}
            max={dayKey()}
            onInput={(e) => setDate((e.target as HTMLInputElement).value || today.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, width: "100%" }}
            aria-label="Pick a date"
          />
        </label>
        <button type="button" class="pill pill-user" onClick={nextPerson} aria-label={`Paid by ${me.name}. Tap to change`}>
          <Avatar
            name={me.name}
            from={accentOf(accentFor(me.id, device.value.me, device.value.accent)).from}
            to={accentOf(accentFor(me.id, device.value.me, device.value.accent)).to}
            size={22}
          />
          <span>{me.name}</span>
        </button>
        <button type="button" class={`pill ${showNote ? "active-note" : ""}`} onClick={() => setShowNote((v) => !v)}>
          <Icon name="note" size={18} /> Note
        </button>
      </div>

      {showNote && (
        <input
          class="note-input"
          placeholder="What was it for?"
          value={note}
          onInput={(e) => setNote((e.target as HTMLInputElement).value)}
          maxLength={80}
          autoFocus
        />
      )}

      {/* Tactile Keypad */}
      <div class="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((k) => (
          <button type="button" class="key" onClick={() => press(k)}>
            {k}
          </button>
        ))}
        <button type="button" class="key key-back" onClick={() => press("back")} aria-label="Delete last digit">
          <Icon name="back" size={26} style={{ margin: "auto" }} />
        </button>
      </div>

      {/* Submission Bar */}
      <div class="sheet-action-row" style={{ display: "grid", gridTemplateColumns: editing ? "1fr 2fr" : "1fr", gap: 10 }}>
        {editing && (
          <button type="button" class="btn btn-danger" onClick={() => { removeExpense(editing.id); close(); }}>
            Delete
          </button>
        )}
        <button
          type="button"
          class="btn btn-primary btn-block btn-save-action"
          disabled={value <= 0 || !catId}
          onClick={save}
        >
          {editing ? "Save changes" : "Save expense"}
        </button>
      </div>
    </Sheet>
  );
}

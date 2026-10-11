import { signal } from "@preact/signals";
import { useState } from "preact/hooks";
import { addSavings, data, deleteSavings, restoreSavings, today, updateSavings, updateSettings } from "../lib/store";
import { Sheet, celebrate, showToast } from "./ui";
import { money } from "../lib/fmt";
import { currentSavings } from "../lib/savings";
import { dayKey } from "../lib/dates";

type S = { mode: "update" } | { mode: "edit"; id: string } | { mode: "target" } | null;
export const savingsSheet = signal<S>(null);
const close = () => (savingsSheet.value = null);

export function SavingsSheetHost() {
  const s = savingsSheet.value;
  if (!s) return null;
  return s.mode === "target" ? <TargetForm /> : <BalanceForm key={s.mode === "edit" ? s.id : "new"} editId={s.mode === "edit" ? s.id : undefined} />;
}

const num = (v: string) => Number(v.replace(/,/g, "")) || 0;

function BalanceForm({ editId }: { editId?: string }) {
  const d = data.value;
  const existing = editId ? d.savings.find((s) => s.id === editId) : undefined;
  const last = currentSavings(d);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : last ? String(last.amount) : "");
  const [date, setDate] = useState(existing?.date ?? today.value);
  const [note, setNote] = useState(existing?.note ?? "");
  const value = num(amount);

  const save = () => {
    if (!(value >= 0) || amount.trim() === "") return;
    if (existing) {
      updateSavings(existing.id, { amount: value, date, note });
    } else {
      const before = last?.amount ?? 0;
      addSavings({ amount: value, date, note });
      const target = d.settings.savingsTarget;
      if (last && value > before) {
        showToast(`Savings up ${money(value - before)}`);
        if (target > 0 && before < target && value >= target) celebrate(60);
        else if (value - before >= 500) celebrate(24);
      } else showToast("Savings updated");
    }
    close();
  };

  return (
    <Sheet onClose={close} label={existing ? "Edit savings entry" : "Update savings"}>
      <div class="form-grid" style={{ paddingBottom: 6 }}>
        <div class="section-head"><h2>{existing ? "Edit entry" : "Update our savings"}</h2></div>
        <div class="field">
          <label for="sv-a">Total saved today</label>
          <input id="sv-a" class="input num" style={{ fontSize: "1.5rem", minHeight: 58 }} inputMode="decimal" value={amount} placeholder="0" onInput={(e) => setAmount((e.target as HTMLInputElement).value)} autoFocus />
          <small>The whole amount, not what you added. Update it any time and the history builds itself.</small>
        </div>
        <div class="field"><label for="sv-d">Date</label><input id="sv-d" class="input" type="date" value={date} max={dayKey()} onInput={(e) => setDate((e.target as HTMLInputElement).value || today.value)} /></div>
        <div class="field"><label for="sv-n">Note</label><input id="sv-n" class="input" value={note} maxLength={60} placeholder="Optional, e.g. Bonus added" onInput={(e) => setNote((e.target as HTMLInputElement).value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: existing ? "1fr 2fr" : "1fr", gap: 10 }}>
          {existing && <button type="button" class="btn btn-danger" onClick={() => { deleteSavings(existing.id); showToast("Entry deleted", { label: "Undo", run: () => restoreSavings(existing.id) }); close(); }}>Delete</button>}
          <button type="button" class="btn btn-primary" disabled={amount.trim() === ""} onClick={save}>{existing ? "Save changes" : "Save"}</button>
        </div>
      </div>
    </Sheet>
  );
}

function TargetForm() {
  const d = data.value;
  const [target, setTarget] = useState(d.settings.savingsTarget ? String(d.settings.savingsTarget) : "");
  const [label, setLabel] = useState(d.settings.savingsTargetLabel);
  return (
    <Sheet onClose={close} label="Savings target">
      <div class="form-grid" style={{ paddingBottom: 6 }}>
        <div class="section-head"><h2>What are we saving for?</h2></div>
        <div class="field"><label for="tg-l">Goal</label><input id="tg-l" class="input" value={label} maxLength={32} placeholder="e.g. House deposit, Summer trip" onInput={(e) => setLabel((e.target as HTMLInputElement).value)} /></div>
        <div class="field"><label for="tg-a">Target amount</label><input id="tg-a" class="input num" inputMode="decimal" value={target} placeholder="0" onInput={(e) => setTarget((e.target as HTMLInputElement).value)} /><small>Leave empty to remove the target.</small></div>
        <button type="button" class="btn btn-primary" onClick={() => { updateSettings({ savingsTarget: num(target), savingsTargetLabel: label.trim() }); close(); }}>Save goal</button>
      </div>
    </Sheet>
  );
}

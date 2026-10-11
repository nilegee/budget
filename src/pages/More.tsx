import { signal } from "@preact/signals";
import { useState } from "preact/hooks";
import { data, deleteCategory, device, exportJson, importJson, resetAll, saveCategory, setAccent, setDevice, updatePerson, updateSettings } from "../lib/store";
import { ACCENTS, accentFor, accentOf, applyAccent } from "../lib/theme";
import { CATEGORY_ICONS } from "../lib/iconkeys";
import { Avatar, Icon } from "../components/Icon";
import { liveCategories } from "../lib/stats";
import { PALETTE } from "../lib/defaults";
import { connectSync, disconnectSync, syncMessage, syncNow, syncStatus } from "../lib/sync";
import { CatBadge, Sheet, showToast } from "../components/ui";

const editing = signal<{ id?: string } | null>(null);

export function More() {
  const d = data.value;
  const cats = liveCategories(d);
  const dev = device.value;
  return (
    <div class="page">
      <header class="topbar"><div class="topbar-text"><h1>More</h1><p>Settings, categories and sharing</p></div></header>

      <section class="settings-block" aria-labelledby="hh">
        <div class="section-head"><h2 id="hh">Budget</h2></div>
        <div class="form-grid">
          <NumberField label="Monthly budget" value={d.settings.monthlyBudget} suffix={d.settings.currency} onSave={(v) => updateSettings({ monthlyBudget: v })} />
          <NumberField label="Savings goal" hint="Share of the budget you'd like to keep each month" value={d.settings.savingsGoalPct} suffix="%" max={50} onSave={(v) => updateSettings({ savingsGoalPct: v })} />
          <NumberField label="Savings target" hint="Optional. Shows progress on the Savings tab" value={d.settings.savingsTarget} suffix={d.settings.currency} onSave={(v) => updateSettings({ savingsTarget: v })} />
          <div class="field">
            <label for="cur">Currency</label>
            <input id="cur" class="input" value={d.settings.currency} maxLength={4} onChange={(e) => updateSettings({ currency: (e.target as HTMLInputElement).value.trim().toUpperCase() || "AED" })} />
          </div>
        </div>
      </section>

      <section class="settings-block" aria-labelledby="pp">
        <div class="section-head"><h2 id="pp">Who's using this phone</h2></div>
        {d.settings.people.map((p) => {
          const ac = accentOf(accentFor(p.id, dev.me, dev.accent));
          return (
            <div key={p.id} style={{ gridTemplateColumns: "48px 1fr auto", alignItems: "center", display: "grid", gap: 10 }}>
              <Avatar name={p.name} from={ac.from} to={ac.to} size={44} />
              <input class="input" value={p.name} aria-label="Name" onChange={(e) => updatePerson(p.id, { name: (e.target as HTMLInputElement).value.trim() || p.name })} />
              <button type="button" class="pill" data-on={dev.me === p.id} onClick={() => setDevice({ me: p.id })}>{dev.me === p.id ? "This phone" : "Use"}</button>
            </div>
          );
        })}
        <div class="field">
          <label>Your colour on this phone</label>
          <div class="swatches">
            {ACCENTS.map((a) => (
              <button type="button" key={a.key} class="swatch" aria-label={a.label} aria-pressed={dev.accent === a.key} style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }} onClick={() => { setAccent(a.key); applyAccent(a.key); }} />
            ))}
          </div>
        </div>
        <div class="field">
          <label for="pn">Name of our pot</label>
          <input id="pn" class="input" value={d.settings.potName} maxLength={16} onChange={(e) => updateSettings({ potName: (e.target as HTMLInputElement).value.trim() || "Fulus" })} />
        </div>
      </section>

      <section aria-labelledby="cc">
        <div class="section-head">
          <h2 id="cc">Categories</h2>
          <button type="button" class="link" onClick={() => (editing.value = {})}>Add</button>
        </div>
        <div class="list">
          {cats.map((c, i) => (
            <button type="button" class="row" style={{ "--i": i, "--cat": c.color, minHeight: 56 }} key={c.id} onClick={() => (editing.value = { id: c.id })}>
              <CatBadge c={c} /><span class="row-title">{c.name}</span><span class="muted">Edit</span>
            </button>
          ))}
        </div>
      </section>

      <SyncSection />

      <section class="settings-block" aria-labelledby="dd">
        <div class="section-head"><h2 id="dd">Your data</h2></div>
        <div class="chip-row">
          <button type="button" class="btn btn-soft" onClick={doExport}>Export backup</button>
          <label class="btn btn-soft" style={{ cursor: "pointer" }}>
            Import backup
            <input type="file" accept="application/json,.json" class="sr" onChange={doImport} />
          </label>
          <button type="button" class="btn btn-danger" onClick={() => { if (confirm("Delete everything on this phone? Export a backup first.")) { resetAll(); showToast("Reset to a fresh start"); } }}>Reset</button>
        </div>
        <p class="muted" style={{ fontSize: ".85rem" }}>Everything is stored on this phone{dev.sync ? " and shared with your household through your sync project" : ""}. Backups are plain JSON you can keep.</p>
      </section>

      {editing.value && <CategoryEditor id={editing.value.id} />}
    </div>
  );
}

function NumberField({ label, value, suffix, hint, max, onSave }: { label: string; value: number; suffix: string; hint?: string; max?: number; onSave: (n: number) => void }) {
  const id = `f-${label.replace(/\W/g, "")}`;
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
        <input id={id} class="input num" type="number" inputMode="decimal" min={0} max={max} value={value} onChange={(e) => { const n = Math.max(0, Math.min(max ?? 1e9, Number((e.target as HTMLInputElement).value) || 0)); onSave(n); }} />
        <span class="muted" style={{ fontWeight: 700 }}>{suffix}</span>
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function doExport() {
  const blob = new Blob([exportJson()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `family-budget-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function doImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const ok = importJson(await file.text());
  showToast(ok ? "Backup imported" : "That file isn't a budget backup");
  input.value = "";
}

function SyncSection() {
  const dev = device.value;
  const [url, setUrl] = useState(dev.sync?.url ?? "");
  const [anon, setAnon] = useState(dev.sync?.anonKey ?? "");
  const [key, setKey] = useState(dev.sync?.householdKey ?? "");
  const status = syncStatus.value;
  const genKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    setKey(Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join(""));
  };
  return (
    <section class="settings-block" aria-labelledby="ss">
      <div class="section-head"><h2 id="ss">Share with Mariem</h2><span class="muted" style={{ fontSize: ".85rem" }}>{status === "off" ? "Not connected" : syncMessage.value || status}</span></div>
      {dev.sync ? (
        <div class="chip-row">
          <button type="button" class="btn btn-soft" onClick={() => void syncNow()}>Sync now</button>
          <button type="button" class="btn btn-danger" onClick={disconnectSync}>Disconnect</button>
        </div>
      ) : (
        <p class="muted" style={{ fontSize: ".9rem" }}>Both phones need the same project details and household key. Setup steps are in the README.</p>
      )}
      <div class="form-grid">
        <div class="field"><label for="su">Project URL</label><input id="su" class="input" inputMode="url" placeholder="https://xxxx.supabase.co" value={url} onInput={(e) => setUrl((e.target as HTMLInputElement).value)} /></div>
        <div class="field"><label for="sa">Public (anon) key</label><input id="sa" class="input" value={anon} onInput={(e) => setAnon((e.target as HTMLInputElement).value)} autoCapitalize="off" autoCorrect="off" /></div>
        <div class="field">
          <label for="sk">Household key</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input id="sk" class="input" value={key} onInput={(e) => setKey((e.target as HTMLInputElement).value)} autoCapitalize="off" autoCorrect="off" />
            <button type="button" class="btn btn-soft" onClick={genKey}>Generate</button>
          </div>
          <small>Acts like a shared password. Use the same one on both phones and keep it private.</small>
        </div>
        <button type="button" class="btn btn-primary" disabled={!url.trim() || !anon.trim() || key.trim().length < 12} onClick={() => connectSync({ url: url.trim(), anonKey: anon.trim(), householdKey: key.trim() })}>
          {dev.sync ? "Update connection" : "Connect"}
        </button>
      </div>
    </section>
  );
}

function CategoryEditor({ id }: { id?: string }) {
  const d = data.value;
  const existing = id ? d.categories.find((c) => c.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState(existing?.icon ?? "grid");
  const [color, setColor] = useState(existing?.color ?? PALETTE[liveCategories(d).length % PALETTE.length]);
  const close = () => (editing.value = null);
  return (
    <Sheet onClose={close} label={existing ? "Edit category" : "New category"}>
      <div class="form-grid" style={{ overflowY: "auto", paddingBottom: 8 }}>
        <div class="section-head"><h2>{existing ? "Edit category" : "New category"}</h2></div>
        <div class="field"><label for="cn">Name</label><input id="cn" class="input" value={name} maxLength={24} onInput={(e) => setName((e.target as HTMLInputElement).value)} autoFocus={!existing} /></div>
        <div class="field">
          <label>Icon</label>
          <div class="chip-row">
            {CATEGORY_ICONS.map((n) => <button type="button" class="pill" data-on={icon === n} key={n} onClick={() => setIcon(n)} aria-label={`Icon ${n}`}><Icon name={n} size={22} /></button>)}
          </div>
        </div>
        <div class="field">
          <label>Colour</label>
          <div class="chip-row">
            {PALETTE.map((c) => (
              <button type="button" key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c} style={{ width: 40, height: 40, borderRadius: 14, background: c, outline: color === c ? "3px solid var(--text)" : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: existing ? "1fr 2fr" : "1fr", gap: 10 }}>
          {existing && <button type="button" class="btn btn-danger" onClick={() => { if (deleteCategory(existing.id)) { showToast("Category removed. Past expenses keep their data."); close(); } else showToast("Keep at least one category"); }}>Remove</button>}
          <button type="button" class="btn btn-primary" disabled={!name.trim()} onClick={() => { saveCategory({ id: existing?.id, name, icon, color }); close(); }}>Save</button>
        </div>
      </div>
    </Sheet>
  );
}

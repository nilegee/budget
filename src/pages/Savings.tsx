import { data, today } from "../lib/store";
import { currentSavings, lastChange, liveSavings, runwayMonths, targetProgress } from "../lib/savings";
import { money } from "../lib/fmt";
import { dayLabel } from "../lib/dates";
import { Count } from "../components/ui";
import { Icon } from "../components/Icon";
import { LineChart } from "../components/Chart";
import { savingsSheet } from "../components/SavingsSheet";

export function Savings() {
  const d = data.value;
  const now = currentSavings(d);
  const list = liveSavings(d);
  const gain = lastChange(d);
  const runway = runwayMonths(d, today.value);
  const tp = targetProgress(d, today.value);
  const name = (id: string) => d.settings.people.find((p) => p.id === id)?.name ?? "";
  const open = () => (savingsSheet.value = { mode: "update" });

  if (!now) {
    return (
      <div class="page">
        <header class="topbar"><div class="topbar-text"><h1>Savings</h1><p>Our safety net</p></div></header>
        <section class="panel empty-hero">
          <Icon name="vault" size={56} class="vault-ico" />
          <h2>Start our vault</h2>
          <p class="muted">Enter what we have saved today. Update it whenever it changes and watch it grow.</p>
          <button type="button" class="btn btn-primary" onClick={open}>Add current savings</button>
        </section>
      </div>
    );
  }

  return (
    <div class="page">
      <header class="topbar"><div class="topbar-text"><h1>Savings</h1><p>Our safety net</p></div></header>

      <section class="vault">
        <div class="label">We have saved</div>
        <div class="total"><Count value={now.amount} format={(n) => money(n)} /></div>
        {gain && (
          <span class={`gain ${gain.delta >= 0 ? "up" : "down"}`}>
            {gain.delta >= 0 ? "▲" : "▼"} {money(Math.abs(gain.delta))} in {gain.days} day{gain.days === 1 ? "" : "s"}
          </span>
        )}
        {runway !== null && (
          <div class="runway"><Icon name="calendar" size={22} /><span>That covers about {runway < 10 ? runway.toFixed(1) : Math.round(runway)} months of our spending</span></div>
        )}
        {tp && (
          <div class="progress-ring-row">
            <div class="line"><span>{d.settings.savingsTargetLabel || "Our target"}</span><b>{Math.round(tp.pct)}%</b></div>
            <div class="bar"><i style={{ width: `${tp.pct}%` }} /></div>
            <div class="line" style={{ marginTop: 6, opacity: 0.8 }}>
              <span>{tp.remaining > 0 ? `${money(tp.remaining)} to go` : "Target reached!"}</span>
              {tp.etaDays !== null && <span>about {tp.etaDays < 60 ? `${tp.etaDays} days` : `${Math.round(tp.etaDays / 30)} months`}</span>}
            </div>
          </div>
        )}
      </section>

      <button type="button" class="btn btn-primary" onClick={open}>Update balance</button>

      {list.length >= 2 && (
        <section class="panel" aria-label="Savings over time">
          <LineChart points={list.map((s) => ({ date: s.date, value: s.amount }))} target={d.settings.savingsTarget || undefined} label="Savings over time" />
        </section>
      )}

      <section aria-labelledby="sh">
        <div class="section-head">
          <h2 id="sh">Updates</h2>
          <button type="button" class="link" onClick={() => (savingsSheet.value = { mode: "target" })}>{d.settings.savingsTarget > 0 ? "Edit target" : "Set a target"}</button>
        </div>
        <div class="list">
          {[...list].reverse().map((s, i) => (
            <button type="button" class="row" style={{ "--i": i, gridTemplateColumns: "1fr auto" }} key={s.id} onClick={() => (savingsSheet.value = { mode: "edit", id: s.id })}>
              <span class="row-title">{dayLabel(s.date, today.value)}<small>{[name(s.by), s.note].filter(Boolean).join(" · ")}</small></span>
              <span class="row-amount">{money(s.amount)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

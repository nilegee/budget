import { data, today } from "../lib/store";
import { computeBadges, computeStreak, longestStreak, monthCalendar, monthReport } from "../lib/game";
import { addMonths, monthKeyOf, monthLabel, parseDay } from "../lib/dates";
import { categoryDeltas, vsLastMonth } from "../lib/stats";
import { money } from "../lib/fmt";
import { Delta } from "../components/ui";
import { Icon } from "../components/Icon";

export function Wins() {
  const d = data.value;
  const t = today.value;
  const month = monthKeyOf(t);
  const streak = computeStreak(d, t);
  const best = longestStreak(d, t);
  const cal = monthCalendar(d, month, t);
  const lead = (parseDay(`${month}-01`).getDay() + 6) % 7; // Monday-first offset
  const badges = computeBadges(d, t);
  const earned = badges.filter((b) => b.earned).length;
  const vs = vsLastMonth(d, t);
  const deltas = categoryDeltas(d, t).filter((x) => x.before > 0 || x.now > 0).sort((a, b) => a.delta - b.delta);
  const history = [5, 4, 3, 2, 1].map((n) => monthReport(d, addMonths(month, -n), t)).filter((r) => r.spent > 0);

  return (
    <div class="page">
      <header class="topbar"><div class="topbar-text"><h1>Wins</h1><p>{earned} of {badges.length} badges earned</p></div></header>

      <section class="streak-card" aria-label="Streak">
        <span class="flame" data-off={streak.count === 0} aria-hidden="true"><Icon name="flame" size={62} /></span>
        <div>
          <b>{streak.count} {streak.count === 1 ? "day" : "days"}</b>
          <p>{streak.doneToday ? "Checked in today. Nice." : streak.count > 0 ? "Check in today to keep it going." : "Log anything, or tap No spend, to start."}</p>
          <p>Best: {best} · One missed day a week is forgiven</p>
        </div>
      </section>

      <section aria-labelledby="cal-h">
        <div class="section-head"><h2 id="cal-h">{monthLabel(month)}</h2><span class="muted" style={{ fontSize: ".85rem", display: "inline-flex", gap: 6, alignItems: "center" }}><Icon name="leaf" size={16} /> no spend</span></div>
        <div class="cal" role="img" aria-label="Days checked in this month">
          {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
          {cal.map((c) => (
            <i key={c.key} data-done={c.done && !c.noSpend} data-ns={c.noSpend} data-today={c.today} data-future={c.future}>{c.day}</i>
          ))}
        </div>
      </section>

      <section aria-labelledby="sc-h">
        <div class="section-head"><h2 id="sc-h">Scoreboard</h2></div>
        <div class="panel compare">
          {vs.before === 0 ? (
            <p class="muted">Once there's a full month to compare against, you'll see who's winning here: this month or last.</p>
          ) : (
            <>
              {Math.abs(vs.delta) < vs.before * 0.02 ? (
                <div class="big-delta">Neck and neck</div>
              ) : (
                <div class={`big-delta ${vs.winning ? "good" : "bad"}`}>{vs.winning ? "Winning" : "Behind"} by {money(Math.abs(vs.delta))}</div>
              )}
              <div class="compare-line"><span>Compared with the same point last month</span><Delta pct={vs.deltaPct} /></div>
            </>
          )}
        </div>
        <div class="list" style={{ marginTop: 8 }}>
          {deltas.slice(0, 6).map((x, i) => (
            <div class="row" style={{ "--i": i, "--cat": x.category.color, minHeight: 56 }} key={x.category.id}>
              <i class="badge-icon" style={{ "--cat": x.category.color }}><Icon name={x.category.icon} /></i>
              <span class="row-title">{x.category.name}<small>{money(x.now)} now · {money(x.before)} last month</small></span>
              <span class="row-amount"><Delta pct={x.deltaPct} />{x.deltaPct === null && x.now > 0 && <span class="muted" style={{ fontSize: ".8rem" }}>new</span>}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="bd-h">
        <div class="section-head"><h2 id="bd-h">Badges</h2></div>
        <div class="badges">
          {badges.map((b) => (
            <div class="badge" data-earned={b.earned} key={b.id} title={b.hint}>
              {b.earned && <div class="badge-foil-glint" aria-hidden="true" />}
              <div class="ring" style={{ "--p": b.earned ? 100 : Math.round(b.progress * 100) }}>
                <span class="badge-coin-face">
                  <Icon name={b.icon} size={26} />
                </span>
              </div>
              <b>{b.title}</b>
              <small>{b.earned ? "Unlocked" : b.hint}</small>
            </div>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section aria-labelledby="pm-h">
          <div class="section-head"><h2 id="pm-h">Past months</h2></div>
          <div class="list">
            {history.reverse().map((r, i) => (
              <div class="row" style={{ "--i": i, minHeight: 56 }} key={r.month}>
                <i class="badge-icon" style={{ "--cat": r.underBudget ? "var(--aqua)" : "var(--coral)" }}><Icon name={r.underBudget ? "target" : "trend"} /></i>
                <span class="row-title">{monthLabel(r.month)}<small>{r.underBudget ? `Under budget, ${money(r.savedVsBudget)} kept` : "Over budget"}{r.beatLast ? " · beat the month before" : ""}</small></span>
                <span class="row-amount">{money(r.spent)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

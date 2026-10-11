import { data, today, device } from "../lib/store";
import { computeMood, computeStreak } from "../lib/game";
import { categoryDeltas, paceInfo, topCategories, vsLastMonth } from "../lib/stats";
import { buildNudges } from "../lib/insights";
import { monthLabel } from "../lib/dates";
import { money } from "../lib/fmt";
import { Pot } from "../components/Pot";
import { CatBadge, Count, Delta } from "../components/ui";
import { Avatar, Icon } from "../components/Icon";
import { accentOf } from "../lib/theme";
import { currentSavings, lastChange, runwayMonths, targetProgress } from "../lib/savings";
import { logNoSpend, potPulse } from "../actions";
import { go, historyView } from "../router";

export function Home() {
  const d = data.value;
  const t = today.value;
  const pace = paceInfo(d, t);
  const mood = computeMood(d, t, pace);
  const streak = computeStreak(d, t);
  const vs = vsLastMonth(d, t);
  const deltas = new Map(categoryDeltas(d, t).map((x) => [x.category.id, x]));
  const top = topCategories(d, pace.month, 3);
  const nudges = buildNudges(d, t, 2);
  const level = pace.pctUsed >= 95 ? "high" : pace.pctUsed >= 70 ? "mid" : "calm";
  const goal = (pace.budget * d.settings.savingsGoalPct) / 100;
  const heading = Math.max(0, pace.budget - pace.projected);
  const person = d.settings.people.find((p) => p.id === device.value.me);
  const hour = new Date().getHours();
  const hello = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const helloAr = hour < 5 ? "لسه صاحي؟" : hour < 12 ? "صباح الفل" : hour < 18 ? "نهارك سعيد" : "مساء الورد";
  const accent = accentOf(device.value.accent);

  // Wealth & Savings metrics for Home
  const savings = currentSavings(d);
  const gain = lastChange(d);
  const runway = runwayMonths(d, t);
  const tp = targetProgress(d, t);

  return (
    <div class="page home">
      <header class="topbar">
        <Avatar name={person?.name ?? "?"} from={accent.from} to={accent.to} size={48} />
        <div class="topbar-text">
          <h1>{hello}, {person?.name ?? "family"}</h1>
          <p><span class="ar" lang="ar" dir="rtl">{helloAr}</span> · {monthLabel(pace.month)}</p>
        </div>
      </header>

      {/* Unified Bento Hero: Mascot + Daily Budget + Integrated Family Savings Badge */}
      <section class="hero unified-hero" data-level={level} data-mood={mood.mood} aria-label="This month's family budget & savings">
        <div class="hero-glow" />
        <div class="hero-top">
          <Pot fill={Math.min(100, pace.pctUsed)} mood={mood.mood} pulse={potPulse.value} />
          <div>
            <div class="hero-label">We spent this month</div>
            <div class="hero-amount"><Count value={pace.spent} format={(n) => money(n)} /></div>
            <div class="hero-of">of {money(pace.budget)} · {Math.round(pace.pctUsed)}%</div>
          </div>
        </div>

        <p class="bubble">{mood.line}<small>{mood.sub}</small><span class="ar-tag ar" lang="ar" dir="rtl">{mood.ar}</span></p>

        {/* 2x2 Unified Bento Stat Grid: Daily Health + Family Savings */}
        <div class="hero-stats unified-stats-grid">
          <div class="stat">
            <span>Today's family breathing room</span>
            <b><Count value={pace.safeToday} format={(n) => money(n)} /></b>
          </div>

          <div class="stat">
            <span>{pace.remaining >= 0 ? "Left for our month" : "Over our budget by"}</span>
            <b><Count value={Math.abs(pace.remaining)} format={(n) => money(n)} /></b>
          </div>

          <div class="stat stat-savings" onClick={() => go("savings")} role="button" tabIndex={0} aria-label="Open our family savings">
            <div class="stat-head-row">
              <span>Our Family Savings</span>
              <span class="stat-arrow">↗</span>
            </div>
            <b>
              {savings ? <Count value={savings.amount} format={(n) => money(n)} /> : "Start savings"}
            </b>
            {gain && (
              <small class={`stat-sub ${gain.delta >= 0 ? "up" : "down"}`}>
                {gain.delta >= 0 ? "▲ +" : "▼ -"}{money(Math.abs(gain.delta))}
              </small>
            )}
          </div>

          <div class="stat stat-runway" onClick={() => go("savings")} role="button" tabIndex={0} aria-label="Open our family runway">
            <div class="stat-head-row">
              <span>Family Runway Buffer</span>
              <span class="stat-arrow">↗</span>
            </div>
            <b>
              {runway !== null ? `${runway < 10 ? runway.toFixed(1) : Math.round(runway)} Months` : (tp ? `${Math.round(tp.pct)}% Goal` : "Protected")}
            </b>
            <small class="stat-sub">
              {tp ? `${money(tp.remaining)} to target` : "Safety buffer"}
            </small>
          </div>
        </div>
      </section>

      {/* Habit Streak Actions */}
      <div class="chip-row">
        {streak.doneToday ? (
          <span class="pill done"><Icon name="check" size={18} /> Checked in together</span>
        ) : (
          <button type="button" class="pill" onClick={logNoSpend}><Icon name="leaf" size={18} /> No-spend victory today! 🌿</button>
        )}
        <button type="button" class="pill" onClick={() => go("wins")} aria-label={`${streak.count} day family streak. Open wins`}>
          <Icon name="flame" size={18} style={{ color: "#ff8a3d" }} /> {streak.count} {streak.count === 1 ? "day streak" : "days streak"}{streak.frozen.length ? <Icon name="snowflake" size={16} style={{ color: "var(--sky)" }} /> : null}
        </button>
      </div>

      {/* Versus Last Month Section with Family Wording */}
      <section aria-labelledby="vs-h">
        <div class="section-head"><h2 id="vs-h">How our family is doing vs last month</h2></div>
        <div class="panel compare">
          {vs.before === 0 ? (
            <p class="muted">Nothing logged at this point last month. As we log together, our family comparison appears here.</p>
          ) : (
            <>
              {Math.abs(vs.delta) < vs.before * 0.02 ? (
                <div class="big-delta">Neck and neck with last month</div>
              ) : (
                <div class={`big-delta ${vs.winning ? "good" : "bad"}`}>
                  {money(Math.abs(vs.delta))} {vs.winning ? "less spent (Winning!)" : "more spent"}
                </div>
              )}
              <div class="compare-line"><span>What we spent so far</span><b>{money(vs.now)}</b></div>
              <div class="compare-line"><span>Same point last month</span><b>{money(vs.before)}</b></div>
            </>
          )}
          {goal > 0 && pace.spent > 0 && (
            <>
              <div class="compare-line" style={{ marginTop: 6 }}><span>On track to add to our savings</span><b>{money(heading)} of {money(goal)} goal</b></div>
              <div class="bar shimmer-bar" style={{ "--cat": heading >= goal ? "var(--aqua)" : "var(--mango)" }}><i style={{ width: `${Math.min(100, (heading / goal) * 100)}%` }} /></div>
            </>
          )}
        </div>
      </section>

      {/* Where Spending Is Going */}
      <section aria-labelledby="top-h">
        <div class="section-head">
          <h2 id="top-h">Where our money went this month</h2>
          <button type="button" class="link" onClick={() => { historyView.value = "categories"; go("history"); }}>See all</button>
        </div>
        {top.length === 0 ? (
          <div class="empty"><b>Nothing logged yet</b>Tap + to add our first expense.</div>
        ) : (
          <div class="list">
            {top.map((r, i) => (
              <div class="row" style={{ "--i": i, "--cat": r.category.color }} key={r.category.id}>
                <CatBadge c={r.category} />
                <div class="row-title">
                  {r.category.name}
                  <div class="bar shimmer-bar"><i style={{ width: `${r.share}%`, animationDelay: `${i * 80}ms` }} /></div>
                </div>
                <div class="row-amount">{money(r.amount)}<br /><Delta pct={deltas.get(r.category.id)?.deltaPct ?? null} /></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Smart Nudges */}
      <section class="stack" aria-label="Tips">
        {nudges.map((n) => (
          <div class="nudge" data-tone={n.tone} key={n.id}>
            <span class="big" aria-hidden="true"><Icon name={n.icon} size={30} /></span>
            <div><b>{n.title}</b><p>{n.body}</p></div>
          </div>
        ))}
      </section>
    </div>
  );
}

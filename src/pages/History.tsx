import { signal } from "@preact/signals";
import { data, today } from "../lib/store";
import { addMonths, dayLabel, monthKeyOf, monthLabel } from "../lib/dates";
import { categoryDeltas, categoryTotals, expensesIn, liveCategories, spentIn } from "../lib/stats";
import { money } from "../lib/fmt";
import { sum } from "../lib/money";
import { CatBadge, Delta } from "../components/ui";
import { openEdit } from "../components/QuickAdd";
import { Icon } from "../components/Icon";
import { historyView } from "../router";
import { CategoryDonut } from "../components/CategoryChart";

const month = signal(monthKeyOf(today.value));
const query = signal("");
const filterCat = signal<string>("all");

export function History() {
  const d = data.value;
  const m = month.value;
  const cats = liveCategories(d);
  const total = spentIn(d, m);
  const isNow = m === monthKeyOf(today.value);

  return (
    <div class="page">
      <div class="monthbar">
        <button type="button" class="icon-btn" aria-label="Previous month" onClick={() => (month.value = addMonths(m, -1))}><Icon name="chevL" size={22} /></button>
        <div style={{ textAlign: "center" }}>
          <h2>{monthLabel(m)}</h2>
          <div class="muted" style={{ fontSize: ".9rem", fontWeight: 600 }}>{money(total)} spent</div>
        </div>
        <button type="button" class="icon-btn" aria-label="Next month" disabled={isNow} style={{ opacity: isNow ? 0.35 : 1 }} onClick={() => (month.value = addMonths(m, 1))}><Icon name="chevR" size={22} /></button>
      </div>

      <div class="seg" role="tablist" aria-label="History view">
        <button type="button" role="tab" aria-selected={historyView.value === "transactions"} data-on={historyView.value === "transactions"} onClick={() => (historyView.value = "transactions")}>Transactions</button>
        <button type="button" role="tab" aria-selected={historyView.value === "categories"} data-on={historyView.value === "categories"} onClick={() => (historyView.value = "categories")}>Categories</button>
      </div>

      {historyView.value === "transactions" ? <Transactions m={m} /> : <Categories m={m} total={total} cats={cats} />}
    </div>
  );
}

function Transactions({ m }: { m: string }) {
  const d = data.value;
  const cats = liveCategories(d);
  const q = query.value.trim().toLowerCase();
  const rows = expensesIn(d, m)
    .filter((e) => filterCat.value === "all" || e.categoryId === filterCat.value)
    .filter((e) => !q || e.note.toLowerCase().includes(q) || (d.categories.find((c) => c.id === e.categoryId)?.name ?? "").toLowerCase().includes(q) || String(e.amount).includes(q))
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  const groups = new Map<string, typeof rows>();
  for (const e of rows) groups.set(e.date, [...(groups.get(e.date) ?? []), e]);

  return (
    <>
      <input class="search" type="search" placeholder="Search notes, categories, amounts" value={query.value} onInput={(e) => (query.value = (e.target as HTMLInputElement).value)} aria-label="Search expenses" />
      <div class="hscroll" role="group" aria-label="Filter by category">
        <button type="button" class="pill" data-on={filterCat.value === "all"} onClick={() => (filterCat.value = "all")}>All</button>
        {cats.map((c) => (
          <button type="button" class="pill" data-on={filterCat.value === c.id} onClick={() => (filterCat.value = c.id)}><Icon name={c.icon} size={18} style={{ color: c.color }} /> {c.name}</button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div class="empty"><b>No expenses here</b>{q || filterCat.value !== "all" ? "Try clearing the search or filter." : "Tap + to add one."}</div>
      ) : (
        <div>
          {[...groups.entries()].map(([date, items]) => (
            <section key={date}>
              <div class="day-head"><span>{dayLabel(date, today.value)}</span><span class="num">{money(sum(items.map((i) => i.amount)))}</span></div>
              <div class="list">
                {items.map((e, i) => {
                  const c = d.categories.find((x) => x.id === e.categoryId);
                  const who = d.settings.people.find((p) => p.id === e.by);
                  return (
                    <button type="button" class="row" style={{ "--i": i, "--cat": c?.color }} key={e.id} onClick={() => openEdit(e.id)}>
                      {c ? <CatBadge c={c} /> : <i class="badge-icon"><Icon name="grid" /></i>}
                      <span class="row-title">{c?.name ?? "Unknown"}<small>{[who?.name, e.note].filter(Boolean).join(" · ")}</small></span>
                      <span class="row-amount">{money(e.amount, true)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Categories({ m, total, cats }: { m: string; total: number; cats: ReturnType<typeof liveCategories> }) {
  const d = data.value;
  const totals = categoryTotals(d, m);
  const isNow = m === monthKeyOf(today.value);
  const deltas = new Map(categoryDeltas(d, isNow ? today.value : `${m}-28`).map((x) => [x.category.id, x]));
  
  const slices = cats.map((c) => {
    const amount = totals.get(c.id) ?? 0;
    const pct = total > 0 ? (amount / total) * 100 : 0;
    return { c, amount, pct };
  }).sort((a, b) => b.amount - a.amount);

  const max = slices[0]?.amount || 1;
  if (total === 0) return <div class="empty"><b>Nothing this month</b>Categories fill in as you log.</div>;

  return (
    <div class="categories-view-wrap">
      {/* Interactive Donut Breakdown Chart */}
      <CategoryDonut
        slices={slices}
        total={total}
        onSelectCategory={(id) => {
          filterCat.value = id;
        }}
      />

      <div class="list" style={{ marginTop: "14px" }}>
        {slices.map(({ c, amount }, i) => (
          <div class="row" style={{ "--i": i, "--cat": c.color, opacity: amount === 0 ? 0.45 : 1 }} key={c.id}>
            <CatBadge c={c} />
            <div class="row-title">
              {c.name}
              <small>{Math.round((amount / total) * 100)}% of the month</small>
              <div class="bar"><i style={{ width: `${(amount / max) * 100}%` }} /></div>
            </div>
            <div class="row-amount">{money(amount)}<br /><Delta pct={deltas.get(c.id)?.deltaPct ?? null} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

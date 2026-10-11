# Family Budget

A mobile-first family budget that turns tracking into a habit. Installable on your phone (PWA), works offline, and can be shared live between two phones.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000 (also on your LAN, for testing on a phone)
pnpm test       # logic tests: streaks, mood, pace, sync merge, legacy import
pnpm build      # production build in dist/
```

Your previous data is picked up automatically: the first time this version opens in a browser that has data from the old single-file app, it imports it. The old app is kept in `legacy/index.html`.

## Put it on your phone

Installing needs HTTPS, so deploy `dist/` anywhere static: Cloudflare Pages, Netlify, Vercel or GitHub Pages (the build uses relative paths, so a sub-folder URL works). Open the URL on the phone, then Share > Add to Home Screen.

## Share with Mariem (optional, free)

Both phones share one household through a small [Supabase](https://supabase.com) project. You own the data.

1. Create a free Supabase project.
2. SQL editor: paste and run `supabase/schema.sql`.
3. Project settings > API: copy the **Project URL** and the **anon public key**.
4. On your phone: More > Share with Mariem. Paste both, tap Generate for a household key, then Connect.
5. On Mariem's phone: enter the **same** URL, anon key and household key.

The household key acts like a shared password: only someone who knows it can read or write your rows (enforced by a row-level-security policy). Keep it private. Records merge per item, last edit wins, deletes sync too, and the app keeps working offline and catches up later.

## How the habit loop works

| Idea | What you see | Why it works |
| --- | --- | --- |
| The pot | Liquid = budget used; its face = how you're doing as a habit | One friendly object carries two signals |
| Mood | Glowing, content, uneasy, stressed, sleepy, sad | Immediate, emotional feedback instead of a spreadsheet |
| Missed day | After a full day with no check-in the pot goes sad ("I missed you") and recovers when anyone logs | Gentle loss aversion, not shame |
| Family streak | Any one of you checking in keeps it alive; one missed day a week is forgiven | Cooperation beats competition; freezes stop all-or-nothing quitting |
| No-spend day | One tap counts as a check-in | Not spending is a win, and it removes the "I forgot to log" gap |
| Safe to spend today | One number to act on | Anchors the next decision |
| Versus last month | Same point in the month, overall and per category | Beating your own past self is a clear, fair game |
| Nudges | Concrete amounts, yearly impact, small-leak detection | Makes the cost of a habit visible |
| Badges | Earned from real data, with progress rings | Goal-gradient: you can see how close you are |

## Project map

```
src/
  lib/        pure logic (no UI): stats, game, insights, merge, migrate, store, sync
  components/ Pot (mascot), QuickAdd (one-thumb entry), shared UI
  pages/      Home, History, Wins, More
  styles/     tokens.css (colour, type, motion) and app.css
tests/        logic.test.ts
supabase/     schema.sql
legacy/       the previous single-file app
```

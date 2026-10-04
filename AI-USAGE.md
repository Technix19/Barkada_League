# AI Usage

Barkada League was built with heavy use of **Claude Code** (Anthropic) as a
pair-programming assistant. It wrote most of the implementation code, working
from a spec and a set of constraints I wrote and from phase-by-phase direction
and review. I'm stating that accurately rather than downplaying it.

Repository: https://github.com/Technix19/Barkada_League

---

## 1. How I used AI

### Entry 1 — Database schema, seed data, and the Express skeleton

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** A PostgreSQL schema for a 1v1 league — players, seasons,
matches — with the rules enforced in the database itself (no tied scores, nobody
playing themselves, the winner has to be one of the two players), seed data to
work against, and a minimal Express app with a health endpoint that connects
through `pg`.

**What came back:** `database/schema.sql` with three tables, foreign keys set to
`ON DELETE RESTRICT`, four `CHECK` constraints, and indexes on the match columns
I'd be filtering by. `database/seed.sql` with 6 players, one active season, and
15 matches. `server/src/db.js` with a shared `Pool`, and `server/src/app.js` with
`GET /api/health` running `SELECT 1`.

**What I kept and changed:** Kept all of it. One thing I noticed and deliberately
left alone for now: the AI set `ssl: { rejectUnauthorized: false }` on the pool.
That encrypts the connection but skips certificate verification. I kept it
because it's what the Supabase pooler connection wanted, but I wrote it up
honestly as a known weakness in `project/SECURITY-CHECKLIST.md` rather than
pretending it's a clean setup.

**Commit:** https://github.com/Technix19/Barkada_League/commit/12d3ee3b9d350e28768da99ed62f06878f77d1fa

---

### Entry 2 — The whole React frontend, built against mock data first

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** All five screens — Leaderboard, Match History, Record
Match, Edit Match, Player Profile — with React Router, built against a fake
in-memory data service so the UI could be finished before the real API existed.

**What came back:** A component tree split into atoms/molecules/organisms, the
five page components, `src/services/mockApi.js` and `src/data/mockData.js`, the
responsive CSS, and client-side form validation.

**What I kept and changed:** Kept the structure. The mock-first approach was on
purpose — I wanted the shape of the data settled before writing the API. It did
backfire in one specific way that I only found later, which I've written up in
section 2 below.

**Commit:** https://github.com/Technix19/Barkada_League/commit/8c03a08bf8dad5337f8b63f9903c36232c4406c8

---

### Entry 3 — Dark theme and a restrained motion pass

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** Replace the original light/green look with a dark, near-black
and neon-blue identity. Keep it restrained — no glow everywhere, no esports
look — and don't break the responsive layout or accessibility.

**What came back:** A rewritten CSS token set in `src/styles/variables.css`, a
`TrophyIcon` component, a subtle highlight treatment for the rank-1 row, and a
`prefers-reduced-motion` block that switches the animations off.

**What I kept and changed:** Kept it, but reviewing the screenshots caught two
bugs it had introduced — the nav showing two items as active at once, and the
winner's name losing its colour on match rows. Both were fixed before I committed.

**Commit:** https://github.com/Technix19/Barkada_League/commit/b4041ec6dd87c348cca9957121a1be708eafdf39

---

### Entry 4 — The read-only Express API over Postgres

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** `GET` endpoints for players, seasons, and matches, reading
from the real database, returning camelCase JSON, with every query parameterised
and route IDs validated before they reach SQL.

**What came back:** `routes/players.js`, `routes/seasons.js`, `routes/matches.js`
and `utils/validation.js` with a `parsePositiveInt` helper. Every query uses
`$1`-style placeholders. Date columns are cast with `::text` in the SQL.

**What I kept and changed:** Kept it. The `::text` cast was the AI's idea and I
asked why — the `pg` driver turns a `DATE` column into a JavaScript `Date` at
local midnight, which shifts the day depending on the server's timezone. Casting
to text in SQL means it comes back as a plain `"YYYY-MM-DD"` string and the
problem can't happen. I accepted it once I understood the reason.

**Commit:** https://github.com/Technix19/Barkada_League/commit/ccdee02519f1445af191cfbfb97019b3c4a03916

---

### Entry 5 — Match write API, with the server deciding the winner

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** `POST`, `PATCH` and `DELETE` for matches. Hard requirement:
the server works out the winner from the scores, and the API refuses a request
that tries to send `winnerId` itself.

**What came back:** The three write routes plus `utils/validateMatch.js`, which
checks types strictly (`typeof value === 'number'`, so a score sent as the string
`"21"` is rejected rather than quietly converted), validates that a date is a real
calendar date, and rejects the whole request with a 400 if `winnerId` appears
anywhere in the body.

**What I kept and changed:** Kept it. The strict number check turned out to matter
more than I expected, because HTML form inputs hand you strings by default — so
the frontend has to convert them before sending, and the backend catches it if it
doesn't.

**Commit:** https://github.com/Technix19/Barkada_League/commit/f64c524ed7431f606fd75ceec0a487bce7fa741c

---

### Entry 6 — Leaderboard calculated from match rows

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** `GET /api/leaderboard?seasonId=` that works out matches
played, wins, losses, win percentage, rank and current streak from the `matches`
table — nothing stored — and still lists players who haven't played yet.

**What came back:** `routes/leaderboard.js` using a `LEFT JOIN` with a `FILTER`
aggregate so zero-match players still appear, the streak worked out in JavaScript
from matches ordered newest-first, and a four-level sort (wins, then win
percentage, then matches played, then name).

**What I kept and changed:** Kept the logic, but the way it was organised caused a
problem as soon as I added the player stats endpoint — see section 2, case 2.

**Commit:** https://github.com/Technix19/Barkada_League/commit/e26b770da73d7c324d6fadf03926556013ade748

---

### Entry 7 — Player stats endpoint and a shared stats module

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** `GET /api/players/:id/stats?seasonId=` for the Player
Profile page, and — specifically — make it impossible for it to disagree with the
leaderboard.

**What came back:** The ranking, streak and win-percentage logic pulled out of the
route and into `server/src/utils/leagueStats.js`, with both the leaderboard route
and the player stats route calling the same `getSeasonStandings()` function.
`leaderboard.js` dropped from 119 lines to 26.

**What I kept and changed:** Kept it. The reason I asked for it this way is that
two separate implementations of "what is this player's rank" can drift apart, and
then the leaderboard and the profile page show different numbers for the same
player. Sharing one function makes that impossible rather than just unlikely.

**Commit:** https://github.com/Technix19/Barkada_League/commit/f105008d7e190930c2d2ebd6eac4c82c13c893cb

---

### Entry 8 — Connecting the React frontend to the real API

**Date:** 2026-09-01
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** Replace the mock service with real `fetch()` calls, and
change as little of the page/component code as possible.

**What came back:** `src/services/api.js` with a shared `request()` helper that
sets JSON headers, returns early on a `204` (so `DELETE` doesn't try to parse an
empty body), and throws an error carrying the backend's own message so the form
can display "Scores cannot be tied" instead of something generic. It also added
small adapter functions that reshape the API's nested response into the flatter
shape the existing components already expected, so the components didn't need
rewriting. The mock files were deleted.

**What I kept and changed:** Kept the adapter approach. It also fixed a crash it
had caused itself — see section 2, case 1.

**Commit:** https://github.com/Technix19/Barkada_League/commit/cbaafdfeca449264909aa87371d56d933992ea1a

---

### Entry 9 — Documentation screenshots

**Date:** 2026-09-03
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** A consistent screenshot set of the finished app — desktop
and 375px mobile, plus close-ups of specific component states — taken against the
real running app and the real database, not mockups.

**What came back:** 22 PNGs in `docs/screenshots/`, captured with headless
Chromium. It used reduced-motion emulation while capturing so the animated
elements sat still and the frames came out clean rather than caught mid-animation.

**What I kept and changed:** Kept all 22. It opened the delete-confirmation dialog
for that screenshot and then cancelled rather than confirming, so no real match
was deleted from the database.

**Commit:** https://github.com/Technix19/Barkada_League/commit/7a242996f03a8c4e284cc1ba9fab28b1491f0988

---

### Entry 10 — Documentation audit and writing

**Date:** 2026-09-27
**Tool:** Claude Code (Claude Sonnet)

**What I asked for:** Audit the repository against the Week 2 requirements, tell
me what's actually missing, and then write the documentation — with an explicit
instruction not to invent anything that the repo and git history don't support.

**What came back:** It found that `README.md` was still the default Vite template,
and that `project/` and `journal/` didn't exist at all. It then wrote the README,
`project/REPORT.md`, `project/SECURITY-CHECKLIST.md` and `journal/week-2.md`.

**What I kept and changed:** Kept them. Worth noting: when I described my week's
work it pushed back on two claims — that responsive design was part of that work
(git shows it was built earlier, in `8c03a08`) and that the documentation was
already done (it wasn't). It also pointed out that the commit history doesn't
support a two-calendar-week timeline and refused to write one.

**Commit:** https://github.com/Technix19/Barkada_League/commit/acf284bc961f1c63400c709c3771f4d09f0f816b

---

### Entry 11 — Active season route (written by me, reviewed with AI)

**Date:** 2026-10-04
**Tool:** Claude Code (Claude Opus / Sonnet)

**What I asked for:** Guidance on how to add `GET /api/seasons/active`, which
returns the season flagged as active, or a 404 if there isn't one.

**What came back:** The AI did not write the route. It gave me the requirements,
where to place it in `server/src/routes/seasons.js`, and the patterns to follow
from the existing routes, then reviewed each version I pasted back.

**What I kept and changed:** I wrote the route myself. The review caught a typo
in the JSON key (`isActiwve`), a path declared as `/` instead of `/active`
(which would have been shadowed by the list route), an empty `catch` block, and
inconsistent error strings. I fixed each one myself.

**Commit:** https://github.com/Technix19/Barkada_League/commit/bd74f7c22d5869e090da755cbbdb37cefbb85a76

---

### Entry 12 — In-memory rate limiter (written by me, reviewed with AI)

**Date:** 2026-10-04
**Tool:** Claude Code (Claude Opus / Sonnet)

**What I asked for:** Guidance on writing a rate limiter with no extra package,
limiting each IP to 100 requests per 15 minutes and returning 429 after that.

**What came back:** The AI did not write the limiter. It explained the Express
middleware shape, what to store per client, and how to wire it into `app.js`,
then reviewed my implementation.

**What I kept and changed:** I wrote `server/src/utils/rateLimit.js` myself. The
review pointed out that the first-request and window-reset branches do the same
thing, and that my comments restated the code. I kept the logic but noted both
points. The limitation that the in-memory `Map` never shrinks is documented in
the README and the security checklist. I tested it against the live database by restarting the
server (to reset the counter) and sending 101 requests to `/api/players`. The
result was 100 `200` responses and 1 `429`.

**Commit:** https://github.com/Technix19/Barkada_League/commit/98235e35cc09bc6553b1dc04c6bcf94eb6eceb79

---

## 2. Where the AI got it wrong

### Case 1 — It wrote two versions of the same thing that disagreed, and the bug hid behind mock data

**What it gave me:** In `LeaderboardRow.jsx` and `LeaderboardTable.jsx` it wrote:

```js
const streakVariant = entry.currentStreak.type === 'W' ? 'win' : ...
```

**What was wrong with it:** The same AI wrote both sides of this contract, and
they didn't match. The mock service returned `{ type: null, count: 0 }` for a
player with no matches:

```js
// src/utils/leagueStats.js (mock version, commit 8c03a08)
if (outcomesNewestFirst.length === 0) {
  return { type: null, count: 0 };
}
```

…but the real backend returns a bare `null`:

```js
// server/src/utils/leagueStats.js
if (!outcomesNewestFirst || outcomesNewestFirst.length === 0) {
  return null;
}
```

So `entry.currentStreak.type` reads `.type` off `null` and the whole leaderboard
page crashes — but only for a player who hasn't played a match yet. Every player
in the mock data had matches, so this sat in the code from 2026-09-01 without
ever showing up. It only became reachable the moment real API data arrived.

**What I did instead:** Changed both to optional chaining so a missing streak
falls through to the neutral badge:

```js
const streakVariant = entry.currentStreak?.type === 'W' ? 'win' : ...
```

**Commits:** the bug is visible in
https://github.com/Technix19/Barkada_League/commit/8c03a08bf8dad5337f8b63f9903c36232c4406c8
and the fix in
https://github.com/Technix19/Barkada_League/commit/cbaafdfeca449264909aa87371d56d933992ea1a

**What I took from it:** Mock data is friendlier than real data. Mine never had a
player with zero matches, so it never produced the one case that broke the page.

---

### Case 2 — It put the stats logic somewhere that would have forced me to duplicate it

**What it gave me:** The first version of `routes/leaderboard.js` (119 lines) had
everything inline in the route handler — the aggregate SQL, the streak
calculation, the win-percentage maths, and the four-level sort.

**What was wrong with it:** It works fine as one endpoint. The problem shows up
with the second one. When I added `GET /api/players/:id/stats` for the Player
Profile page, that same ranking and streak logic would have had to be written a
second time. Two copies of "what is this player's rank" can drift apart, and then
the leaderboard says a player is 3rd while their own profile page says 4th — with
no obvious bug, just two implementations that have quietly diverged.

**What I did instead:** Asked for it to be pulled out into
`server/src/utils/leagueStats.js`, with both routes calling the same
`getSeasonStandings()`. The player stats endpoint now looks itself up in the same
ranked list the leaderboard returns, so the two can't disagree — it's the same
computation, not a matching one. `leaderboard.js` went from 119 lines to 26.

**Commits:** original
https://github.com/Technix19/Barkada_League/commit/e26b770da73d7c324d6fadf03926556013ade748
→ refactor
https://github.com/Technix19/Barkada_League/commit/f105008d7e190930c2d2ebd6eac4c82c13c893cb

---

### Case 3 — A CSS change that silently broke an unrelated feature

**What it gave me:** During the dark theme pass it added an explicit colour to the
player-name link style:

```css
.leaderboard-player-link {
  font-weight: 700;
  text-decoration: none;
  color: var(--color-text); /* <- this line */
}
```

**What was wrong with it:** On a match row, the winning player's name is supposed
to be highlighted — that comes from a colour set on the parent element, which the
link inherits. Setting `color` directly on the link itself beats inheritance, so
every winner's name silently went back to plain white. The page still rendered
and nothing errored; the feature just stopped working. I only caught it by
actually looking at the screenshots and noticing the winners weren't highlighted
any more.

**What I did instead:** Removed the `color` line so the link inherits again, and
left a comment saying why, so it doesn't get "helpfully" added back:

```css
.leaderboard-player-link {
  font-weight: 700;
  text-decoration: none;
  /* No explicit color: inherits from the reset's `a { color: inherit }`
     so a winning player's name still shows in the success color. */
}
```

**Commit:** https://github.com/Technix19/Barkada_League/commit/b4041ec6dd87c348cca9957121a1be708eafdf39

**Honest caveat:** this bug and its fix are both inside that one commit, because I
committed at the end of the phase rather than mid-way — so unlike case 1 you
can't see a before/after diff for it in git. The CSS comment is the evidence
that's actually in the repo.

**What I took from it:** CSS bugs don't throw errors. This one would have shipped
if I'd only checked that the page loaded.

---

## 3. Who wrote what

> **⚠️ THIS SECTION IS NOT FINISHED — DO NOT SUBMIT AS-IS.**
>
> This section is worth 30 of the 100 points and it has to be written by me,
> about code I actually wrote myself, naming the file and the commit and
> explaining it in my own words. Sections 1, 2 and the README credit together
> only reach 70 points, and the badge needs 75 — so this section is the
> difference between earning the badge and not.
>
> As the repository stands right now, I cannot honestly point at a meaningful
> piece of application code as my own. What I actually contributed was the spec
> in `BARKADA_LEAGUE_PROJECT_SPEC.md`, the architecture constraints (server
> derives the winner; no stored statistics; no Supabase SDK on the frontend),
> the phase-by-phase review that caught several bugs, the Supabase setup, and
> the commits — all real, but none of it is "code I wrote myself."
>
> **To finish this honestly I need to write a real piece of this project myself,
> commit it, and then explain it here.** Something route-sized or query-sized, as
> the rubric suggests. Then replace this block with:
>
> - **What I wrote:** the file, the commit link, and what it does
> - **Why it's built that way:** in my own words — the reasoning, not a
>   description of the syntax
> - **The one AI-written piece I understand best:** file, commit, and the same
>   depth of explanation (the rubric gives full marks for explaining AI-written
>   code well, as long as I'm clear that's what it is)

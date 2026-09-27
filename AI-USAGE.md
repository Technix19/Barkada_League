# AI Usage

This project was built with heavy use of Claude Code (Anthropic's
AI coding assistant), used as a pair-programmer across the whole stack —
not just for small snippets, but for actually writing most of the
implementation code, based on requirements and direction I gave it.

Being upfront about this rather than downplaying it:

## What the AI did

- Wrote the PostgreSQL schema (`database/schema.sql`) and seed data
  (`database/seed.sql`) based on the table/relationship design I asked
  for.
- Wrote the Express backend: `server/src/app.js`, `db.js`, and all the
  route files (`players.js`, `seasons.js`, `matches.js`,
  `leaderboard.js`), including the input validation logic and the
  shared leaderboard/streak calculation code.
- Wrote the React frontend: all the page components, the reusable UI
  components, the CSS, and the routing setup.
- Wrote the real API service layer (`src/services/api.js`) that replaced
  the earlier mock data service.
- Diagnosed and fixed real bugs during development (the Postgres date
  timezone issue, a null-safety crash in the leaderboard component, a
  git push failure caused by an HTTP/2 issue).
- Took the screenshots in `docs/screenshots/` using a headless browser
  against the real running app and real database.
- Wrote this documentation, including the README, the security
  checklist, and the weekly report/journal — based on actually reading
  the code and git history, not from a template guess.

## What I (the human) did

- Defined the actual project requirements and scope — what screens exist,
  what the database should look like, what the API should and shouldn't
  do, what's explicitly out of scope (no auth, no teams, etc.). This is
  written down in `BARKADA_LEAGUE_PROJECT_SPEC.md`.
- Reviewed and approved each stage of work before moving to the next one
  (database setup, then read API, then write API, then leaderboard, then
  player stats, then frontend integration, then documentation) instead of
  having everything built in one uncontrolled pass.
- Set up the actual Supabase project and provided the real database
  credentials (kept out of the repo, only in the local `.env` file).
- Made the actual git commits and pushed them to GitHub.
- Caught and asked for a fix when the connection string almost ended up
  in the wrong (tracked) file.
- Am responsible for the final content of every file in this repo,
  including this one — I read through what was generated rather than
  submitting it blind.

## Why this matters for grading

If you're evaluating this for understanding rather than just output: I
can walk through and explain any part of this codebase — how the winner
gets calculated, why the leaderboard endpoint and player-stats endpoint
share the same calculation code, why dates needed to be cast to text,
why the server rejects a client-provided `winnerId`. The design decisions
were mine; a lot of the typing was not.

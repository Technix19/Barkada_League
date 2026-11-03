# Multi-league upgrade: Phases 1–2 (database, API and frontend)

> **Do not deploy or merge yet.** The React client now uses the new league API,
> but the live Supabase project is inactive and the migration has not been run.
> Apply and test the schema on staging first, then configure Auth and deploy
> the client and server together. CI passing is not equivalent to E2E testing.

## What has been implemented

- A new multi-tenant data model: profiles, leagues, league_members and
  league_id on every player, season and match.
- A one-time **additive** migration that moves every existing record to the
  unowned, public, read-only "Barkada Demo" league. IDs are preserved.
- Database constraints prevent matches from pairing cross-league players or
  seasons and enforce that the winner matches the scores.
- Verified Supabase Auth bearer tokens via the Auth /user endpoint. User IDs
  come only from verified server responses, never from request bodies or
  editable JWT metadata.
- Explicit server-side role checks. Owners and admins can create/update data;
  members can read; nonmembers can read public leagues only.
- New league-scoped API paths; all SQL queries filter by league ID.
- Legacy unscoped API routes return HTTP 410. They must not remain active
  after introducing multiple user-owned leagues.
- CORS allowlist, bounded request JSON and periodic expired-IP cleanup in
  the in-memory rate limiter.
- Basic middleware/API tests and GitHub Actions CI (frontend lint/build and backend tests).
- React email/password signup and login using the pinned Supabase JavaScript SDK,
  browser session persistence, and authenticated Bearer token forwarding.
- My Leagues dashboard, league creation, player roster creation, season creation
  and activation, and league-scoped navigation.
- League-specific leaderboard, player profiles, record/edit/delete match flows,
  server-side paginated match history, and public read-only demo discovery.

## Before applying to any live database

1. Restore/resume the correct Supabase project (it was reported INACTIVE
   during the review on 2026-11-03).
2. Take a restorable backup and test that backup on a **separate staging DB**.
3. Inspect the existing rows and run the migration on staging first:
   `database/migrations/20261103_multileague_foundation.sql`
   It is a one-time script, not an idempotent upsert or a CLI migration.
4. Verify counts and associations. Example queries:

   ```sql
   SELECT count(*) FROM players;
   SELECT count(*) FROM seasons;
   SELECT count(*) FROM matches;
   SELECT league_id, count(*) FROM matches GROUP BY league_id;
   SELECT id, slug, is_public FROM leagues;
   SELECT count(*) FROM matches m
     JOIN players p1 ON m.player1_id=p1.id
     JOIN players p2 ON m.player2_id=p2.id
     JOIN seasons s ON m.season_id=s.id
     WHERE m.league_id<>p1.league_id OR m.league_id<>p2.league_id
        OR m.league_id<>s.league_id;
   ```

   The last query must return 0. Confirm the demo league owns the pre-existing
   players, seasons and matches. DO NOT re-run seed.sql on a populated database.
5. Confirm the server DB role can query tables and that PostgREST anon and
   authenticated roles cannot. RLS is enabled with no exposed policies; Express
   is the access-control boundary. Validate this with the Supabase advisors.
6. Test the Phase 2 account flow against the **staging** schema: sign up,
   login, create two leagues, create players/seasons, record and edit matches,
   verify cross-league authorization, and anonymous access to the public demo.
7. Deploy the frontend and server with the new environment variables in a
   coordinated cutover, then apply the verified production migration with a
   clear rollback window. The existing deployment still uses legacy routes.

## Express environment (server only)

- DATABASE_URL: PostgreSQL connection URL.
- SUPABASE_URL: project URL (e.g. https://ref.supabase.co).
- SUPABASE_PUBLISHABLE_KEY: project's publishable API key.
- FRONTEND_ORIGIN: comma-separated allowed browser origins, including Vercel
  production/preview domains as needed.
- PORT: local development only; Render provides PORT in production.

Do not use an elevated service-role/secret key in the browser. Email/password
signup uses Supabase Auth through the React interface.
If exposing signup publicly, configure email verification and a suitable
custom SMTP provider, since Supabase's built-in email service is rate limited.

## React environment (Vercel / local build)

- `VITE_API_URL`: deployed Express API base URL (no `/api` suffix).
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: project publishable key, **never** a secret key.

After configuring Supabase Email/Password Auth, add the deployed frontend URL
and `/login` redirect to the Auth allowed redirect URLs. If confirmation is
required, a new user must follow the confirmation email before login. Configure
custom SMTP for public registration due to Supabase's limited default email sender.

## New API contract

All paths are under /api, and :leagueId is the numeric league ID.

| Method | Path | Permission |
| --- | --- | --- |
| GET | /leagues | Signed-in user; only member leagues |
| GET | /leagues/demo | Anyone; locates the existing public demo |
| POST | /leagues | Signed-in user; becomes owner |
| GET | /leagues/:leagueId | Member, or visitor if public |
| GET | /leagues/:leagueId/players | Member, or visitor if public |
| POST | /leagues/:leagueId/players | Owner/admin |
| GET | /leagues/:leagueId/players/:id | Member, or public |
| GET | /leagues/:leagueId/players/:id/stats?seasonId= | Member, or public |
| GET | /leagues/:leagueId/players/:id/matches?seasonId= | Member, or public |
| GET | /leagues/:leagueId/players/:id/vs/:opponentId | Member, or public |
| GET | /leagues/:leagueId/seasons | Member, or public |
| GET | /leagues/:leagueId/seasons/active | Member, or public |
| POST | /leagues/:leagueId/seasons | Owner/admin |
| PATCH | /leagues/:leagueId/seasons/:id/activate | Owner/admin |
| GET | /leagues/:leagueId/matches?seasonId=&limit=&offset= | Member, or public |
| GET | /leagues/:leagueId/matches/:id | Member, or public |
| POST | /leagues/:leagueId/matches | Owner/admin |
| PATCH | /leagues/:leagueId/matches/:id | Owner/admin |
| DELETE | /leagues/:leagueId/matches/:id | Owner/admin |
| GET | /leagues/:leagueId/leaderboard?seasonId= | Member, or public |

The API automatically determines winners from scores. Player accounts and
roster entries are separate: an admin can add an unregistered friend.

## Remaining work before calling this portfolio ready

- Phase 3: invitations, profile claiming, robust owner transfer and delete flows.
- Phase 3: database integration tests with **two** user accounts, ensuring no
  cross-league read/write; public/private permission coverage.
- Phase 3: review TLS certificate validation in server/src/db.js, improve
  distributed rate limiting, and test email verification/recovery.
- Phase 3: verify staging/production migration, resume Supabase project,
  configure allowed origins and SMTP, and verify full browser E2E flows.
- Phase 3: player editing/removal, invitations, password recovery,
  end-to-end authorization coverage and production readiness polish.

## Rollback strategy

- Before migration: restore the staging backup, not a hand-edited partial SQL.
- After migration: restore the full production backup if rolling back the
  database; do not drop the league_id columns while new data exists.
- Backend/frontend must be deployed as a coordinated cutover. The old frontend
  cannot use this branch's 410 legacy routes.

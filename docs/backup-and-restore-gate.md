# Barkada League: backup and restore release gate

The one-time Phase 1 database migration has passed a PostgreSQL 17 CI test and a rollback-only test on the live schema, but **has not been permanently applied**.

The earlier ZIP contains an application-record snapshot (6 players, 1 season, 15 matches). It is not a complete database backup. A verified independent logical backup and test restoration are required before the production migration.

## Create a logical backup

1. On a Mac with Node.js and [Docker Desktop](https://docs.docker.com/get-started/get-docker/) installed and running, open Terminal in the Barkada League repository.
2. Check out the backup helper branch, or copy `scripts/backup-supabase.sh` into the repo.
3. Run `bash scripts/backup-supabase.sh`. Authenticate with the Supabase account that has access to Portfolio 2.
4. The script **explicitly** links to Barkada League project `fwazvwgyzxpjmycuazcp`. Enter the project's database password only into the Supabase CLI prompts; never paste it into a chat or GitHub.
5. Find the timestamped files under `~/BarkadaLeagueBackups/`. They are deliberately outside the repository, with restrictive file permissions. Preserve an encrypted offsite copy.

The helper invokes Supabase's documented roles/schema/data dump commands. It does not change any production data. It does **not** download Supabase Storage binary files, dashboard configuration, Auth email settings, or API secrets. Keep the backup private because it may contain sensitive account information.

Source documentation: [CLI database backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [Supabase free-project backup policy](https://supabase.com/docs/guides/platform/backups).

## Restore test: release gate

Restore the roles, schema, and data to **a separate disposable instance**, never over Barkada League's production database. Follow [Supabase's official restore instructions](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). Account for Supabase-managed schemas, extensions, and PostgreSQL version differences.

Verify restored application tables have **6 players, 1 season, and 15 matches**, with all original IDs, scores, dates, winner references, and sequence next-values. At the previous capture, the sequence last-values were 9, 1, 39, respectively. Supabase Auth had zero users at that time. Do not proceed if your current database differs from those expectations without understanding the changes.

To preserve access to the original records, do not merge or deploy the new API/frontend independently. The temporary Vercel production deployment uses old frontend commit `5e44bda` to match the still-running Render legacy API.

## Coordinated cutover once verified

1. Confirm a full backup and a successful test restoration.
2. Fix Render deployment drift and securely configure the Barkada League PostgreSQL connection, Supabase Auth variables and frontend-origin allowlist. Do not put secrets into GitHub or chat.
3. Arrange maintenance / stop writes. Recheck record counts and repeat backup if records changed.
4. Apply `database/migrations/20261103_multileague_foundation.sql` once.
5. Deploy the updated Render backend and Phase 2 Vercel frontend together.
6. Run `BARKADA_API_URL=https://barkada-league-api.onrender.com node server/scripts/smoke.mjs` and browser tests for login, ownership, demo read-only access, and cross-league isolation.
7. Re-run Supabase security advisors and confirm RLS is enabled with direct Data API access restricted.

**Known critical risk:** RLS is presently disabled on public.players, public.seasons, public.matches. The old backend is also a legacy, unauthenticated API. Avoid treating it as safe for public writes until the release is completed.

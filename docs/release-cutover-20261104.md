# Barkada League cutover checklist — November 4, 2026

**Status: NOT RELEASED.** Production remains on the Phase 1 merge commit with the legacy React client.
Keep PR #2 as a draft until the API, schema, and client work together.

## Evidence from live services

- Supabase project `fwazvwgyzxpjmycuazcp` was ACTIVE_HEALTHY.
- Before migration: `players=6`, `seasons=1`, `matches=15`, `auth.users=0`.
- Integrity: no tied scores, invalid winners or broken foreign keys.
- Supabase migration history empty; only original 3 tables exist.
- The existing 3 public tables have RLS **disabled**. The Phase 1 migration enables RLS and revokes PostgREST access; do not create public all-access policies.
- The one-time migration `database/migrations/20261103_multileague_foundation.sql` passed a transaction-only test against the real existing schema; all 22 records retained their original IDs; rollback left no schema changes.
- An application-table snapshot ZIP exists as a conversation attachment dated November 4, 2026 with `restore.sql`, CSVs, and original sequence states. **It is not a complete Supabase backup**; do not check it into a public GitHub repository.
- Vercel production uses old React frontend, commit `12b7e331a02b7269432e5eac2d771db3e22d2628`.
- Phase 2 Vercel preview has branch-scoped `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, plus an existing shared `VITE_API_URL`. **The production Supabase frontend variables were also configured on November 4.** No production deployment was triggered; the latest production deployment still runs the Phase 1 frontend.
- A standard Vercel SPA rewrite is in `vercel.json` to support deep links.
- Render's backend service configuration and version are not yet verified from an authorized integration.

## 1. Complete backup and test restore (required)

- [ ] Capture a complete logical backup of the live Supabase database before production migration, using Supabase CLI with a secure project connection.
- [ ] Store the backup off the repository, and test a restore to a **separate empty environment**.
- [ ] Confirm restored row counts and sequence states match the pre-migration manifest. The November 4 ZIP passed CRC, SHA-256, and individual CSV row-count verification; **a full-database backup and independent test restore are still missing**.
- [ ] Review the entire migration, and keep the old production backup available for rollback.

Supabase recommends exporting free-project data yourself. Suggested CLI workflow, after `supabase db dump --help`:

```bash
npx supabase login
npx supabase link --project-ref fwazvwgyzxpjmycuazcp
npx supabase db dump --linked -f barkada-full-schema.sql
npx supabase db dump --linked --data-only -f barkada-full-data.sql
```

Never commit backups, database passwords, or access tokens.

## 2. Configure integrations

- [ ] Confirm Render workspace: the connected account lists only `My Workspace` (ID `tea-d9vuo1rl550s73c5tdfg`), but Render explicitly requires the user to choose the workspace before tools can read or change services. Once confirmed, inspect `barkada-league-api` service, deployed code and build command.
- [ ] Set server `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to **this project's** values, not the EasyBooks or SourceMind project.
- [ ] Confirm server `DATABASE_URL` points to Barkada League and uses a role authorized to reach protected tables.
- [ ] Set `FRONTEND_ORIGIN` to the exact production Vercel origin and any preview origins to be tested.
- [ ] Configure Supabase Auth Email/Password, allowed redirect URL (`/login`), and appropriate SMTP / rate limits.
- [x] Configure Vercel **production** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. These environment variables will take effect only on a future deployment; do not merge or deploy until Render and migration steps are ready.
- [ ] Ensure `VITE_API_URL` is the correct Render URL without an `/api` suffix.

## 3. Staging end-to-end checks

- [ ] Run schema migration on staging and check that all 22 demo records remain intact.
- [ ] Run the **read-only** script: `BARKADA_API_URL=https://STAGING_BACKEND node server/scripts/smoke.mjs`.
- [ ] Sign up, confirm email if enabled, sign in, and sign out.
- [ ] Create two test users, two **private** leagues, add players/seasons, and record a match.
- [ ] As user A, verify access to user B's private league by guessed ID is denied on reads and writes.
- [ ] Anonymous user must read the public demo but **never** create, edit or delete demo data.
- [ ] Test refresh/deep links, leaderboard calculations, match edits and pagination in the Vercel preview.
- [ ] Verify Supabase security advisors after migration; confirm RLS is enabled and PostgREST cannot bypass Express authorization.
- [ ] Resolve existing `server/src/db.js` TLS certificate verification configuration before production signoff.

## 4. Coordinated production cutover

1. Announce a maintenance window and restrict writes during backup/migration.
2. Verify fresh production backup and restore readiness.
3. Apply reviewed migration once and immediately verify counts and RLS.
4. Configure and deploy Render backend with the new env variables.
5. Deploy **PR #2** frontend and confirm correct Vite Auth variables and API origin.
6. Run the read-only smoke checks and full browser login / league / results flow.
7. Only then consider the release complete.

**Rollback:** If the migration has introduced user-owned league data, do not simply drop the `league_id` columns or deploy the old backend. Restore from the complete backup following a reviewed recovery plan. The application-table snapshot alone is insufficient for full project recovery.

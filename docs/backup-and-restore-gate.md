# Barkada League: Docker-free backup using GitHub Actions

**Status as of November 4, 2026:** Encrypted application database backup and isolated PostgreSQL restore **PASSED** in [GitHub Actions run #41800099546](https://github.com/Technix19/Barkada_League/actions/runs/41800099546). Artifact `barkada-encrypted-pre-migration-backup` is available until **November 18, 2026**. The user should download and retain an offsite copy with their passphrase. Production multi-league migration remains **unapplied**.

This workflow requires **no Docker installation on your laptop**. GitHub-hosted Linux runners supply Docker and PostgreSQL 17 in the cloud. The backup and a test restoration run there. The workflow exists only on the draft `chore/release-backup-safety-20261104` branch and does not affect Vercel production.

At the time of backup validation, the project had **6 players, 1 season, 15 matches, zero Auth users, zero Storage buckets, and zero Storage objects**. The separate test restore verified table record counts, sequence values, and integrity. The backup is limited to the `public` schema; dashboard configuration, auth/storage settings, and platform internals are outside scope.

## One-time user setup in GitHub

Go to [Barkada_League repository Settings → Secrets and variables → Actions](https://github.com/Technix19/Barkada_League/settings/secrets/actions). Create **two repository secrets**:

| Secret | Value |
|---|---|
| `BARKADA_DB_URL` | Full **Session pooler** database connection URI from **Barkada League's** [Supabase Connect panel](https://supabase.com/dashboard/project/fwazvwgyzxpjmycuazcp), including the database password. The URI must identify project `fwazvwgyzxpjmycuazcp`. Use the project owner account in Portfolio 2. |
| `BARKADA_BACKUP_PASSPHRASE` | A unique, long random passphrase from your password manager. This encrypts the backup file before it leaves the GitHub runner. Store it safely; without it you cannot decrypt the backup. |

Do **not** paste these secrets into ChatGPT or commit them into files. Never put database credentials in the public repo or a pull request.

Once both secrets exist, **ask ChatGPT to trigger the backup**, or edit a comment in `.github/workflows/barkada-cloud-backup.yml` on the **backup branch** and commit the edit directly to that branch. Its branch-only `push` trigger starts the workflow. Do not merge the draft PR to trigger it.

Track the run under [GitHub Actions](https://github.com/Technix19/Barkada_League/actions). After it passes, download the artifact named `barkada-encrypted-pre-migration-backup` (available for 14 days) and preserve an offsite copy.

## What the workflow does

- Rejects a database URL that does not identify the **Barkada League** Supabase project.
- Uses a GitHub-hosted runner's Docker runtime and PostgreSQL 17 to make a **read-only** logical dump of the complete `public` schema, including its table definitions, constraints, sequences, and application data.
- Checks that `auth.users` is **empty**. If there are Auth users, it stops rather than falsely claiming to capture all user identity data; an Auth-aware backup is then required.
- Restores the application dump into a completely separate, disposable PostgreSQL 17 service on the same runner.
- Verifies **6 players, 1 season, 15 matches**, known sequence values, and referential and winner integrity after restoration. If data has changed since the last snapshot, the job fails safely; review differences before proceeding.
- Creates a checksum and manifest, encrypts the archive with GPG AES-256 using the passphrase secret, and uploads **only the encrypted archive**. The unencrypted database files remain inside the ephemeral runner and are not uploaded.

**Scope:** This is a restorable **application database backup**, not a full Supabase platform snapshot. It does not include Storage object files, Auth provider configuration, API secrets, SMTP settings, and other platform-managed resources. At the last check, there were zero Auth users. For general Supabase logical backup guidance see [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups).

## Decrypt later

After downloading the artifact and unzipping the GitHub artifact container, decrypt the contained `.gpg` file on a trusted machine with GPG:

```bash
gpg --decrypt --output barkada-application-backup.tar.gz \
  barkada-application-backup.tar.gz.gpg
tar -tzf barkada-application-backup.tar.gz
```

The GPG prompt will ask for `BARKADA_BACKUP_PASSPHRASE`; never expose the plaintext archive publicly.

## Production cutover after verification

1. Ensure the encrypted backup artifact exists, its restore check passed, and a secured offsite copy is retained.
2. Confirm Render's backend environment and `DATABASE_URL` point at this project; configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `FRONTEND_ORIGIN` via Render's secure dashboard. No secrets belong in source code.
3. Arrange a maintenance window, pause writes, and retake a backup if production records change.
4. Apply `database/migrations/20261103_multileague_foundation.sql` exactly once to Barkada League's database.
5. Deploy the modern backend and Vercel Phase 2 frontend as a coordinated release.
6. Run `BARKADA_API_URL=https://barkada-league-api.onrender.com node server/scripts/smoke.mjs` and the complete signup/private-league isolation checks.
7. Run Supabase security advisors; confirm the migration enabled RLS on all six public tables and blocked direct Data API access.

**Current critical risk:** Existing `public.players`, `public.seasons`, and `public.matches` have RLS disabled. The pre-upgrade backend is also a legacy unauthenticated API. Neither should be considered secure for untrusted public writes.

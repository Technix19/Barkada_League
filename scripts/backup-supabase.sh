#!/usr/bin/env bash
# Barkada League: logical database backup before the multi-league migration.
# Requires: Docker Desktop, Supabase CLI through npx, authorized Supabase login.
# Backup files are intentionally written OUTSIDE the GitHub working tree.
set -Eeuo pipefail

PROJECT_REF="fwazvwgyzxpjmycuazcp"
REPO_ROOT="$(cd -- "$(dirname -- "$0")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$HOME/BarkadaLeagueBackups/$STAMP"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
command -v node >/dev/null || fail "Node.js is required."
command -v npx >/dev/null || fail "npx is required."
command -v docker >/dev/null || fail "Docker Desktop is required for the Supabase CLI dump."
docker info >/dev/null 2>&1 || fail "Start Docker Desktop, then retry."

cd "$REPO_ROOT"
if [[ ! -f supabase/config.toml ]]; then
  printf 'Initializing local Supabase CLI config.\n'
  npx supabase init
fi

printf 'Supabase CLI version:\n'
npx supabase --version
printf '\nSign in with the account that can access Barkada League (Portfolio 2).\n'
printf 'You may be prompted for authentication and a database password.\n'
npx supabase login
# Explicit project ref prevents accidentally dumping EasyBooks or SourceMind.
npx supabase link --project-ref "$PROJECT_REF"

umask 077
mkdir -p "$DEST"
chmod 700 "$DEST"
printf 'Writing backup outside Git: %s\n' "$DEST"

npx supabase db dump --linked --role-only -f "$DEST/roles.sql"
npx supabase db dump --linked -f "$DEST/schema.sql"
npx supabase db dump --linked --use-copy --data-only \
  -x "storage.buckets_vectors" -x "storage.vector_indexes" \
  -f "$DEST/data.sql"

for file in roles.sql schema.sql data.sql; do
  [[ -s "$DEST/$file" ]] || fail "$file is missing or empty; do not proceed with migration."
done

{
  printf 'Barkada League logical backup\n'
  printf 'Supabase project ref: %s\n' "$PROJECT_REF"
  printf 'Captured at (UTC): %s\n' "$STAMP"
  printf 'Source repository: Technix19/Barkada_League\n'
  printf 'Contains: roles.sql, schema.sql, data.sql.\n'
  printf 'Not included: Storage files, dashboard settings, API secrets.\n'
  printf 'Restore test: NOT YET PERFORMED. Verify on disposable instance.\n'
} > "$DEST/MANIFEST.txt"

(
  cd "$DEST"
  if command -v shasum >/dev/null; then
    shasum -a 256 roles.sql schema.sql data.sql > SHA256SUMS.txt
  elif command -v sha256sum >/dev/null; then
    sha256sum roles.sql schema.sql data.sql > SHA256SUMS.txt
  else
    fail "SHA-256 checksum tool missing. Verify backup manually."
  fi
)

printf '\nBackup files created:\n'
ls -lh "$DEST/roles.sql" "$DEST/schema.sql" "$DEST/data.sql" "$DEST/SHA256SUMS.txt"
printf '\nIMPORTANT: Test a restoration separately; backup alone is not proof of recoverability.\n'
printf 'Keep files out of GitHub, and never share database passwords.\n'
printf 'Backup directory: %s\n' "$DEST"

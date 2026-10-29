#!/usr/bin/env bash
# Backs up the database and uploaded images into ./backups/<date>/
# Usage:  bash scripts/backup.sh        (run from the ms-mart folder)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source server/.env; set +a
OUT="backups/$(date +%F_%H%M)"
mkdir -p "$OUT"
pg_dump "$DATABASE_URL" > "$OUT/database.sql"
tar -czf "$OUT/uploads.tar.gz" uploads
echo "Backup saved in $OUT"
# Restore:  psql "$DATABASE_URL" < database.sql   and   tar -xzf uploads.tar.gz

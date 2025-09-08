#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for DB at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "DB is up"

# Apply migrations (idempotent)
npx prisma migrate deploy

# Start API
node -r module-alias/register dist/index.js

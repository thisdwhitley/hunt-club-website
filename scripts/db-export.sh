#!/bin/bash
# scripts/db-export.sh - Secure database export script

set -e

# Load environment variables from .env.local
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Create .env.local with your database credentials"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check required variables
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ SUPABASE_DB_PASSWORD not found in .env.local"
    exit 1
fi

echo "🎯 Exporting database schema..."

# Create directory
mkdir -p supabase

# Export schema using PostgreSQL container
podman run --rm \
  -e PGPASSWORD="$SUPABASE_DB_PASSWORD" \
  postgres:17 pg_dump \
  --host="$SUPABASE_DB_HOST" \
  --port="$SUPABASE_DB_PORT" \
  --username="$SUPABASE_DB_USER" \
  --dbname="$SUPABASE_DB_NAME" \
  --schema-only \
  --quote-all-identifiers \
  --exclude-schema="information_schema|pg_*|_analytics|_realtime|_supavisor|auth|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault" \
  > supabase/schema.sql

echo "✅ Schema exported to supabase/schema.sql"
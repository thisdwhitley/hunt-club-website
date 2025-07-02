#!/bin/bash
# scripts/db-test.sh - Test database connection securely

set -e

# Load environment variables
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

export $(cat .env.local | grep -v '^#' | xargs)

echo "🧪 Testing database connection..."

# Test connection by listing tables
podman run --rm \
  -e PGPASSWORD="$SUPABASE_DB_PASSWORD" \
  postgres:17 psql \
  --host="$SUPABASE_DB_HOST" \
  --port="$SUPABASE_DB_PORT" \
  --username="$SUPABASE_DB_USER" \
  --dbname="$SUPABASE_DB_NAME" \
  -c "\dt"

echo "✅ Database connection successful"
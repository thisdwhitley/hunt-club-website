#!/bin/bash
# scripts/db-types.sh - Regenerate the Database type block in src/types/database.ts
#
# Uses the Supabase CLI to generate fresh types from the live schema, then
# re-attaches the hand-maintained utility aliases that live below the generated
# block. Safe to run after any schema change.

set -e

TARGET="src/types/database.ts"
PROJECT_ID="gmwrrdkuaqqpjponksnv"

# Verify the target file has the expected delimiter so we don't overwrite aliases
if ! grep -q "UTILITY TYPE ALIASES" "$TARGET"; then
  echo "❌ Could not find '// UTILITY TYPE ALIASES' delimiter in $TARGET"
  echo "   The file may have been manually restructured. Aborting."
  exit 1
fi

echo "🔧 Generating TypeScript types from Supabase (project: $PROJECT_ID)..."
GENERATED=$(supabase gen types typescript --project-id "$PROJECT_ID")

# Extract everything from the ===== line immediately before UTILITY TYPE ALIASES
ALIAS_START_LINE=$(grep -n "UTILITY TYPE ALIASES" "$TARGET" | head -1 | cut -d: -f1)
SECTION_START=$((ALIAS_START_LINE - 1))
ALIASES=$(tail -n +"$SECTION_START" "$TARGET")

# Write: header + generated block + preserved aliases
{
  printf '// Generated from Supabase — regenerate with: npm run db:types\n'
  printf '// Do not edit the Database type manually; run db:types to refresh.\n'
  printf '// Hand-maintained utility aliases live below the generated block.\n\n'
  printf '%s\n' "$GENERATED"
  printf '\n'
  printf '%s\n' "$ALIASES"
} > "$TARGET"

echo "✅ $TARGET regenerated."
echo "   Run: npm run type-check"

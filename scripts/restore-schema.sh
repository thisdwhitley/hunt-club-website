# restore-schema.sh - Restore schema from git history
#!/bin/bash

# Script to restore schema from a specific git commit
# Usage: ./scripts/restore-schema.sh [commit-hash]

set -e

COMMIT=${1:-HEAD}

echo "🎯 Restoring schema from commit: $COMMIT"

if [ "$COMMIT" != "HEAD" ]; then
    echo "⚠️  This will restore your schema to an earlier state!"
    echo -n "Are you sure? (y/N): "
    read -r confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
fi

# Get schema from git history
git show "$COMMIT:supabase/schema.sql" > /tmp/restore_schema.sql

echo "Schema from commit $COMMIT saved to /tmp/restore_schema.sql"
echo ""
echo "To apply this schema:"
echo "  1. Review the file: cat /tmp/restore_schema.sql"
echo "  2. Apply via Supabase dashboard or CLI"
echo "  3. Run: npm run db:sync 'Restored schema from $COMMIT'"
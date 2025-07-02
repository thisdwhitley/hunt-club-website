# watch-db.sh - Watch for schema changes (optional)
#!/bin/bash

# Simple script to periodically check for schema changes
# Useful during active development

INTERVAL=${1:-30}  # Default 30 seconds

echo "🎯 Watching for database changes every ${INTERVAL} seconds..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
    # Export current schema to temp file
    supabase db dump --schema-only > /tmp/hunting_club_schema_temp.sql 2>/dev/null
    
    # Compare with existing schema
    if [ -f supabase/schema.sql ]; then
        if ! diff -q supabase/schema.sql /tmp/hunting_club_schema_temp.sql > /dev/null 2>&1; then
            echo "🔄 Schema changes detected at $(date)"
            echo "Run 'npm run db:sync' to update documentation"
            echo ""
        fi
    fi
    
    sleep "$INTERVAL"
done

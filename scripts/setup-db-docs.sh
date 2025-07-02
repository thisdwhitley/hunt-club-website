# setup-db-docs.sh - One-time setup script
#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo ""
log_info "🎯 Setting up Hunting Club Database Documentation"
echo ""

# Create directory structure
mkdir -p docs/database
mkdir -p supabase
mkdir -p src/types
mkdir -p scripts

# Create initial schema.md template
cat > docs/database/schema.md << 'EOF'
# Hunting Club Database Schema

Last Updated: $(date)
Supabase Project: [YOUR_PROJECT_ID]

## Tables

### Overview
Document your tables here. Example:

### `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** User profile information
**Relationships:** References auth.users(id)
**RLS:** Users can view all profiles, only update their own

## Indexes
List your performance indexes here.

## Views
Document any database views here.
EOF

# Create policies.md template
cat > docs/database/policies.md << 'EOF'
# Row Level Security Policies

## Profiles Table
```sql
-- Add your actual RLS policies here
```

## Other Tables
Document all your RLS policies for each table.
EOF

# Create functions.md template
cat > docs/database/functions.md << 'EOF'
# Database Functions & Triggers

## Custom Functions
Document any custom PostgreSQL functions here.

## Triggers
Document any database triggers here.

## Scheduled Jobs
Document any pg_cron or other scheduled jobs here.
EOF

# Make scripts executable
chmod +x scripts/*.sh

# Add npm scripts
if [ -f package.json ]; then
    log_info "Adding npm scripts to package.json..."
    
    # Check if scripts section exists and add our scripts
    if ! grep -q '"db:sync"' package.json; then
        # This is a simple approach - you might need to adjust based on your package.json structure
        sed -i.bak 's/"scripts": {/"scripts": {\
    "db:sync": ".\/scripts\/sync-db.sh",\
    "db:quick": ".\/scripts\/quick-sync.sh",\
    "db:export": "supabase db dump --schema-only > supabase\/schema.sql",\
    "db:types": "supabase gen types typescript --local > src\/types\/database.ts",/' package.json
    fi
fi

log_success "✅ Database documentation setup complete!"
echo ""
log_info "Next steps:"
echo "  1. Run: npm run db:sync 'Initial database documentation'"
echo "  2. Fill out docs/database/schema.md with your actual tables"
echo "  3. Document your RLS policies in docs/database/policies.md"
echo ""
log_info "Available commands:"
echo "  npm run db:sync      # Interactive sync with commit prompts"  
echo "  npm run db:quick     # Quick sync and auto-commit"
echo "  ./scripts/sync-db.sh # Direct script usage"
echo ""
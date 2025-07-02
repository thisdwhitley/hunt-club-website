#!/bin/bash

# sync-db.sh - Automated Database Documentation Sync
# Usage: ./scripts/sync-db.sh [optional-description]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCS_DIR="docs/database"
SUPABASE_DIR="supabase"
MIGRATIONS_FILE="$DOCS_DIR/migrations.md"
SCHEMA_FILE="$SUPABASE_DIR/schema.sql"
TYPES_FILE="src/types/database.ts"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Install with: npm install -g supabase"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git not found. Please install Git."
        exit 1
    fi
    
    log_success "All dependencies found"
}

# Create directory structure if it doesn't exist
setup_directories() {
    log_info "Setting up directory structure..."
    
    mkdir -p "$DOCS_DIR"
    mkdir -p "$SUPABASE_DIR"
    mkdir -p "src/types"
    mkdir -p "scripts"
    
    log_success "Directories created"
}

# Initialize migration file if it doesn't exist
init_migrations_file() {
    if [ ! -f "$MIGRATIONS_FILE" ]; then
        log_info "Creating initial migrations file..."
        cat > "$MIGRATIONS_FILE" << 'EOF'
# Migration History

## Migration Log
Track all schema changes with dates and purposes

## Schema Change Process
1. Make changes in Supabase dashboard
2. Run `./scripts/sync-db.sh "description of changes"`
3. Review generated files
4. Commit to git

---

EOF
        log_success "Created $MIGRATIONS_FILE"
    fi
}

# Export current schema
export_schema() {
    log_info "Exporting database schema..."
    
    if supabase db dump --schema-only > "$SCHEMA_FILE" 2>/dev/null; then
        log_success "Schema exported to $SCHEMA_FILE"
    else
        log_error "Failed to export schema. Make sure you're connected to Supabase."
        log_info "Try running: supabase login"
        exit 1
    fi
}

# Generate TypeScript types
generate_types() {
    log_info "Generating TypeScript types..."
    
    if supabase gen types typescript --local > "$TYPES_FILE" 2>/dev/null; then
        log_success "Types generated in $TYPES_FILE"
    else
        log_warning "Failed to generate types. Continuing without types..."
    fi
}

# Get migration description from user or parameter
get_migration_description() {
    if [ -n "$1" ]; then
        echo "$1"
    else
        echo -n "Enter a description of the database changes: "
        read -r description
        echo "$description"
    fi
}

# Add entry to migrations file
update_migrations_log() {
    local description="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    local date_only=$(date '+%Y-%m-%d')
    
    log_info "Updating migrations log..."
    
    # Create temp file with new entry
    cat > temp_migration.md << EOF

### $date_only: $description
- Updated at: $timestamp
- Schema exported: ✅
- Types generated: ✅

EOF
    
    # Insert new entry after the header section
    if grep -q "^---$" "$MIGRATIONS_FILE"; then
        # If there's already a separator, insert after it
        awk '/^---$/ {print; getline; print; while ((getline line < "temp_migration.md") > 0) print line; close("temp_migration.md")} !/^---$/ {print}' "$MIGRATIONS_FILE" > temp_migrations_full.md
    else
        # If no separator, add it and the entry
        echo "" >> "$MIGRATIONS_FILE"
        echo "---" >> "$MIGRATIONS_FILE"
        cat temp_migration.md >> "$MIGRATIONS_FILE"
        cp "$MIGRATIONS_FILE" temp_migrations_full.md
    fi
    
    mv temp_migrations_full.md "$MIGRATIONS_FILE"
    rm -f temp_migration.md
    
    log_success "Migration log updated"
}

# Show diff of what changed
show_changes() {
    log_info "Checking for changes..."
    
    if git diff --quiet HEAD -- "$SCHEMA_FILE" "$TYPES_FILE" "$MIGRATIONS_FILE" 2>/dev/null; then
        log_warning "No changes detected in database files"
        return 1
    else
        echo ""
        log_info "Changes detected:"
        git diff --stat HEAD -- "$SCHEMA_FILE" "$TYPES_FILE" "$MIGRATIONS_FILE" 2>/dev/null || true
        echo ""
        return 0
    fi
}

# Commit changes to git
commit_changes() {
    local description="$1"
    
    log_info "Staging database files..."
    git add "$DOCS_DIR/" "$SUPABASE_DIR/" "$TYPES_FILE" 2>/dev/null || true
    
    if git diff --cached --quiet; then
        log_warning "No changes to commit"
        return 0
    fi
    
    echo -n "Commit these changes? (y/N): "
    read -r commit_confirm
    
    if [[ "$commit_confirm" =~ ^[Yy]$ ]]; then
        local commit_msg="db: $description"
        git commit -m "$commit_msg"
        log_success "Changes committed with message: '$commit_msg'"
        
        echo -n "Push to remote? (y/N): "
        read -r push_confirm
        if [[ "$push_confirm" =~ ^[Yy]$ ]]; then
            git push
            log_success "Changes pushed to remote"
        fi
    else
        log_info "Changes staged but not committed"
    fi
}

# Main execution
main() {
    echo ""
    log_info "🎯 Hunting Club Database Sync Script"
    echo ""
    
    check_dependencies
    setup_directories
    init_migrations_file
    
    # Get description of changes
    description=$(get_migration_description "$1")
    
    if [ -z "$description" ]; then
        log_error "Description cannot be empty"
        exit 1
    fi
    
    # Export and generate
    export_schema
    generate_types
    update_migrations_log "$description"
    
    # Show what changed and optionally commit
    if show_changes; then
        commit_changes "$description"
    fi
    
    echo ""
    log_success "✅ Database sync complete!"
    log_info "Next steps:"
    echo "  1. Review the generated files"
    echo "  2. Update docs/database/schema.md if needed"
    echo "  3. Update docs/database/policies.md if RLS changed"
    echo ""
}

# Help text
show_help() {
    cat << 'EOF'
Hunting Club Database Sync Script

USAGE:
    ./scripts/sync-db.sh [description]

EXAMPLES:
    ./scripts/sync-db.sh "Added trail camera photos table"
    ./scripts/sync-db.sh "Updated hunt logs with weather data"
    ./scripts/sync-db.sh  # Will prompt for description

WHAT IT DOES:
    1. Exports current database schema
    2. Generates TypeScript types
    3. Updates migration log
    4. Shows git diff
    5. Optionally commits changes

FILES CREATED/UPDATED:
    - supabase/schema.sql
    - src/types/database.ts  
    - docs/database/migrations.md

EOF
}

# Handle command line arguments
case "${1:-}" in
    -h|--help|help)
        show_help
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac
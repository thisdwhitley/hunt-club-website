#!/bin/bash
# scripts/setup-env.sh - Setup environment variables securely

echo "🔐 Setting up secure database environment..."

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists"
    echo "Do you want to add database credentials? (y/N)"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo ""
echo "Enter your Supabase database credentials:"
echo "(You can find these in your Supabase dashboard → Settings → Database)"
echo ""

echo -n "Database Host: "
read -r DB_HOST

echo -n "Database Port (usually 5432): "
read -r DB_PORT

echo -n "Database User (postgres.xxxxx): "
read -r DB_USER

echo -n "Database Password: "
read -rs DB_PASSWORD
echo ""

echo -n "Database Name (usually postgres): "
read -r DB_NAME

# Create .env.local
cat > .env.local << EOF
# Supabase Database Configuration
# Keep this file secure and never commit to git!
SUPABASE_DB_HOST="$DB_HOST"
SUPABASE_DB_PORT="$DB_PORT"
SUPABASE_DB_USER="$DB_USER"
SUPABASE_DB_PASSWORD="$DB_PASSWORD"
SUPABASE_DB_NAME="$DB_NAME"
SUPABASE_DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Add your other environment variables below:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF

# Ensure .env.local is in .gitignore
if ! grep -q "\.env\.local" .gitignore 2>/dev/null; then
    echo ".env.local" >> .gitignore
    echo "✅ Added .env.local to .gitignore"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Files created:"
echo "  - .env.local (with your credentials)"
echo "  - .gitignore updated"
echo ""
echo "Test your setup with:"
echo "  npm run db:test"
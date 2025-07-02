#!/bin/bash
# scripts/db-types.sh - Generate TypeScript types securely

set -e

# Load environment variables
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

export $(cat .env.local | grep -v '^#' | xargs)

if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ SUPABASE_DB_URL not found in .env.local"
    exit 1
fi

echo "🔧 Generating TypeScript types..."

# Create directory
mkdir -p src/types

# Try different approaches to bypass Docker issues
echo "Attempting type generation (this may take a moment)..."

# Method 1: Try with --linked=false flag
if supabase gen types typescript --db-url "$SUPABASE_DB_URL" --linked=false > src/types/database.ts 2>/dev/null; then
    echo "✅ Types generated successfully with --linked=false"
    exit 0
fi

# Method 2: Try basic command
if supabase gen types typescript --db-url "$SUPABASE_DB_URL" > src/types/database.ts 2>/dev/null; then
    echo "✅ Types generated successfully"
    exit 0
fi

# Method 3: Try from container (using Supabase CLI in container)
echo "⚠️  Host CLI failed, trying container approach..."
if podman run --rm \
    -e SUPABASE_DB_URL="$SUPABASE_DB_URL" \
    -v $(pwd)/src/types:/output:Z \
    node:18-alpine sh -c "npm install -g supabase@latest && supabase gen types typescript --db-url \$SUPABASE_DB_URL > /output/database.ts" 2>/dev/null; then
    echo "✅ Types generated via container"
    exit 0
fi

# Method 4: Fallback message
echo "⚠️  Automatic type generation failed due to Docker requirements"
echo "📝 Creating basic type template..."

# Create a basic template based on the schema we know
cat > src/types/database.ts << 'EOF'
// Generated type definitions for Supabase
// This is a basic template - regenerate when schema changes

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'member'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stands: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string
          active: boolean
          latitude: number | null
          longitude: number | null
          // Add other stand fields as needed
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type?: string
          active?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string
          active?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      hunt_logs: {
        Row: {
          id: string
          member_id: string
          stand_id: string | null
          hunt_date: string
          harvest_count: number
          game_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          stand_id?: string | null
          hunt_date: string
          harvest_count?: number
          game_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          stand_id?: string | null
          hunt_date?: string
          harvest_count?: number
          game_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_level: 'easy' | 'moderate' | 'difficult'
      hunting_season: 'early_season' | 'mid_season' | 'late_season' | 'all_season'
      stand_condition: 'excellent' | 'good' | 'fair' | 'needs_repair' | 'unsafe'
      stand_style: 'tree_stand' | 'ground_blind' | 'elevated_box' | 'ladder_stand' | 'climbing_stand' | 'popup_blind' | 'permanent_blind'
      time_of_day: 'morning' | 'evening' | 'all_day'
      wind_direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
    }
  }
}
EOF

echo "📝 Basic type template created"
echo ""
echo "To generate complete types:"
echo "1. Install Docker Desktop, OR"
echo "2. Manually run: supabase gen types typescript --db-url [your-url]"
echo "3. Or regenerate types when Docker issues are resolved"
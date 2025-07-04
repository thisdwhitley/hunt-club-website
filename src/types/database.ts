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

// Generated type definitions for Supabase
// Updated with hunt logging system - Phase 1 Complete

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
      members: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: string
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
          created_at: string
          updated_at: string
          last_hunted: string | null
          total_hunts: number | null
          total_harvests: number | null
          last_harvest: string | null
          success_rate: number | null
          last_hunted_by: string | null
          last_harvest_by: string | null
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
          last_hunted?: string | null
          total_hunts?: number | null
          total_harvests?: number | null
          last_harvest?: string | null
          success_rate?: number | null
          last_hunted_by?: string | null
          last_harvest_by?: string | null
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
          last_hunted?: string | null
          total_hunts?: number | null
          total_harvests?: number | null
          last_harvest?: string | null
          success_rate?: number | null
          last_hunted_by?: string | null
          last_harvest_by?: string | null
        }
      }
      // =====================================================
      // HUNT LOGGING SYSTEM - Phase 1 Complete
      // =====================================================
      hunt_logs: {
        Row: {
          id: string
          member_id: string
          stand_id: string | null
          hunt_date: string
          start_time: string | null
          end_time: string | null
          weather_conditions: Json | null
          temperature_high: number | null
          temperature_low: number | null
          wind_speed: number | null
          wind_direction: string | null
          precipitation: number | null
          moon_phase: string | null
          harvest_count: number
          game_type: string | null
          notes: string | null
          photos: string[] | null
          // Auto-population fields added in Phase 1
          hunt_type: string | null
          moon_illumination: number | null
          sunrise_time: string | null
          sunset_time: string | null
          hunting_season: string | null
          property_sector: string | null
          hunt_duration_minutes: number | null
          had_harvest: boolean | null
          weather_fetched_at: string | null
          stand_coordinates: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          stand_id?: string | null
          hunt_date: string
          start_time?: string | null
          end_time?: string | null
          weather_conditions?: Json | null
          temperature_high?: number | null
          temperature_low?: number | null
          wind_speed?: number | null
          wind_direction?: string | null
          precipitation?: number | null
          moon_phase?: string | null
          harvest_count?: number
          game_type?: string | null
          notes?: string | null
          photos?: string[] | null
          // Auto-population fields
          hunt_type?: string | null
          moon_illumination?: number | null
          sunrise_time?: string | null
          sunset_time?: string | null
          hunting_season?: string | null
          property_sector?: string | null
          hunt_duration_minutes?: number | null
          had_harvest?: boolean | null
          weather_fetched_at?: string | null
          stand_coordinates?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          stand_id?: string | null
          hunt_date?: string
          start_time?: string | null
          end_time?: string | null
          weather_conditions?: Json | null
          temperature_high?: number | null
          temperature_low?: number | null
          wind_speed?: number | null
          wind_direction?: string | null
          precipitation?: number | null
          moon_phase?: string | null
          harvest_count?: number
          game_type?: string | null
          notes?: string | null
          photos?: string[] | null
          // Auto-population fields
          hunt_type?: string | null
          moon_illumination?: number | null
          sunrise_time?: string | null
          sunset_time?: string | null
          hunting_season?: string | null
          property_sector?: string | null
          hunt_duration_minutes?: number | null
          had_harvest?: boolean | null
          weather_fetched_at?: string | null
          stand_coordinates?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      hunt_harvests: {
        Row: {
          id: string
          hunt_log_id: string
          animal_type: string
          gender: string | null
          estimated_age: string | null
          estimated_weight: number | null
          shot_distance_yards: number | null
          weapon_used: string | null
          shot_placement: string | null
          tracking_time_minutes: number | null
          tracking_distance_yards: number | null
          recovery_notes: string | null
          field_dressed_weight: number | null
          antler_points: number | null
          antler_spread_inches: number | null
          hide_condition: string | null
          meat_condition: string | null
          photos: string[] | null
          processor_name: string | null
          processing_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hunt_log_id: string
          animal_type: string
          gender?: string | null
          estimated_age?: string | null
          estimated_weight?: number | null
          shot_distance_yards?: number | null
          weapon_used?: string | null
          shot_placement?: string | null
          tracking_time_minutes?: number | null
          tracking_distance_yards?: number | null
          recovery_notes?: string | null
          field_dressed_weight?: number | null
          antler_points?: number | null
          antler_spread_inches?: number | null
          hide_condition?: string | null
          meat_condition?: string | null
          photos?: string[] | null
          processor_name?: string | null
          processing_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hunt_log_id?: string
          animal_type?: string
          gender?: string | null
          estimated_age?: string | null
          estimated_weight?: number | null
          shot_distance_yards?: number | null
          weapon_used?: string | null
          shot_placement?: string | null
          tracking_time_minutes?: number | null
          tracking_distance_yards?: number | null
          recovery_notes?: string | null
          field_dressed_weight?: number | null
          antler_points?: number | null
          antler_spread_inches?: number | null
          hide_condition?: string | null
          meat_condition?: string | null
          photos?: string[] | null
          processor_name?: string | null
          processing_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hunt_sightings: {
        Row: {
          id: string
          hunt_log_id: string
          animal_type: string
          count: number | null
          gender: string | null
          estimated_age: string | null
          behavior: string | null
          distance_yards: number | null
          direction: string | null
          time_observed: string | null
          notes: string | null
          photos: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hunt_log_id: string
          animal_type: string
          count?: number | null
          gender?: string | null
          estimated_age?: string | null
          behavior?: string | null
          distance_yards?: number | null
          direction?: string | null
          time_observed?: string | null
          notes?: string | null
          photos?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hunt_log_id?: string
          animal_type?: string
          count?: number | null
          gender?: string | null
          estimated_age?: string | null
          behavior?: string | null
          distance_yards?: number | null
          direction?: string | null
          time_observed?: string | null
          notes?: string | null
          photos?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      // Existing tables preserved
      food_plots: {
        Row: {
          id: string
          name: string
          description: string | null
          latitude: number
          longitude: number
          plot_type: string | null
          size_acres: number | null
          crop_type: string | null
          planting_date: string | null
          last_maintained: string | null
          soil_type: string | null
          active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          latitude: number
          longitude: number
          plot_type?: string | null
          size_acres?: number | null
          crop_type?: string | null
          planting_date?: string | null
          last_maintained?: string | null
          soil_type?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          latitude?: number
          longitude?: number
          plot_type?: string | null
          size_acres?: number | null
          crop_type?: string | null
          planting_date?: string | null
          last_maintained?: string | null
          soil_type?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trails: {
        Row: {
          id: string
          name: string
          description: string | null
          path_coordinates: Json
          trail_type: string | null
          difficulty: string | null
          length_miles: number | null
          surface_type: string | null
          active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          path_coordinates: Json
          trail_type?: string | null
          difficulty?: string | null
          length_miles?: number | null
          surface_type?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          path_coordinates?: Json
          trail_type?: string | null
          difficulty?: string | null
          length_miles?: number | null
          surface_type?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          assigned_to: string | null
          priority: string
          status: string
          due_date: string | null
          category: string
          location: string | null
          estimated_hours: number | null
          actual_hours: number | null
          notes: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assigned_to?: string | null
          priority?: string
          status?: string
          due_date?: string | null
          category?: string
          location?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assigned_to?: string | null
          priority?: string
          status?: string
          due_date?: string | null
          category?: string
          location?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =====================================================
// HUNT LOGGING UTILITY TYPES
// =====================================================

// Type aliases for better developer experience
export type HuntLog = Database['public']['Tables']['hunt_logs']['Row']
export type HuntLogInsert = Database['public']['Tables']['hunt_logs']['Insert']
export type HuntLogUpdate = Database['public']['Tables']['hunt_logs']['Update']

export type HuntHarvest = Database['public']['Tables']['hunt_harvests']['Row']
export type HuntHarvestInsert = Database['public']['Tables']['hunt_harvests']['Insert']
export type HuntHarvestUpdate = Database['public']['Tables']['hunt_harvests']['Update']

export type HuntSighting = Database['public']['Tables']['hunt_sightings']['Row']
export type HuntSightingInsert = Database['public']['Tables']['hunt_sightings']['Insert']
export type HuntSightingUpdate = Database['public']['Tables']['hunt_sightings']['Update']

// Existing utility types
export type Member = Database['public']['Tables']['members']['Row']
export type Stand = Database['public']['Tables']['stands']['Row']
export type MaintenanceTask = Database['public']['Tables']['maintenance_tasks']['Row']

// Hunt-specific enums for validation
export type HuntType = 'AM' | 'PM' | 'All Day'
export type AnimalGender = 'Buck' | 'Doe' | 'Mixed' | 'Unknown'
export type HuntDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'Unknown'
export type ConditionRating = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged'

// src/lib/types/database.ts - UPDATED to extend existing structure
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Updated enum types for enhanced stand management
export type HuntingSeason = 'archery' | 'blackpowder' | 'gun' | 'all_seasons';
export type StandStyle = 'tree_stand' | 'ground_blind' | 'elevated_box' | 'ladder_stand' | 'climbing_stand' | 'popup_blind' | 'permanent_blind';
export type StandCondition = 'excellent' | 'good' | 'fair' | 'needs_repair' | 'unsafe';
export type DifficultyLevel = 'easy' | 'moderate' | 'difficult';
export type TimeOfDay = 'morning' | 'evening' | 'all_day';
export type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface Database {
  public: {
    Tables: {
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
      // ENHANCED STANDS TABLE with all hunting stand management fields
      stands: {
        Row: {
          id: string
          name: string
          description: string | null
          latitude: number | null
          longitude: number | null
          type: string
          active: boolean
          // Enhanced fields for hunting stand management
          trail_name: string | null
          walking_time_minutes: number | null
          difficulty_level: DifficultyLevel | null
          access_notes: string | null
          height_feet: number | null
          capacity: number | null
          construction_material: string | null
          stand_style: StandStyle | null
          weight_limit_lbs: number | null
          primary_wind_directions: WindDirection[] | null
          game_trails_nearby: boolean | null
          best_time_of_day: TimeOfDay | null
          best_season: HuntingSeason | null
          cover_rating: number | null
          view_distance_yards: number | null
          last_inspection_date: string | null
          condition: StandCondition | null
          maintenance_notes: string | null
          safety_equipment_required: string[] | null
          nearby_water_source: boolean | null
          food_plot_proximity_yards: number | null
          bedding_area_distance_yards: number | null
          trail_camera_coverage: boolean | null
          total_hunts: number | null
          total_harvests: number | null
          last_used_date: string | null
          success_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string
          active?: boolean
          trail_name?: string | null
          walking_time_minutes?: number | null
          difficulty_level?: DifficultyLevel | null
          access_notes?: string | null
          height_feet?: number | null
          capacity?: number | null
          construction_material?: string | null
          stand_style?: StandStyle | null
          weight_limit_lbs?: number | null
          primary_wind_directions?: WindDirection[] | null
          game_trails_nearby?: boolean | null
          best_time_of_day?: TimeOfDay | null
          best_season?: HuntingSeason | null
          cover_rating?: number | null
          view_distance_yards?: number | null
          last_inspection_date?: string | null
          condition?: StandCondition | null
          maintenance_notes?: string | null
          safety_equipment_required?: string[] | null
          nearby_water_source?: boolean | null
          food_plot_proximity_yards?: number | null
          bedding_area_distance_yards?: number | null
          trail_camera_coverage?: boolean | null
          total_hunts?: number | null
          total_harvests?: number | null
          last_used_date?: string | null
          success_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string
          active?: boolean
          trail_name?: string | null
          walking_time_minutes?: number | null
          difficulty_level?: DifficultyLevel | null
          access_notes?: string | null
          height_feet?: number | null
          capacity?: number | null
          construction_material?: string | null
          stand_style?: StandStyle | null
          weight_limit_lbs?: number | null
          primary_wind_directions?: WindDirection[] | null
          game_trails_nearby?: boolean | null
          best_time_of_day?: TimeOfDay | null
          best_season?: HuntingSeason | null
          cover_rating?: number | null
          view_distance_yards?: number | null
          last_inspection_date?: string | null
          condition?: StandCondition | null
          maintenance_notes?: string | null
          safety_equipment_required?: string[] | null
          nearby_water_source?: boolean | null
          food_plot_proximity_yards?: number | null
          bedding_area_distance_yards?: number | null
          trail_camera_coverage?: boolean | null
          total_hunts?: number | null
          total_harvests?: number | null
          last_used_date?: string | null
          success_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      trail_cameras: {
        Row: {
          id: string
          name: string
          description: string | null
          latitude: number
          longitude: number
          type: string
          brand: string | null
          model: string | null
          installation_date: string | null
          last_check_date: string | null
          battery_level: number | null
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
          type?: string
          brand?: string | null
          model?: string | null
          installation_date?: string | null
          last_check_date?: string | null
          battery_level?: number | null
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
          type?: string
          brand?: string | null
          model?: string | null
          installation_date?: string | null
          last_check_date?: string | null
          battery_level?: number | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      food_plots: {
        Row: {
          id: string
          name: string
          description: string | null
          latitude: number
          longitude: number
          plot_type: string
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
          plot_type?: string
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
          plot_type?: string
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
          path_coordinates: Json // Array of [lat, lng] points
          trail_type: string
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
          trail_type?: string
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
          trail_type?: string
          difficulty?: string | null
          length_miles?: number | null
          surface_type?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          start_time: string | null
          end_time: string | null
          event_type: string
          location: string | null
          all_day: boolean
          is_public: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          start_time?: string | null
          end_time?: string | null
          event_type?: string
          location?: string | null
          all_day?: boolean
          is_public?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          event_type?: string
          location?: string | null
          all_day?: boolean
          is_public?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      camp_todos: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          priority: string
          status: string
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string
          priority?: string
          status?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          priority?: string
          status?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
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
      difficulty_level: 'easy' | 'moderate' | 'difficult'
      hunting_season: 'archery' | 'blackpowder' | 'gun' | 'all_seasons'
      stand_condition: 'excellent' | 'good' | 'fair' | 'needs_repair' | 'unsafe'
      stand_style: 'tree_stand' | 'ground_blind' | 'elevated_box' | 'ladder_stand' | 'climbing_stand' | 'popup_blind' | 'permanent_blind'
      time_of_day: 'morning' | 'evening' | 'all_day'
      wind_direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
    }
  }
}

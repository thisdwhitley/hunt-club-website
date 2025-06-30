// src/lib/types/database.ts
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
          latitude: number | null
          longitude: number | null
          type: string
          active: boolean
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
          created_at?: string
          updated_at?: string
        }
      }
      // NEW MAP TABLES
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
      property_boundaries: {
        Row: {
          id: string
          name: string
          description: string | null
          boundary_coordinates: Json // Array of [lat, lng] points defining polygon
          boundary_type: string
          area_acres: number | null
          legal_description: string | null
          active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          boundary_coordinates: Json
          boundary_type?: string
          area_acres?: number | null
          legal_description?: string | null
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          boundary_coordinates?: Json
          boundary_type?: string
          area_acres?: number | null
          legal_description?: string | null
          active?: boolean
          notes?: string | null
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
      club_events: {
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
  }
}

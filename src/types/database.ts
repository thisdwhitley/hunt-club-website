// Generated from Supabase — regenerate with: npm run db:types
// Do not edit the Database type manually; run db:types to refresh.
// Hand-maintained utility aliases live below the generated block.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      camera_deployments: {
        Row: {
          active: boolean | null
          consecutive_missing_days: number | null
          created_at: string | null
          external_bank_id: string | null
          facing_direction: string | null
          hardware_id: string
          has_solar_panel: boolean | null
          id: string
          is_missing: boolean | null
          last_seen_date: string | null
          latitude: number
          location_name: string
          longitude: number
          missing_since_date: string | null
          notes: string | null
          season_year: number
          solar_panel_id: string | null
          stand_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          consecutive_missing_days?: number | null
          created_at?: string | null
          external_bank_id?: string | null
          facing_direction?: string | null
          hardware_id: string
          has_solar_panel?: boolean | null
          id?: string
          is_missing?: boolean | null
          last_seen_date?: string | null
          latitude: number
          location_name: string
          longitude: number
          missing_since_date?: string | null
          notes?: string | null
          season_year?: number
          solar_panel_id?: string | null
          stand_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          consecutive_missing_days?: number | null
          created_at?: string | null
          external_bank_id?: string | null
          facing_direction?: string | null
          hardware_id?: string
          has_solar_panel?: boolean | null
          id?: string
          is_missing?: boolean | null
          last_seen_date?: string | null
          latitude?: number
          location_name?: string
          longitude?: number
          missing_since_date?: string | null
          notes?: string | null
          season_year?: number
          solar_panel_id?: string | null
          stand_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_deployments_hardware_id_fkey"
            columns: ["hardware_id"]
            isOneToOne: false
            referencedRelation: "camera_hardware"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_deployments_stand_id_fkey"
            columns: ["stand_id"]
            isOneToOne: false
            referencedRelation: "stands"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_hardware: {
        Row: {
          active: boolean | null
          battery_type: string | null
          brand: string
          cl_version: string | null
          condition: string | null
          created_at: string | null
          cuddeback_name: string | null
          device_id: string
          fw_version: string | null
          id: string
          model: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          battery_type?: string | null
          brand: string
          cl_version?: string | null
          condition?: string | null
          created_at?: string | null
          cuddeback_name?: string | null
          device_id: string
          fw_version?: string | null
          id?: string
          model: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          battery_type?: string | null
          brand?: string
          cl_version?: string | null
          condition?: string | null
          created_at?: string | null
          cuddeback_name?: string | null
          device_id?: string
          fw_version?: string | null
          id?: string
          model?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      camera_status_reports: {
        Row: {
          alert_reason: string | null
          battery_status: string | null
          created_at: string | null
          cuddeback_last_checkin_at: string | null
          cuddeback_report_timestamp: string | null
          deployment_id: string
          hardware_id: string
          id: string
          image_queue: number | null
          is_check_in_stale: boolean | null
          needs_attention: boolean | null
          network_links: string | null
          report_date: string
          report_processing_date: string | null
          sd_free_space_mb: number | null
          sd_images_count: number | null
          signal_level: string | null
        }
        Insert: {
          alert_reason?: string | null
          battery_status?: string | null
          created_at?: string | null
          cuddeback_last_checkin_at?: string | null
          cuddeback_report_timestamp?: string | null
          deployment_id: string
          hardware_id: string
          id?: string
          image_queue?: number | null
          is_check_in_stale?: boolean | null
          needs_attention?: boolean | null
          network_links?: string | null
          report_date: string
          report_processing_date?: string | null
          sd_free_space_mb?: number | null
          sd_images_count?: number | null
          signal_level?: string | null
        }
        Update: {
          alert_reason?: string | null
          battery_status?: string | null
          created_at?: string | null
          cuddeback_last_checkin_at?: string | null
          cuddeback_report_timestamp?: string | null
          deployment_id?: string
          hardware_id?: string
          id?: string
          image_queue?: number | null
          is_check_in_stale?: boolean | null
          needs_attention?: boolean | null
          network_links?: string | null
          report_date?: string
          report_processing_date?: string | null
          sd_free_space_mb?: number | null
          sd_images_count?: number | null
          signal_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_status_reports_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "camera_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_status_reports_hardware_id_fkey"
            columns: ["hardware_id"]
            isOneToOne: false
            referencedRelation: "camera_hardware"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_todos: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camp_todos_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      club_events: {
        Row: {
          all_day: boolean | null
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          id: string
          is_public: boolean | null
          location: string | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_camera_snapshots: {
        Row: {
          activity_score: number | null
          activity_trend: string | null
          anomaly_detected: boolean | null
          anomaly_severity: string | null
          anomaly_type: string | null
          battery_status: string | null
          camera_device_id: string
          collection_timestamp: string | null
          created_at: string | null
          current_coordinates: string | null
          data_source_quality: number | null
          date: string
          days_since_last_activity: number | null
          distance_moved_meters: number | null
          id: string
          images_added_today: number | null
          last_image_timestamp: string | null
          location_changed: boolean | null
          peak_activity_hour: number | null
          previous_coordinates: string | null
          processing_notes: string | null
          sd_images_count: number | null
          seven_day_average: number | null
          signal_level: number | null
          temperature: number | null
          updated_at: string | null
          weekly_image_change: number | null
        }
        Insert: {
          activity_score?: number | null
          activity_trend?: string | null
          anomaly_detected?: boolean | null
          anomaly_severity?: string | null
          anomaly_type?: string | null
          battery_status?: string | null
          camera_device_id: string
          collection_timestamp?: string | null
          created_at?: string | null
          current_coordinates?: string | null
          data_source_quality?: number | null
          date: string
          days_since_last_activity?: number | null
          distance_moved_meters?: number | null
          id?: string
          images_added_today?: number | null
          last_image_timestamp?: string | null
          location_changed?: boolean | null
          peak_activity_hour?: number | null
          previous_coordinates?: string | null
          processing_notes?: string | null
          sd_images_count?: number | null
          seven_day_average?: number | null
          signal_level?: number | null
          temperature?: number | null
          updated_at?: string | null
          weekly_image_change?: number | null
        }
        Update: {
          activity_score?: number | null
          activity_trend?: string | null
          anomaly_detected?: boolean | null
          anomaly_severity?: string | null
          anomaly_type?: string | null
          battery_status?: string | null
          camera_device_id?: string
          collection_timestamp?: string | null
          created_at?: string | null
          current_coordinates?: string | null
          data_source_quality?: number | null
          date?: string
          days_since_last_activity?: number | null
          distance_moved_meters?: number | null
          id?: string
          images_added_today?: number | null
          last_image_timestamp?: string | null
          location_changed?: boolean | null
          peak_activity_hour?: number | null
          previous_coordinates?: string | null
          processing_notes?: string | null
          sd_images_count?: number | null
          seven_day_average?: number | null
          signal_level?: number | null
          temperature?: number | null
          updated_at?: string | null
          weekly_image_change?: number | null
        }
        Relationships: []
      }
      daily_collection_log: {
        Row: {
          alerts_generated: number | null
          collection_date: string
          collection_type: string
          completed_at: string | null
          created_at: string | null
          data_completeness_score: number | null
          error_details: Json | null
          errors_encountered: number | null
          id: string
          processing_duration_ms: number | null
          processing_summary: string | null
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          alerts_generated?: number | null
          collection_date: string
          collection_type: string
          completed_at?: string | null
          created_at?: string | null
          data_completeness_score?: number | null
          error_details?: Json | null
          errors_encountered?: number | null
          id?: string
          processing_duration_ms?: number | null
          processing_summary?: string | null
          records_processed?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          alerts_generated?: number | null
          collection_date?: string
          collection_type?: string
          completed_at?: string | null
          created_at?: string | null
          data_completeness_score?: number | null
          error_details?: Json | null
          errors_encountered?: number | null
          id?: string
          processing_duration_ms?: number | null
          processing_summary?: string | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      daily_weather_snapshots: {
        Row: {
          api_source: string | null
          cloudcover: number | null
          collection_timestamp: string | null
          created_at: string | null
          data_quality_score: number | null
          date: string
          humidity: number | null
          id: string
          legal_hunting_end: string | null
          legal_hunting_start: string | null
          missing_fields: string[] | null
          moonphase: number | null
          precip: number | null
          precipprob: number | null
          property_center_lat: number
          property_center_lng: number
          quality_notes: string | null
          raw_weather_data: Json
          sunrise: string | null
          sunset: string | null
          temp: number | null
          temp_dawn: number | null
          temp_dusk: number | null
          tempmax: number | null
          tempmin: number | null
          updated_at: string | null
          uvindex: number | null
          winddir: number | null
          windspeed: number | null
        }
        Insert: {
          api_source?: string | null
          cloudcover?: number | null
          collection_timestamp?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          date: string
          humidity?: number | null
          id?: string
          legal_hunting_end?: string | null
          legal_hunting_start?: string | null
          missing_fields?: string[] | null
          moonphase?: number | null
          precip?: number | null
          precipprob?: number | null
          property_center_lat?: number
          property_center_lng?: number
          quality_notes?: string | null
          raw_weather_data: Json
          sunrise?: string | null
          sunset?: string | null
          temp?: number | null
          temp_dawn?: number | null
          temp_dusk?: number | null
          tempmax?: number | null
          tempmin?: number | null
          updated_at?: string | null
          uvindex?: number | null
          winddir?: number | null
          windspeed?: number | null
        }
        Update: {
          api_source?: string | null
          cloudcover?: number | null
          collection_timestamp?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          date?: string
          humidity?: number | null
          id?: string
          legal_hunting_end?: string | null
          legal_hunting_start?: string | null
          missing_fields?: string[] | null
          moonphase?: number | null
          precip?: number | null
          precipprob?: number | null
          property_center_lat?: number
          property_center_lng?: number
          quality_notes?: string | null
          raw_weather_data?: Json
          sunrise?: string | null
          sunset?: string | null
          temp?: number | null
          temp_dawn?: number | null
          temp_dusk?: number | null
          tempmax?: number | null
          tempmin?: number | null
          updated_at?: string | null
          uvindex?: number | null
          winddir?: number | null
          windspeed?: number | null
        }
        Relationships: []
      }
      food_plots: {
        Row: {
          active: boolean | null
          created_at: string
          crop_type: string | null
          description: string | null
          harvest_date: string | null
          id: string
          name: string
          notes: string | null
          planting_date: string | null
          plot_data: Json | null
          size_acres: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          crop_type?: string | null
          description?: string | null
          harvest_date?: string | null
          id?: string
          name: string
          notes?: string | null
          planting_date?: string | null
          plot_data?: Json | null
          size_acres?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          crop_type?: string | null
          description?: string | null
          harvest_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          planting_date?: string | null
          plot_data?: Json | null
          size_acres?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hunt_harvests: {
        Row: {
          animal_type: string
          antler_points: number | null
          antler_spread_inches: number | null
          created_at: string | null
          estimated_age: string | null
          estimated_weight: number | null
          field_dressed_weight: number | null
          gender: string | null
          hide_condition: string | null
          hunt_log_id: string
          id: string
          meat_condition: string | null
          photos: string[] | null
          processing_notes: string | null
          processor_name: string | null
          recovery_notes: string | null
          shot_distance_yards: number | null
          shot_placement: string | null
          tracking_distance_yards: number | null
          tracking_time_minutes: number | null
          updated_at: string | null
          weapon_used: string | null
        }
        Insert: {
          animal_type: string
          antler_points?: number | null
          antler_spread_inches?: number | null
          created_at?: string | null
          estimated_age?: string | null
          estimated_weight?: number | null
          field_dressed_weight?: number | null
          gender?: string | null
          hide_condition?: string | null
          hunt_log_id: string
          id?: string
          meat_condition?: string | null
          photos?: string[] | null
          processing_notes?: string | null
          processor_name?: string | null
          recovery_notes?: string | null
          shot_distance_yards?: number | null
          shot_placement?: string | null
          tracking_distance_yards?: number | null
          tracking_time_minutes?: number | null
          updated_at?: string | null
          weapon_used?: string | null
        }
        Update: {
          animal_type?: string
          antler_points?: number | null
          antler_spread_inches?: number | null
          created_at?: string | null
          estimated_age?: string | null
          estimated_weight?: number | null
          field_dressed_weight?: number | null
          gender?: string | null
          hide_condition?: string | null
          hunt_log_id?: string
          id?: string
          meat_condition?: string | null
          photos?: string[] | null
          processing_notes?: string | null
          processor_name?: string | null
          recovery_notes?: string | null
          shot_distance_yards?: number | null
          shot_placement?: string | null
          tracking_distance_yards?: number | null
          tracking_time_minutes?: number | null
          updated_at?: string | null
          weapon_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hunt_harvests_hunt_log_id_fkey"
            columns: ["hunt_log_id"]
            isOneToOne: false
            referencedRelation: "hunt_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hunt_harvests_hunt_log_id_fkey"
            columns: ["hunt_log_id"]
            isOneToOne: false
            referencedRelation: "hunt_logs_with_temperature"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_logs: {
        Row: {
          created_at: string | null
          end_time: string | null
          game_type: string | null
          had_harvest: boolean | null
          harvest_count: number | null
          hunt_date: string
          hunt_duration_minutes: number | null
          hunt_type: string | null
          hunting_season: string | null
          id: string
          member_id: string
          moon_illumination: number | null
          moon_phase: string | null
          notes: string | null
          photos: string[] | null
          precipitation: number | null
          property_sector: string | null
          season: string | null
          stand_coordinates: Json | null
          stand_id: string | null
          start_time: string | null
          sunrise_time: string | null
          sunset_time: string | null
          temperature_high: number | null
          temperature_low: number | null
          updated_at: string | null
          weather_conditions: Json | null
          weather_fetched_at: string | null
          wind_direction: string | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          game_type?: string | null
          had_harvest?: boolean | null
          harvest_count?: number | null
          hunt_date: string
          hunt_duration_minutes?: number | null
          hunt_type?: string | null
          hunting_season?: string | null
          id?: string
          member_id: string
          moon_illumination?: number | null
          moon_phase?: string | null
          notes?: string | null
          photos?: string[] | null
          precipitation?: number | null
          property_sector?: string | null
          season?: string | null
          stand_coordinates?: Json | null
          stand_id?: string | null
          start_time?: string | null
          sunrise_time?: string | null
          sunset_time?: string | null
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string | null
          weather_conditions?: Json | null
          weather_fetched_at?: string | null
          wind_direction?: string | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          game_type?: string | null
          had_harvest?: boolean | null
          harvest_count?: number | null
          hunt_date?: string
          hunt_duration_minutes?: number | null
          hunt_type?: string | null
          hunting_season?: string | null
          id?: string
          member_id?: string
          moon_illumination?: number | null
          moon_phase?: string | null
          notes?: string | null
          photos?: string[] | null
          precipitation?: number | null
          property_sector?: string | null
          season?: string | null
          stand_coordinates?: Json | null
          stand_id?: string | null
          start_time?: string | null
          sunrise_time?: string | null
          sunset_time?: string | null
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string | null
          weather_conditions?: Json | null
          weather_fetched_at?: string | null
          wind_direction?: string | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hunt_logs_stand_id_fkey"
            columns: ["stand_id"]
            isOneToOne: false
            referencedRelation: "stands"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_sightings: {
        Row: {
          animal_type: string
          behavior: string | null
          count: number | null
          created_at: string | null
          direction: string | null
          distance_yards: number | null
          estimated_age: string | null
          gender: string | null
          hunt_log_id: string
          id: string
          notes: string | null
          photos: string[] | null
          time_observed: string | null
          updated_at: string | null
        }
        Insert: {
          animal_type: string
          behavior?: string | null
          count?: number | null
          created_at?: string | null
          direction?: string | null
          distance_yards?: number | null
          estimated_age?: string | null
          gender?: string | null
          hunt_log_id: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          time_observed?: string | null
          updated_at?: string | null
        }
        Update: {
          animal_type?: string
          behavior?: string | null
          count?: number | null
          created_at?: string | null
          direction?: string | null
          distance_yards?: number | null
          estimated_age?: string | null
          gender?: string | null
          hunt_log_id?: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          time_observed?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hunt_sightings_hunt_log_id_fkey"
            columns: ["hunt_log_id"]
            isOneToOne: false
            referencedRelation: "hunt_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hunt_sightings_hunt_log_id_fkey"
            columns: ["hunt_log_id"]
            isOneToOne: false
            referencedRelation: "hunt_logs_with_temperature"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          location: string | null
          notes: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_boundaries: {
        Row: {
          boundary_data: Json
          created_at: string
          description: string | null
          id: string
          name: string
          total_acres: number | null
          updated_at: string
        }
        Insert: {
          boundary_data: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_acres?: number | null
          updated_at?: string
        }
        Update: {
          boundary_data?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_acres?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      season_calendar: {
        Row: {
          closes: string
          confidence: string
          created_at: string | null
          id: string
          notes: string | null
          opens: string
          season_type: string
          season_year: number
          species: string
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          closes: string
          confidence?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opens: string
          season_type: string
          season_year: number
          species: string
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          closes?: string
          confidence?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opens?: string
          season_type?: string
          season_year?: number
          species?: string
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      stands: {
        Row: {
          access_notes: string | null
          active: boolean | null
          archery_season: boolean | null
          capacity: number | null
          created_at: string | null
          description: string | null
          food_source: Database["public"]["Enums"]["food_source_type"] | null
          height_feet: number | null
          id: string
          last_harvest: string | null
          last_harvest_by: string | null
          last_hunted: string | null
          last_hunted_by: string | null
          last_used_date: string | null
          latitude: number | null
          longitude: number | null
          name: string
          nearby_water_source: boolean | null
          season_hunts: number | null
          success_rate: number | null
          time_of_day: Database["public"]["Enums"]["time_of_day"] | null
          total_harvests: number | null
          total_hunts: number | null
          trail_camera_name: string | null
          trail_name: string | null
          type: Database["public"]["Enums"]["stand_type"] | null
          updated_at: string | null
          view_distance_yards: number | null
          walking_time_minutes: number | null
        }
        Insert: {
          access_notes?: string | null
          active?: boolean | null
          archery_season?: boolean | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          food_source?: Database["public"]["Enums"]["food_source_type"] | null
          height_feet?: number | null
          id?: string
          last_harvest?: string | null
          last_harvest_by?: string | null
          last_hunted?: string | null
          last_hunted_by?: string | null
          last_used_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          nearby_water_source?: boolean | null
          season_hunts?: number | null
          success_rate?: number | null
          time_of_day?: Database["public"]["Enums"]["time_of_day"] | null
          total_harvests?: number | null
          total_hunts?: number | null
          trail_camera_name?: string | null
          trail_name?: string | null
          type?: Database["public"]["Enums"]["stand_type"] | null
          updated_at?: string | null
          view_distance_yards?: number | null
          walking_time_minutes?: number | null
        }
        Update: {
          access_notes?: string | null
          active?: boolean | null
          archery_season?: boolean | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          food_source?: Database["public"]["Enums"]["food_source_type"] | null
          height_feet?: number | null
          id?: string
          last_harvest?: string | null
          last_harvest_by?: string | null
          last_hunted?: string | null
          last_hunted_by?: string | null
          last_used_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          nearby_water_source?: boolean | null
          season_hunts?: number | null
          success_rate?: number | null
          time_of_day?: Database["public"]["Enums"]["time_of_day"] | null
          total_harvests?: number | null
          total_hunts?: number | null
          trail_camera_name?: string | null
          trail_name?: string | null
          type?: Database["public"]["Enums"]["stand_type"] | null
          updated_at?: string | null
          view_distance_yards?: number | null
          walking_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stands_last_harvest_by_fkey"
            columns: ["last_harvest_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stands_last_hunted_by_fkey"
            columns: ["last_hunted_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      trails: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          distance_miles: number | null
          id: string
          name: string
          trail_data: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          distance_miles?: number | null
          id?: string
          name: string
          trail_data?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          distance_miles?: number | null
          id?: string
          name?: string
          trail_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      hunt_logs_with_temperature: {
        Row: {
          cloudcover: number | null
          created_at: string | null
          daily_average: number | null
          daily_high: number | null
          daily_low: number | null
          data_quality_score: number | null
          end_time: string | null
          game_type: string | null
          had_harvest: boolean | null
          harvest_count: number | null
          has_dawn_dusk_temps: boolean | null
          has_weather_data: boolean | null
          humidity: number | null
          hunt_date: string | null
          hunt_duration_minutes: number | null
          hunt_temperature: number | null
          hunt_type: string | null
          hunting_season: string | null
          id: string | null
          legal_hunting_end: string | null
          legal_hunting_start: string | null
          member_id: string | null
          moon_illumination: number | null
          moon_phase: string | null
          moonphase: number | null
          notes: string | null
          photos: string[] | null
          precip: number | null
          precipitation: number | null
          precipprob: number | null
          property_sector: string | null
          stand_coordinates: Json | null
          stand_id: string | null
          start_time: string | null
          sunrise: string | null
          sunrise_time: string | null
          sunset: string | null
          sunset_time: string | null
          temp_dawn: number | null
          temp_dusk: number | null
          temperature_high: number | null
          temperature_low: number | null
          updated_at: string | null
          uvindex: number | null
          weather_conditions: Json | null
          weather_fetched_at: string | null
          wind_direction: string | null
          wind_speed: number | null
          winddir: number | null
          windspeed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hunt_logs_stand_id_fkey"
            columns: ["stand_id"]
            isOneToOne: false
            referencedRelation: "stands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      backfill_hunt_weather_data: {
        Args: never
        Returns: {
          updated_hunts: number
        }[]
      }
      backfill_legal_hunting_times: {
        Args: never
        Returns: {
          updated_count: number
        }[]
      }
      calculate_activity_score: {
        Args: { avg_images_per_day?: number; images_added_today: number }
        Returns: number
      }
      calculate_activity_trend: {
        Args: {
          current_images: number
          days_back?: number
          previous_images: number
        }
        Returns: string
      }
      calculate_weather_quality_score: {
        Args: { weather_data: Json }
        Returns: {
          missing_fields: string[]
          quality_score: number
        }[]
      }
      detect_camera_location_change: {
        Args: {
          current_coordinates: string
          previous_coordinates: string
          threshold_meters?: number
        }
        Returns: {
          changed: boolean
          distance_meters: number
        }[]
      }
      detect_missing_cameras: { Args: { check_date?: string }; Returns: number }
      interpolate_dawn_dusk_temps: {
        Args: {
          current_temp: number
          sunrise_time: string
          sunset_time: string
          tempmax: number
          tempmin: number
        }
        Returns: {
          temp_dawn: number
          temp_dusk: number
        }[]
      }
      validate_coordinates: { Args: { coordinates: string }; Returns: boolean }
    }
    Enums: {
      food_source_type: "field" | "feeder"
      stand_type:
        | "ladder_stand"
        | "bale_blind"
        | "box_stand"
        | "tripod"
        | "ground_blind"
      time_of_day: "AM" | "PM" | "ALL"
      wind_direction: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      food_source_type: ["field", "feeder"],
      stand_type: [
        "ladder_stand",
        "bale_blind",
        "box_stand",
        "tripod",
        "ground_blind",
      ],
      time_of_day: ["AM", "PM", "ALL"],
      wind_direction: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    },
  },
} as const

// =============================================================================
// UTILITY TYPE ALIASES
// =============================================================================

export type HuntLog = Database["public"]["Tables"]["hunt_logs"]["Row"]
export type HuntLogInsert = Database["public"]["Tables"]["hunt_logs"]["Insert"]
export type HuntLogUpdate = Database["public"]["Tables"]["hunt_logs"]["Update"]

export type HuntHarvest = Database["public"]["Tables"]["hunt_harvests"]["Row"]
export type HuntHarvestInsert = Database["public"]["Tables"]["hunt_harvests"]["Insert"]
export type HuntHarvestUpdate = Database["public"]["Tables"]["hunt_harvests"]["Update"]

export type HuntSighting = Database["public"]["Tables"]["hunt_sightings"]["Row"]
export type HuntSightingInsert = Database["public"]["Tables"]["hunt_sightings"]["Insert"]
export type HuntSightingUpdate = Database["public"]["Tables"]["hunt_sightings"]["Update"]

export type Member = Database["public"]["Tables"]["members"]["Row"]
export type Stand = Database["public"]["Tables"]["stands"]["Row"]
export type MaintenanceTask = Database["public"]["Tables"]["maintenance_tasks"]["Row"]

export type SeasonCalendar = Database["public"]["Tables"]["season_calendar"]["Row"]
export type SeasonCalendarInsert = Database["public"]["Tables"]["season_calendar"]["Insert"]
export type SeasonCalendarUpdate = Database["public"]["Tables"]["season_calendar"]["Update"]

export type SeasonSpecies = "deer" | "turkey"
export type SeasonType = "archery" | "blackpowder" | "gun" | "turkey"
export type SeasonConfidence = "estimated" | "tentative" | "confirmed"

export type HuntType = "AM" | "PM" | "All Day"
export type AnimalGender = "Buck" | "Doe" | "Mixed" | "Unknown"
export type HuntDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "Unknown"
export type ConditionRating = "Excellent" | "Good" | "Fair" | "Poor" | "Damaged"

// hunt_logs_with_temperature is a View (not a Table)
export type HuntWithTemperature = Database["public"]["Views"]["hunt_logs_with_temperature"]["Row"]

export type HuntTemperatureDisplay = {
  hunt_temperature: number | null
  temperature_context: "dawn" | "dusk" | "average" | "fallback" | "unavailable"
  temperature_source: string
}

export type ComputeTemperatureContext = (hunt: HuntWithTemperature) => HuntTemperatureDisplay

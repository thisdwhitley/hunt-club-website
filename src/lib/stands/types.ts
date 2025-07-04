// src/lib/stands/types.ts
// TypeScript types for the cleaned 23-field stands schema

export type StandType = 'ladder_stand' | 'bale_blind' | 'box_stand' | 'tripod'
export type TimeOfDay = 'AM' | 'PM' | 'ALL'
export type FoodSourceType = 'field' | 'feeder'

// Core Stand interface matching the 23-field database schema
export interface Stand {
  // ESSENTIAL (8 fields)
  id: string
  name: string
  description: string | null
  active: boolean
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string

  // IMPORTANT (3 fields)
  type: StandType
  height_feet: number | null
  capacity: number | null

  // USEFUL (12 fields)
  trail_name: string | null
  walking_time_minutes: number | null
  access_notes: string | null
  view_distance_yards: number | null
  total_harvests: number | null
  total_hunts: number | null
  season_hunts: number | null
  last_used_date: string | null
  time_of_day: TimeOfDay | null
  archery_season: boolean | null
  nearby_water_source: boolean | null
  food_source: FoodSourceType | null
  trail_camera_name: string | null
}

// Form data interface (what we collect from users)
export interface StandFormData {
  // Required fields
  name: string
  type: StandType

  // Optional core fields
  description?: string
  latitude?: number
  longitude?: number
  height_feet?: number
  capacity?: number
  active?: boolean

  // Optional useful fields
  trail_name?: string
  walking_time_minutes?: number
  access_notes?: string
  view_distance_yards?: number
  time_of_day?: TimeOfDay
  archery_season?: boolean
  nearby_water_source?: boolean
  food_source?: FoodSourceType
  trail_camera_name?: string
}

// Database insert/update interfaces
export interface StandInsert {
  name: string
  type: StandType
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  height_feet?: number | null
  capacity?: number | null
  active?: boolean
  trail_name?: string | null
  walking_time_minutes?: number | null
  access_notes?: string | null
  view_distance_yards?: number | null
  time_of_day?: TimeOfDay | null
  archery_season?: boolean | null
  nearby_water_source?: boolean | null
  food_source?: FoodSourceType | null
  trail_camera_name?: string | null
}

export interface StandUpdate extends Partial<StandInsert> {
  id: string
}

// UI display interfaces
export interface StandCardData {
  id: string
  name: string
  type: StandType
  description?: string | null
  height_feet?: number | null
  capacity?: number | null
  walking_time_minutes?: number | null
  total_harvests?: number | null
  total_hunts?: number | null
  season_hunts?: number | null
  last_used_date?: string | null
  time_of_day?: TimeOfDay | null
  archery_season?: boolean | null
  nearby_water_source?: boolean | null
  food_source?: FoodSourceType | null
  trail_camera_name?: string | null
  active: boolean
}

// Filter and sorting interfaces
export interface StandFilters {
  type?: StandType[]
  time_of_day?: TimeOfDay[]
  archery_season?: boolean
  nearby_water_source?: boolean
  food_source?: FoodSourceType[]
  active?: boolean
  has_camera?: boolean
}

export interface StandSortOptions {
  field: keyof Stand
  direction: 'asc' | 'desc'
}

// Statistics interface
export interface StandStats {
  total_stands: number
  active_stands: number
  stands_by_type: Record<StandType, number>
  total_harvests: number
  total_hunts: number
  success_rate: number
  most_productive_stand: Stand | null
  least_used_stands: Stand[]
}

// API response interfaces
export interface StandsResponse {
  data: Stand[] | null
  error: string | null
  loading: boolean
}

export interface StandResponse {
  data: Stand | null
  error: string | null
  loading: boolean
}

// Hook return interfaces
export interface UseStandsReturn {
  stands: Stand[]
  loading: boolean
  error: string | null
  
  // CRUD operations
  createStand: (data: StandFormData) => Promise<Stand | null>
  updateStand: (id: string, data: Partial<StandFormData>) => Promise<Stand | null>
  deleteStand: (id: string) => Promise<boolean>
  
  // Utility operations
  refreshStands: () => Promise<void>
  getStandById: (id: string) => Stand | undefined
  getActiveStands: () => Stand[]
  getStandsByType: (type: StandType) => Stand[]
  
  // Statistics
  getStandStats: () => StandStats
}

export interface UseStandReturn {
  stand: Stand | null
  loading: boolean
  error: string | null
  updateStand: (data: Partial<StandFormData>) => Promise<Stand | null>
  deleteStand: () => Promise<boolean>
  refresh: () => Promise<void>
}

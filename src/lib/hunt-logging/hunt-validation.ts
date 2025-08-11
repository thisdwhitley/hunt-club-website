// src/lib/hunt-logging/hunt-validation.ts
// Database-aligned validation schemas for hunt logging system

import { z } from 'zod'

// ===========================================
// DATABASE-ALIGNED VALIDATION SCHEMAS
// ===========================================

// Hunt logs schema - exactly matching hunt_logs table
export const HuntEntrySchema = z.object({
  // Required fields
  hunt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
  member_id: z.string().uuid('Invalid member ID'),
  stand_id: z.string().uuid('Please select a hunting stand').min(1, 'Stand selection is required').nullable(),
  
  // Optional time fields
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  
  // Weather fields (will be auto-populated)
  weather_conditions: z.any().optional(), // jsonb
  temperature_high: z.number().optional(),
  temperature_low: z.number().optional(), 
  wind_speed: z.number().optional(),
  wind_direction: z.string().max(10).optional(),
  precipitation: z.number().min(0).max(100).optional(),
  moon_phase: z.string().max(20).optional(),
  
  // Harvest tracking
  harvest_count: z.number().min(0).default(0),
  game_type: z.string().max(50).optional(),
  
  // Notes and photos
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional(),
  photos: z.array(z.string()).optional(),
  
  // Auto-population fields (set by service)
  hunt_type: z.string().max(20).default('AM').optional(),
  moon_illumination: z.number().min(0).max(100).optional(),
  sunrise_time: z.string().optional(),
  sunset_time: z.string().optional(),
  hunting_season: z.string().max(50).optional(),
  property_sector: z.string().max(50).optional(),
  hunt_duration_minutes: z.number().optional(),
  had_harvest: z.boolean().optional(),
  weather_fetched_at: z.string().optional(),
  stand_coordinates: z.any().optional(), // jsonb
}).refine((data) => {
  // If exact times provided, start must be before end
  if (data.start_time && data.end_time && data.start_time !== '' && data.end_time !== '') {
    return data.start_time < data.end_time
  }
  return true
}, {
  message: "Start time must be before end time",
  path: ["end_time"]
}).refine((data) => {
  // Hunt date cannot be in the future
  const huntDate = new Date(data.hunt_date)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return huntDate <= today
}, {
  message: "Hunt date cannot be in the future",
  path: ["hunt_date"]
})

// Harvest details schema - exactly matching hunt_harvests table
export const HarvestDetailsSchema = z.object({
  hunt_log_id: z.string().uuid(),
  animal_type: z.string().max(50).min(1, 'Animal type is required'),
  gender: z.enum(['Buck', 'Doe', 'Unknown']).optional(),
  estimated_age: z.string().max(20).optional(),
  estimated_weight: z.number().min(1).max(1000).optional(), // integer in db
  shot_distance_yards: z.number().min(1).max(1000).optional(), // integer in db
  weapon_used: z.string().max(100).optional(),
  shot_placement: z.string().max(100).optional(),
  tracking_time_minutes: z.number().min(0).max(480).optional(), // integer in db
  tracking_distance_yards: z.number().min(0).max(5000).optional(), // integer in db
  recovery_notes: z.string().max(500).optional(),
  field_dressed_weight: z.number().min(1).max(800).optional(), // integer in db
  antler_points: z.number().min(0).max(30).optional(), // integer in db
  antler_spread_inches: z.number().min(0).max(50).optional(), // numeric(4,1) in db
  hide_condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']).optional(),
  meat_condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']).optional(),
  photos: z.array(z.string()).optional(),
  processor_name: z.string().max(100).optional(),
  processing_notes: z.string().max(300).optional(),
})

// Sightings schema - exactly matching hunt_sightings table
export const SightingSchema = z.object({
  hunt_log_id: z.string().uuid().optional(), // Will be set by service
  animal_type: z.string().max(50).min(1, 'Animal type is required'),
  count: z.number().min(1, 'Count must be at least 1').max(50, 'Count seems too high').default(1),
  gender: z.enum(['Buck', 'Doe', 'Mixed', 'Unknown']).optional(),
  estimated_age: z.string().max(20).optional(),
  behavior: z.string().max(200, 'Behavior notes must be under 200 characters').optional(),
  distance_yards: z.number().min(0).max(2000).optional(), // integer in db
  direction: z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'Unknown']).optional(),
  time_observed: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  notes: z.string().max(300, 'Notes must be under 300 characters').optional(),
  photos: z.array(z.string()).optional(),
})

// Form schema for frontend (simplified for user input)
export const HuntFormSchema = z.object({
  hunt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
  stand_id: z.string().uuid('Please select a hunting stand').min(1, 'Stand selection is required'),
  member_id: z.string().uuid().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  had_harvest: z.boolean().default(false),
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional(),
  hunt_type: z.enum(['AM', 'PM', 'All Day']).optional(),
  sightings: z.array(SightingSchema.omit({ hunt_log_id: true })).optional(),
}).refine((data) => {
  if (data.start_time && data.end_time && data.start_time !== '' && data.end_time !== '') {
    return data.start_time < data.end_time
  }
  return true
}, {
  message: "Start time must be before end time",
  path: ["end_time"]
})

// ===========================================
// TYPE EXPORTS
// ===========================================

export type HuntFormData = z.infer<typeof HuntFormSchema>
export type HuntEntryData = z.infer<typeof HuntEntrySchema>
export type HarvestDetailsData = z.infer<typeof HarvestDetailsSchema>
export type SightingData = z.infer<typeof SightingSchema>

// ===========================================
// VALIDATION HELPER FUNCTIONS
// ===========================================

export const validateHuntForm = (data: unknown) => {
  return HuntFormSchema.safeParse(data)
}

export const validateHuntEntry = (data: unknown) => {
  return HuntEntrySchema.safeParse(data)
}

export const validateHarvestDetails = (data: unknown) => {
  return HarvestDetailsSchema.safeParse(data)
}

export const validateSighting = (data: unknown) => {
  return SightingSchema.safeParse(data)
}

// ===========================================
// BUSINESS LOGIC HELPERS
// ===========================================

// Smart time period detection (used in form defaults)
export const getCurrentTimePeriod = (): 'AM' | 'PM' => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'AM'   // 5 AM to 12 PM = Morning hunt
  if (hour >= 12 && hour < 20) return 'PM'  // 12 PM to 8 PM = Evening hunt
  return 'AM' // Default for late night/early morning entries
}

// Calculate hunt duration in minutes
export const calculateHuntDuration = (startTime?: string, endTime?: string): number | null => {
  if (!startTime || !endTime) return null
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  // Handle overnight hunts (rare but possible)
  if (endMinutes < startMinutes) {
    return (24 * 60 - startMinutes) + endMinutes
  }
  
  return endMinutes - startMinutes
}

// Transform form data to database format
export const transformFormToDatabase = (formData: HuntFormData, memberId: string): HuntEntryData => {
  return {
    ...formData,
    member_id: memberId,
    hunt_type: formData.hunt_type || getCurrentTimePeriod(),
    hunt_duration_minutes: calculateHuntDuration(formData.start_time, formData.end_time),
    harvest_count: formData.had_harvest ? 1 : 0, // Convert boolean to count for database
  }
}

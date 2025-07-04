// src/lib/stands/validation.ts
// Fixed Zod validation schemas for stand management

import { z } from 'zod'
import { VALIDATION_LIMITS } from './constants'

// Base enum schemas
export const StandTypeSchema = z.enum(['ladder_stand', 'bale_blind', 'box_stand', 'tripod'])
export const TimeOfDaySchema = z.enum(['AM', 'PM', 'ALL'])
export const FoodSourceTypeSchema = z.enum(['field', 'feeder'])

// Individual field schemas with validation
export const StandFieldSchemas = {
  // Required fields
  name: z.string()
    .min(VALIDATION_LIMITS.name.min, `Name must be at least ${VALIDATION_LIMITS.name.min} characters`)
    .max(VALIDATION_LIMITS.name.max, `Name must be less than ${VALIDATION_LIMITS.name.max} characters`)
    .trim(),
  
  type: StandTypeSchema,

  // Optional core fields
  description: z.string()
    .max(VALIDATION_LIMITS.description.max, `Description must be less than ${VALIDATION_LIMITS.description.max} characters`)
    .trim()
    .optional()
    .nullable(),

  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),

  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),

  height_feet: z.number()
    .int('Height must be a whole number')
    .min(VALIDATION_LIMITS.height_feet.min, `Height must be at least ${VALIDATION_LIMITS.height_feet.min} feet`)
    .max(VALIDATION_LIMITS.height_feet.max, `Height must be less than ${VALIDATION_LIMITS.height_feet.max} feet`)
    .optional()
    .nullable(),

  capacity: z.number()
    .int('Capacity must be a whole number')
    .min(VALIDATION_LIMITS.capacity.min, `Capacity must be at least ${VALIDATION_LIMITS.capacity.min}`)
    .max(VALIDATION_LIMITS.capacity.max, `Capacity must be less than ${VALIDATION_LIMITS.capacity.max}`)
    .optional()
    .nullable(),

  active: z.boolean().optional(),

  // Optional useful fields
  trail_name: z.string()
    .max(VALIDATION_LIMITS.trail_name.max, `Trail name must be less than ${VALIDATION_LIMITS.trail_name.max} characters`)
    .trim()
    .optional()
    .nullable(),

  walking_time_minutes: z.number()
    .int('Walking time must be a whole number')
    .min(VALIDATION_LIMITS.walking_time_minutes.min, `Walking time must be at least ${VALIDATION_LIMITS.walking_time_minutes.min} minute`)
    .max(VALIDATION_LIMITS.walking_time_minutes.max, `Walking time must be less than ${VALIDATION_LIMITS.walking_time_minutes.max} minutes`)
    .optional()
    .nullable(),

  access_notes: z.string()
    .max(VALIDATION_LIMITS.access_notes.max, `Access notes must be less than ${VALIDATION_LIMITS.access_notes.max} characters`)
    .trim()
    .optional()
    .nullable(),

  view_distance_yards: z.number()
    .int('View distance must be a whole number')
    .min(VALIDATION_LIMITS.view_distance_yards.min, `View distance must be at least ${VALIDATION_LIMITS.view_distance_yards.min} yards`)
    .max(VALIDATION_LIMITS.view_distance_yards.max, `View distance must be less than ${VALIDATION_LIMITS.view_distance_yards.max} yards`)
    .optional()
    .nullable(),

  time_of_day: TimeOfDaySchema.optional().nullable(),

  archery_season: z.boolean().optional().nullable(),

  nearby_water_source: z.boolean().optional().nullable(),

  food_source: FoodSourceTypeSchema.optional().nullable(),

  trail_camera_name: z.string()
    .max(VALIDATION_LIMITS.trail_camera_name.max, `Camera name must be less than ${VALIDATION_LIMITS.trail_camera_name.max} characters`)
    .trim()
    .optional()
    .nullable()
}

// Base object schema (without .refine() - so it can be extended)
const BaseStandFormSchema = z.object({
  name: StandFieldSchemas.name,
  type: StandFieldSchemas.type,
  description: StandFieldSchemas.description,
  latitude: StandFieldSchemas.latitude,
  longitude: StandFieldSchemas.longitude,
  height_feet: StandFieldSchemas.height_feet,
  capacity: StandFieldSchemas.capacity,
  active: StandFieldSchemas.active,
  trail_name: StandFieldSchemas.trail_name,
  walking_time_minutes: StandFieldSchemas.walking_time_minutes,
  access_notes: StandFieldSchemas.access_notes,
  view_distance_yards: StandFieldSchemas.view_distance_yards,
  time_of_day: StandFieldSchemas.time_of_day,
  archery_season: StandFieldSchemas.archery_season,
  nearby_water_source: StandFieldSchemas.nearby_water_source,
  food_source: StandFieldSchemas.food_source,
  trail_camera_name: StandFieldSchemas.trail_camera_name
})

// Form validation schema (with custom validation)
export const StandFormSchema = BaseStandFormSchema
.refine((data) => {
  // Custom validation: if latitude is provided, longitude must also be provided
  if ((data.latitude !== null && data.latitude !== undefined) && 
      (data.longitude === null || data.longitude === undefined)) {
    return false
  }
  if ((data.longitude !== null && data.longitude !== undefined) && 
      (data.latitude === null || data.latitude === undefined)) {
    return false
  }
  return true
}, {
  message: "Both latitude and longitude must be provided together",
  path: ["latitude", "longitude"]
})

// Database insert schema (extends the base schema without .refine())
export const StandInsertSchema = BaseStandFormSchema.extend({
  // Add any additional fields that might be set programmatically
  // Currently no additional fields needed
})

// Database update schema (partial updates)
export const StandUpdateSchema = BaseStandFormSchema.partial().extend({
  id: z.string().uuid('Invalid stand ID')
})

// Full stand schema (what we get from database)
export const StandSchema = z.object({
  // Essential fields (always present)
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),

  // Important fields
  type: StandTypeSchema,
  height_feet: z.number().nullable(),
  capacity: z.number().nullable(),

  // Useful fields
  trail_name: z.string().nullable(),
  walking_time_minutes: z.number().nullable(),
  access_notes: z.string().nullable(),
  view_distance_yards: z.number().nullable(),
  total_harvests: z.number().nullable(),
  total_hunts: z.number().nullable(),
  season_hunts: z.number().nullable(),
  last_used_date: z.string().nullable(),
  time_of_day: TimeOfDaySchema.nullable(),
  archery_season: z.boolean().nullable(),
  nearby_water_source: z.boolean().nullable(),
  food_source: FoodSourceTypeSchema.nullable(),
  trail_camera_name: z.string().nullable()
})

// Filter schemas
export const StandFiltersSchema = z.object({
  type: z.array(StandTypeSchema).optional(),
  time_of_day: z.array(TimeOfDaySchema).optional(),
  archery_season: z.boolean().optional(),
  nearby_water_source: z.boolean().optional(),
  food_source: z.array(FoodSourceTypeSchema).optional(),
  active: z.boolean().optional(),
  has_camera: z.boolean().optional()
})

// Sort schema
export const StandSortSchema = z.object({
  field: z.enum([
    'name', 'type', 'last_used_date', 'total_harvests', 
    'total_hunts', 'season_hunts', 'walking_time_minutes', 
    'height_feet', 'created_at'
  ]),
  direction: z.enum(['asc', 'desc'])
})

// Utility schemas for specific operations

// Quick stand creation (minimal required fields)
export const QuickStandSchema = z.object({
  name: StandFieldSchemas.name,
  type: StandFieldSchemas.type,
  latitude: StandFieldSchemas.latitude,
  longitude: StandFieldSchemas.longitude
})

// Stand location update
export const StandLocationSchema = z.object({
  id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

// Stand status update
export const StandStatusSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean()
})

// Bulk operations schema
export const BulkStandUpdateSchema = z.object({
  stand_ids: z.array(z.string().uuid()).min(1, 'At least one stand must be selected'),
  updates: BaseStandFormSchema.partial()
})

// Statistics validation (for API responses)
export const StandStatsSchema = z.object({
  total_stands: z.number().int().min(0),
  active_stands: z.number().int().min(0),
  stands_by_type: z.record(StandTypeSchema, z.number().int().min(0)),
  total_harvests: z.number().int().min(0),
  total_hunts: z.number().int().min(0),
  success_rate: z.number().min(0).max(100),
  most_productive_stand: StandSchema.nullable(),
  least_used_stands: z.array(StandSchema)
})

// Type exports for use in components
export type StandFormData = z.infer<typeof StandFormSchema>
export type StandInsertData = z.infer<typeof StandInsertSchema>
export type StandUpdateData = z.infer<typeof StandUpdateSchema>
export type Stand = z.infer<typeof StandSchema>
export type StandFilters = z.infer<typeof StandFiltersSchema>
export type StandSort = z.infer<typeof StandSortSchema>
export type QuickStand = z.infer<typeof QuickStandSchema>
export type StandStats = z.infer<typeof StandStatsSchema>

// Validation helper functions
export const validateStandForm = (data: unknown) => {
  return StandFormSchema.safeParse(data)
}

export const validateStandUpdate = (data: unknown) => {
  return StandUpdateSchema.safeParse(data)
}

export const validateStandFilters = (data: unknown) => {
  return StandFiltersSchema.safeParse(data)
}

export const validateQuickStand = (data: unknown) => {
  return QuickStandSchema.safeParse(data)
}

// src/lib/stands/index.ts
// Fixed barrel export for all stand-related modules

// Types
export type {
  Stand,
  StandType,
  TimeOfDay,
  FoodSourceType,
  StandFormData,
  StandInsert,
  StandUpdate,
  StandCardData,
  StandFilters,
  StandSortOptions,
  StandStats,
  StandsResponse,
  StandResponse,
  UseStandsReturn,
  UseStandReturn
} from './types'

// Validation schemas and types
export {
  StandTypeSchema,
  TimeOfDaySchema,
  FoodSourceTypeSchema,
  StandFieldSchemas,
  StandFormSchema,
  StandInsertSchema,
  StandUpdateSchema,
  StandSchema,
  StandFiltersSchema,
  StandSortSchema,
  QuickStandSchema,
  StandLocationSchema,
  StandStatusSchema,
  BulkStandUpdateSchema,
  StandStatsSchema,
  validateStandForm,
  validateStandUpdate,
  validateStandFilters,
  validateQuickStand
} from './validation'

export type {
  StandFormData as ValidatedStandFormData,
  StandInsertData,
  StandUpdateData,
  Stand as ValidatedStand,
  StandFilters as ValidatedStandFilters,
  StandSort,
  QuickStand,
  StandStats as ValidatedStandStats
} from './validation'

// Constants and configuration
export {
  STAND_TYPES,
  TIME_OF_DAY_OPTIONS,
  FOOD_SOURCE_OPTIONS,
  FEATURE_ICONS,
  COLORS,
  DEFAULTS,
  VALIDATION_LIMITS,
  SORT_OPTIONS,
  FILTER_GROUPS,
  BREAKPOINTS,
  TOUCH_TARGETS,
  PROPERTY_CONFIG,
  PERFORMANCE_THRESHOLDS
} from './constants'

// Import utility functions first
import {
  formatStandForCard,
  getStandTypeLabel,
  getTimeOfDayLabel,
  getFoodSourceLabel,
  calculateSuccessRate,
  getPerformanceRating,
  getUsageLevel,
  formatDistance,
  formatWalkingTime,
  formatHeight,
  formatCapacity,
  formatDate,
  filterStands,
  sortStands,
  searchStands,
  getStandsNearLocation,
  calculateDistance,
  getStandColor,
  getStandsNeedingMaintenance,
  generateStandSummary
} from './utils'

// Export utility functions
export {
  formatStandForCard,
  getStandTypeLabel,
  getTimeOfDayLabel,
  getFoodSourceLabel,
  calculateSuccessRate,
  getPerformanceRating,
  getUsageLevel,
  formatDistance,
  formatWalkingTime,
  formatHeight,
  formatCapacity,
  formatDate,
  filterStands,
  sortStands,
  searchStands,
  getStandsNearLocation,
  calculateDistance,
  getStandColor,
  getStandsNeedingMaintenance,
  generateStandSummary
}

// Hooks (re-export from hooks directory)
export { useStands, useStand } from '../../hooks/useStands'

// Convenience re-exports for common operations (now using imported functions)
export const StandHelpers = {
  // Type utilities
  getTypeLabel: getStandTypeLabel,
  getTimeLabel: getTimeOfDayLabel,
  getFoodLabel: getFoodSourceLabel,
  
  // Performance utilities
  calculateSuccess: calculateSuccessRate,
  getPerformance: getPerformanceRating,
  getUsage: getUsageLevel,
  
  // Formatting utilities
  formatDist: formatDistance,
  formatTime: formatWalkingTime,
  formatHt: formatHeight,
  formatCap: formatCapacity,
  formatDt: formatDate,
  
  // Data operations
  filter: filterStands,
  sort: sortStands,
  search: searchStands,
  
  // Location utilities
  getNearby: getStandsNearLocation,
  getDistance: calculateDistance,
  getColor: getStandColor,
  
  // Analysis utilities
  getNeedingMaintenance: getStandsNeedingMaintenance,
  getSummary: generateStandSummary
} as const

// Default configurations for quick setup
export const DefaultStandConfig = {
  // Default form values
  formDefaults: {
    type: 'ladder_stand' as const,
    capacity: 1,
    height_feet: 12,
    walking_time_minutes: 5,
    view_distance_yards: 100,
    archery_season: true,
    nearby_water_source: false,
    active: true
  },
  
  // Default sort options
  defaultSort: {
    field: 'name' as const,
    direction: 'asc' as const
  },
  
  // Default filters (show all)
  defaultFilters: {
    active: true
  },
  
  // Common filter presets
  filterPresets: {
    active: { active: true },
    archery: { archery_season: true, active: true },
    nearWater: { nearby_water_source: true, active: true },
    withCamera: { has_camera: true, active: true },
    ladderStands: { type: ['ladder_stand'], active: true },
    groundBlinds: { type: ['bale_blind'], active: true }
  },
  
  // Performance color scheme
  performanceColors: {
    excellent: '#059669',
    good: '#65A30D', 
    average: '#D97706',
    poor: '#DC2626'
  }
} as const

// Quick validation helpers
export const QuickValidation = {
  isValidStandName: (name: string): boolean => {
    return name.length >= 2 && name.length <= 100
  },
  
  isValidHeight: (height: number): boolean => {
    return height >= 1 && height <= 50
  },
  
  isValidCapacity: (capacity: number): boolean => {
    return capacity >= 1 && capacity <= 8
  },
  
  isValidCoordinates: (lat?: number | null, lng?: number | null): boolean => {
    if (!lat || !lng) return false
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  },
  
  hasRequiredFields: (data: Partial<any>): boolean => {
    return Boolean(data.name && data.type)
  }
} as const

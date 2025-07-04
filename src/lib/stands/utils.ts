// src/lib/stands/utils.ts
// Utility functions for stand management

import { Stand, StandFilters, StandSort, StandCardData } from './types'
import { STAND_TYPES, TIME_OF_DAY_OPTIONS, FOOD_SOURCE_OPTIONS, PERFORMANCE_THRESHOLDS } from './constants'

/**
 * Format stand data for display in cards/lists
 */
export function formatStandForCard(stand: Stand): StandCardData {
  return {
    id: stand.id,
    name: stand.name,
    type: stand.type,
    description: stand.description,
    height_feet: stand.height_feet,
    capacity: stand.capacity,
    walking_time_minutes: stand.walking_time_minutes,
    total_harvests: stand.total_harvests,
    total_hunts: stand.total_hunts,
    season_hunts: stand.season_hunts,
    last_used_date: stand.last_used_date,
    time_of_day: stand.time_of_day,
    archery_season: stand.archery_season,
    nearby_water_source: stand.nearby_water_source,
    food_source: stand.food_source,
    trail_camera_name: stand.trail_camera_name,
    active: stand.active
  }
}

/**
 * Get human-readable stand type label
 */
export function getStandTypeLabel(type: Stand['type']): string {
  return STAND_TYPES[type]?.label || type
}

/**
 * Get time of day label
 */
export function getTimeOfDayLabel(timeOfDay: Stand['time_of_day']): string {
  if (!timeOfDay) return 'Any time'
  return TIME_OF_DAY_OPTIONS[timeOfDay]?.label || timeOfDay
}

/**
 * Get food source label
 */
export function getFoodSourceLabel(foodSource: Stand['food_source']): string {
  if (!foodSource) return 'No food source'
  return FOOD_SOURCE_OPTIONS[foodSource]?.label || foodSource
}

/**
 * Calculate success rate for a stand
 */
export function calculateSuccessRate(stand: Stand): number {
  const hunts = stand.total_hunts || 0
  const harvests = stand.total_harvests || 0
  
  if (hunts === 0) return 0
  return Math.round((harvests / hunts) * 10000) / 100 // Round to 2 decimal places
}

/**
 * Get performance rating based on success rate
 */
export function getPerformanceRating(successRate: number): {
  rating: 'excellent' | 'good' | 'average' | 'poor'
  color: string
  label: string
} {
  if (successRate >= PERFORMANCE_THRESHOLDS.success_rate.excellent) {
    return { rating: 'excellent', color: '#059669', label: 'Excellent' }
  } else if (successRate >= PERFORMANCE_THRESHOLDS.success_rate.good) {
    return { rating: 'good', color: '#65A30D', label: 'Good' }
  } else if (successRate >= PERFORMANCE_THRESHOLDS.success_rate.average) {
    return { rating: 'average', color: '#D97706', label: 'Average' }
  } else {
    return { rating: 'poor', color: '#DC2626', label: 'Poor' }
  }
}

/**
 * Get usage level based on season hunts
 */
export function getUsageLevel(seasonHunts: number): {
  level: 'high' | 'medium' | 'low' | 'unused'
  color: string
  label: string
} {
  if (seasonHunts >= PERFORMANCE_THRESHOLDS.hunts_per_season.high) {
    return { level: 'high', color: '#059669', label: 'High Usage' }
  } else if (seasonHunts >= PERFORMANCE_THRESHOLDS.hunts_per_season.medium) {
    return { level: 'medium', color: '#D97706', label: 'Medium Usage' }
  } else if (seasonHunts >= PERFORMANCE_THRESHOLDS.hunts_per_season.low) {
    return { level: 'low', color: '#6B7280', label: 'Low Usage' }
  } else {
    return { level: 'unused', color: '#DC2626', label: 'Unused' }
  }
}

/**
 * Format distance for display
 */
export function formatDistance(yards: number | null): string {
  if (!yards) return 'Unknown'
  
  if (yards < 100) {
    return `${yards} yds`
  } else {
    return `${Math.round(yards / 10) * 10} yds` // Round to nearest 10
  }
}

/**
 * Format walking time for display
 */
export function formatWalkingTime(minutes: number | null): string {
  if (!minutes) return 'Unknown'
  
  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
}

/**
 * Format height for display
 */
export function formatHeight(feet: number | null): string {
  if (!feet) return 'Ground level'
  return `${feet} ft`
}

/**
 * Format capacity for display
 */
export function formatCapacity(capacity: number | null): string {
  if (!capacity) return '1 hunter'
  return capacity === 1 ? '1 hunter' : `${capacity} hunters`
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  
  return date.toLocaleDateString()
}

/**
 * Filter stands based on criteria
 */
export function filterStands(stands: Stand[], filters: StandFilters): Stand[] {
  return stands.filter(stand => {
    // Filter by type
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(stand.type)) return false
    }

    // Filter by time of day
    if (filters.time_of_day && filters.time_of_day.length > 0) {
      if (!stand.time_of_day || !filters.time_of_day.includes(stand.time_of_day)) return false
    }

    // Filter by archery season
    if (filters.archery_season !== undefined) {
      if (stand.archery_season !== filters.archery_season) return false
    }

    // Filter by water source
    if (filters.nearby_water_source !== undefined) {
      if (stand.nearby_water_source !== filters.nearby_water_source) return false
    }

    // Filter by food source
    if (filters.food_source && filters.food_source.length > 0) {
      if (!stand.food_source || !filters.food_source.includes(stand.food_source)) return false
    }

    // Filter by active status
    if (filters.active !== undefined) {
      if (stand.active !== filters.active) return false
    }

    // Filter by camera presence
    if (filters.has_camera !== undefined) {
      const hasCamera = Boolean(stand.trail_camera_name)
      if (hasCamera !== filters.has_camera) return false
    }

    return true
  })
}

/**
 * Sort stands based on criteria
 */
export function sortStands(stands: Stand[], sort: StandSort): Stand[] {
  const { field, direction } = sort
  
  return [...stands].sort((a, b) => {
    let aValue = a[field]
    let bValue = b[field]
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = ''
    if (bValue === null || bValue === undefined) bValue = ''
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return direction === 'asc' ? comparison : -comparison
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue
      return direction === 'asc' ? comparison : -comparison
    }
    
    // Handle dates
    if (field === 'last_used_date' || field === 'created_at') {
      const aDate = aValue ? new Date(aValue as string).getTime() : 0
      const bDate = bValue ? new Date(bValue as string).getTime() : 0
      const comparison = aDate - bDate
      return direction === 'asc' ? comparison : -comparison
    }
    
    // Default string comparison
    const comparison = String(aValue).localeCompare(String(bValue))
    return direction === 'asc' ? comparison : -comparison
  })
}

/**
 * Search stands by name, description, or trail name
 */
export function searchStands(stands: Stand[], searchTerm: string): Stand[] {
  if (!searchTerm.trim()) return stands
  
  const term = searchTerm.toLowerCase().trim()
  
  return stands.filter(stand => 
    stand.name.toLowerCase().includes(term) ||
    stand.description?.toLowerCase().includes(term) ||
    stand.trail_name?.toLowerCase().includes(term) ||
    stand.trail_camera_name?.toLowerCase().includes(term) ||
    getStandTypeLabel(stand.type).toLowerCase().includes(term)
  )
}

/**
 * Get stands within a certain radius of a point (for map clustering)
 */
export function getStandsNearLocation(
  stands: Stand[], 
  centerLat: number, 
  centerLng: number, 
  radiusInMeters: number
): Stand[] {
  return stands.filter(stand => {
    if (!stand.latitude || !stand.longitude) return false
    
    const distance = calculateDistance(
      centerLat, centerLng,
      stand.latitude, stand.longitude
    )
    
    return distance <= radiusInMeters
  })
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Generate a unique color for a stand (for map markers)
 */
export function getStandColor(stand: Stand): string {
  // Use stand type color as base
  const baseColor = STAND_TYPES[stand.type]?.color || '#FA7921'
  
  // Adjust based on activity and performance
  if (!stand.active) {
    return '#9CA3AF' // Gray for inactive stands
  }
  
  const successRate = calculateSuccessRate(stand)
  const performance = getPerformanceRating(successRate)
  
  // Return color based on performance
  switch (performance.rating) {
    case 'excellent':
      return '#059669' // Green for excellent
    case 'good':
      return baseColor // Use type color for good
    case 'average':
      return '#D97706' // Orange for average
    case 'poor':
      return '#DC2626' // Red for poor
    default:
      return baseColor
  }
}

/**
 * Get stands that need maintenance (example criteria)
 */
export function getStandsNeedingMaintenance(stands: Stand[]): Stand[] {
  return stands.filter(stand => {
    // Example criteria - stands that haven't been used in a long time
    if (stand.last_used_date) {
      const lastUsed = new Date(stand.last_used_date)
      const now = new Date()
      const daysSinceUsed = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24))
      
      // If not used in over 2 years, might need maintenance
      if (daysSinceUsed > 730) return true
    }
    
    // Add other maintenance criteria as needed
    return false
  })
}

/**
 * Generate summary statistics for a group of stands
 */
export function generateStandSummary(stands: Stand[]): {
  total: number
  active: number
  totalHarvests: number
  totalHunts: number
  averageSuccessRate: number
  mostUsedType: Stand['type'] | null
} {
  const active = stands.filter(s => s.active)
  const totalHarvests = stands.reduce((sum, s) => sum + (s.total_harvests || 0), 0)
  const totalHunts = stands.reduce((sum, s) => sum + (s.total_hunts || 0), 0)
  
  // Calculate average success rate
  const standsWithHunts = stands.filter(s => (s.total_hunts || 0) > 0)
  const averageSuccessRate = standsWithHunts.length > 0
    ? standsWithHunts.reduce((sum, s) => sum + calculateSuccessRate(s), 0) / standsWithHunts.length
    : 0
  
  // Find most used type
  const typeCounts = stands.reduce((acc, stand) => {
    acc[stand.type] = (acc[stand.type] || 0) + (stand.total_hunts || 0)
    return acc
  }, {} as Record<Stand['type'], number>)
  
  const mostUsedType = Object.entries(typeCounts).reduce((mostUsed, [type, count]) => {
    return count > (mostUsed[1] || 0) ? [type, count] : mostUsed
  }, ['', 0])[0] as Stand['type'] || null
  
  return {
    total: stands.length,
    active: active.length,
    totalHarvests,
    totalHunts,
    averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
    mostUsedType
  }
}

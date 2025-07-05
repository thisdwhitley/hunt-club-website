// src/lib/utils/stands.ts
// Utility functions for stand management

import { Stand } from '@/lib/database/stands'

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate success rate for a stand
 */
export function calculateSuccessRate(stand: Stand): number | null {
  if (!stand.total_hunts || stand.total_hunts === 0) return null
  return Math.round((stand.total_harvests || 0) / stand.total_hunts * 100)
}

/**
 * Get performance rating based on success rate
 */
export function getPerformanceRating(successRate: number | null): 'excellent' | 'good' | 'average' | 'poor' | 'unknown' {
  if (successRate === null) return 'unknown'
  if (successRate >= 75) return 'excellent'
  if (successRate >= 50) return 'good'
  if (successRate >= 25) return 'average'
  return 'poor'
}

/**
 * Get usage level based on season hunts
 */
export function getUsageLevel(seasonHunts: number): 'high' | 'medium' | 'low' | 'unused' {
  if (seasonHunts >= 10) return 'high'
  if (seasonHunts >= 5) return 'medium'
  if (seasonHunts >= 1) return 'low'
  return 'unused'
}

/**
 * Format last used date in human-readable format
 */
export function formatLastUsed(dateString: string | null): string {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Format walking time in human-readable format
 */
export function formatWalkingTime(minutes: number | null): string {
  if (!minutes) return 'Unknown'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format height in human-readable format
 */
export function formatHeight(feet: number | null): string {
  if (!feet) return 'Ground level'
  return `${feet} ft`
}

/**
 * Format capacity in human-readable format
 */
export function formatCapacity(capacity: number | null): string {
  if (!capacity) return 'Unknown'
  if (capacity === 1) return '1 hunter'
  return `${capacity} hunters`
}

/**
 * Format view distance in human-readable format
 */
export function formatViewDistance(yards: number | null): string {
  if (!yards) return 'Unknown'
  if (yards >= 1000) return `${(yards / 1000).toFixed(1)}k yards`
  return `${yards} yards`
}

/**
 * Get stand type display information
 */
export function getStandTypeInfo(type: Stand['type']) {
  const standTypes = {
    ladder_stand: {
      label: 'Ladder Stand',
      description: 'Portable or fixed ladder stand with platform',
      icon: '🪜',
      color: '#FA7921'
    },
    bale_blind: {
      label: 'Bale Blind',
      description: 'Round hay bale ground blind',
      icon: '🌾',
      color: '#FA7921'
    },
    box_stand: {
      label: 'Box Stand',
      description: 'Enclosed box blind with windows',
      icon: '📦',
      color: '#FA7921'
    },
    tripod: {
      label: 'Tripod',
      description: 'Tripod stand with elevated platform',
      icon: '📐',
      color: '#FA7921'
    }
  }
  
  return standTypes[type]
}

/**
 * Get time of day display information
 */
export function getTimeOfDayInfo(timeOfDay: Stand['time_of_day']) {
  const timeInfo = {
    AM: { label: 'Morning', icon: '🌅', description: 'Best for morning hunts' },
    PM: { label: 'Evening', icon: '🌇', description: 'Best for evening hunts' },
    ALL: { label: 'All Day', icon: '☀️', description: 'Good for any time of day' }
  }
  
  return timeOfDay ? timeInfo[timeOfDay] : null
}

/**
 * Sort stands by various criteria
 */
export function sortStands(stands: Stand[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Stand[] {
  const sorted = [...stands].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
      case 'lastUsed':
        const aDate = a.last_used_date ? new Date(a.last_used_date).getTime() : 0
        const bDate = b.last_used_date ? new Date(b.last_used_date).getTime() : 0
        comparison = aDate - bDate
        break
      case 'successRate':
        const aRate = calculateSuccessRate(a) || 0
        const bRate = calculateSuccessRate(b) || 0
        comparison = aRate - bRate
        break
      case 'hunts':
        comparison = (a.total_hunts || 0) - (b.total_hunts || 0)
        break
      case 'harvests':
        comparison = (a.total_harvests || 0) - (b.total_harvests || 0)
        break
      case 'walkingTime':
        comparison = (a.walking_time_minutes || 0) - (b.walking_time_minutes || 0)
        break
      case 'created':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      default:
        comparison = a.name.localeCompare(b.name)
    }
    
    return order === 'desc' ? -comparison : comparison
  })
  
  return sorted
}

/**
 * Filter stands by multiple criteria
 */
export function filterStands(stands: Stand[], filters: {
  search?: string
  type?: Stand['type'] | 'all'
  active?: boolean | 'all'
  timeOfDay?: Stand['time_of_day'] | 'all'
  hasCoordinates?: boolean | 'all'
  hasCamera?: boolean | 'all'
  hasWater?: boolean | 'all'
  foodSource?: Stand['food_source'] | 'all'
  minSuccessRate?: number
  maxWalkingTime?: number
}): Stand[] {
  return stands.filter(stand => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchFields = [
        stand.name,
        stand.description,
        stand.trail_name,
        stand.access_notes,
        stand.trail_camera_name
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (!searchFields.includes(searchLower)) return false
    }
    
    // Type filter
    if (filters.type && filters.type !== 'all' && stand.type !== filters.type) {
      return false
    }
    
    // Active filter
    if (filters.active !== undefined && filters.active !== 'all' && stand.active !== filters.active) {
      return false
    }
    
    // Time of day filter
    if (filters.timeOfDay && filters.timeOfDay !== 'all' && stand.time_of_day !== filters.timeOfDay) {
      return false
    }
    
    // Coordinates filter
    if (filters.hasCoordinates !== undefined && filters.hasCoordinates !== 'all') {
      const hasCoords = stand.latitude !== null && stand.longitude !== null
      if (hasCoords !== filters.hasCoordinates) return false
    }
    
    // Camera filter
    if (filters.hasCamera !== undefined && filters.hasCamera !== 'all') {
      const hasCamera = !!stand.trail_camera_name
      if (hasCamera !== filters.hasCamera) return false
    }
    
    // Water source filter
    if (filters.hasWater !== undefined && filters.hasWater !== 'all') {
      if (stand.nearby_water_source !== filters.hasWater) return false
    }
    
    // Food source filter
    if (filters.foodSource && filters.foodSource !== 'all' && stand.food_source !== filters.foodSource) {
      return false
    }
    
    // Success rate filter
    if (filters.minSuccessRate !== undefined) {
      const successRate = calculateSuccessRate(stand)
      if (successRate === null || successRate < filters.minSuccessRate) return false
    }
    
    // Walking time filter
    if (filters.maxWalkingTime !== undefined) {
      if (!stand.walking_time_minutes || stand.walking_time_minutes > filters.maxWalkingTime) return false
    }
    
    return true
  })
}

/**
 * Find stands near a location
 */
export function findNearbyStands(
  stands: Stand[],
  latitude: number,
  longitude: number,
  radiusKm: number = 1
): (Stand & { distance: number })[] {
  return stands
    .filter(stand => stand.latitude !== null && stand.longitude !== null)
    .map(stand => ({
      ...stand,
      distance: calculateDistance(latitude, longitude, stand.latitude!, stand.longitude!)
    }))
    .filter(stand => stand.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Get stand statistics
 */
export function getStandStatistics(stands: Stand[]) {
  const stats = {
    total: stands.length,
    active: stands.filter(s => s.active).length,
    inactive: stands.filter(s => !s.active).length,
    mapped: stands.filter(s => s.latitude !== null && s.longitude !== null).length,
    withCamera: stands.filter(s => s.trail_camera_name).length,
    withWater: stands.filter(s => s.nearby_water_source).length,
    byType: {
      ladder_stand: stands.filter(s => s.type === 'ladder_stand').length,
      bale_blind: stands.filter(s => s.type === 'bale_blind').length,
      box_stand: stands.filter(s => s.type === 'box_stand').length,
      tripod: stands.filter(s => s.type === 'tripod').length
    },
    byTimeOfDay: {
      AM: stands.filter(s => s.time_of_day === 'AM').length,
      PM: stands.filter(s => s.time_of_day === 'PM').length,
      ALL: stands.filter(s => s.time_of_day === 'ALL').length,
      unspecified: stands.filter(s => !s.time_of_day).length
    },
    totalHunts: stands.reduce((sum, s) => sum + (s.total_hunts || 0), 0),
    totalHarvests: stands.reduce((sum, s) => sum + (s.total_harvests || 0), 0),
    avgHuntsPerStand: 0,
    avgHarvestsPerStand: 0,
    avgSuccessRate: 0
  }
  
  // Calculate averages
  if (stats.total > 0) {
    stats.avgHuntsPerStand = Math.round((stats.totalHunts / stats.total) * 10) / 10
    stats.avgHarvestsPerStand = Math.round((stats.totalHarvests / stats.total) * 10) / 10
    
    const standsWithData = stands.filter(s => s.total_hunts && s.total_hunts > 0)
    if (standsWithData.length > 0) {
      const totalSuccessRate = standsWithData.reduce((sum, s) => {
        const rate = calculateSuccessRate(s)
        return sum + (rate || 0)
      }, 0)
      stats.avgSuccessRate = Math.round((totalSuccessRate / standsWithData.length) * 10) / 10
    }
  }
  
  return stats
}

/**
 * Validate stand coordinates
 */
export function validateCoordinates(latitude: number | null, longitude: number | null): {
  valid: boolean
  error?: string
} {
  if (latitude === null && longitude === null) {
    return { valid: true } // Both null is okay
  }
  
  if (latitude === null || longitude === null) {
    return { valid: false, error: 'Both latitude and longitude must be provided together' }
  }
  
  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' }
  }
  
  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' }
  }
  
  return { valid: true }
}

/**
 * Generate stand suggestions based on patterns
 */
export function generateStandSuggestions(stands: Stand[]): string[] {
  const suggestions = []
  
  // Analyze existing patterns
  const typeCount = getStandStatistics(stands).byType
  const hasWaterStands = stands.filter(s => s.nearby_water_source).length
  const hasFieldStands = stands.filter(s => s.food_source === 'field').length
  
  // Suggest based on gaps
  if (typeCount.ladder_stand === 0) {
    suggestions.push('Consider adding a ladder stand for elevated hunting')
  }
  
  if (typeCount.bale_blind === 0) {
    suggestions.push('A bale blind could provide good ground-level concealment')
  }
  
  if (hasWaterStands < 2) {
    suggestions.push('Look for locations near water sources - deer visit water regularly')
  }
  
  if (hasFieldStands === 0) {
    suggestions.push('Field edge stands often provide excellent hunting opportunities')
  }
  
  if (stands.filter(s => s.time_of_day === 'AM').length < stands.filter(s => s.time_of_day === 'PM').length) {
    suggestions.push('Consider adding morning-specific stands facing east')
  }
  
  return suggestions
}

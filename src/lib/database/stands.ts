// src/lib/database/stands.ts - Updated Stand Service for Complete Schema
import { createClient } from '@/lib/supabase/client'

// Complete Stand type matching your database schema exactly
export interface Stand {
  id: string
  name: string
  description: string | null
  type: 'ladder_stand' | 'bale_blind' | 'box_stand' | 'tripod' | 'ground_blind'
  active: boolean
  latitude: number | null
  longitude: number | null
  trail_name: string | null
  walking_time_minutes: number | null
  access_notes: string | null
  height_feet: number | null
  capacity: number | null
  time_of_day: 'AM' | 'PM' | 'ALL' | null
  view_distance_yards: number | null
  nearby_water_source: boolean | null
  total_hunts: number | null
  total_harvests: number | null
  last_used_date: string | null
  season_hunts: number | null
  food_source: 'field' | 'feeder' | null
  archery_season: boolean | null
  trail_camera_name: string | null
  created_at: string
  updated_at: string
}

// Insert type (excludes id, created_at, updated_at)
export interface StandInsert {
  name: string
  description?: string | null
  type: 'ladder_stand' | 'bale_blind' | 'box_stand' | 'tripod' | 'ground_blind'
  active?: boolean
  latitude?: number | null
  longitude?: number | null
  trail_name?: string | null
  walking_time_minutes?: number | null
  access_notes?: string | null
  height_feet?: number | null
  capacity?: number | null
  time_of_day?: 'AM' | 'PM' | 'ALL' | null
  view_distance_yards?: number | null
  nearby_water_source?: boolean | null
  total_hunts?: number | null
  total_harvests?: number | null
  last_used_date?: string | null
  season_hunts?: number | null
  food_source?: 'field' | 'feeder' | null
  archery_season?: boolean | null
  trail_camera_name?: string | null
}

// Update type (all fields optional except id)
export interface StandUpdate {
  name?: string
  description?: string | null
  type?: 'ladder_stand' | 'bale_blind' | 'box_stand' | 'tripod' | 'ground_blind'
  active?: boolean
  latitude?: number | null
  longitude?: number | null
  trail_name?: string | null
  walking_time_minutes?: number | null
  access_notes?: string | null
  height_feet?: number | null
  capacity?: number | null
  time_of_day?: 'AM' | 'PM' | 'ALL' | null
  view_distance_yards?: number | null
  nearby_water_source?: boolean | null
  total_hunts?: number | null
  total_harvests?: number | null
  last_used_date?: string | null
  season_hunts?: number | null
  food_source?: 'field' | 'feeder' | null
  archery_season?: boolean | null
  trail_camera_name?: string | null
}

// Filter options for getStands
export interface StandFilters {
  active?: boolean
  type?: string
  search?: string
  timeOfDay?: string
  hasCoordinates?: boolean
}

// Statistics interface
export interface StandStats {
  total: number
  active: number
  inactive: number
  mapped: number
  unmapped: number
  totalHunts: number
  totalHarvests: number
  avgHuntsPerStand: number
  avgHarvestsPerStand: number
}

export class StandService {
  private supabase = createClient()

  /**
   * Get all stands with optional filtering
   */
  async getStands(filters?: StandFilters): Promise<Stand[]> {
    console.log('🔍 StandService.getStands called with filters:', filters)
    
    try {
      let query = this.supabase
        .from('stands')
        .select('*')
        .order('name')

      // Apply filters
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters?.timeOfDay && filters.timeOfDay !== 'all') {
        query = query.eq('time_of_day', filters.timeOfDay)
      }

      if (filters?.hasCoordinates !== undefined) {
        if (filters.hasCoordinates) {
          query = query.not('latitude', 'is', null).not('longitude', 'is', null)
        } else {
          query = query.or('latitude.is.null,longitude.is.null')
        }
      }

      if (filters?.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},trail_name.ilike.${searchTerm},access_notes.ilike.${searchTerm}`)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching stands:', error)
        throw new Error(`Failed to fetch stands: ${error.message}`)
      }

      console.log('✅ Fetched stands:', data?.length || 0)
      return data || []
    } catch (err) {
      console.error('❌ StandService.getStands error:', err)
      throw err
    }
  }

  /**
   * Get single stand by ID
   */
  async getStand(id: string): Promise<Stand> {
    console.log('🔍 StandService.getStand called with id:', id)
    
    try {
      const { data, error } = await this.supabase
        .from('stands')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ Error fetching stand:', error)
        throw new Error(`Failed to fetch stand: ${error.message}`)
      }

      if (!data) {
        throw new Error('Stand not found')
      }

      console.log('✅ Fetched stand:', data.name)
      return data
    } catch (err) {
      console.error('❌ StandService.getStand error:', err)
      throw err
    }
  }

  /**
   * Create new stand
   */
  async createStand(standData: StandInsert): Promise<Stand> {
    console.log('🔍 StandService.createStand called with data:', standData.name)
    
    try {
      // Prepare data with defaults
      const insertData: StandInsert = {
        active: true,
        total_hunts: 0,
        total_harvests: 0,
        season_hunts: 0,
        ...standData
      }

      const { data, error } = await this.supabase
        .from('stands')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating stand:', error)
        throw new Error(`Failed to create stand: ${error.message}`)
      }

      if (!data) {
        throw new Error('Failed to create stand: No data returned')
      }

      console.log('✅ Created stand:', data.name)
      return data
    } catch (err) {
      console.error('❌ StandService.createStand error:', err)
      throw err
    }
  }

  /**
   * Update existing stand
   */
  async updateStand(id: string, updates: StandUpdate): Promise<Stand> {
    console.log('🔍 StandService.updateStand called with ID:', id)
    console.log('🔍 Raw updates received:', updates)
    console.log('🔍 Updates keys:', Object.keys(updates))
    
    try {
      // Filter updates to only include valid database fields
      const validFields = [
        'name', 'description', 'type', 'active', 'latitude', 'longitude',
        'trail_name', 'walking_time_minutes', 'access_notes', 'height_feet',
        'capacity', 'time_of_day', 'view_distance_yards', 'nearby_water_source',
        'total_hunts', 'total_harvests', 'last_used_date', 'season_hunts',
        'food_source', 'archery_season', 'trail_camera_name'
      ]
      
      console.log('🔍 Valid fields:', validFields)
      
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => validFields.includes(key))
      )
      
      console.log('🔍 Filtered updates:', filteredUpdates)
      console.log('🔍 Filtered update keys:', Object.keys(filteredUpdates))
      
      // Check for any forbidden fields that got through
      const invalidFields = Object.keys(updates).filter(key => !validFields.includes(key))
      if (invalidFields.length > 0) {
        console.warn('⚠️ Invalid fields detected and filtered out:', invalidFields)
      }

      const { data, error } = await this.supabase
        .from('stands')
        .update(filteredUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to update stand: ${error.message}`)
      }

      if (!data) {
        throw new Error('Stand not found or failed to update')
      }

      console.log('✅ Updated stand successfully:', data.name)
      return data
    } catch (err) {
      console.error('❌ StandService.updateStand error:', err)
      throw err
    }
  }

  /**
   * Delete stand (soft delete by setting active = false, or hard delete)
   */
  async deleteStand(id: string, hardDelete: boolean = false): Promise<void> {
    console.log('🔍 StandService.deleteStand called:', id, hardDelete ? 'hard' : 'soft')
    
    try {
      if (hardDelete) {
        // Hard delete - completely remove from database
        const { error } = await this.supabase
          .from('stands')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('❌ Error deleting stand:', error)
          throw new Error(`Failed to delete stand: ${error.message}`)
        }
      } else {
        // Soft delete - just mark as inactive
        const { error } = await this.supabase
          .from('stands')
          .update({ active: false })
          .eq('id', id)

        if (error) {
          console.error('❌ Error deactivating stand:', error)
          throw new Error(`Failed to deactivate stand: ${error.message}`)
        }
      }

      console.log('✅ Stand deleted/deactivated')
    } catch (err) {
      console.error('❌ StandService.deleteStand error:', err)
      throw err
    }
  }

  /**
   * Get stands statistics
   */
  async getStandsStats(): Promise<StandStats> {
    console.log('🔍 StandService.getStandsStats called')
    
    try {
      const { data, error } = await this.supabase
        .from('stands')
        .select('active, latitude, longitude, total_hunts, total_harvests')

      if (error) {
        console.error('❌ Error fetching stands stats:', error)
        throw new Error(`Failed to fetch stands stats: ${error.message}`)
      }

      const stands = data || []
      const active = stands.filter(s => s.active)
      const mapped = stands.filter(s => s.latitude !== null && s.longitude !== null)
      const totalHunts = stands.reduce((sum, s) => sum + (s.total_hunts || 0), 0)
      const totalHarvests = stands.reduce((sum, s) => sum + (s.total_harvests || 0), 0)

      const stats: StandStats = {
        total: stands.length,
        active: active.length,
        inactive: stands.length - active.length,
        mapped: mapped.length,
        unmapped: stands.length - mapped.length,
        totalHunts,
        totalHarvests,
        avgHuntsPerStand: stands.length > 0 ? Math.round((totalHunts / stands.length) * 10) / 10 : 0,
        avgHarvestsPerStand: stands.length > 0 ? Math.round((totalHarvests / stands.length) * 10) / 10 : 0
      }

      console.log('✅ Calculated stats:', stats)
      return stats
    } catch (err) {
      console.error('❌ StandService.getStandsStats error:', err)
      throw err
    }
  }

  /**
   * Test database connection and permissions
   */
  async testConnection(): Promise<{ success: boolean; error?: any; message?: string }> {
    console.log('🔍 StandService.testConnection called')
    
    try {
      // Test basic select
      const { data, error } = await this.supabase
        .from('stands')
        .select('id, name')
        .limit(1)

      if (error) {
        console.error('❌ Connection test failed:', error)
        return { 
          success: false, 
          error, 
          message: `Database connection failed: ${error.message}` 
        }
      }

      console.log('✅ Connection test successful')
      return { 
        success: true, 
        message: `Connection successful. Found ${data.length} stand(s).` 
      }
    } catch (err) {
      console.error('❌ Connection test error:', err)
      return { 
        success: false, 
        error: err, 
        message: `Connection test failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Bulk update stand statistics (useful for maintenance)
   */
  async updateStandStats(standId: string, stats: { total_hunts?: number; total_harvests?: number; season_hunts?: number; last_used_date?: string }): Promise<Stand> {
    console.log('🔍 StandService.updateStandStats called:', standId, stats)
    
    try {
      const { data, error } = await this.supabase
        .from('stands')
        .update(stats)
        .eq('id', standId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating stand stats:', error)
        throw new Error(`Failed to update stand stats: ${error.message}`)
      }

      if (!data) {
        throw new Error('Stand not found')
      }

      console.log('✅ Updated stand stats for:', data.name)
      return data
    } catch (err) {
      console.error('❌ StandService.updateStandStats error:', err)
      throw err
    }
  }

  /**
   * Get stands by location (within a radius)
   */
  async getStandsNearLocation(latitude: number, longitude: number, radiusKm: number = 1): Promise<Stand[]> {
    console.log('🔍 StandService.getStandsNearLocation called:', latitude, longitude, radiusKm)
    
    try {
      // This is a simple implementation - for production you might want to use PostGIS
      const stands = await this.getStands({ hasCoordinates: true })
      
      const nearbyStands = stands.filter(stand => {
        if (!stand.latitude || !stand.longitude) return false
        
        const distance = this.calculateDistance(
          latitude, longitude,
          stand.latitude, stand.longitude
        )
        
        return distance <= radiusKm
      })

      console.log('✅ Found nearby stands:', nearbyStands.length)
      return nearbyStands
    } catch (err) {
      console.error('❌ StandService.getStandsNearLocation error:', err)
      throw err
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

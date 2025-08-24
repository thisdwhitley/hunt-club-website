// src/lib/hunt-logging/hunt-service.ts
// MAJOR UPDATE: Now uses hunt_logs_with_temperature view for smart temperature display

import { createClient } from '@/lib/supabase/client'
import type { 
  HuntLog, 
  HuntLogInsert, 
  HuntLogUpdate,
  HuntHarvest,
  HuntSighting,
  Stand,
  Member,
  HuntWithTemperature
} from '@/types/database'

const supabase = createClient()

// Extended member interface to handle cases where member record doesn't exist
export interface ExtendedMember extends Partial<Member> {
  email?: string
  full_name?: string | null
  display_name?: string | null
}

// UPDATED: Now extends HuntWithTemperature for smart temperature support
export interface HuntWithDetails extends HuntWithTemperature {
  stand?: Stand
  member?: ExtendedMember
  harvests?: HuntHarvest[]
  sightings?: HuntSighting[]
  // Note: weather data is now included directly in HuntWithTemperature
}

export interface HuntStats {
  totalHunts: number
  totalHarvests: number
  totalSightings: number
  activeStands: number
  thisSeason: {
    hunts: number
    harvests: number
    sightings: number
  }
  topStands: Array<Stand & {
    hunt_count: number
  }>
}

export interface HuntFilters {
  member_id?: string
  stand_id?: string
  date_from?: string
  date_to?: string
  had_harvest?: boolean
  season?: string
}

export interface ManagementStats {
  totalRecords: number
  recordsThisMonth: number
  recordsThisWeek: number
  harvestRate: number
  topStands: Array<{ name: string, hunt_count: number }>
  topMembers: Array<{ name: string, hunt_count: number }>
}

export class HuntService {
  
  // ===============================================
  // UPDATED CRUD OPERATIONS - Now uses hunt_logs_with_temperature view
  // ===============================================
  
  async getHunts(filters?: HuntFilters): Promise<HuntWithDetails[]> {
    try {
      // Build the base hunt logs query
      let huntQuery = supabase
        .from('hunt_logs_with_temperature')
        .select('*')
        .order('hunt_date', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply filters to hunt logs
      if (filters?.member_id) {
        huntQuery = huntQuery.eq('member_id', filters.member_id)
      }
      if (filters?.stand_id) {
        huntQuery = huntQuery.eq('stand_id', filters.stand_id)
      }
      if (filters?.date_from) {
        huntQuery = huntQuery.gte('hunt_date', filters.date_from)
      }
      if (filters?.date_to) {
        huntQuery = huntQuery.lte('hunt_date', filters.date_to)
      }
      if (filters?.had_harvest !== undefined) {
        if (filters.had_harvest) {
          huntQuery = huntQuery.gt('harvest_count', 0)
        } else {
          huntQuery = huntQuery.eq('harvest_count', 0)
        }
      }
      if (filters?.season) {
        huntQuery = huntQuery.eq('hunting_season', filters.season)
      }

      // Execute the hunt logs query
      const { data: hunts, error: huntError } = await huntQuery

      if (huntError) {
        console.error('Error fetching hunts:', huntError)
        throw huntError
      }

      if (!hunts || hunts.length === 0) {
        return []
      }

      // Get unique member IDs and stand IDs for batch queries
      const memberIds = [...new Set(hunts.map(hunt => hunt.member_id).filter(Boolean))]
      const standIds = [...new Set(hunts.map(hunt => hunt.stand_id).filter(Boolean))]
      const huntIds = hunts.map(hunt => hunt.id)

      // Batch fetch related data - SIMPLIFIED: only members table needed
      const [membersResult, standsResult, harvestsResult, sightingsResult] = await Promise.all([
        // Get member data from members table only
        memberIds.length > 0 
          ? supabase.from('members').select('*').in('id', memberIds)
          : { data: [], error: null },
        
        // Get stands data
        standIds.length > 0 
          ? supabase.from('stands').select('*').in('id', standIds)
          : { data: [], error: null },
        
        // Get harvests for these hunts
        supabase.from('hunt_harvests').select('*').in('hunt_log_id', huntIds),
        
        // Get sightings for these hunts
        supabase.from('hunt_sightings').select('*').in('hunt_log_id', huntIds)
      ])

      // ADD THIS DEBUG BLOCK RIGHT HERE:
      console.log('🔍 HUNT SERVICE SIGHTINGS DEBUG')
      console.log('🔍 Hunt IDs:', huntIds)
      console.log('🔍 Sightings from database:', sightingsResult.data)
      console.log('🔍 Sightings count:', sightingsResult.data?.length || 0)

      // Create lookup maps for efficient joining
      const membersMap = new Map((membersResult.data || []).map(member => [member.id, member]))
      const standsMap = new Map((standsResult.data || []).map(stand => [stand.id, stand]))
      
      // Group harvests and sightings by hunt_log_id
      const harvestsMap = new Map()
      const sightingsMap = new Map()
      
      ;(harvestsResult.data || []).forEach(harvest => {
        if (!harvestsMap.has(harvest.hunt_log_id)) {
          harvestsMap.set(harvest.hunt_log_id, [])
        }
        harvestsMap.get(harvest.hunt_log_id).push(harvest)
      })
      
      ;(sightingsResult.data || []).forEach(sighting => {
        if (!sightingsMap.has(sighting.hunt_log_id)) {
          sightingsMap.set(sighting.hunt_log_id, [])
        }
        sightingsMap.get(sighting.hunt_log_id).push(sighting)
      })

      console.log('🔍 SightingsMap keys:', Array.from(sightingsMap.keys()))
      console.log('🔍 SightingsMap:', sightingsMap)

      // Combine all data - SIMPLIFIED: no fallback logic needed
      const enrichedHunts = hunts.map(hunt => {
        const memberData = membersMap.get(hunt.member_id)
        const huntSightings = sightingsMap.get(hunt.id) || []
  
        // ADD THIS DEBUG LINE:
        console.log(`🔍 Hunt ${hunt.id} (${memberData?.display_name}): looking for sightings, found ${huntSightings.length}`)

        // Create enriched member data with display_name
        const enrichedMember = memberData ? {
          ...memberData,
          display_name: memberData.display_name || memberData.full_name || memberData.email
        } : null

        return {
          ...hunt,
          member: enrichedMember,
          stand: standsMap.get(hunt.stand_id) || null,
          harvests: harvestsMap.get(hunt.id) || [],
          // sightings: sightingsMap.get(hunt.id) || []
          sightings: huntSightings  // This should now have the sightings
        }
      })

      return enrichedHunts
    } catch (error) {
      console.error('Error fetching hunts:', error)
      throw error
    }
  }

  async getHuntById(huntId: string): Promise<HuntWithDetails | null> {
    try {
      // UPDATED: Use hunt_logs_with_temperature view
      const { data: huntLog, error: huntError } = await supabase
        .from('hunt_logs_with_temperature')
        .select('*')
        .eq('id', huntId)
        .single()

      if (huntError) {
        console.error('Error fetching hunt:', huntError)
        throw huntError
      }

      if (!huntLog) return null

      // Get related data - FIXED: Only use members table
      const [memberResult, standResult, harvestsResult, sightingsResult] = await Promise.all([
        // FIXED: Only query members table, no profiles fallback
        supabase.from('members').select('*').eq('id', huntLog.member_id).single(),
        
        // Get stand info
        huntLog.stand_id 
          ? supabase.from('stands').select('*').eq('id', huntLog.stand_id).single()
          : { data: null, error: null },
        
        // Get harvests
        supabase.from('hunt_harvests').select('*').eq('hunt_log_id', huntId),
        
        // Get sightings
        supabase.from('hunt_sightings').select('*').eq('hunt_log_id', huntId)
      ])

      // Create enriched member data with display_name (consistent with getHunts)
      const enrichedMember = memberResult.data ? {
        ...memberResult.data,
        display_name: memberResult.data.display_name || memberResult.data.full_name || memberResult.data.email
      } : undefined

      // Build the complete hunt object - weather is already included!
      const hunt: HuntWithDetails = {
        ...huntLog, // Includes all smart temperature data from the view
        member: enrichedMember,
        stand: standResult.data || undefined,
        harvests: harvestsResult.data || [],
        sightings: sightingsResult.data || []
      }

      return hunt
    } catch (error) {
      console.error('Error in getHuntById:', error)
      throw error
    }
  }

  // NOTE: Create/Update operations still use base hunt_logs table
  async createHunt(huntData: HuntLogInsert): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('hunt_logs') // Still use base table for mutations
        .insert(huntData)
        .select('id')
        .single()

      if (error) {
        console.error('Error creating hunt:', error)
        throw error
      }

      return data.id
    } catch (error) {
      console.error('Error in createHunt:', error)
      throw error
    }
  }

  async getHuntStats(): Promise<HuntStats> {
    try {
      const currentYear = new Date().getFullYear()
      
      const [huntsResult, harvestsResult, sightingsResult, standsResult] = await Promise.all([
        // Total hunts and this season's hunts - use base table for stats
        supabase.from('hunt_logs').select('id, hunt_date, harvest_count').gte('hunt_date', `${currentYear}-01-01`),
        
        // Total harvests
        supabase.from('hunt_harvests').select('id'),
        
        // Total sightings
        supabase.from('hunt_sightings').select('id'),
        
        // Active stands with hunt counts
        supabase.from('stands').select('id, name, type, total_hunts, active').eq('active', true)
      ])

      const totalHunts = huntsResult.data?.length || 0
      const totalHarvests = harvestsResult.data?.length || 0
      const totalSightings = sightingsResult.data?.length || 0
      const activeStands = standsResult.data?.length || 0

      // Calculate this season stats
      const thisSeasonHunts = huntsResult.data?.length || 0
      const thisSeasonHarvests = huntsResult.data?.filter(hunt => hunt.harvest_count > 0).length || 0

      // Top stands by hunt count
      const topStands = (standsResult.data || [])
        .filter(stand => stand.total_hunts && stand.total_hunts > 0)
        .map(stand => ({
          ...stand,
          hunt_count: stand.total_hunts || 0
        }))
        .sort((a, b) => b.hunt_count - a.hunt_count)
        .slice(0, 5)

      return {
        totalHunts,
        totalHarvests,
        totalSightings,
        activeStands,
        thisSeason: {
          hunts: thisSeasonHunts,
          harvests: thisSeasonHarvests,
          sightings: totalSightings
        },
        topStands
      }
    } catch (error) {
      console.error('Error getting hunt stats:', error)
      throw error
    }
  }

  // ===============================================
  // MANAGEMENT INTERFACE METHODS
  // ===============================================

  async deleteHunt(huntId: string): Promise<void> {
    try {
      console.log(`Starting deletion of hunt: ${huntId}`)
      
      // Delete in order: sightings -> harvests -> hunt_log
      // This respects foreign key constraints
      
      // 1. Delete hunt sightings
      const { error: sightingsError } = await supabase
        .from('hunt_sightings')
        .delete()
        .eq('hunt_log_id', huntId)
      
      if (sightingsError) {
        console.error('Error deleting hunt sightings:', sightingsError)
        throw new Error(`Failed to delete hunt sightings: ${sightingsError.message}`)
      }

      // 2. Delete hunt harvests  
      const { error: harvestsError } = await supabase
        .from('hunt_harvests')
        .delete()
        .eq('hunt_log_id', huntId)
      
      if (harvestsError) {
        console.error('Error deleting hunt harvests:', harvestsError)
        throw new Error(`Failed to delete hunt harvests: ${harvestsError.message}`)
      }

      // 3. Delete main hunt log - use base table for deletion
      const { error: huntError } = await supabase
        .from('hunt_logs') // Use base table for mutations
        .delete()
        .eq('id', huntId)
      
      if (huntError) {
        console.error('Error deleting hunt log:', huntError)
        throw new Error(`Failed to delete hunt log: ${huntError.message}`)
      }

      console.log(`Hunt ${huntId} deleted successfully`)
    } catch (error) {
      console.error('Error in deleteHunt:', error)
      throw error
    }
  }

  async updateHunt(huntId: string, updates: Partial<HuntLogUpdate>): Promise<void> {
    try {
      console.log(`Updating hunt ${huntId} with:`, updates)
      
      // Update the hunt log - use base table for mutations
      const { error } = await supabase
        .from('hunt_logs') // Use base table for mutations
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', huntId)
      
      if (error) {
        console.error('Error updating hunt:', error)
        throw new Error(`Failed to update hunt: ${error.message}`)
      }

      console.log(`Hunt ${huntId} updated successfully`)
    } catch (error) {
      console.error('Error in updateHunt:', error)
      throw error
    }
  }

  async bulkDeleteHunts(huntIds: string[]): Promise<{ succeeded: string[], failed: string[] }> {
    const succeeded: string[] = []
    const failed: string[] = []

    console.log(`Starting bulk delete of ${huntIds.length} hunts`)

    // Process deletions sequentially to avoid overwhelming the database
    for (const huntId of huntIds) {
      try {
        await this.deleteHunt(huntId)
        succeeded.push(huntId)
        console.log(`Successfully deleted hunt: ${huntId}`)
      } catch (error) {
        console.error(`Failed to delete hunt ${huntId}:`, error)
        failed.push(huntId)
      }
    }

    console.log(`Bulk delete completed: ${succeeded.length} succeeded, ${failed.length} failed`)
    return { succeeded, failed }
  }

  /**
   * UPDATED: Export hunt data to CSV format with smart temperature
   */
  async exportHuntsToCSV(filters?: HuntFilters): Promise<string> {
    try {
      const hunts = await this.getHunts(filters)
      
      const headers = [
        'Date',
        'Member Name',
        'Member Email',
        'Stand Name',
        'Stand Type',
        'Start Time',
        'End Time', 
        'Duration (minutes)',
        'Hunt Type',
        'Had Harvest',
        'Harvest Count',
        'Game Type',
        // UPDATED: Smart temperature first, then detailed weather
        'Hunt Temperature (°F)', // NEW: The contextual temperature
        'Temperature Context', // NEW: dawn/dusk/average explanation
        'Weather Dawn Temp (°F)',
        'Weather Dusk Temp (°F)',
        'Weather Daily High (°F)',
        'Weather Daily Low (°F)',
        'Weather Wind Speed (mph)',
        'Weather Wind Direction (degrees)',
        'Weather Humidity (%)',
        'Weather Precipitation',
        'Weather Moon Phase',
        'Weather Sunrise',
        'Weather Sunset',
        'Legal Hunting Start',
        'Legal Hunting End',
        'Weather Quality Score',
        'Hunting Season',
        'Property Sector',
        'Sightings Count',
        'Harvest Details',
        'Notes',
        'Created At',
        'Updated At'
      ]

      const rows = hunts.map(hunt => {
        // Get temperature context for export
        let tempContext = 'unknown'
        if (hunt.hunt_type === 'AM' && hunt.temp_dawn !== null) {
          tempContext = 'dawn'
        } else if (hunt.hunt_type === 'PM' && hunt.temp_dusk !== null) {
          tempContext = 'dusk'
        } else if (hunt.hunt_type === 'All Day') {
          tempContext = 'daily average'
        } else {
          tempContext = 'estimated'
        }

        return [
          hunt.hunt_date,
          hunt.member?.display_name || hunt.member?.full_name || 'Unknown',
          hunt.member?.email || '',
          hunt.stand?.name || 'Unknown Stand',
          hunt.stand?.type || '',
          hunt.start_time || '',
          hunt.end_time || '',
          hunt.hunt_duration_minutes || '',
          hunt.hunt_type || '',
          hunt.had_harvest ? 'Yes' : 'No',
          hunt.harvest_count || 0,
          hunt.game_type || '',
          // UPDATED: Smart temperature data
          hunt.hunt_temperature || '', // The contextual temperature
          tempContext, // Explanation of which temperature was used
          hunt.temp_dawn || '',
          hunt.temp_dusk || '',
          hunt.daily_high || '',
          hunt.daily_low || '',
          hunt.windspeed || '',
          hunt.winddir || '',
          hunt.humidity || '',
          hunt.precip || '',
          hunt.moonphase || '',
          hunt.sunrise || '',
          hunt.sunset || '',
          hunt.legal_hunting_start || '',
          hunt.legal_hunting_end || '',
          hunt.data_quality_score || '',
          hunt.hunting_season || '',
          hunt.property_sector || '',
          hunt.sightings?.length || 0,
          hunt.harvests?.map(h => `${h.animal_type} (${h.estimated_weight || 'Unknown'} lbs)`).join('; ') || '',
          hunt.notes || '',
          hunt.created_at,
          hunt.updated_at
        ]
      })

      // Convert to CSV with proper escaping
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            const cellStr = String(cell)
            // Escape cells that contain commas, quotes, or newlines
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          }).join(',')
        )
      ].join('\n')

      return csvContent
    } catch (error) {
      console.error('Error exporting hunts to CSV:', error)
      throw error
    }
  }

  // ===============================================
  // REST OF SERVICE METHODS (UNCHANGED)
  // ===============================================

  async getManagementStats(): Promise<ManagementStats> {
    try {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0]
      const firstOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const [
        totalResult,
        monthResult,
        weekResult,
        harvestResult,
        standStatsResult,
        memberStatsResult
      ] = await Promise.all([
        supabase.from('hunt_logs').select('id', { count: 'exact' }),
        supabase.from('hunt_logs').select('id', { count: 'exact' }).gte('hunt_date', firstOfMonth),
        supabase.from('hunt_logs').select('id', { count: 'exact' }).gte('hunt_date', firstOfWeek),
        supabase.from('hunt_logs').select('harvest_count').gt('harvest_count', 0),
        supabase.from('stands').select('name, total_hunts').not('total_hunts', 'is', null).order('total_hunts', { ascending: false }).limit(5),
        supabase.from('hunt_logs').select('member_id, members!inner(display_name, full_name)').not('member_id', 'is', null)
      ])

      const totalHunts = totalResult.count || 0
      const harvestHunts = harvestResult.data?.length || 0
      const harvestRate = totalHunts > 0 ? (harvestHunts / totalHunts) * 100 : 0

      const memberCounts: Record<string, { name: string, count: number }> = {}
      memberStatsResult.data?.forEach(record => {
        const member = record.members as any
        const name = member?.display_name || member?.full_name || 'Unknown'
        const key = record.member_id
        
        if (!memberCounts[key]) {
          memberCounts[key] = { name, count: 0 }
        }
        memberCounts[key].count++
      })

      const topMembers = Object.values(memberCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(m => ({ name: m.name, hunt_count: m.count }))

      return {
        totalRecords: totalResult.count || 0,
        recordsThisMonth: monthResult.count || 0,
        recordsThisWeek: weekResult.count || 0,
        harvestRate: Math.round(harvestRate * 10) / 10,
        topStands: standStatsResult.data?.map(s => ({ name: s.name, hunt_count: s.total_hunts || 0 })) || [],
        topMembers
      }
    } catch (error) {
      console.error('Error getting management stats:', error)
      throw error
    }
  }

  validateHuntData(huntData: Partial<HuntLogInsert>): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!huntData.hunt_date) errors.push('Hunt date is required')
    if (!huntData.member_id) errors.push('Member ID is required')

    if (huntData.start_time && huntData.end_time) {
      const start = new Date(`2000-01-01T${huntData.start_time}`)
      const end = new Date(`2000-01-01T${huntData.end_time}`)
      if (end <= start) errors.push('End time must be after start time')
    }

    if (huntData.harvest_count && huntData.harvest_count < 0) errors.push('Harvest count cannot be negative')
    if (huntData.temperature_high && huntData.temperature_low && huntData.temperature_low > huntData.temperature_high) {
      errors.push('Low temperature cannot be higher than high temperature')
    }
    if (huntData.wind_speed && huntData.wind_speed < 0) errors.push('Wind speed cannot be negative')
    if (huntData.precipitation && huntData.precipitation < 0) errors.push('Precipitation cannot be negative')

    return { isValid: errors.length === 0, errors }
  }

  // Harvest and sighting management methods (unchanged)
  async createHarvest(harvestData: Omit<HuntHarvest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase.from('hunt_harvests').insert(harvestData).select('id').single()
      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error in createHarvest:', error)
      throw error
    }
  }

  async createSighting(sightingData: Omit<HuntSighting, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase.from('hunt_sightings').insert(sightingData).select('id').single()
      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error in createSighting:', error)
      throw error
    }
  }

  async updateHarvest(harvestId: string, updates: Partial<HuntHarvest>): Promise<void> {
    try {
      const { error } = await supabase.from('hunt_harvests').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', harvestId)
      if (error) throw error
    } catch (error) {
      console.error('Error in updateHarvest:', error)
      throw error
    }
  }

  async updateSighting(sightingId: string, updates: Partial<HuntSighting>): Promise<void> {
    try {
      const { error } = await supabase.from('hunt_sightings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', sightingId)
      if (error) throw error
    } catch (error) {
      console.error('Error in updateSighting:', error)
      throw error
    }
  }

  async deleteHarvest(harvestId: string): Promise<void> {
    try {
      const { error } = await supabase.from('hunt_harvests').delete().eq('id', harvestId)
      if (error) throw error
    } catch (error) {
      console.error('Error in deleteHarvest:', error)
      throw error
    }
  }

  async deleteSighting(sightingId: string): Promise<void> {
    try {
      const { error } = await supabase.from('hunt_sightings').delete().eq('id', sightingId)
      if (error) throw error
    } catch (error) {
      console.error('Error in deleteSighting:', error)
      throw error
    }
  }
}

// Instantiate and export the service
export const huntService = new HuntService()

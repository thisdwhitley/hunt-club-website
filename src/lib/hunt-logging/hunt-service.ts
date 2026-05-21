// src/lib/hunt-logging/hunt-service.ts
// MAJOR UPDATE: Now uses hunt_logs_with_temperature view for smart temperature display

import { createClient } from '@/lib/supabase/client'
import type {
  HuntLogInsert,
  HuntLogUpdate,
  HuntHarvest,
  HuntHarvestInsert,
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
  // The underlying hunt_logs table guarantees these are always set;
  // the View marks all columns nullable so we restore the invariant here.
  id: string
  hunt_date: string
  member_id: string
  stand?: Stand
  member?: ExtendedMember
  harvests?: HuntHarvest[]
  sightings?: HuntSighting[]
}

export interface SightingWithContext extends HuntSighting {
  hunt_log: {
    hunt_date: string
    hunting_season: string | null
    stand_id: string | null
    stand: { name: string } | null
    member: { display_name: string | null; full_name: string | null } | null
  } | null
}

export interface HuntStats {
  totalHunts: number
  totalHarvests: number
  totalSightings: number
  activeStands: number
  mostHuntedStand?: {
    name: string
    hunt_count: number
  }
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
        console.error('Error creating hunt:', error.message, error.code, error.details, error.hint)
        throw new Error(error.message || 'Failed to create hunt')
      }

      return data.id
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
  }

  async saveHarvestDetails(huntLogId: string, harvestData: Omit<HuntHarvestInsert, 'hunt_log_id'>): Promise<void> {
    const { error } = await supabase
      .from('hunt_harvests')
      .insert({ ...harvestData, hunt_log_id: huntLogId })
    if (error) throw new Error(`Failed to save harvest details: ${error.message}`)
  }

  async upsertHarvestDetails(huntLogId: string, harvestData: Omit<HuntHarvestInsert, 'hunt_log_id'>): Promise<void> {
    const { error: delError } = await supabase
      .from('hunt_harvests')
      .delete()
      .eq('hunt_log_id', huntLogId)
    if (delError) throw new Error(`Failed to clear existing harvest: ${delError.message}`)
    const { error } = await supabase
      .from('hunt_harvests')
      .insert({ ...harvestData, hunt_log_id: huntLogId })
    if (error) throw new Error(`Failed to save harvest details: ${error.message}`)
  }

  async getHuntStats(seasonYear?: number): Promise<HuntStats> {
    try {
      const year = seasonYear ?? new Date().getFullYear()
      const yearStart = `${year}-01-01`
      const yearEnd = `${year + 1}-01-01`

      const thisSeasonQuery = supabase
        .from('hunt_logs')
        .select('id, hunt_date, harvest_count')
        .gte('hunt_date', yearStart)
        .lt('hunt_date', yearEnd)

      const allHuntsQuery = supabase
        .from('hunt_logs')
        .select('id, had_harvest, harvest_count')
        .gte('hunt_date', yearStart)
        .lt('hunt_date', yearEnd)

      const standHuntCountsQuery = supabase
        .from('hunt_logs')
        .select('stand_id')
        .gte('hunt_date', yearStart)
        .lt('hunt_date', yearEnd)

      const [huntsResult, allHuntsResult, sightingsResult, standsResult, standHuntCounts] = await Promise.all([
        thisSeasonQuery,
        allHuntsQuery,
        supabase
          .from('hunt_sightings')
          .select('id, count, hunt_log_id, hunt_logs!inner(hunt_date)')
          .eq('animal_type', 'Deer')
          .gte('hunt_logs.hunt_date', yearStart)
          .lt('hunt_logs.hunt_date', yearEnd),
        supabase.from('stands').select('id, name, type, active').eq('active', true),
        standHuntCountsQuery
      ])

      const totalHunts = huntsResult.data?.length || 0
      const totalHarvests = allHuntsResult.data?.filter(hunt => hunt.had_harvest || (hunt.harvest_count && hunt.harvest_count > 0)).length || 0
      const totalSightings = sightingsResult.data?.reduce((sum, sighting) => sum + (sighting.count || 0), 0) || 0
      const activeStands = standsResult.data?.length || 0

      const huntCountsByStand = (standHuntCounts.data || []).reduce((acc, hunt) => {
        if (hunt.stand_id) {
          acc[hunt.stand_id] = (acc[hunt.stand_id] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      const thisSeasonHunts = huntsResult.data?.length || 0
      const thisSeasonHarvests = huntsResult.data?.filter(hunt => hunt.harvest_count > 0).length || 0

      const topStands = (standsResult.data || [])
        .map(stand => ({
          ...stand,
          hunt_count: huntCountsByStand[stand.id] || 0,
          total_hunts: huntCountsByStand[stand.id] || 0
        }))
        .filter(stand => stand.hunt_count > 0)
        .sort((a, b) => b.hunt_count - a.hunt_count)
        .slice(0, 5)

      const mostHuntedStand = topStands.length > 0 ? {
        name: topStands[0].name,
        hunt_count: topStands[0].hunt_count
      } : undefined

      return {
        totalHunts,
        totalHarvests,
        totalSightings,
        activeStands,
        mostHuntedStand,
        thisSeason: {
          hunts: thisSeasonHunts,
          harvests: thisSeasonHarvests,
          sightings: totalSightings
        },
        topStands: topStands as Array<Stand & { hunt_count: number }>
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
          hunt.wind_speed || '',
          hunt.wind_direction || '',
          '', // humidity not in schema
          hunt.precipitation || '',
          hunt.moon_phase || '',
          hunt.sunrise_time || '',
          hunt.sunset_time || '',
          hunt.legal_hunting_start || '',
          hunt.legal_hunting_end || '',
          '', // data_quality_score not in schema
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
        const member = record.members as { display_name?: string | null; full_name?: string | null } | null
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

  async getSightingsWithContext(): Promise<SightingWithContext[]> {
    try {
      const { data: sightings, error: sErr } = await supabase
        .from('hunt_sightings')
        .select('*')
        .order('created_at', { ascending: false })
      if (sErr) throw sErr
      if (!sightings || sightings.length === 0) return []

      const huntIds = [...new Set(sightings.map(s => s.hunt_log_id))]
      const { data: hunts, error: hErr } = await supabase
        .from('hunt_logs')
        .select('id, hunt_date, hunting_season, stand_id, member_id')
        .in('id', huntIds)
      if (hErr) throw hErr

      const standIds = [...new Set((hunts || []).map(h => h.stand_id).filter(Boolean))]
      const { data: stands } = standIds.length
        ? await supabase.from('stands').select('id, name').in('id', standIds)
        : { data: [] }

      const memberIds = [...new Set((hunts || []).map(h => h.member_id).filter(Boolean))]
      const { data: members } = memberIds.length
        ? await supabase.from('members').select('id, display_name, full_name').in('id', memberIds)
        : { data: [] }

      const huntMap = new Map((hunts || []).map(h => [h.id, h]))
      const standMap = new Map((stands || []).map(s => [s.id, s]))
      const memberMap = new Map((members || []).map(m => [m.id, m]))

      return sightings.map(s => {
        const hunt = huntMap.get(s.hunt_log_id) ?? null
        return {
          ...s,
          hunt_log: hunt
            ? {
                hunt_date: hunt.hunt_date,
                hunting_season: hunt.hunting_season,
                stand_id: hunt.stand_id,
                stand: hunt.stand_id ? (standMap.get(hunt.stand_id) ?? null) : null,
                member: hunt.member_id ? (memberMap.get(hunt.member_id) ?? null) : null,
              }
            : null,
        }
      })
    } catch (error) {
      console.error('Error in getSightingsWithContext:', error)
      throw error
    }
  }

  async saveSightings(huntId: string, sightings: Array<{
    animal_type: string
    count?: number
    gender?: string | null
    estimated_age?: string | null
    behavior?: string | null
    distance_yards?: number | null
    direction?: string | null
    time_observed?: string | null
    notes?: string | null
  }>): Promise<void> {
    if (!sightings.length) return
    const rows = sightings.map(s => ({
      hunt_log_id: huntId,
      animal_type: s.animal_type,
      count: s.count || 1,
      gender: s.gender || null,
      estimated_age: s.estimated_age || null,
      behavior: s.behavior || null,
      distance_yards: s.distance_yards ?? null,
      direction: s.direction || null,
      time_observed: s.time_observed || null,
      notes: s.notes || null,
    }))
    const { error } = await supabase.from('hunt_sightings').insert(rows)
    if (error) throw error
  }

  async replaceSightings(huntId: string, sightings: Array<{
    animal_type: string
    count?: number
    gender?: string | null
    estimated_age?: string | null
    behavior?: string | null
    distance_yards?: number | null
    direction?: string | null
    time_observed?: string | null
    notes?: string | null
  }>): Promise<void> {
    const { error: delError } = await supabase.from('hunt_sightings').delete().eq('hunt_log_id', huntId)
    if (delError) throw delError
    if (sightings.length) await this.saveSightings(huntId, sightings)
  }

  async getHuntSeasons(): Promise<string[]> {
    try {
      // Query the view (which aliases the column as 'hunting_season') not the base table
      const { data, error } = await supabase
        .from('hunt_logs_with_temperature')
        .select('hunting_season')
        .not('hunting_season', 'is', null)
        .order('hunting_season', { ascending: false })
      if (error) throw error
      const unique = [...new Set((data ?? []).map(r => r.hunting_season as string))]
      return unique
    } catch (error) {
      console.error('Error in getHuntSeasons:', error)
      return []
    }
  }

  async getHuntMembers(): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data: huntData, error: huntError } = await supabase
        .from('hunt_logs')
        .select('member_id')
        .not('member_id', 'is', null)
      if (huntError) throw huntError

      const memberIds = [...new Set((huntData ?? []).map(r => r.member_id as string))]
      if (memberIds.length === 0) return []

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, display_name, full_name')
        .in('id', memberIds)
      if (memberError) throw memberError

      return (memberData ?? [])
        .map(m => ({ id: m.id, name: m.display_name || m.full_name || 'Unknown' }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Error in getHuntMembers:', error)
      return []
    }
  }
}

// Instantiate and export the service
export const huntService = new HuntService()

// src/lib/hunt-logging/hunt-service.ts
// Database service for hunt logging operations - Fixed user/member handling

import { createClient } from '@/lib/supabase/client'
import type { 
  HuntLog, 
  HuntLogInsert, 
  HuntLogUpdate,
  HuntHarvest,
  HuntSighting,
  Stand,
  Member 
} from '@/types/database'

const supabase = createClient()

// Extended member interface to handle cases where member record doesn't exist
export interface ExtendedMember extends Partial<Member> {
  email?: string
  full_name?: string | null
  display_name?: string
}

export interface HuntWithDetails extends HuntLog {
  stand?: Stand
  member?: ExtendedMember
  harvests?: HuntHarvest[]
  sightings?: HuntSighting[]
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

export class HuntService {
  
  // ===============================================
  // BASIC CRUD OPERATIONS
  // ===============================================
  
  async getHunts(filters?: HuntFilters): Promise<HuntWithDetails[]> {
    try {
      // Build the base hunt logs query
      let huntQuery = supabase
        .from('hunt_logs')
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

      // Batch fetch related data
      const [membersResult, standsResult, harvestsResult, sightingsResult, authUsersResult] = await Promise.all([
        // Get member data via public.members table
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
        supabase.from('hunt_sightings').select('*').in('hunt_log_id', huntIds),

        // Get auth user data as fallback for missing member records
        this.getAuthUserData(memberIds)
      ])

      // Create lookup maps for efficient joining
      const membersMap = new Map((membersResult.data || []).map(member => [member.id, member]))
      const standsMap = new Map((standsResult.data || []).map(stand => [stand.id, stand]))
      const authUsersMap = new Map((authUsersResult || []).map(user => [user.id, user]))
      
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

      // Combine all data
      const enrichedHunts = hunts.map(hunt => {
        let memberData = membersMap.get(hunt.member_id)
        
        // If no member record exists, fallback to auth user data
        if (!memberData && authUsersMap.has(hunt.member_id)) {
          const authUser = authUsersMap.get(hunt.member_id)
          memberData = {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || null,
            display_name: authUser.user_metadata?.full_name || authUser.email,
            phone: null,
            role: 'member',
            avatar_url: authUser.user_metadata?.avatar_url || null,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at
          }
        }

        return {
          ...hunt,
          member: memberData || null,
          stand: standsMap.get(hunt.stand_id) || null,
          harvests: harvestsMap.get(hunt.id) || [],
          sightings: sightingsMap.get(hunt.id) || []
        }
      })

      return enrichedHunts
    } catch (error) {
      console.error('Hunt service error:', error)
      throw error
    }
  }

  async getHuntById(id: string): Promise<HuntWithDetails | null> {
    try {
      // Get the specific hunt
      const { data: hunt, error } = await supabase
        .from('hunt_logs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching hunt:', error)
        throw error
      }

      if (!hunt) {
        return null
      }

      // Fetch related data in parallel
      const [memberResult, standResult, harvestsResult, sightingsResult] = await Promise.all([
        // Get member data - first try members table, then auth
        this.getMemberData(hunt.member_id),
        
        // Get stand data
        hunt.stand_id 
          ? supabase.from('stands').select('*').eq('id', hunt.stand_id).single()
          : { data: null, error: null },
        
        // Get harvests for this hunt
        supabase.from('hunt_harvests').select('*').eq('hunt_log_id', hunt.id),
        
        // Get sightings for this hunt
        supabase.from('hunt_sightings').select('*').eq('hunt_log_id', hunt.id)
      ])

      // Combine the data
      return {
        ...hunt,
        member: memberResult || null,
        stand: standResult.data || null,
        harvests: harvestsResult.data || [],
        sightings: sightingsResult.data || []
      }
    } catch (error) {
      console.error('Hunt service error:', error)
      throw error
    }
  }

  async createHunt(huntData: HuntLogInsert): Promise<HuntLog> {
    try {
      const { data, error } = await supabase
        .from('hunt_logs')
        .insert(huntData)
        .select()
        .single()

      if (error) {
        console.error('Error creating hunt:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Hunt service error:', error)
      throw error
    }
  }

  async updateHunt(id: string, updates: HuntLogUpdate): Promise<HuntLog> {
    try {
      const { data, error } = await supabase
        .from('hunt_logs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating hunt:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Hunt service error:', error)
      throw error
    }
  }

  async deleteHunt(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('hunt_logs')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting hunt:', error)
        throw error
      }
    } catch (error) {
      console.error('Hunt service error:', error)
      throw error
    }
  }

  // ===============================================
  // STATISTICS AND ANALYTICS
  // ===============================================

  async getHuntStats(): Promise<HuntStats> {
    try {
      // Get current season dates (adjust based on your hunting seasons)
      const currentYear = new Date().getFullYear()
      const seasonStart = `${currentYear}-08-01` // Adjust season start
      const seasonEnd = `${currentYear + 1}-02-28` // Adjust season end

      // Fetch all data in parallel
      const [huntsResult, sightingsResult, standsResult] = await Promise.all([
        supabase.from('hunt_logs').select('*'),
        supabase.from('hunt_sightings').select('*'),
        supabase.from('stands').select('*').eq('active', true)
      ])

      if (huntsResult.error) throw huntsResult.error
      if (sightingsResult.error) throw sightingsResult.error
      if (standsResult.error) throw standsResult.error

      const hunts = huntsResult.data || []
      const sightings = sightingsResult.data || []
      const stands = standsResult.data || []

      // Calculate basic statistics
      const totalHunts = hunts.length
      const totalHarvests = hunts.reduce((sum, hunt) => sum + (hunt.harvest_count || 0), 0)
      const totalSightings = sightings.length
      const activeStands = stands.length

      // Current season stats
      const seasonHunts = hunts.filter(hunt => 
        hunt.hunt_date >= seasonStart && hunt.hunt_date <= seasonEnd
      )
      
      const seasonHarvests = seasonHunts.reduce((sum, hunt) => sum + (hunt.harvest_count || 0), 0)
      
      // For sightings, we need to get the hunt dates to filter by season
      const seasonHuntIds = new Set(seasonHunts.map(hunt => hunt.id))
      const seasonSightings = sightings.filter(sighting => 
        seasonHuntIds.has(sighting.hunt_log_id)
      )

      // Calculate top stands by activity (get full stand data)
      const standStats = new Map()
      
      // Get full stand data for stands that have hunts
      const usedStandIds = [...new Set(hunts.map(hunt => hunt.stand_id).filter(Boolean))]
      const { data: standData } = await supabase
        .from('stands')
        .select('*')  // Get all stand fields
        .in('id', usedStandIds)

      const standDataMap = new Map((standData || []).map(stand => [stand.id, stand]))
      
      // Calculate stats per stand
      hunts.forEach(hunt => {
        if (hunt.stand_id && standDataMap.has(hunt.stand_id)) {
          const existing = standStats.get(hunt.stand_id) || { 
            hunts: 0, 
            standData: standDataMap.get(hunt.stand_id)
          }
          existing.hunts++
          standStats.set(hunt.stand_id, existing)
        }
      })

      const topStands = Array.from(standStats.entries())
        .map(([standId, stats]) => ({
          ...stats.standData,  // Spread all stand properties
          hunt_count: stats.hunts  // Add hunt count
        }))
        .sort((a, b) => b.hunt_count - a.hunt_count)
        .slice(0, 5)

      return {
        totalHunts,
        totalHarvests,
        totalSightings,
        activeStands,
        thisSeason: {
          hunts: seasonHunts.length,
          harvests: seasonHarvests,
          sightings: seasonSightings.length
        },
        topStands
      }
    } catch (error) {
      console.error('Error fetching hunt stats:', error)
      throw error
    }
  }

  // ===============================================
  // HARVEST OPERATIONS
  // ===============================================

  async getHarvests(huntLogId?: string): Promise<HuntHarvest[]> {
    try {
      let query = supabase
        .from('hunt_harvests')
        .select('*')
        .order('created_at', { ascending: false })

      if (huntLogId) {
        query = query.eq('hunt_log_id', huntLogId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching harvests:', error)
      throw error
    }
  }

  // ===============================================
  // SIGHTING OPERATIONS  
  // ===============================================

  async getSightings(huntLogId?: string): Promise<HuntSighting[]> {
    try {
      let query = supabase
        .from('hunt_sightings')
        .select('*')
        .order('created_at', { ascending: false })

      if (huntLogId) {
        query = query.eq('hunt_log_id', huntLogId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sightings:', error)
      throw error
    }
  }

  // ===============================================
  // PRIVATE HELPER METHODS
  // ===============================================

  private async getMemberData(memberId: string): Promise<ExtendedMember | null> {
    try {
      // First try to get from members table
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single()

      if (memberData && !memberError) {
        return {
          ...memberData,
          display_name: memberData.full_name || memberData.email
        }
      }

      // If no member record, try to get auth user data
      const authUsers = await this.getAuthUserData([memberId])
      if (authUsers && authUsers.length > 0) {
        const authUser = authUsers[0]
        return {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || null,
          display_name: authUser.user_metadata?.full_name || authUser.email,
          phone: null,
          role: 'member',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching member data:', error)
      return null
    }
  }

  private async getAuthUserData(userIds: string[]): Promise<any[]> {
    try {
      if (userIds.length === 0) return []

      // Note: This is a workaround since we can't directly query auth.users from client
      // In a real app, you'd want to have a server-side function or ensure member records exist
      // For now, we'll try to infer user data from available sources or return empty
      
      // This is a placeholder - in production, you might want to:
      // 1. Ensure member records are created when users sign up
      // 2. Use a server-side function to fetch auth user data
      // 3. Store user info in a more accessible format
      
      return []
    } catch (error) {
      console.error('Error fetching auth user data:', error)
      return []
    }
  }

  // ===============================================
  // UTILITY METHODS
  // ===============================================

  async getHuntingSeasons(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('hunt_logs')
        .select('hunting_season')
        .not('hunting_season', 'is', null)

      if (error) throw error

      const seasons = Array.from(new Set(
        data?.map(item => item.hunting_season).filter(Boolean) || []
      ))

      return seasons.sort()
    } catch (error) {
      console.error('Error fetching seasons:', error)
      return []
    }
  }

  formatHuntDuration(startTime?: string, endTime?: string): string {
    if (!startTime || !endTime) return 'Not specified'
    
    try {
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${endTime}`)
      const diff = end.getTime() - start.getTime()
      
      if (diff <= 0) return 'Invalid time range'
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours === 0) return `${minutes}m`
      if (minutes === 0) return `${hours}h`
      return `${hours}h ${minutes}m`
    } catch (error) {
      return 'Invalid time'
    }
  }
}

// Export singleton instance
export const huntService = new HuntService()

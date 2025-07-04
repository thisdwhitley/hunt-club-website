// src/hooks/useStands.ts
// Custom hook for stand data management with Supabase

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Stand, 
  StandFormData, 
  StandFilters, 
  StandStats,
  UseStandsReturn,
  UseStandReturn
} from '@/lib/stands/types'
import { 
  StandSchema, 
  validateStandForm, 
  validateStandUpdate 
} from '@/lib/stands/validation'
import { DEFAULTS, PERFORMANCE_THRESHOLDS } from '@/lib/stands/constants'

/**
 * Main hook for managing multiple stands
 */
export function useStands(initialFilters?: StandFilters): UseStandsReturn {
  const [stands, setStands] = useState<Stand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Load stands from database
  const loadStands = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (fetchError) {
        throw new Error(`Failed to load stands: ${fetchError.message}`)
      }

      // Validate and transform data
      const validatedStands: Stand[] = []
      
      if (data) {
        for (const stand of data) {
          const result = StandSchema.safeParse(stand)
          if (result.success) {
            validatedStands.push(result.data)
          } else {
            console.warn(`Invalid stand data for ID ${stand.id}:`, result.error)
          }
        }
      }

      setStands(validatedStands)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stands'
      setError(errorMessage)
      console.error('Error loading stands:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create new stand
  const createStand = useCallback(async (formData: StandFormData): Promise<Stand | null> => {
    try {
      setError(null)

      // Validate form data
      const validation = validateStandForm(formData)
      if (!validation.success) {
        throw new Error(`Invalid stand data: ${validation.error.issues[0]?.message}`)
      }

      // Prepare insert data with defaults
      const insertData = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        height_feet: formData.height_feet || DEFAULTS.height_feet,
        capacity: formData.capacity || DEFAULTS.capacity,
        active: formData.active ?? DEFAULTS.active,
        trail_name: formData.trail_name || null,
        walking_time_minutes: formData.walking_time_minutes || DEFAULTS.walking_time_minutes,
        access_notes: formData.access_notes || null,
        view_distance_yards: formData.view_distance_yards || DEFAULTS.view_distance_yards,
        time_of_day: formData.time_of_day || null,
        archery_season: formData.archery_season ?? DEFAULTS.archery_season,
        nearby_water_source: formData.nearby_water_source ?? DEFAULTS.nearby_water_source,
        food_source: formData.food_source || null,
        trail_camera_name: formData.trail_camera_name || null,
        // Initialize statistics fields
        total_harvests: 0,
        total_hunts: 0,
        season_hunts: 0,
        last_used_date: null
      }

      const { data, error: insertError } = await supabase
        .from('stands')
        .insert([insertData])
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create stand: ${insertError.message}`)
      }

      // Validate response data
      const result = StandSchema.safeParse(data)
      if (!result.success) {
        throw new Error('Invalid stand data returned from database')
      }

      const newStand = result.data
      setStands(prev => [...prev, newStand].sort((a, b) => a.name.localeCompare(b.name)))
      
      return newStand
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create stand'
      setError(errorMessage)
      console.error('Error creating stand:', err)
      return null
    }
  }, [supabase])

  // Update existing stand
  const updateStand = useCallback(async (id: string, formData: Partial<StandFormData>): Promise<Stand | null> => {
    try {
      setError(null)

      // Validate update data
      const validation = validateStandUpdate({ id, ...formData })
      if (!validation.success) {
        throw new Error(`Invalid update data: ${validation.error.issues[0]?.message}`)
      }

      // Prepare update data (only include non-undefined fields)
      const updateData: Record<string, any> = {}
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value
        }
      })

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString()

      const { data, error: updateError } = await supabase
        .from('stands')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update stand: ${updateError.message}`)
      }

      // Validate response data
      const result = StandSchema.safeParse(data)
      if (!result.success) {
        throw new Error('Invalid stand data returned from database')
      }

      const updatedStand = result.data
      setStands(prev => 
        prev.map(stand => 
          stand.id === id ? updatedStand : stand
        ).sort((a, b) => a.name.localeCompare(b.name))
      )
      
      return updatedStand
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stand'
      setError(errorMessage)
      console.error('Error updating stand:', err)
      return null
    }
  }, [supabase])

  // Delete stand
  const deleteStand = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('stands')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(`Failed to delete stand: ${deleteError.message}`)
      }

      setStands(prev => prev.filter(stand => stand.id !== id))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete stand'
      setError(errorMessage)
      console.error('Error deleting stand:', err)
      return false
    }
  }, [supabase])

  // Utility functions
  const getStandById = useCallback((id: string): Stand | undefined => {
    return stands.find(stand => stand.id === id)
  }, [stands])

  const getActiveStands = useCallback((): Stand[] => {
    return stands.filter(stand => stand.active)
  }, [stands])

  const getStandsByType = useCallback((type: Stand['type']): Stand[] => {
    return stands.filter(stand => stand.type === type)
  }, [stands])

  // Calculate statistics
  const getStandStats = useCallback((): StandStats => {
    const activeStands = getActiveStands()
    
    // Count by type
    const standsByType = stands.reduce((acc, stand) => {
      acc[stand.type] = (acc[stand.type] || 0) + 1
      return acc
    }, {} as Record<Stand['type'], number>)

    // Calculate totals
    const totalHarvests = stands.reduce((sum, stand) => sum + (stand.total_harvests || 0), 0)
    const totalHunts = stands.reduce((sum, stand) => sum + (stand.total_hunts || 0), 0)
    const successRate = totalHunts > 0 ? (totalHarvests / totalHunts) * 100 : 0

    // Find most productive stand
    const mostProductiveStand = stands.reduce((best, current) => {
      const currentRate = (current.total_hunts || 0) > 0 
        ? ((current.total_harvests || 0) / (current.total_hunts || 0)) * 100 
        : 0
      const bestRate = (best?.total_hunts || 0) > 0 
        ? ((best?.total_harvests || 0) / (best?.total_hunts || 0)) * 100 
        : 0
      
      return currentRate > bestRate ? current : best
    }, stands[0] || null)

    // Find least used stands (less than low threshold this season)
    const leastUsedStands = stands.filter(stand => 
      (stand.season_hunts || 0) < PERFORMANCE_THRESHOLDS.hunts_per_season.low
    )

    return {
      total_stands: stands.length,
      active_stands: activeStands.length,
      stands_by_type: standsByType,
      total_harvests: totalHarvests,
      total_hunts: totalHunts,
      success_rate: Math.round(successRate * 100) / 100,
      most_productive_stand: mostProductiveStand,
      least_used_stands: leastUsedStands
    }
  }, [stands, getActiveStands])

  // Refresh data
  const refreshStands = useCallback(async () => {
    await loadStands()
  }, [loadStands])

  // Load data on mount
  useEffect(() => {
    loadStands()
  }, [loadStands])

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('stands-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'stands' },
        (payload) => {
          console.log('Stand data changed:', payload)
          // Refresh data when changes occur
          loadStands()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadStands])

  return {
    stands,
    loading,
    error,
    createStand,
    updateStand,
    deleteStand,
    refreshStands,
    getStandById,
    getActiveStands,
    getStandsByType,
    getStandStats
  }
}

/**
 * Hook for managing a single stand
 */
export function useStand(id: string): UseStandReturn {
  const [stand, setStand] = useState<Stand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Load single stand
  const loadStand = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('stands')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to load stand: ${fetchError.message}`)
      }

      // Validate data
      const result = StandSchema.safeParse(data)
      if (!result.success) {
        throw new Error('Invalid stand data from database')
      }

      setStand(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stand'
      setError(errorMessage)
      console.error('Error loading stand:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, id])

  // Update stand
  const updateStand = useCallback(async (formData: Partial<StandFormData>): Promise<Stand | null> => {
    try {
      setError(null)

      const validation = validateStandUpdate({ id, ...formData })
      if (!validation.success) {
        throw new Error(`Invalid update data: ${validation.error.issues[0]?.message}`)
      }

      const updateData: Record<string, any> = {}
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value
        }
      })

      updateData.updated_at = new Date().toISOString()

      const { data, error: updateError } = await supabase
        .from('stands')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update stand: ${updateError.message}`)
      }

      const result = StandSchema.safeParse(data)
      if (!result.success) {
        throw new Error('Invalid stand data returned from database')
      }

      const updatedStand = result.data
      setStand(updatedStand)
      return updatedStand
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stand'
      setError(errorMessage)
      console.error('Error updating stand:', err)
      return null
    }
  }, [supabase, id])

  // Delete stand
  const deleteStand = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('stands')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(`Failed to delete stand: ${deleteError.message}`)
      }

      setStand(null)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete stand'
      setError(errorMessage)
      console.error('Error deleting stand:', err)
      return false
    }
  }, [supabase, id])

  // Refresh stand
  const refresh = useCallback(async () => {
    await loadStand()
  }, [loadStand])

  // Load on mount and when ID changes
  useEffect(() => {
    if (id) {
      loadStand()
    }
  }, [loadStand, id])

  return {
    stand,
    loading,
    error,
    updateStand,
    deleteStand,
    refresh
  }
}

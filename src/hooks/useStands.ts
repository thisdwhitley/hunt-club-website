// src/hooks/useStands.ts
// Custom hook for stand data management with Supabase

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Stand,
  StandFilters,
  StandStats,
  UseStandsReturn,
} from '@/lib/stands/types'
import { StandSchema } from '@/lib/stands/validation'
import { PERFORMANCE_THRESHOLDS } from '@/lib/stands/constants'

/**
 * Main hook for managing multiple stands
 */
export function useStands(_initialFilters?: StandFilters): UseStandsReturn {
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
    refreshStands,
    getStandById,
    getActiveStands,
    getStandsByType,
    getStandStats
  }
}


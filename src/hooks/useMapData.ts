// src/hooks/useMapData.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Stand = Database['public']['Tables']['stands']['Row']
type TrailCamera = Database['public']['Tables']['trail_cameras']['Row']
type FoodPlot = Database['public']['Tables']['food_plots']['Row']
type Trail = Database['public']['Tables']['trails']['Row']
type PropertyBoundary = Database['public']['Tables']['property_boundaries']['Row']

export interface MapData {
  stands: Stand[]
  trailCameras: TrailCamera[]
  foodPlots: FoodPlot[]
  trails: Trail[]
  propertyBoundaries: PropertyBoundary[]
}

export interface MapLayerVisibility {
  stands: boolean
  trailCameras: boolean
  foodPlots: boolean
  trails: boolean
  propertyBoundaries: boolean
}

export const useMapData = () => {
  const [mapData, setMapData] = useState<MapData>({
    stands: [],
    trailCameras: [],
    foodPlots: [],
    trails: [],
    propertyBoundaries: []
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>({
    stands: true,
    trailCameras: true,
    foodPlots: true,
    trails: true,
    propertyBoundaries: true
  })

  const supabase = createClient()

  const fetchMapData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all map data in parallel
      const [
        standsResponse,
        trailCamerasResponse,
        foodPlotsResponse,
        trailsResponse,
        propertyBoundariesResponse
      ] = await Promise.all([
        supabase.from('stands').select('*').eq('active', true).order('name'),
        supabase.from('trail_cameras').select('*').eq('active', true).order('name'),
        supabase.from('food_plots').select('*').eq('active', true).order('name'),
        supabase.from('trails').select('*').eq('active', true).order('name'),
        supabase.from('property_boundaries').select('*').eq('active', true).order('name')
      ])

      // Check for errors
      if (standsResponse.error) throw standsResponse.error
      if (trailCamerasResponse.error) throw trailCamerasResponse.error
      if (foodPlotsResponse.error) throw foodPlotsResponse.error
      if (trailsResponse.error) throw trailsResponse.error
      if (propertyBoundariesResponse.error) throw propertyBoundariesResponse.error

      setMapData({
        stands: standsResponse.data || [],
        trailCameras: trailCamerasResponse.data || [],
        foodPlots: foodPlotsResponse.data || [],
        trails: trailsResponse.data || [],
        propertyBoundaries: propertyBoundariesResponse.data || []
      })

    } catch (err) {
      console.error('Error fetching map data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load map data')
    } finally {
      setLoading(false)
    }
  }

  const toggleLayerVisibility = (layer: keyof MapLayerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }))
  }

  const addStand = async (standData: Database['public']['Tables']['stands']['Insert']) => {
    try {
      const { data, error } = await supabase
        .from('stands')
        .insert(standData)
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setMapData(prev => ({
        ...prev,
        stands: [...prev.stands, data]
      }))

      return { success: true, data }
    } catch (err) {
      console.error('Error adding stand:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add stand' }
    }
  }

  const addTrailCamera = async (cameraData: Database['public']['Tables']['trail_cameras']['Insert']) => {
    try {
      const { data, error } = await supabase
        .from('trail_cameras')
        .insert(cameraData)
        .select()
        .single()

      if (error) throw error
      
      setMapData(prev => ({
        ...prev,
        trailCameras: [...prev.trailCameras, data]
      }))

      return { success: true, data }
    } catch (err) {
      console.error('Error adding trail camera:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add trail camera' }
    }
  }

  const addFoodPlot = async (plotData: Database['public']['Tables']['food_plots']['Insert']) => {
    try {
      const { data, error } = await supabase
        .from('food_plots')
        .insert(plotData)
        .select()
        .single()

      if (error) throw error
      
      setMapData(prev => ({
        ...prev,
        foodPlots: [...prev.foodPlots, data]
      }))

      return { success: true, data }
    } catch (err) {
      console.error('Error adding food plot:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add food plot' }
    }
  }

  const updateStand = async (id: string, updates: Database['public']['Tables']['stands']['Update']) => {
    try {
      const { data, error } = await supabase
        .from('stands')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setMapData(prev => ({
        ...prev,
        stands: prev.stands.map(stand => stand.id === id ? data : stand)
      }))

      return { success: true, data }
    } catch (err) {
      console.error('Error updating stand:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update stand' }
    }
  }

  const deleteStand = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stands')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setMapData(prev => ({
        ...prev,
        stands: prev.stands.filter(stand => stand.id !== id)
      }))

      return { success: true }
    } catch (err) {
      console.error('Error deleting stand:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete stand' }
    }
  }

  // Set up real-time subscriptions for collaborative editing
  useEffect(() => {
    const channel = supabase
      .channel('map-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stands'
      }, () => {
        fetchMapData() // Refresh data when changes occur
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'trail_cameras'
      }, () => {
        fetchMapData()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'food_plots'
      }, () => {
        fetchMapData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchMapData()
  }, [])

  return {
    mapData,
    loading,
    error,
    layerVisibility,
    toggleLayerVisibility,
    addStand,
    addTrailCamera,
    addFoodPlot,
    updateStand,
    deleteStand,
    refetch: fetchMapData
  }
}

'use client'

// src/app/stands/page.tsx
// Complete CRUD stands management page for Caswell County Yacht Club

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Filter, MapPin, Settings, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StandCard from '@/components/stands/StandCard'
import StandFormModal from '@/components/stands/StandFormModal'
import StandFilters from '@/components/stands/StandFilters'
import { StandService } from '@/lib/database/stands'

// Types based on your existing schema
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

export interface StandFilters {
  search: string
  type: string
  active: string
  timeOfDay: string
  hasCoordinates: string
}

export default function StandsPage() {
  // State management
  const [stands, setStands] = useState<Stand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingStand, setEditingStand] = useState<Stand | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<StandFilters>({
    search: '',
    type: 'all',
    active: 'all',
    timeOfDay: 'all',
    hasCoordinates: 'all'
  })

  const standService = new StandService()

  // Load stands data
  const loadStands = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await standService.getStands()
      setStands(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stands')
      console.error('Error loading stands:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadStands()
  }, [])

  // Filter stands based on current filters
  const filteredStands = useMemo(() => {
    return stands.filter(stand => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          stand.name.toLowerCase().includes(searchLower) ||
          stand.description?.toLowerCase().includes(searchLower) ||
          stand.trail_name?.toLowerCase().includes(searchLower) ||
          stand.access_notes?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Type filter
      if (filters.type !== 'all' && stand.type !== filters.type) {
        return false
      }

      // Active filter
      if (filters.active !== 'all') {
        const isActive = filters.active === 'true'
        if (stand.active !== isActive) return false
      }

      // Time of day filter
      if (filters.timeOfDay !== 'all' && stand.time_of_day !== filters.timeOfDay) {
        return false
      }

      // Coordinates filter
      if (filters.hasCoordinates !== 'all') {
        const hasCoords = stand.latitude !== null && stand.longitude !== null
        const shouldHaveCoords = filters.hasCoordinates === 'true'
        if (hasCoords !== shouldHaveCoords) return false
      }

      return true
    })
  }, [stands, filters])

  // Handle stand actions
  const handleCreateStand = () => {
    setEditingStand(null)
    setShowForm(true)
  }

  const handleEditStand = (stand: Stand) => {
    setEditingStand(stand)
    setShowForm(true)
  }

  const handleDeleteStand = async (stand: Stand) => {
    if (!confirm(`Are you sure you want to delete "${stand.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await standService.deleteStand(stand.id)
      await loadStands() // Reload data
    } catch (err) {
      alert(`Failed to delete stand: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleFormSubmit = async () => {
    setShowForm(false)
    setEditingStand(null)
    await loadStands() // Reload data
  }

  const handleNavigateToStand = (stand: Stand) => {
    if (stand.latitude && stand.longitude) {
      const url = `https://maps.google.com/?q=${stand.latitude},${stand.longitude}`
      window.open(url, '_blank')
    } else {
      alert('No coordinates available for this stand')
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      active: 'all',
      timeOfDay: 'all',
      hasCoordinates: 'all'
    })
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '')

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Stand Management</h1>
              <p className="text-green-100 mt-1">
                Manage your hunting stands across the property
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-pine-needle border-pine-needle text-white'
                    : 'border-green-200 text-green-100 hover:bg-green-700'
                }`}
                title="Toggle Filters"
              >
                <Filter size={20} />
              </button>
              
              <button
                onClick={handleCreateStand}
                className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Stand</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Stats Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-weathered-wood" />
              </div>
              <input
                type="text"
                placeholder="Search stands by name, trail, or notes..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-morning-mist placeholder-weathered-wood focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-weathered-wood">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-olive-green rounded-full"></div>
                <span>
                  {filteredStands.length} of {stands.length} stands
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>
                  {filteredStands.filter(s => s.latitude && s.longitude).length} mapped
                </span>
              </div>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-olive-green hover:text-pine-needle font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6">
            <StandFilters 
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Stands</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={loadStands}
                className="text-red-700 hover:text-red-800 font-medium text-sm mt-2 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredStands.length === 0 && stands.length === 0 && (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-weathered-wood mb-4" />
            <h3 className="text-lg font-medium text-forest-shadow mb-2">No stands yet</h3>
            <p className="text-weathered-wood mb-6">Get started by adding your first hunting stand.</p>
            <button
              onClick={handleCreateStand}
              className="bg-burnt-orange hover:bg-clay-earth text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Your First Stand
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && filteredStands.length === 0 && stands.length > 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-weathered-wood mb-4" />
            <h3 className="text-lg font-medium text-forest-shadow mb-2">No stands found</h3>
            <p className="text-weathered-wood mb-4">
              No stands match your current search and filter criteria.
            </p>
            <button
              onClick={clearFilters}
              className="text-olive-green hover:text-pine-needle font-medium underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Stands Grid */}
        {!loading && !error && filteredStands.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStands.map((stand) => (
              <StandCard
                key={stand.id}
                stand={stand}
                mode="full"
                onClick={() => {/* Could open detail view */}}
                onEdit={handleEditStand}
                onDelete={handleDeleteStand}
                onNavigate={handleNavigateToStand}
                showLocation={true}
                showStats={true}
                showActions={true}
                className="hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <StandFormModal
          stand={editingStand}
          onClose={() => {
            setShowForm(false)
            setEditingStand(null)
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}

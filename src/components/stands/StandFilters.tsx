'use client'

// src/components/stands/StandFilters.tsx
// Advanced filtering component for stand management

import React from 'react'
import { X, Filter } from 'lucide-react'

export interface StandFilters {
  search: string
  type: string
  active: string
  timeOfDay: string
  hasCoordinates: string
}

interface StandFiltersProps {
  filters: StandFilters
  onFiltersChange: (filters: StandFilters) => void
  onClose: () => void
}

export default function StandFilters({ filters, onFiltersChange, onClose }: StandFiltersProps) {
  const updateFilter = (key: keyof StandFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-olive-green text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <h3 className="font-medium">Filter Stands</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-pine-needle rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stand Type Filter */}
          <div>
            <label className="block text-sm font-medium text-forest-shadow mb-2">
              Stand Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
            >
              <option value="all">All Types</option>
              <option value="ladder_stand">Ladder Stand</option>
              <option value="bale_blind">Bale Blind</option>
              <option value="box_stand">Box Stand</option>
              <option value="tripod">Tripod</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <label className="block text-sm font-medium text-forest-shadow mb-2">
              Status
            </label>
            <select
              value={filters.active}
              onChange={(e) => updateFilter('active', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
            >
              <option value="all">All Stands</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Time of Day Filter */}
          <div>
            <label className="block text-sm font-medium text-forest-shadow mb-2">
              Best Time
            </label>
            <select
              value={filters.timeOfDay}
              onChange={(e) => updateFilter('timeOfDay', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
            >
              <option value="all">Any Time</option>
              <option value="AM">Morning (AM)</option>
              <option value="PM">Evening (PM)</option>
              <option value="ALL">All Day</option>
            </select>
          </div>

          {/* Coordinates Filter */}
          <div>
            <label className="block text-sm font-medium text-forest-shadow mb-2">
              Map Location
            </label>
            <select
              value={filters.hasCoordinates}
              onChange={(e) => updateFilter('hasCoordinates', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
            >
              <option value="all">All Stands</option>
              <option value="true">Mapped Only</option>
              <option value="false">Not Mapped</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-weathered-wood">
              Active filters applied
            </span>
            <button
              onClick={clearAllFilters}
              className="text-sm bg-muted-gold hover:bg-sunset-amber text-forest-shadow px-3 py-1 rounded font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

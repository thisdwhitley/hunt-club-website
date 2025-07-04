'use client'

// src/components/stands/StandCardDemo.tsx
// Demo component showing StandCard in different modes

import React, { useState } from 'react'
import StandCard from './StandCard'
import type { Stand } from '@/lib/stands'

// Sample stand data for demonstration
const sampleStands: Stand[] = [
  {
    id: '1',
    name: 'North Ridge Stand',
    description: 'Elevated ladder stand overlooking the main food plot with excellent morning visibility',
    type: 'ladder_stand',
    active: true,
    latitude: 36.42800,
    longitude: -79.51000,
    height_feet: 15,
    capacity: 2,
    trail_name: 'North Trail',
    walking_time_minutes: 8,
    access_notes: 'Use caution on wet mornings - can be slippery',
    view_distance_yards: 150,
    total_harvests: 12,
    total_hunts: 48,
    season_hunts: 6,
    last_used_date: '2024-11-15',
    time_of_day: 'AM',
    archery_season: true,
    nearby_water_source: false,
    food_source: 'field',
    trail_camera_name: 'Ridge Cam 1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-11-15T08:30:00Z'
  },
  {
    id: '2', 
    name: 'Creek Crossing Blind',
    description: 'Round bale blind positioned at the main creek crossing where deer travel between bedding and feeding areas',
    type: 'bale_blind',
    active: true,
    latitude: 36.42650,
    longitude: -79.51150,
    height_feet: null,
    capacity: 1,
    trail_name: 'Creek Trail',
    walking_time_minutes: 12,
    access_notes: 'Approach from downwind side only',
    view_distance_yards: 75,
    total_harvests: 8,
    total_hunts: 32,
    season_hunts: 4,
    last_used_date: '2024-10-28',
    time_of_day: 'PM',
    archery_season: true,
    nearby_water_source: true,
    food_source: null,
    trail_camera_name: 'Creek Cam',
    created_at: '2024-02-01T14:00:00Z',
    updated_at: '2024-10-28T18:45:00Z'
  },
  {
    id: '3',
    name: 'South Box Stand',
    description: 'Enclosed box stand on the southern property line',
    type: 'box_stand',
    active: false,
    latitude: 36.42500,
    longitude: -79.51200,
    height_feet: 12,
    capacity: 2,
    trail_name: 'South Trail',
    walking_time_minutes: 15,
    access_notes: 'Needs maintenance - window latch is broken',
    view_distance_yards: 100,
    total_harvests: 2,
    total_hunts: 18,
    season_hunts: 0,
    last_used_date: '2023-12-10',
    time_of_day: 'ALL',
    archery_season: false,
    nearby_water_source: false,
    food_source: 'feeder',
    trail_camera_name: null,
    created_at: '2023-08-10T12:00:00Z',
    updated_at: '2024-01-05T09:15:00Z'
  }
]

export default function StandCardDemo() {
  const [selectedMode, setSelectedMode] = useState<'full' | 'compact' | 'popup'>('full')
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null)
  
  const handleStandClick = (stand: Stand) => {
    console.log('Stand clicked:', stand.name)
    setSelectedStand(stand)
  }

  const handleEditStand = (stand: Stand) => {
    console.log('Edit stand:', stand.name)
    alert(`Edit ${stand.name} - would open edit form`)
  }

  const handleDeleteStand = (stand: Stand) => {
    console.log('Delete stand:', stand.name)
    if (confirm(`Are you sure you want to delete ${stand.name}?`)) {
      alert('Stand would be deleted from database')
    }
  }

  const handleNavigateToStand = (stand: Stand) => {
    console.log('Navigate to stand:', stand.name)
    if (stand.latitude && stand.longitude) {
      // Would open navigation app or show directions
      const url = `https://maps.google.com/?q=${stand.latitude},${stand.longitude}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Stand Card Component Demo
        </h1>
        <p className="text-gray-600">
          Flexible stand display component for lists, grids, and map popups
        </p>
      </div>

      {/* Mode Selector */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Display Mode</h2>
        <div className="flex gap-2">
          {(['full', 'compact', 'popup'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedMode === mode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
            </button>
          ))}
        </div>
      </div>

      {/* Demo Grid */}
      <div className="grid gap-6">
        {selectedMode === 'full' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Full Mode - Main List View
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sampleStands.map((stand) => (
                <StandCard
                  key={stand.id}
                  stand={stand}
                  mode="full"
                  onClick={handleStandClick}
                  onEdit={handleEditStand}
                  onDelete={handleDeleteStand}
                  onNavigate={handleNavigateToStand}
                  showLocation={true}
                  showStats={true}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'compact' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compact Mode - Tight Spaces
            </h2>
            <div className="space-y-2 max-w-md">
              {sampleStands.map((stand) => (
                <StandCard
                  key={stand.id}
                  stand={stand}
                  mode="compact"
                  onClick={handleStandClick}
                  showActions={false}
                />
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'popup' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Popup Mode - Map Popups
            </h2>
            <div className="flex flex-wrap gap-4">
              {sampleStands.map((stand) => (
                <div key={stand.id} className="relative">
                  <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Map Popup
                  </div>
                  <StandCard
                    stand={stand}
                    mode="popup"
                    popupWidth={320}
                    onClick={handleStandClick}
                    onEdit={handleEditStand}
                    onNavigate={handleNavigateToStand}
                    showLocation={true}
                    showStats={true}
                    showActions={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Stand Info */}
      {selectedStand && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            Selected Stand: {selectedStand.name}
          </h3>
          <p className="text-blue-700 text-sm">
            Check the browser console for interaction logs. Click coordinates above to open in Google Maps.
          </p>
        </div>
      )}

      {/* Usage Examples */}
      <div className="mt-12 bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Usage Examples
        </h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900">For Stand Lists:</h3>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
              {`<StandCard stand={stand} mode="full" onClick={viewDetails} onEdit={editStand} />`}
            </code>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">For Map Popups:</h3>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
              {`<StandCard stand={stand} mode="popup" popupWidth={300} onNavigate={getDirections} />`}
            </code>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">For Search Results:</h3>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
              {`<StandCard stand={stand} mode="compact" onClick={selectStand} showActions={false} />`}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
